import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  createPhotoRepairRateLimiters,
  hasPhotoRepairConfirmation,
  isOwnedPhotoStoragePath,
  isPhotoRepairDryRun,
  isPhotoRepairEnabled,
  parsePhotoRepairTarget,
  PHOTO_REPAIR_LIMITS,
  requestExceedsLimit,
  type PhotoRepairOperation,
  type PhotoRepairScope,
  validatePhotoRepairOrigin,
  validateRepairJpeg,
} from "@/lib/photoRepairSecurity.server";

const BUCKET = "profile-photos";
const PROFILE_MARKERS = [
  `/storage/v1/object/public/${BUCKET}/`,
  `/storage/v1/object/sign/${BUCKET}/`,
  `/storage/v1/object/authenticated/${BUCKET}/`,
];

type RepairRow = {
  source: "profiles.photo_url" | "profile_photos.url";
  user_id: string;
  photo_id: string | null;
  url: string;
  storage_path: string | null;
  issue: "heic_heif_salvo" | "arquivo_nao_existe_no_storage";
  valid_extra_url?: string | null;
};

type RepairAuditInput = {
  requestId: string;
  actorId: string;
  action: PhotoRepairOperation;
  phase: "started" | "dry_run" | "succeeded" | "failed";
  outcome: "pending" | "allowed" | "completed" | "rejected";
  scope?: PhotoRepairScope | null;
  targetUserId?: string | null;
  targetPhotoId?: string | null;
  errorCode?: string | null;
  dryRun?: boolean;
};

const repairRateLimiters = createPhotoRepairRateLimiters();

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  extraHeaders?: Record<string, string>,
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function logRepairEvent(
  level: "info" | "warn" | "error",
  event: string,
  fields: Record<string, string | number | boolean> = {},
) {
  console[level](
    JSON.stringify({
      component: "photo_repair",
      event,
      ...fields,
    }),
  );
}

async function auditRepairEvent(input: RepairAuditInput) {
  const { error } = await supabaseAdmin.from("photo_repair_audit" as never).insert({
    request_id: input.requestId,
    actor_id: input.actorId,
    action: input.action,
    phase: input.phase,
    outcome: input.outcome,
    scope: input.scope ?? null,
    target_user_id: input.targetUserId ?? null,
    target_photo_id: input.targetPhotoId ?? null,
    error_code: input.errorCode ?? null,
    dry_run: input.dryRun ?? false,
  } as never);

  if (error) throw new Error("audit_unavailable");
}

function stripQueryAndHash(value: string) {
  return value.split("#")[0].split("?")[0];
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function looksLikeRawProfilePath(value: string) {
  if (!value || value.startsWith("/") || value.startsWith("data:") || value.startsWith("blob:"))
    return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false;
  return value.includes("/");
}

function extractProfilePhotoPath(url: string | null | undefined): string | null {
  const clean = url?.trim();
  if (!clean) return null;

  for (const marker of PROFILE_MARKERS) {
    const idx = clean.indexOf(marker);
    if (idx >= 0) {
      const tail = clean.slice(idx + marker.length);
      return safeDecode(stripQueryAndHash(tail)).replace(/^\/+/, "") || null;
    }
  }

  if (clean.startsWith(`${BUCKET}/`)) {
    return (
      safeDecode(stripQueryAndHash(clean.slice(BUCKET.length + 1))).replace(/^\/+/, "") || null
    );
  }

  if (clean.startsWith(`/${BUCKET}/`)) {
    return (
      safeDecode(stripQueryAndHash(clean.slice(BUCKET.length + 2))).replace(/^\/+/, "") || null
    );
  }

  if (looksLikeRawProfilePath(clean)) {
    return safeDecode(stripQueryAndHash(clean)).replace(/^\/+/, "") || null;
  }

  return null;
}

function isHeicUrl(value: string | null | undefined) {
  return Boolean(value && /\.(heic|heif)(?:[?#].*)?$/i.test(stripQueryAndHash(value)));
}

async function requireAdmin(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return { error: jsonResponse({ error: "unauthorized" }, 401) };
  }

  const token = auth.slice(7).trim();
  if (!token) {
    return { error: jsonResponse({ error: "unauthorized" }, 401) };
  }
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { error: jsonResponse({ error: "service_unavailable" }, 503) };
  }

  const sb = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userRes, error: userErr } = await sb.auth.getUser();
  if (userErr || !userRes.user) {
    return { error: jsonResponse({ error: "unauthorized" }, 401) };
  }

  const { data: roles, error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userRes.user.id)
    .in("role", ["admin", "super_admin"]);
  if (rolesError || !roles?.length) {
    return { error: jsonResponse({ error: "forbidden" }, 403) };
  }

  return { userId: userRes.user.id };
}

async function existingPaths(paths: string[]) {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  const found = new Set<string>();
  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100);
    const { data, error } = await supabaseAdmin
      .schema("storage" as never)
      .from("objects" as never)
      .select("name")
      .eq("bucket_id", BUCKET)
      .in("name", batch);
    if (error) throw error;
    for (const row of (data ?? []) as unknown as Array<{ name: string }>) found.add(row.name);
  }
  return found;
}

async function firstValidExtraUrl(userId: string, ignorePhotoId?: string | null) {
  const { data } = await supabaseAdmin
    .from("profile_photos")
    .select("id,url,sort_order,created_at")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as Array<{ id: string; url: string }>;
  const candidates = rows
    .filter((row) => row.id !== ignorePhotoId && !isHeicUrl(row.url))
    .map((row) => ({ ...row, path: extractProfilePhotoPath(row.url) }))
    .filter((row): row is { id: string; url: string; path: string } => Boolean(row.path));
  if (!candidates.length) return null;
  const found = await existingPaths(candidates.map((row) => row.path));
  return candidates.find((row) => found.has(row.path))?.url ?? null;
}

async function loadRepairRows(): Promise<RepairRow[]> {
  const [{ data: profiles }, { data: extras }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id,photo_url").not("photo_url", "is", null).limit(2000),
    supabaseAdmin
      .from("profile_photos")
      .select("id,user_id,url")
      .not("url", "is", null)
      .limit(5000),
  ]);

  const rows: Array<Omit<RepairRow, "issue" | "valid_extra_url">> = [
    ...((profiles ?? []) as Array<{ id: string; photo_url: string | null }>).flatMap((row) =>
      row.photo_url
        ? [
            {
              source: "profiles.photo_url" as const,
              user_id: row.id,
              photo_id: null,
              url: row.photo_url,
              storage_path: extractProfilePhotoPath(row.photo_url),
            },
          ]
        : [],
    ),
    ...((extras ?? []) as Array<{ id: string; user_id: string; url: string | null }>).flatMap(
      (row) =>
        row.url
          ? [
              {
                source: "profile_photos.url" as const,
                user_id: row.user_id,
                photo_id: row.id,
                url: row.url,
                storage_path: extractProfilePhotoPath(row.url),
              },
            ]
          : [],
    ),
  ];

  const found = await existingPaths(rows.map((row) => row.storage_path ?? ""));
  const issues: RepairRow[] = [];

  for (const row of rows) {
    if (isHeicUrl(row.url) || isHeicUrl(row.storage_path)) {
      issues.push({ ...row, issue: "heic_heif_salvo" });
      continue;
    }
    if (row.storage_path && !found.has(row.storage_path)) {
      issues.push({
        ...row,
        issue: "arquivo_nao_existe_no_storage",
        valid_extra_url:
          row.source === "profiles.photo_url" ? await firstValidExtraUrl(row.user_id) : null,
      });
    }
  }

  return issues.slice(0, 300);
}

async function removeOldObject(url: string | null | undefined, userId: string, newPath: string) {
  const path = extractProfilePhotoPath(url);
  if (!path || !isOwnedPhotoStoragePath(path, userId) || path === newPath) return;
  try {
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    if (!error) return;
  } catch {
    // The new reference is already consistent. Cleanup is reconciled separately.
  }
  logRepairEvent("warn", "old_object_cleanup_failed");
}

async function removeStagedObject(path: string) {
  try {
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    if (!error) return;
  } catch {
    // A failed staged cleanup is surfaced without exposing its path.
  }
  logRepairEvent("warn", "staged_object_cleanup_failed");
}

export const Route = createFileRoute("/api/photo-repair")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const startedAt = Date.now();
        const requestId = crypto.randomUUID();
        if (!isPhotoRepairEnabled(process.env)) {
          return jsonResponse({ error: "service_unavailable" }, 503);
        }

        const auth = await requireAdmin(request);
        if ("error" in auth) return auth.error;

        const rateLimit = repairRateLimiters.check(auth.userId, "scan");
        if (!rateLimit.allowed) {
          logRepairEvent("warn", "request_rate_limited", { operation: "scan", status: 429 });
          return jsonResponse({ error: "rate_limited" }, 429, {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          });
        }

        try {
          await auditRepairEvent({
            requestId,
            actorId: auth.userId,
            action: "scan",
            phase: "started",
            outcome: "pending",
          });
          const rows = await loadRepairRows();
          try {
            await auditRepairEvent({
              requestId,
              actorId: auth.userId,
              action: "scan",
              phase: "succeeded",
              outcome: "completed",
            });
          } catch {
            logRepairEvent("error", "audit_completion_failed", { operation: "scan" });
          }
          logRepairEvent("info", "request_completed", {
            operation: "scan",
            resultCount: rows.length,
            durationMs: Date.now() - startedAt,
          });
          return jsonResponse({ rows });
        } catch (error) {
          try {
            await auditRepairEvent({
              requestId,
              actorId: auth.userId,
              action: "scan",
              phase: "failed",
              outcome: "rejected",
              errorCode: "scan_failed",
            });
          } catch {
            logRepairEvent("error", "audit_failure_event_failed", { operation: "scan" });
          }
          const auditUnavailable = error instanceof Error && error.message === "audit_unavailable";
          logRepairEvent("error", "request_failed", {
            operation: "scan",
            status: auditUnavailable ? 503 : 500,
            durationMs: Date.now() - startedAt,
          });
          return jsonResponse(
            { error: auditUnavailable ? "service_unavailable" : "internal_error" },
            auditUnavailable ? 503 : 500,
          );
        }
      },
      POST: async ({ request }) => {
        const startedAt = Date.now();
        const requestId = crypto.randomUUID();
        if (!isPhotoRepairEnabled(process.env)) {
          return jsonResponse({ error: "service_unavailable" }, 503);
        }
        if (!validatePhotoRepairOrigin(request)) {
          return jsonResponse({ error: "forbidden_origin" }, 403);
        }

        const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
        const multipart = contentType.includes("multipart/form-data");
        const json = contentType.split(";", 1)[0]?.trim() === "application/json";
        if (!multipart && !json) {
          return jsonResponse({ error: "unsupported_media_type" }, 415);
        }
        if (
          requestExceedsLimit(
            request,
            multipart ? PHOTO_REPAIR_LIMITS.maxMultipartBytes : PHOTO_REPAIR_LIMITS.maxJsonBytes,
          )
        ) {
          return jsonResponse({ error: "request_too_large" }, 413);
        }

        const auth = await requireAdmin(request);
        if ("error" in auth) return auth.error;
        const dryRun = isPhotoRepairDryRun(request);

        if (multipart) {
          const rateLimit = repairRateLimiters.check(auth.userId, "replace");
          if (!rateLimit.allowed) {
            logRepairEvent("warn", "request_rate_limited", { operation: "replace", status: 429 });
            return jsonResponse({ error: "rate_limited" }, 429, {
              "Retry-After": String(rateLimit.retryAfterSeconds),
            });
          }

          const form = await request.formData();
          const target = parsePhotoRepairTarget({
            scope: form.get("scope"),
            userId: form.get("userId"),
            photoId: form.get("photoId"),
          });
          if (!target.ok) {
            return jsonResponse({ error: target.error }, 400);
          }

          const oldUrl = String(form.get("oldUrl") ?? "");
          const file = form.get("file");
          if (oldUrl.length > 2_048 || !(file instanceof File)) {
            return jsonResponse({ error: "invalid_input" }, 400);
          }
          const jpeg = await validateRepairJpeg(file);
          if (!jpeg.ok) {
            return jsonResponse({ error: jpeg.error }, jpeg.status);
          }

          if (dryRun) {
            try {
              await auditRepairEvent({
                requestId,
                actorId: auth.userId,
                action: "replace",
                phase: "dry_run",
                outcome: "allowed",
                scope: target.scope,
                targetUserId: target.userId,
                targetPhotoId: target.photoId,
                dryRun: true,
              });
            } catch {
              logRepairEvent("error", "audit_dry_run_failed", { operation: "replace" });
              return jsonResponse({ error: "service_unavailable" }, 503);
            }
            return jsonResponse({
              dryRun: true,
              operation: "replace",
              scope: target.scope,
            });
          }
          if (!hasPhotoRepairConfirmation(request)) {
            try {
              await auditRepairEvent({
                requestId,
                actorId: auth.userId,
                action: "replace",
                phase: "failed",
                outcome: "rejected",
                scope: target.scope,
                targetUserId: target.userId,
                targetPhotoId: target.photoId,
                errorCode: "confirmation_required",
              });
            } catch {
              return jsonResponse({ error: "service_unavailable" }, 503);
            }
            return jsonResponse({ error: "confirmation_required" }, 428);
          }

          const path = `${target.userId}/repair-${crypto.randomUUID()}.jpg`;
          let uploaded = false;
          let referenceUpdated = false;
          try {
            await auditRepairEvent({
              requestId,
              actorId: auth.userId,
              action: "replace",
              phase: "started",
              outcome: "pending",
              scope: target.scope,
              targetUserId: target.userId,
              targetPhotoId: target.photoId,
            });
            const { error: uploadError } = await supabaseAdmin.storage
              .from(BUCKET)
              .upload(path, file, {
                upsert: false,
                contentType: "image/jpeg",
                cacheControl: "3600",
              });
            if (uploadError) throw new Error("upload_failed");
            uploaded = true;

            const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
            const url = pub.publicUrl;
            if (target.scope === "avatar") {
              const { data, error } = await supabaseAdmin
                .from("profiles")
                .update({
                  photo_url: url,
                  avatar_ai_verified: true,
                  avatar_ai_checked_at: new Date().toISOString(),
                })
                .eq("id", target.userId)
                .select("id")
                .maybeSingle();
              if (error || !data) throw new Error("target_not_found");
            } else {
              const { data, error } = await supabaseAdmin
                .from("profile_photos")
                .update({
                  url,
                  ai_verified: true,
                  ai_checked_at: new Date().toISOString(),
                })
                .eq("id", target.photoId!)
                .eq("user_id", target.userId)
                .select("id")
                .maybeSingle();
              if (error || !data) throw new Error("target_not_found");
            }
            referenceUpdated = true;

            await removeOldObject(oldUrl, target.userId, path);
            try {
              await auditRepairEvent({
                requestId,
                actorId: auth.userId,
                action: "replace",
                phase: "succeeded",
                outcome: "completed",
                scope: target.scope,
                targetUserId: target.userId,
                targetPhotoId: target.photoId,
              });
            } catch {
              logRepairEvent("error", "audit_completion_failed", { operation: "replace" });
            }
            logRepairEvent("info", "request_completed", {
              operation: "replace",
              durationMs: Date.now() - startedAt,
            });
            return jsonResponse({ url });
          } catch (error) {
            if (uploaded && !referenceUpdated) {
              await removeStagedObject(path);
            }
            try {
              await auditRepairEvent({
                requestId,
                actorId: auth.userId,
                action: "replace",
                phase: "failed",
                outcome: "rejected",
                scope: target.scope,
                targetUserId: target.userId,
                targetPhotoId: target.photoId,
                errorCode:
                  error instanceof Error && error.message === "audit_unavailable"
                    ? "audit_unavailable"
                    : "operation_failed",
              });
            } catch {
              logRepairEvent("error", "audit_failure_event_failed", { operation: "replace" });
            }
            const auditUnavailable =
              error instanceof Error && error.message === "audit_unavailable";
            logRepairEvent("error", "request_failed", {
              operation: "replace",
              status: auditUnavailable ? 503 : 500,
              durationMs: Date.now() - startedAt,
            });
            return jsonResponse(
              { error: auditUnavailable ? "service_unavailable" : "internal_error" },
              auditUnavailable ? 503 : 500,
            );
          }
        }

        const rawBody = await request.text();
        if (new TextEncoder().encode(rawBody).byteLength > PHOTO_REPAIR_LIMITS.maxJsonBytes) {
          return jsonResponse({ error: "request_too_large" }, 413);
        }
        const body = (() => {
          try {
            return JSON.parse(rawBody) as Record<string, unknown>;
          } catch {
            return null;
          }
        })();
        if (body?.action !== "clear") {
          return jsonResponse({ error: "invalid_action" }, 400);
        }
        const target = parsePhotoRepairTarget({
          scope: body.scope,
          userId: body.userId,
          photoId: body.photoId,
        });
        if (!target.ok) {
          return jsonResponse({ error: target.error }, 400);
        }

        const rateLimit = repairRateLimiters.check(auth.userId, "clear");
        if (!rateLimit.allowed) {
          logRepairEvent("warn", "request_rate_limited", { operation: "clear", status: 429 });
          return jsonResponse({ error: "rate_limited" }, 429, {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          });
        }

        if (dryRun) {
          try {
            const promotedUrl =
              target.scope === "avatar" ? await firstValidExtraUrl(target.userId) : null;
            await auditRepairEvent({
              requestId,
              actorId: auth.userId,
              action: "clear",
              phase: "dry_run",
              outcome: "allowed",
              scope: target.scope,
              targetUserId: target.userId,
              targetPhotoId: target.photoId,
              dryRun: true,
            });
            return jsonResponse({
              dryRun: true,
              operation: "clear",
              scope: target.scope,
              wouldPromoteExtra: Boolean(promotedUrl),
            });
          } catch {
            logRepairEvent("error", "dry_run_failed", { operation: "clear" });
            return jsonResponse({ error: "service_unavailable" }, 503);
          }
        }

        if (!hasPhotoRepairConfirmation(request)) {
          try {
            await auditRepairEvent({
              requestId,
              actorId: auth.userId,
              action: "clear",
              phase: "failed",
              outcome: "rejected",
              scope: target.scope,
              targetUserId: target.userId,
              targetPhotoId: target.photoId,
              errorCode: "confirmation_required",
            });
          } catch {
            return jsonResponse({ error: "service_unavailable" }, 503);
          }
          return jsonResponse({ error: "confirmation_required" }, 428);
        }

        try {
          await auditRepairEvent({
            requestId,
            actorId: auth.userId,
            action: "clear",
            phase: "started",
            outcome: "pending",
            scope: target.scope,
            targetUserId: target.userId,
            targetPhotoId: target.photoId,
          });

          let promotedUrl: string | null = null;
          if (target.scope === "extra") {
            const { data, error } = await supabaseAdmin
              .from("profile_photos")
              .delete()
              .eq("id", target.photoId!)
              .eq("user_id", target.userId)
              .select("id")
              .maybeSingle();
            if (error || !data) throw new Error("target_not_found");
          } else {
            promotedUrl = await firstValidExtraUrl(target.userId);
            const { data, error } = await supabaseAdmin
              .from("profiles")
              .update({
                photo_url: promotedUrl,
                avatar_ai_verified: Boolean(promotedUrl),
                avatar_ai_checked_at: promotedUrl ? new Date().toISOString() : null,
              })
              .eq("id", target.userId)
              .select("id")
              .maybeSingle();
            if (error || !data) throw new Error("target_not_found");
          }

          try {
            await auditRepairEvent({
              requestId,
              actorId: auth.userId,
              action: "clear",
              phase: "succeeded",
              outcome: "completed",
              scope: target.scope,
              targetUserId: target.userId,
              targetPhotoId: target.photoId,
            });
          } catch {
            logRepairEvent("error", "audit_completion_failed", { operation: "clear" });
          }
          logRepairEvent("info", "request_completed", {
            operation: "clear",
            durationMs: Date.now() - startedAt,
          });
          return jsonResponse({ cleared: true, promotedUrl });
        } catch (error) {
          try {
            await auditRepairEvent({
              requestId,
              actorId: auth.userId,
              action: "clear",
              phase: "failed",
              outcome: "rejected",
              scope: target.scope,
              targetUserId: target.userId,
              targetPhotoId: target.photoId,
              errorCode:
                error instanceof Error && error.message === "audit_unavailable"
                  ? "audit_unavailable"
                  : "operation_failed",
            });
          } catch {
            logRepairEvent("error", "audit_failure_event_failed", { operation: "clear" });
          }
          const auditUnavailable = error instanceof Error && error.message === "audit_unavailable";
          logRepairEvent("error", "request_failed", {
            operation: "clear",
            status: auditUnavailable ? 503 : 500,
            durationMs: Date.now() - startedAt,
          });
          return jsonResponse(
            { error: auditUnavailable ? "service_unavailable" : "internal_error" },
            auditUnavailable ? 503 : 500,
          );
        }
      },
    },
  },
});

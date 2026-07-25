import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "profile-photos";
const PROFILE_MARKERS = [
  `/storage/v1/object/public/${BUCKET}/`,
  `/storage/v1/object/sign/${BUCKET}/`,
  `/storage/v1/object/authenticated/${BUCKET}/`,
];

type PhotoScope = "avatar" | "extra";
type RepairRow = {
  source: "profiles.photo_url" | "profile_photos.url";
  user_id: string;
  photo_id: string | null;
  url: string;
  storage_path: string | null;
  issue: "heic_heif_salvo" | "arquivo_nao_existe_no_storage";
  valid_extra_url?: string | null;
};

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
    return { error: new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }) };
  }

  const token = auth.slice(7).trim();
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { error: new Response(JSON.stringify({ error: "server_misconfig" }), { status: 500 }) };
  }

  const sb = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userRes, error: userErr } = await sb.auth.getUser();
  if (userErr || !userRes.user) {
    return { error: new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }) };
  }

  const { data: roles, error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userRes.user.id)
    .in("role", ["admin", "super_admin"]);
  if (rolesError || !roles?.length) {
    return { error: new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }) };
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

async function removeOldObject(url: string | null | undefined) {
  const path = extractProfilePhotoPath(url);
  if (path) await supabaseAdmin.storage.from(BUCKET).remove([path]);
}

export const Route = createFileRoute("/api/photo-repair")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ("error" in auth) return auth.error;
        const rows = await loadRepairRows();
        return new Response(JSON.stringify({ rows }), {
          headers: { "Content-Type": "application/json" },
        });
      },
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ("error" in auth) return auth.error;

        const contentType = request.headers.get("content-type") ?? "";
        if (contentType.includes("multipart/form-data")) {
          const form = await request.formData();
          const scope = form.get("scope") === "extra" ? "extra" : "avatar";
          const userId = String(form.get("userId") ?? "");
          const photoId = form.get("photoId") ? String(form.get("photoId")) : null;
          const oldUrl = String(form.get("oldUrl") ?? "");
          const file = form.get("file");
          if (!userId || !(file instanceof File)) {
            return new Response(JSON.stringify({ error: "invalid_input" }), { status: 400 });
          }
          if (!["image/jpeg", "image/jpg"].includes((file.type || "").toLowerCase())) {
            return new Response(JSON.stringify({ error: "expected_jpeg" }), { status: 400 });
          }

          const path =
            scope === "avatar"
              ? `${userId}/avatar.jpg`
              : `${userId}/extra-repair-${Date.now()}.jpg`;
          const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(path, file, {
              upsert: scope === "avatar",
              contentType: "image/jpeg",
              cacheControl: "3600",
            });
          if (uploadError) {
            return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 });
          }
          const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
          const url = `${pub.publicUrl}?t=${Date.now()}`;

          if (scope === "avatar") {
            const { error } = await supabaseAdmin
              .from("profiles")
              .update({
                photo_url: url,
                avatar_ai_verified: true,
                avatar_ai_checked_at: new Date().toISOString(),
              })
              .eq("id", userId);
            if (error) {
              return new Response(JSON.stringify({ error: error.message }), { status: 500 });
            }
          } else {
            if (!photoId) {
              return new Response(JSON.stringify({ error: "missing_photo_id" }), { status: 400 });
            }
            const { error } = await supabaseAdmin
              .from("profile_photos")
              .update({
                url,
                ai_verified: true,
                ai_checked_at: new Date().toISOString(),
              })
              .eq("id", photoId)
              .eq("user_id", userId);
            if (error) {
              return new Response(JSON.stringify({ error: error.message }), { status: 500 });
            }
          }

          await removeOldObject(oldUrl);
          return new Response(JSON.stringify({ url }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const body = await request.json().catch(() => null);
        if (body?.action !== "clear") {
          return new Response(JSON.stringify({ error: "invalid_action" }), { status: 400 });
        }
        const scope: PhotoScope = body.scope === "extra" ? "extra" : "avatar";
        const userId = String(body.userId ?? "");
        const photoId = body.photoId ? String(body.photoId) : null;
        if (!userId) {
          return new Response(JSON.stringify({ error: "missing_user_id" }), { status: 400 });
        }

        if (scope === "extra") {
          if (!photoId) {
            return new Response(JSON.stringify({ error: "missing_photo_id" }), { status: 400 });
          }
          const { error } = await supabaseAdmin
            .from("profile_photos")
            .delete()
            .eq("id", photoId)
            .eq("user_id", userId);
          if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
          }
          return new Response(JSON.stringify({ cleared: true }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const promotedUrl = await firstValidExtraUrl(userId);
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            photo_url: promotedUrl,
            avatar_ai_verified: Boolean(promotedUrl),
            avatar_ai_checked_at: promotedUrl ? new Date().toISOString() : null,
          })
          .eq("id", userId);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
        return new Response(JSON.stringify({ cleared: true, promotedUrl }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});

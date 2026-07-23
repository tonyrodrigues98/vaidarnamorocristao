import type { AuthSessionStatus } from "@/v2/app/auth/session-state";
import type { V2ShellUser } from "@/v2/app-shell";

export interface V2RuntimeIdentitySource {
  readonly user_metadata?: Readonly<Record<string, unknown>>;
}

export type V2RuntimeAccessDecision =
  | "legacy-fallback"
  | "session-loading"
  | "session-error"
  | "wait-for-route-boundary"
  | "mount-shell";

export interface V2RuntimeAccessInput {
  readonly enabled: boolean;
  readonly status: AuthSessionStatus;
  readonly hasUser: boolean;
}

const DISPLAY_NAME_KEYS = ["display_name", "full_name", "name"] as const;
const AVATAR_KEYS = ["avatar_url", "picture"] as const;
const FALLBACK_DISPLAY_NAME = "Pessoa da comunidade";

function firstNonEmptyString(
  metadata: Readonly<Record<string, unknown>>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function toSafeAvatarUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function resolveV2RuntimeAccess({
  enabled,
  status,
  hasUser,
}: V2RuntimeAccessInput): V2RuntimeAccessDecision {
  if (!enabled) return "legacy-fallback";
  if (status === "initializing") return "session-loading";
  if (status === "recoverable-error") return "session-error";
  if (status === "unauthenticated" || !hasUser) return "wait-for-route-boundary";
  return "mount-shell";
}

export function createV2ShellUser(source: V2RuntimeIdentitySource | null): V2ShellUser {
  const metadata = source?.user_metadata ?? {};
  const displayName = firstNonEmptyString(metadata, DISPLAY_NAME_KEYS) ?? FALLBACK_DISPLAY_NAME;
  const avatarUrl = toSafeAvatarUrl(firstNonEmptyString(metadata, AVATAR_KEYS));
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase("pt-BR"))
      .join("") || "PC";

  return {
    displayName,
    supportingText: "Participante da comunidade",
    initials,
    avatarUrl,
    status: "online",
  };
}

export async function performV2Logout(
  signOut: () => Promise<void>,
): Promise<{ readonly ok: true } | { readonly ok: false; readonly message: string }> {
  try {
    await signOut();
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Não foi possível sair agora. Tente novamente em instantes.",
    };
  }
}

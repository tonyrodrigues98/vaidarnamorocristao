export const INTERNAL_NAVIGATION_PREFIXES = Object.freeze([
  "/",
  "/admin",
  "/avatar",
  "/blog",
  "/bloqueados",
  "/caixas",
  "/como-funciona",
  "/comunidade",
  "/conquistas",
  "/conta",
  "/conversas",
  "/dashboard",
  "/depoimentos",
  "/devocional",
  "/instalar",
  "/inicio",
  "/interesses",
  "/loja",
  "/manual",
  "/matches",
  "/meu-pet",
  "/noticias",
  "/notificacoes",
  "/onboarding",
  "/oracoes",
  "/perfil",
  "/pet-arcade",
  "/presentes",
  "/pretendentes",
  "/proposito",
  "/quiz-biblico",
  "/recados",
  "/sobre",
  "/suporte",
  "/termos",
  "/v2",
  "/verificacao",
] as const);

const DEFAULT_ORIGIN = "https://vaidarnamoro.com";

export interface InternalDestinationOptions {
  readonly origin?: string;
  readonly fallback?: string | null;
  readonly allowAbsoluteSameOrigin?: boolean;
  readonly allowedPrefixes?: readonly string[];
}

export type InternalDestinationResult =
  | Readonly<{ ok: true; destination: string }>
  | Readonly<{
      ok: false;
      destination: string | null;
      reason:
        | "empty"
        | "too-long"
        | "malformed"
        | "forbidden-protocol"
        | "external-origin"
        | "forbidden-path"
        | "not-allowlisted";
    }>;

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

function isAllowedPath(pathname: string, allowedPrefixes: readonly string[]): boolean {
  if (pathname === "/") return allowedPrefixes.includes("/");
  return allowedPrefixes.some(
    (prefix) => prefix !== "/" && (pathname === prefix || pathname.startsWith(`${prefix}/`)),
  );
}

function reject(
  reason: Exclude<InternalDestinationResult, { ok: true }>["reason"],
  fallback: string | null,
): InternalDestinationResult {
  return { ok: false, destination: fallback, reason };
}

export function resolveInternalDestination(
  value: unknown,
  options: InternalDestinationOptions = {},
): InternalDestinationResult {
  const fallback = options.fallback === undefined ? "/inicio" : options.fallback;
  if (typeof value !== "string" || value.length === 0) return reject("empty", fallback);
  if (value.length > 2048) return reject("too-long", fallback);
  if (hasControlCharacter(value) || value.includes("\\")) return reject("malformed", fallback);

  const origin = options.origin ?? DEFAULT_ORIGIN;
  const allowAbsolute = options.allowAbsoluteSameOrigin ?? true;
  const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(value);
  if (value.startsWith("//")) return reject("external-origin", fallback);
  if (!isAbsolute && !value.startsWith("/")) return reject("malformed", fallback);
  if (isAbsolute && !allowAbsolute) return reject("external-origin", fallback);

  try {
    const base = new URL(origin);
    const parsed = new URL(value, base);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return reject("forbidden-protocol", fallback);
    }
    if (parsed.origin !== base.origin || parsed.username || parsed.password) {
      return reject("external-origin", fallback);
    }

    const decodedPath = decodeURIComponent(parsed.pathname);
    if (
      decodedPath.startsWith("//") ||
      decodedPath.includes("\\") ||
      hasControlCharacter(decodedPath) ||
      decodedPath === "/api" ||
      decodedPath.startsWith("/api/")
    ) {
      return reject("forbidden-path", fallback);
    }
    if (!isAllowedPath(decodedPath, options.allowedPrefixes ?? INTERNAL_NAVIGATION_PREFIXES)) {
      return reject("not-allowlisted", fallback);
    }

    return {
      ok: true,
      destination: `${parsed.pathname}${parsed.search}${parsed.hash}`,
    };
  } catch {
    return reject("malformed", fallback);
  }
}

export function sanitizeInternalDestination(
  value: unknown,
  options: InternalDestinationOptions = {},
): string | null {
  return resolveInternalDestination(value, options).destination;
}

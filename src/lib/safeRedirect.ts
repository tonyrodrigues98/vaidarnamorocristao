const FALLBACK_PATH = "/inicio";

const AUTH_RETURN_ROUTES = new Set([
  "/auth/forgot-password",
  "/auth/login",
  "/auth/reset-password",
  "/auth/signup",
  "/logout",
]);

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

export function sanitizeInternalRedirect(value: unknown, fallback = FALLBACK_PATH): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (containsControlCharacter(value)) return fallback;

  try {
    const parsed = new URL(value, "https://vaidarnamoro.local");
    if (parsed.origin !== "https://vaidarnamoro.local") return fallback;

    const decodedPath = decodeURIComponent(parsed.pathname);
    if (
      decodedPath.startsWith("//") ||
      decodedPath.includes("\\") ||
      containsControlCharacter(decodedPath)
    ) {
      return fallback;
    }

    const normalizedPath = normalizePathname(decodedPath);
    if (
      AUTH_RETURN_ROUTES.has(normalizedPath) ||
      normalizedPath.startsWith("/auth/") ||
      normalizedPath.startsWith("/api/")
    ) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function readSafeReturnTo(search: string, fallback = FALLBACK_PATH): string {
  try {
    return sanitizeInternalRedirect(new URLSearchParams(search).get("returnTo"), fallback);
  } catch {
    return fallback;
  }
}

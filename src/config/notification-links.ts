export function rewriteNotificationLink(
  link: string | null,
  nativeShellEnabled: boolean,
): string | null {
  if (!link) return link;
  if (link === "/comunidade" || link.startsWith("/comunidade/")) {
    return nativeShellEnabled ? "/comunidade" : "/conversas";
  }
  return link;
}

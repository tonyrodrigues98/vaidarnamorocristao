const privateFocusedChatPattern = /^\/conversas\/[^/?#]+\/?(?:[?#].*)?$/;

export function shouldUseNativeFocusedChat(pathname: string, featureEnabled: boolean): boolean {
  if (!featureEnabled) return false;
  const normalizedPath = pathname.split(/[?#]/, 1)[0]?.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/conversas/comunidade") return true;
  if (normalizedPath === "/conversas") return false;
  return privateFocusedChatPattern.test(normalizedPath);
}

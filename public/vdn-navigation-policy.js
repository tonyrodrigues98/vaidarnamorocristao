(function installVdnNavigationPolicy(scope) {
  "use strict";

  var allowedPrefixes = Object.freeze([
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
  ]);

  function hasControlCharacter(value) {
    return Array.from(value).some(function (character) {
      var code = character.charCodeAt(0);
      return code <= 31 || code === 127;
    });
  }

  function isAllowedPath(pathname) {
    if (pathname === "/") return allowedPrefixes.includes("/");
    return allowedPrefixes.some(function (prefix) {
      return prefix !== "/" && (pathname === prefix || pathname.startsWith(prefix + "/"));
    });
  }

  function resolve(value, origin, fallback) {
    var safeFallback = typeof fallback === "string" ? fallback : "/notificacoes";
    if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
      return safeFallback;
    }
    if (value.startsWith("//") || value.includes("\\") || hasControlCharacter(value)) {
      return safeFallback;
    }
    if (!value.startsWith("/") && !/^[a-z][a-z0-9+.-]*:/i.test(value)) {
      return safeFallback;
    }

    try {
      var base = new URL(origin);
      var parsed = new URL(value, base);
      if (
        (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
        parsed.origin !== base.origin ||
        parsed.username ||
        parsed.password
      ) {
        return safeFallback;
      }
      var decodedPath = decodeURIComponent(parsed.pathname);
      if (
        decodedPath.startsWith("//") ||
        decodedPath.includes("\\") ||
        hasControlCharacter(decodedPath) ||
        decodedPath === "/api" ||
        decodedPath.startsWith("/api/") ||
        !isAllowedPath(decodedPath)
      ) {
        return safeFallback;
      }
      return parsed.pathname + parsed.search + parsed.hash;
    } catch {
      return safeFallback;
    }
  }

  scope.VDN_NAVIGATION_POLICY = Object.freeze({
    allowedPrefixes: allowedPrefixes,
    resolve: resolve,
  });
})(self);

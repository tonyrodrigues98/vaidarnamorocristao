import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

const ALLOWED_PREFIXES = [
  "/inicio",
  "/notificacoes",
  "/conta",
  "/suporte",
  "/termos",
  "/manual",
  "/auth",
];

/**
 * Redirects banned and rejected users away from disallowed routes.
 * They keep access only to /inicio, /notificacoes, /conta, /suporte
 * (and the public /termos /manual /auth flows). Rejected users can
 * still edit their profile, so /perfil is also allowed for them.
 */
export function BanGuard() {
  const { profileStatus, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (profileStatus !== "banned" && profileStatus !== "rejected") return;
    const path = location.pathname;
    const prefixes =
      profileStatus === "rejected" ? [...ALLOWED_PREFIXES, "/perfil"] : ALLOWED_PREFIXES;
    const allowed = prefixes.some((p) => path === p || path.startsWith(p + "/"));
    if (!allowed) {
      navigate({ to: "/inicio", replace: true });
    }
  }, [profileStatus, loading, location.pathname, navigate]);

  return null;
}

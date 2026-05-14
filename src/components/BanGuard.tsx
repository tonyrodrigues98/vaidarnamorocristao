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
 * Redirects banned users away from disallowed routes.
 * Banned users keep access only to /inicio, /notificacoes, /conta,
 * /suporte (and the public /termos /manual /auth flows).
 */
export function BanGuard() {
  const { profileStatus, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (profileStatus !== "banned") return;
    const path = location.pathname;
    const allowed = ALLOWED_PREFIXES.some(
      (p) => path === p || path.startsWith(p + "/"),
    );
    if (!allowed) {
      navigate({ to: "/inicio", replace: true });
    }
  }, [profileStatus, loading, location.pathname, navigate]);

  return null;
}
import { type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

/**
 * Blocks pages that require an approved profile.
 * Pending/rejected/banned users are redirected to /dashboard,
 * where they see their approval status. Staff bypass.
 */
export function RequireApproved({ children }: { children: ReactNode }) {
  const { user, loading, isApproved } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth/login" />;
  if (!isApproved) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

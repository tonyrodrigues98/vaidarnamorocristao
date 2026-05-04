import { Link } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function SupportFooterButton() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <span aria-hidden className="opacity-40">•</span>
      <Link
        to="/suporte"
        aria-label="Suporte"
        title="Suporte"
        className="inline-flex items-center gap-1 text-[var(--rose)] hover:underline"
      >
        <LifeBuoy className="h-4 w-4" />
        <span className="hidden sm:inline">Suporte</span>
      </Link>
    </>
  );
}
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { AdminSidebar } from "@/components/admin-shell/AdminSidebar";
import type { AdminDestination } from "@/config/admin-destinations";

export function AdminMobileDrawer({
  open,
  destinations,
  activeId,
  onClose,
}: {
  open: boolean;
  destinations: readonly AdminDestination[];
  activeId: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div
      className="vdn-admin-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Menu administrativo"
    >
      <button
        type="button"
        className="vdn-admin-drawer__backdrop"
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <div className="vdn-admin-drawer__panel">
        <button
          ref={closeRef}
          type="button"
          className="vdn-admin-drawer__close"
          onClick={onClose}
          aria-label="Fechar menu administrativo"
        >
          <X aria-hidden />
        </button>
        <AdminSidebar destinations={destinations} activeId={activeId} onNavigate={onClose} />
      </div>
    </div>
  );
}

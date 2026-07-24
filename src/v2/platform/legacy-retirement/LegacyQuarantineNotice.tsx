import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { createLegacyRetirementEvent, emitLegacyRetirementEvent } from "./telemetry";

export interface LegacyQuarantineNoticeProps {
  readonly context: "avatar" | "admin-avatar";
}

export function LegacyQuarantineNotice({ context }: LegacyQuarantineNoticeProps) {
  useEffect(() => {
    emitLegacyRetirementEvent(
      createLegacyRetirementEvent({
        name: "quarantine-shown",
        surface: "character-avatar",
        routeFamily: "avatar",
      }),
    );
  }, []);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-12">
      <section className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
        <ShieldCheck className="h-8 w-8 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">Avatar-personagem em quarentena</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          A criação, edição e expansão do personagem foram pausadas com segurança. Fotos, molduras,
          auras, fundos, presentes, stickers, inventários e histórico continuam preservados.
        </p>
        {context === "admin-avatar" ? (
          <Link
            to="/admin"
            className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Voltar ao Admin
          </Link>
        ) : (
          <Link
            to="/v2/$section"
            params={{ section: "perfil" }}
            className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Ir para o perfil
          </Link>
        )}
      </section>
    </main>
  );
}

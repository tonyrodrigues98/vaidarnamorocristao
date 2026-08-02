import { Compass, Clock } from "lucide-react";
import type { PetCareKind } from "@/types/petCare";

const KIND_MESSAGES: Record<PetCareKind, string[]> = {
  feed: [
    "Tá caçando o próprio almoço — não interrompe.",
    "Encontrou bagas raras no caminho.",
    "Diz que o lanche pode esperar.",
  ],
  hygiene: ["Tá voltando coberto de poeira épica.", "Banho? Só depois da aventura."],
  energy: ["Cochilou rapidinho atrás de uma pedra.", "Energia? Adrenalina pura agora."],
  sleep: ["Cochilou rapidinho atrás de uma pedra.", "Tá guardando energia pra próxima."],
  play: ["Tá brincando com criaturas estranhas.", "Achou amigos novos no caminho."],
  affection: [
    "Mandou um carinho mental — disse que te ama.",
    "Tá pensando em você bem nesse momento.",
  ],
};

function pickMessage(kind: PetCareKind, petId: string): string {
  const list = KIND_MESSAGES[kind] ?? ["Tá ocupado por aí. Volta logo."];
  // semente leve baseada no ms — varia entre toasts da mesma sessão
  const idx = Math.floor((Date.now() / 1000 + petId.length) % list.length);
  return list[idx];
}

export function PetAwayToast({
  petName,
  expeditionTitle,
  remaining,
  progressPct,
  kind,
  petId,
}: {
  petName: string;
  expeditionTitle: string;
  remaining: string;
  progressPct: number;
  kind: PetCareKind | "radial";
  petId: string;
}) {
  const msg =
    kind === "radial"
      ? `Não tá em casa — voltou e te abre os menus de novo.`
      : pickMessage(kind, petId);

  return (
    <div className="w-[min(360px,90vw)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)]">
      <div className="flex items-start gap-3 p-3.5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <Compass className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
            {expeditionTitle}
          </p>
          <p className="mt-0.5 text-[13px] font-medium text-neutral-900">
            {petName} {msg}
          </p>
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-neutral-500">
            <Clock className="size-3" />
            <span className="tabular-nums">Volta em {remaining}</span>
          </div>
        </div>
      </div>
      <div className="h-1 w-full bg-neutral-100">
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width] duration-700"
          style={{ width: `${Math.max(2, Math.min(100, progressPct))}%` }}
        />
      </div>
    </div>
  );
}

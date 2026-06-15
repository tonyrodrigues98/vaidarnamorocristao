import { createPortal } from "react-dom";
import { Coins, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PET_CARE_LABEL, type PetCareKind } from "@/types/petCare";

export type PetRandomEventPayload =
  | { type: "coins"; amount: number; label: string }
  | {
      type: "buff";
      kind: PetCareKind | "all";
      mult: number;
      duration_min: number;
      label: string;
    };

/**
 * Modal celebratório quando um evento aleatório dispara durante o cuidado.
 * Antes era só um toast discreto — agora ganha presença e CTA explícito.
 */
export function PetRandomEventModal({
  event,
  onClose,
}: {
  event: PetRandomEventPayload | null;
  onClose: () => void;
}) {
  if (!event || typeof document === "undefined") return null;

  const isCoins = event.type === "coins";
  const Icon = isCoins ? Coins : Sparkles;
  const accent = isCoins
    ? "from-amber-50 to-amber-100 text-amber-700"
    : "from-indigo-50 to-indigo-100 text-indigo-700";

  const title = isCoins ? "Evento da sorte!" : "Buff ativado!";
  const headline = isCoins
    ? `+${event.amount} moedas`
    : event.label;
  const detail = isCoins
    ? event.label
    : `Próximas ações de ${
        event.kind === "all" ? "qualquer tipo" : PET_CARE_LABEL[event.kind as PetCareKind] ?? event.kind
      } com +${Math.round((event.mult - 1) * 100)}% por ${event.duration_min} min.`;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-label="Evento aleatório do pet"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative z-10 m-3 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 rounded-full p-1 text-neutral-400 hover:text-neutral-700"
        >
          <X className="size-4" />
        </button>
        <div className={`bg-gradient-to-b ${accent} px-6 py-7 text-center`}>
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
            <Icon className="size-7" />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
            {title}
          </p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
            {headline}
          </h3>
        </div>
        <div className="px-6 pb-5 pt-4 text-center">
          <p className="text-sm leading-relaxed text-neutral-600">{detail}</p>
          <Button
            onClick={onClose}
            className="mt-5 w-full rounded-full bg-neutral-900 text-white hover:bg-neutral-800"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
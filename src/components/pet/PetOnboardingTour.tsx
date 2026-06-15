import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, Hand, ListChecks, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "pet_onboarding_seen_v1";

type Step = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Barras de cuidado",
    body:
      "Fome, energia, humor, higiene, sono e carência caem com o tempo. Mantenha-as acima de 50% para deixar seu pet feliz.",
  },
  {
    icon: ListChecks,
    title: "Missões e XP",
    body:
      "Complete missões diárias para ganhar XP, moedas e subir de nível — destrava novos cenários e itens.",
  },
  {
    icon: Hand,
    title: "Segure no pet",
    body:
      "Segure (ou clique com o direito) sobre o pet para abrir o menu circular de ações: alimentar, brincar, dar banho e mais.",
  },
];

/**
 * Tour de 3 passos exibido na primeira vez que o usuário abre /meu-pet
 * com um pet já criado. Marcado como visto em localStorage.
 */
export function PetOnboardingTour() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      /* noop */
    }
  }, []);

  function close() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
    setOpen(false);
  }

  if (!open || typeof document === "undefined") return null;
  const step = STEPS[i];
  const Icon = step.icon;
  const last = i === STEPS.length - 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-label="Apresentação do pet"
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200" />
      <div className="relative z-10 m-3 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
          <span>Passo {i + 1} de {STEPS.length}</span>
          <button
            type="button"
            onClick={close}
            className="text-neutral-400 hover:text-neutral-700"
          >
            Pular
          </button>
        </div>
        <div className="px-5 pb-5 pt-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <Icon className="size-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.body}</p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (idx === i ? "w-5 bg-neutral-900" : "w-1.5 bg-neutral-300")
                }
              />
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => (last ? close() : setI((n) => n + 1))}
            className="h-9 rounded-full bg-neutral-900 px-4 text-white hover:bg-neutral-800"
          >
            {last ? (
              <>
                Entendi <Check className="ml-1 size-4" />
              </>
            ) : (
              <>
                Avançar <ArrowRight className="ml-1 size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
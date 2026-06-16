import { useEffect, useState } from "react";
import { BookHeart, Trash2, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { clearDiaryLog, loadDiaryLog, type LoggedEntry } from "@/lib/petDiary";
import { cn } from "@/lib/utils";

const PHASE_LABEL: Record<LoggedEntry["phase"], string> = {
  morning: "Manhã",
  day: "Tarde",
  evening: "Entardecer",
  night: "Noite",
};

const MOOD_LABEL: Record<LoggedEntry["mood"], string> = {
  happy: "Tranquilo",
  playful: "Brincalhão",
  proud: "Orgulhoso",
  tired: "Cansado",
  sleepy: "Sonolento",
  hungry: "Com fome",
  lonely: "Saudoso",
  sad: "Pra baixo",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function PetDiarySheet({
  open,
  onOpenChange,
  petId,
  refreshKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  /** Incrementar força reler do localStorage (após salvar nova entrada). */
  refreshKey?: number;
}) {
  const [entries, setEntries] = useState<LoggedEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    setEntries(loadDiaryLog(petId));
  }, [open, petId, refreshKey]);

  // Agrupa por dia
  const groups = entries.reduce<Record<string, LoggedEntry[]>>((acc, e) => {
    const key = new Date(e.savedAt).toDateString();
    (acc[key] ??= []).push(e);
    return acc;
  }, {});

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="inline-flex items-center gap-2">
            <BookHeart className="size-4 text-amber-600" />
            Diário do pet
          </SheetTitle>
          <SheetDescription>
            Pensamentos que você decidiu guardar. Salvos no seu navegador.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
              <Sparkles className="mx-auto mb-2 size-5 text-amber-500" />
              <p className="text-sm text-neutral-600">
                Nenhuma página ainda. Quando seu pet pensar em algo bonito, toque em
                {" "}
                <span className="font-medium">Guardar no diário</span> para preservar.
              </p>
            </div>
          ) : (
            <>
              {Object.entries(groups).map(([day, items]) => (
                <div key={day}>
                  <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                    {formatDate(items[0].savedAt)}
                  </div>
                  <ul className="space-y-2">
                    {items.map((e) => (
                      <li
                        key={`${e.id}-${e.savedAt}`}
                        className={cn(
                          "rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm",
                        )}
                      >
                        <p className="text-[13px] leading-snug text-neutral-800">{e.text}</p>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-neutral-500">
                          <span>{formatTime(e.savedAt)}</span>
                          <span aria-hidden>·</span>
                          <span>{PHASE_LABEL[e.phase]}</span>
                          <span aria-hidden>·</span>
                          <span>{MOOD_LABEL[e.mood]}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  clearDiaryLog(petId);
                  setEntries([]);
                }}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[12px] font-medium text-neutral-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="size-3.5" />
                Limpar diário
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
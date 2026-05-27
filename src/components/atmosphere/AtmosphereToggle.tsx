import { useEffect, useState } from "react";
import { getAtmosMode, setAtmosMode, type AtmosMode } from "@/lib/timeOfDay";
import { Sparkles } from "lucide-react";

const OPTIONS: { value: AtmosMode; label: string; hint: string }[] = [
  { value: "on", label: "Completo", hint: "Cores + partículas + ícone do céu" },
  { value: "colors-only", label: "Só cores", hint: "Atmosfera estática, sem animação" },
  { value: "off", label: "Desligado", hint: "Sem ambientação" },
];

export function AtmosphereToggle() {
  const [mode, setMode] = useState<AtmosMode>("on");

  useEffect(() => {
    setMode(getAtmosMode());
  }, []);

  const update = (v: AtmosMode) => {
    setMode(v);
    setAtmosMode(v);
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-love text-white shadow-glow">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold">Ambiente dinâmico</h2>
          <p className="text-sm text-muted-foreground">
            A atmosfera visual muda suavemente conforme o horário do dia.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((o) => {
          const active = mode === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => update(o.value)}
              className={`rounded-xl border p-3 text-left transition ${
                active
                  ? "border-[var(--rose)] bg-[var(--rose)]/8 shadow-soft"
                  : "border-border bg-background hover:bg-accent"
              }`}
              aria-pressed={active}
            >
              <div className="text-sm font-medium">{o.label}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{o.hint}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
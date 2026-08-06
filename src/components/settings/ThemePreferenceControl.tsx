import type { ResolvedTheme, ThemePreference } from "@/lib/theme-core";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "system", label: "Sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
] as const;

export type ThemePreferenceControlProps = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  onChange: (preference: ThemePreference) => void;
  className?: string;
};

export function ThemePreferenceControl({
  preference,
  resolvedTheme,
  onChange,
  className,
}: ThemePreferenceControlProps) {
  return (
    <fieldset className={cn("grid gap-2", className)}>
      <legend className="sr-only">Tema do aplicativo</legend>
      <div
        role="radiogroup"
        aria-label="Tema do aplicativo"
        className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/50 p-1"
      >
        {themeOptions.map((option) => {
          const selected = option.value === preference;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              data-state={selected ? "checked" : "unchecked"}
              className={cn(
                "min-h-11 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected && "bg-card text-foreground shadow-sm",
              )}
              onClick={() => onChange(option.value)}
            >
              {option.label}
              {selected ? <span className="sr-only">, selecionado</span> : null}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Sistema acompanha o dispositivo. Tema aplicado agora:{" "}
        {resolvedTheme === "dark" ? "Escuro" : "Claro"}.
      </p>
    </fieldset>
  );
}

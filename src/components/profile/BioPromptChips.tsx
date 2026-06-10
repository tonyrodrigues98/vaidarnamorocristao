import { Lightbulb } from "lucide-react";
import { BIO_PROMPTS, LOOKING_FOR_PROMPTS, type BioPrompt } from "@/lib/bioPrompts";

type Props = {
  current: string | null | undefined;
  onApply: (newValue: string) => void;
  variant?: "bio" | "looking_for";
};

/**
 * Renders prompt chips that help the user start writing a bio.
 * Behavior:
 * - clicking a chip prefixes the textarea with the prompt starter;
 * - if the textarea already has content, asks for confirmation before replacing;
 * - never auto-saves; the user still needs to submit.
 */
export function BioPromptChips({ current, onApply, variant = "bio" }: Props) {
  const prompts: BioPrompt[] = variant === "looking_for" ? LOOKING_FOR_PROMPTS : BIO_PROMPTS;

  function handleClick(p: BioPrompt) {
    const hasContent = !!current && current.trim().length > 0;
    if (hasContent) {
      const ok = window.confirm(
        "Você já escreveu algo. Deseja substituir pelo começo da sugestão? Você ainda poderá editar antes de salvar.",
      );
      if (!ok) return;
    }
    onApply(p.starter);
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Lightbulb className="h-3.5 w-3.5" />
        Sugestões para começar
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleClick(p)}
            className="app-pressable rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground transition hover:bg-accent"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
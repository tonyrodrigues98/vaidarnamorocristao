import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type AvatarBaseOption = {
  id: string;
  name: string;
  image_url: string;
  key: string; // body_type or pose_key
  label: string;
  /** Optional color swatch to render when image_url is empty (e.g. skin tones). */
  swatch?: string;
  /** When true, option is shown but not clickable (asset not generated yet). */
  disabled?: boolean;
};

type Props = {
  title: string;
  description?: string;
  options: AvatarBaseOption[];
  activeKey: string;
  onPick: (option: AvatarBaseOption) => void;
  emptyHint?: string;
};

export function AvatarBaseSelector({
  title,
  description,
  options,
  activeKey,
  onPick,
  emptyHint,
}: Props) {
  return (
    <div className="rounded-t-3xl bg-white px-4 pt-4 pb-24 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {options.length === 0 ? (
        <div className="rounded-2xl bg-secondary/40 px-3 py-4 text-center text-xs text-muted-foreground">
          {emptyHint ?? "Nenhuma opção disponível ainda."}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {options.map((opt) => {
            const active = opt.key === activeKey;
            const isDisabled = !!opt.disabled;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => !isDisabled && onPick(opt)}
                disabled={isDisabled}
                className={cn(
                  "group relative flex flex-col rounded-2xl border bg-white p-2 text-left transition",
                  active
                    ? "border-primary shadow-md ring-1 ring-primary"
                    : "border-border hover:border-primary/40",
                  isDisabled && "cursor-not-allowed opacity-60",
                )}
              >
                {active && (
                  <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#FFF7F3] to-[#FFEEE6]">
                  {opt.image_url ? (
                    <img
                      src={opt.image_url}
                      alt={opt.label}
                      className="h-full w-full object-contain p-1"
                      loading="lazy"
                    />
                  ) : opt.swatch ? (
                    <div className="flex h-full w-full items-center justify-center p-3">
                      <div
                        className="h-full w-full rounded-xl border border-black/10"
                        style={{ backgroundColor: opt.swatch }}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="mt-2 px-1">
                  <p className="truncate text-sm font-medium text-foreground">{opt.label}</p>
                  <div className="mt-1.5">
                    <div className="rounded-full bg-secondary px-3 py-1 text-center text-[11px] font-medium text-foreground">
                      {isDisabled ? "Em breve" : "Grátis"}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

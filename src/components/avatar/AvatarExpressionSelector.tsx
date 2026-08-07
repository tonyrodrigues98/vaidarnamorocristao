import { cn } from "@/lib/utils";
import { MOCK_EXPRESSIONS } from "@/data/avatarMockData";
import type { AvatarExpressionKey } from "@/types/avatar";

type Props = {
  value: AvatarExpressionKey;
  onChange: (expression: AvatarExpressionKey) => void;
};

export function AvatarExpressionSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOCK_EXPRESSIONS.map((exp) => {
        const active = exp.key === value;
        return (
          <button
            key={exp.key}
            type="button"
            onClick={() => onChange(exp.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-foreground hover:bg-secondary/80",
            )}
          >
            {exp.label}
          </button>
        );
      })}
    </div>
  );
}

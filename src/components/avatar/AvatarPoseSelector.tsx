import { cn } from "@/lib/utils";
import { MOCK_POSES } from "@/data/avatarMockData";
import type { AvatarPoseKey } from "@/types/avatar";

type Props = {
  value: AvatarPoseKey;
  onChange: (pose: AvatarPoseKey) => void;
};

export function AvatarPoseSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOCK_POSES.map((pose) => {
        const active = pose.key === value;
        return (
          <button
            key={pose.key}
            type="button"
            onClick={() => onChange(pose.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-foreground hover:bg-secondary/80",
            )}
          >
            {pose.label}
          </button>
        );
      })}
    </div>
  );
}

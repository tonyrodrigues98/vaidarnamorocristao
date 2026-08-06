import * as React from "react";

import { cn } from "@/lib/utils";

export type NativeProgressProps = {
  title: string;
  value: number;
  metadata?: React.ReactNode;
  className?: string;
};

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function NativeProgress({ title, value, metadata, className }: NativeProgressProps) {
  const clampedValue = clampProgress(value);

  return (
    <section className={cn("grid gap-2", className)} data-native-progress="">
      <header className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-foreground">{title}</span>
        {metadata ? <span className="text-sm text-muted-foreground">{metadata}</span> : null}
      </header>
      <div
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedValue}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <span
          className="block h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </section>
  );
}

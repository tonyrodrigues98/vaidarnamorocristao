import type { ReactNode } from "react";

export type NativeSettingsGroupProps = {
  title: string;
  children: ReactNode;
  tone?: "default" | "danger";
};

export function NativeSettingsGroup({
  title,
  children,
  tone = "default",
}: NativeSettingsGroupProps) {
  return (
    <section className="space-y-2" data-native-settings-group={tone}>
      <h2
        className={
          tone === "danger"
            ? "px-1 text-sm font-semibold text-destructive"
            : "px-1 text-sm font-semibold text-foreground"
        }
      >
        {title}
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {children}
      </div>
    </section>
  );
}

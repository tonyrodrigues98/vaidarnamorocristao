import type { ReactNode } from "react";

export function NativeCommunitySection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

import type { CSSProperties, ReactNode } from "react";

import { nativeShellTokens } from "@/config/native-shell-tokens";
import { useTheme } from "@/lib/theme";

import "@/styles/native-shell.frame.css";

export type NativeRootPlaceholderSection = {
  id: string;
  label: string;
  description: string;
};

export type NativeRootPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: readonly NativeRootPlaceholderSection[];
  children?: ReactNode;
};

export function NativeRootPlaceholder({
  eyebrow,
  title,
  description,
  sections,
  children,
}: NativeRootPlaceholderProps) {
  const { resolvedTheme } = useTheme();
  const palette = nativeShellTokens[resolvedTheme];
  const descriptionId = `native-root-${title.toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, "-")}-description`;
  const scopedTheme = {
    "--vdn-native-canvas": palette.canvas,
    "--vdn-native-surface-primary": palette.surfacePrimary,
    "--vdn-native-text-primary": palette.textPrimary,
    "--vdn-native-text-secondary": palette.textSecondary,
    "--vdn-native-border": palette.border,
  } as CSSProperties;

  return (
    <main
      className="min-h-[100dvh] bg-background px-4 pb-24 pt-[max(1.5rem,env(safe-area-inset-top))] text-foreground"
      data-vdn-native-root
      data-theme={resolvedTheme}
      aria-describedby={descriptionId}
      style={scopedTheme}
    >
      <div className="mx-auto w-full max-w-3xl">
        <header className="vdn-native-root__header">
          <p className="vdn-native-root__eyebrow">{eyebrow}</p>
          <h1 className="vdn-native-root__title">{title}</h1>
          <p id={descriptionId} className="vdn-native-root__description">
            {description}
          </p>
        </header>

        <div className="vdn-native-root__sections" aria-label={`Áreas de ${title}`}>
          {sections.map((section) => (
            <section
              key={section.id}
              className="vdn-native-root__section"
              aria-labelledby={`native-root-section-${section.id}`}
            >
              <h2
                id={`native-root-section-${section.id}`}
                className="vdn-native-root__section-title"
              >
                {section.label}
              </h2>
              <p className="vdn-native-root__section-description">{section.description}</p>
            </section>
          ))}
        </div>

        {children !== undefined && <div className="vdn-native-root__actions">{children}</div>}
      </div>
    </main>
  );
}

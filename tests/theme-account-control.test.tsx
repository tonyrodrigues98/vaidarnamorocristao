import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ThemePreferenceControl } from "../src/components/settings/ThemePreferenceControl";

function findButtons(
  node: ReactNode,
): ReactElement<{ onClick?: () => void; children?: ReactNode }>[] {
  if (!isValidElement(node)) return [];
  const element = node as ReactElement<{ onClick?: () => void; children?: ReactNode }>;
  const own = element.type === "button" ? [element] : [];
  return [
    ...own,
    ...Children.toArray(element.props.children).flatMap((child) => findButtons(child)),
  ];
}

describe("account theme preference control", () => {
  it("renders three accessible options and exposes text selection", () => {
    const markup = renderToStaticMarkup(
      <ThemePreferenceControl preference="system" resolvedTheme="dark" onChange={() => {}} />,
    );
    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('aria-label="Tema do aplicativo"');
    expect(markup.match(/role="radio"/g)).toHaveLength(3);
    expect(markup).toContain("Sistema");
    expect(markup).toContain("Claro");
    expect(markup).toContain("Escuro");
    expect(markup).toContain("selecionado");
    expect(markup).toContain("min-h-11");
    expect(markup).toContain("Tema aplicado agora:");
  });

  it("changes preference when an option is activated", () => {
    const onChange = vi.fn();
    const tree = ThemePreferenceControl({
      preference: "system",
      resolvedTheme: "light",
      onChange,
    });
    const buttons = findButtons(tree);
    expect(buttons).toHaveLength(3);
    buttons[2]?.props.onClick?.();
    expect(onChange).toHaveBeenCalledWith("dark");
  });
});

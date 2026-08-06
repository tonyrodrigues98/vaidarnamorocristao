import { renderToStaticMarkup } from "react-dom/server";
import { Bell, Check } from "lucide-react";
import { describe, expect, it } from "vitest";
import {
  V2Button,
  V2Heading,
  V2IconButton,
  V2LoadingIndicator,
  V2Skeleton,
  V2StatusBadge,
  V2Surface,
  V2TextArea,
  V2TextField,
  V2ThemeScope,
  buttonVariants,
} from "../src/v2/design-system";
import { V2DesignSystemShowcase } from "../src/v2/design-system/showcase/V2DesignSystemShowcase";

describe("V2 component contracts", () => {
  it("keeps button defaults predictable and exposes every validated variant", () => {
    expect(buttonVariants()).toContain("vdn-v2-button--primary");
    for (const variant of [
      "primary",
      "secondary",
      "outline",
      "ghost",
      "destructive",
      "link",
    ] as const) {
      expect(buttonVariants({ variant })).toContain(`vdn-v2-button--${variant}`);
    }
  });

  it("makes loading and disabled buttons unavailable and announced", () => {
    const loading = renderToStaticMarkup(
      <V2Button loading loadingLabel="Salvando">
        Salvar
      </V2Button>,
    );
    const disabled = renderToStaticMarkup(<V2Button disabled>Indisponível</V2Button>);

    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain("disabled");
    expect(loading).toContain('role="status"');
    expect(loading).toContain("Salvando");
    expect(disabled).toContain("disabled");
  });

  it("supports safe composition and rejects unsupported composed loading", () => {
    const composed = renderToStaticMarkup(
      <V2Button asChild variant="outline">
        <a href="/inicio">Abrir</a>
      </V2Button>,
    );

    expect(composed).toContain('<a href="/inicio"');
    expect(composed).toContain("vdn-v2-button--outline");
    expect(() =>
      renderToStaticMarkup(
        <V2Button asChild loading>
          <a href="/inicio">Abrir</a>
        </V2Button>,
      ),
    ).toThrow(/does not accept loading/);
  });

  it("requires an accessible name for icon-only buttons", () => {
    const markup = renderToStaticMarkup(<V2IconButton label="Notificações" icon={<Bell />} />);
    expect(markup).toContain('aria-label="Notificações"');
    expect(markup).toContain('aria-hidden="true"');
    expect(() => renderToStaticMarkup(<V2IconButton label=" " icon={<Bell />} />)).toThrow(
      /accessible label/,
    );
  });

  it("associates text-field label, help and error without relying on placeholder", () => {
    const markup = renderToStaticMarkup(
      <V2TextField
        id="public-name"
        label="Nome público"
        description="Visível na comunidade"
        error="Revise este campo"
        required
        autoComplete="name"
      />,
    );

    expect(markup).toContain('for="public-name"');
    expect(markup).toContain('id="public-name"');
    expect(markup).toContain('required=""');
    expect(markup).toContain('aria-describedby="public-name-description public-name-error"');
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('role="alert"');
    expect(markup).not.toContain("placeholder=");
  });

  it("associates textarea metadata and preserves native read-only behavior", () => {
    const markup = renderToStaticMarkup(
      <V2TextArea id="about" label="Sobre você" description="Apresentação comunitária" readOnly />,
    );
    expect(markup).toContain('for="about"');
    expect(markup).toContain('aria-describedby="about-description"');
    expect(markup).toContain('readOnly=""');
  });

  it("separates heading semantics from visual size", () => {
    const markup = renderToStaticMarkup(
      <V2Heading level={3} size="display">
        Título
      </V2Heading>,
    );
    expect(markup).toContain("<h3");
    expect(markup).toContain("vdn-v2-heading--display");
    expect(markup).toContain('data-vdn-v2-heading-level="3"');
  });

  it("keeps surfaces presentational, badges textual and skeletons non-interactive", () => {
    const surface = renderToStaticMarkup(
      <V2Surface as="article" tone="elevated" elevation="two">
        Conteúdo
      </V2Surface>,
    );
    const badge = renderToStaticMarkup(
      <V2StatusBadge tone="success" icon={<Check />}>
        Confirmado
      </V2StatusBadge>,
    );
    const skeleton = renderToStaticMarkup(<V2Skeleton width="12rem" height="2rem" />);

    expect(surface).toContain("<article");
    expect(surface).toContain("vdn-v2-surface--elevated");
    expect(badge).toContain("Confirmado");
    expect(skeleton).toContain('aria-hidden="true"');
    expect(skeleton).not.toContain("tabindex");
  });

  it("applies a complete scoped theme without browser globals", () => {
    const markup = renderToStaticMarkup(
      <V2ThemeScope theme="dark">
        <V2LoadingIndicator label="Carregando conteúdo" />
      </V2ThemeScope>,
    );
    expect(markup).toContain('data-vdn-v2=""');
    expect(markup).toContain('data-vdn-v2-theme="dark"');
    expect(markup).toContain("--v2-color-canvas:#11151c");
    expect(markup).toContain('role="status"');
  });

  it("renders the isolated showcase as a real consumer", () => {
    const markup = renderToStaticMarkup(<V2DesignSystemShowcase />);
    const ids = Array.from(markup.matchAll(/\sid="([^"]+)"/g), (match) => match[1]);
    expect(markup).toContain('data-vdn-v2-showcase=""');
    expect(markup).toContain('data-vdn-v2-theme="light"');
    expect(markup).toContain('data-vdn-v2-theme="dark"');
    expect(markup).toContain("Explorar comunidade");
    expect(markup).toContain("Nome público");
    expect(ids).toHaveLength(new Set(ids).size);
  });
});

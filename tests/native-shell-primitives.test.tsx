import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  NativeAvatar,
  NativeField,
  NativeProgress,
  type NativeAvatarProps,
} from "../src/components/native-shell";

const validImageAvatar: NativeAvatarProps = {
  src: "/profile.jpg",
  alt: "Foto de Ana",
  fallback: "AN",
};
const validFallbackAvatar: NativeAvatarProps = { fallback: "AN" };
// @ts-expect-error image avatars require alternative text
const invalidImageAvatar: NativeAvatarProps = { src: "/profile.jpg", fallback: "AN" };

describe("isolated native shell primitives", () => {
  it("renders a square, circular and incompressible avatar with required image semantics", () => {
    const markup = renderToStaticMarkup(
      <NativeAvatar src="/profile.jpg" alt="Foto de Ana" fallback="AN" size="lg" />,
    );

    expect(markup).toContain('data-native-avatar-size="lg"');
    expect(markup).toContain("aspect-square");
    expect(markup).toContain("shrink-0");
    expect(markup).toContain("rounded-full");
    expect(markup).toContain("object-cover");
    expect(markup).toContain('alt="Foto de Ana"');
    expect(markup).toContain("h-12 w-12");
    expect(markup).not.toContain('src="undefined"');
    expect(validImageAvatar.alt).toBe("Foto de Ana");
    expect(validFallbackAvatar.src).toBeUndefined();
    expect(invalidImageAvatar.src).toBe("/profile.jpg");
  });

  it("renders an avatar fallback without an image request", () => {
    const markup = renderToStaticMarkup(<NativeAvatar fallback="VD" size="sm" />);

    expect(markup).toContain("VD");
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain("<img");
  });

  it("falls back on error and resets the failure when the image source changes", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) =>
      readFile("src/components/native-shell/NativeAvatar.tsx", "utf8"),
    );

    expect(source).toContain('const hasImage = "src" in props');
    expect(source).toContain("setImageFailed(false)");
    expect(source).toContain("}, [imageSrc])");
    expect(source).toContain("onError={() => setImageFailed(true)}");
    expect(source).toContain('role={hasImage && imageFailed ? "img" : undefined}');
    expect(source).not.toMatch(/src=\{[^}]*undefined/);
  });

  it("clamps progress and exposes its accessible range on a separate bar row", () => {
    const markup = renderToStaticMarkup(
      <NativeProgress title="Perfil completo" value={140} metadata="5 de 5" />,
    );
    const emptyMarkup = renderToStaticMarkup(
      <NativeProgress title="Progresso inválido" value={Number.NaN} />,
    );
    const titleEnd = markup.indexOf("</header>");
    const progressStart = markup.indexOf('role="progressbar"');

    expect(markup).toContain('aria-valuemin="0"');
    expect(markup).toContain('aria-valuemax="100"');
    expect(markup).toContain('aria-valuenow="100"');
    expect(markup).toContain("width:100%");
    expect(progressStart).toBeGreaterThan(titleEnd);
    expect(markup).not.toContain("absolute");
    expect(markup).not.toMatch(/-m[trblxy]?-|margin:-/);
    expect(emptyMarkup).toContain('aria-valuenow="0"');
    expect(emptyMarkup).toContain("width:0%");
  });

  it("associates input label, description and error while preserving mobile font size", () => {
    const markup = renderToStaticMarkup(
      <NativeField
        id="native-name"
        label="Nome"
        description="Como você será chamado"
        error="Informe seu nome"
        autoComplete="name"
        disabled
      />,
    );

    expect(markup).toContain('for="native-name"');
    expect(markup).toContain('id="native-name"');
    expect(markup).toContain('aria-describedby="native-name-description native-name-error"');
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("text-base");
    expect(markup).toContain("focus-visible:ring-2");
    expect(markup).toContain("disabled");
  });

  it("composes the existing textarea without introducing a form system", () => {
    const markup = renderToStaticMarkup(
      <NativeField
        id="native-about"
        label="Sobre você"
        description="Uma apresentação breve"
        multiline
        rows={4}
      />,
    );

    expect(markup).toContain("<textarea");
    expect(markup).toContain('aria-describedby="native-about-description"');
    expect(markup).toContain('rows="4"');
    expect(markup).not.toContain("user-scalable");
  });
});

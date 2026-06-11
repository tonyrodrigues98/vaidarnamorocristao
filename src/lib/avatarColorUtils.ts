/**
 * Utilitários de recolor para o avatar.
 *
 * O contrato é simples: dada uma camada do renderer, retorna `style` e
 * `className` para aplicar no <img>. Cada `colorMode` tem uma rota
 * diferente, mas a chamada no renderer é sempre a mesma — é a única
 * regra para qualquer camada futura também.
 *
 * Fallbacks deliberadamente seguros:
 *  - sem preset OU `colorMode === "fixed_asset"` → estilo vazio
 *    (imagem original intacta).
 *  - `mask_tint` sem `maskUrl` → estilo vazio + warning em dev.
 *  - `canvas_tint` → ainda não implementado; cai em `fixed_asset`.
 */

import type { CSSProperties } from "react";
import type {
  AvatarColorMode,
  AvatarColorPreset,
  AvatarRendererLayer,
} from "@/types/avatar";

type LayerColorInput = {
  colorMode?: AvatarColorMode;
  preset?: AvatarColorPreset | null;
  maskUrl?: string;
};

export type LayerColorOutput = {
  style: CSSProperties;
  className: string;
};

const EMPTY: LayerColorOutput = { style: {}, className: "" };

/**
 * Retorna o estilo CSS que aplica o preset sobre a camada. Os modos hoje:
 *  - tintable: usa `mix-blend-mode: multiply` num overlay de cor que
 *    fica POR CIMA do PNG via pseudo-elemento; como `<img>` não suporta
 *    pseudo-elemento, no v1 usamos `filter` (hue + saturate aproximado).
 *    É bom o bastante para variações de cor "lisas".
 *  - mask_tint: usa `mask-image` (CSS) com `background-color` para pintar
 *    o recorte exato. O <img> vira efetivamente um pixel pintado dentro
 *    da máscara.
 */
export function getLayerColorStyle({
  colorMode = "fixed_asset",
  preset,
  maskUrl,
}: LayerColorInput): LayerColorOutput {
  if (!preset || colorMode === "fixed_asset") return EMPTY;

  if (colorMode === "tintable") {
    // Aproximação barata: hue-rotate puxa para a matiz alvo + saturação.
    // Funciona melhor sobre assets já mais ou menos neutros. Para fidelidade
    // real, migrar o asset para mask_tint.
    return {
      className: "",
      style: {
        // O hint de cor é só metadata para devtools; o efeito real é o filter.
        ["--avatar-tint" as unknown as keyof CSSProperties]: preset.hex,
        filter: buildTintFilter(preset.hex),
      } as CSSProperties,
    };
  }

  if (colorMode === "mask_tint") {
    if (!maskUrl) {
      if (import.meta.env.DEV) {
        console.warn("[avatarColorUtils] mask_tint sem maskUrl, voltando para fixed_asset");
      }
      return EMPTY;
    }
    return {
      className: "",
      style: {
        backgroundColor: preset.hex,
        maskImage: `url(${maskUrl})`,
        WebkitMaskImage: `url(${maskUrl})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
      },
    };
  }

  // canvas_tint: reservado para composição offscreen no futuro.
  return EMPTY;
}

export function getLayerColorStyleForRendererLayer(
  layer: AvatarRendererLayer,
): LayerColorOutput {
  return getLayerColorStyle({
    colorMode: layer.colorMode,
    preset: layer.colorPreset ?? null,
    maskUrl: layer.maskUrl,
  });
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h, s, l };
}

/**
 * Converte um hex em uma string de `filter` que aproxima a cor sobre
 * uma imagem "neutra". Não é fiel; é só um caminho rápido enquanto não
 * temos máscara real. Para itens premium ou cores críticas, use
 * mask_tint.
 */
function buildTintFilter(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  // Hue-rotate parte do vermelho (0deg), então passamos h direto.
  const sat = Math.round(s * 200); // 0..200%
  const bright = Math.round(l * 150 + 30); // 30..180%
  return `saturate(0) sepia(1) hue-rotate(${Math.round(h)}deg) saturate(${sat}%) brightness(${bright}%)`;
}

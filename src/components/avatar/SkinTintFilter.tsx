/**
 * Filtro SVG global de tonalização de pele.
 *
 * Renderize <SkinTintFilter /> UMA vez perto da raiz da página de avatar.
 * Cada base/luminância depois aplica `filter: url(#skin-tint-<tone>)` para
 * receber a cor de pele correspondente sem gerar PNG novo.
 *
 * Mecânica: feColorMatrix multiplica o canal cinza da luminância pela
 * cor `base` do tom; sombras (luminância baixa) puxam para `shadow`,
 * brilhos (luminância alta) para `highlight`. Como o PNG neutro só tem
 * pele dentro da máscara, o filtro só pinta onde há pele.
 *
 * NOTA: enquanto as bases neutras (luminance + mask) não chegam (Fase 2 do
 * plano), este componente fica registrado mas só é aplicado em <img> que
 * opta explicitamente via prop — bases coloridas antigas continuam intactas.
 */

import { SKIN_PALETTE, type SkinToneKey } from "@/lib/avatarPalette";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function colorMatrix(base: string): string {
  const [r, g, b] = hexToRgb(base);
  // Multiply: cada canal de saída = canal de entrada (cinza) * cor/255
  // Resulta em "pinta a luminância com a cor base, preservando sombras".
  const fr = (r / 255).toFixed(4);
  const fg = (g / 255).toFixed(4);
  const fb = (b / 255).toFixed(4);
  return `${fr} 0 0 0 0  0 ${fg} 0 0 0  0 0 ${fb} 0 0  0 0 0 1 0`;
}

export function SkinTintFilter() {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {(Object.keys(SKIN_PALETTE) as SkinToneKey[]).map((tone) => (
          <filter key={tone} id={`skin-tint-${tone}`} colorInterpolationFilters="sRGB">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values={colorMatrix(SKIN_PALETTE[tone].base)}
            />
          </filter>
        ))}
      </defs>
    </svg>
  );
}

export function skinFilterUrl(tone: SkinToneKey | string | null | undefined) {
  if (!tone || !(tone in SKIN_PALETTE)) return undefined;
  return `url(#skin-tint-${tone})`;
}

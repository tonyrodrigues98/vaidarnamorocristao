/**
 * "Galeria de Fé e Vida" — categorias opcionais para `profile_photos.category`.
 * Valores internos em português curto para combinar com o restante do projeto.
 * Fotos antigas continuam válidas com `category = null` e aparecem em
 * "Dia a dia" no agrupamento de UI.
 */

export type PhotoCategory = "fe" | "familia" | "especiais" | "viagens" | "dia_a_dia";

export type PhotoCategoryOption = {
  value: PhotoCategory;
  label: string;
  description: string;
};

export const PHOTO_CATEGORIES: PhotoCategoryOption[] = [
  { value: "fe", label: "Vida com Deus", description: "Igreja, batismo, louvor, devocional." },
  { value: "familia", label: "Família", description: "Pais, irmãos, sobrinhos, casa." },
  { value: "especiais", label: "Momentos especiais", description: "Conquistas e datas marcantes." },
  { value: "viagens", label: "Viagens", description: "Lugares que marcaram." },
  { value: "dia_a_dia", label: "Dia a dia", description: "Rotina, hobbies, amigos." },
];

const LABELS: Record<PhotoCategory, string> = Object.fromEntries(
  PHOTO_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<PhotoCategory, string>;

export function categoryLabel(value: string | null | undefined): string {
  if (!value) return "Dia a dia";
  return LABELS[value as PhotoCategory] ?? "Dia a dia";
}

export function isPhotoCategory(value: unknown): value is PhotoCategory {
  return typeof value === "string" && PHOTO_CATEGORIES.some((c) => c.value === value);
}

export function normalizeCategory(value: string | null | undefined): PhotoCategory {
  return isPhotoCategory(value) ? value : "dia_a_dia";
}

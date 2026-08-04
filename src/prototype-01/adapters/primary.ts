import type { NativeCommunityTab } from "@/config/native-community-tabs";
import type { Prototype01CommunitySection } from "@/prototype-01/screens/ComunidadeScreen";
import type { Prototype01ProfileFields } from "@/prototype-01/screens/PerfilScreen";

export function toPrototype01CommunitySection(
  tab: NativeCommunityTab,
): Prototype01CommunitySection {
  if (tab === "espacos") return "Espaços";
  if (tab === "eventos") return "Eventos";
  return "Agora";
}

export function fromPrototype01CommunitySection(
  section: Prototype01CommunitySection,
): NativeCommunityTab {
  if (section === "Espaços") return "espacos";
  if (section === "Eventos") return "eventos";
  return "agora";
}

export function toPrototype01ProfileFields(fields: Prototype01ProfileFields) {
  return { ...fields } satisfies Prototype01ProfileFields;
}

export const PROFILE_MODULE_TYPES = [
  "about",
  "faith",
  "favorites",
  "gallery",
  "achievements",
  "gifts",
  "pet",
  "verses",
  "communities",
  "collections",
  "relationship",
] as const;

export type ProfileModuleType = (typeof PROFILE_MODULE_TYPES)[number];
export type ProfileAudience = "public" | "community" | "connections" | "private";

const PROFILE_MODULE_TITLES: Readonly<Record<ProfileModuleType, string>> = {
  about: "Sobre mim",
  faith: "Minha fé",
  favorites: "Favoritos",
  gallery: "Galeria",
  achievements: "Conquistas",
  gifts: "Presentes",
  pet: "Pet em destaque",
  verses: "Versículos e devocionais",
  communities: "Comunidades e eventos",
  collections: "Coleções",
  relationship: "Relacionamento",
};

export function profileModuleTitle(type: ProfileModuleType): string {
  return PROFILE_MODULE_TITLES[type];
}

export interface ProfileIdentity {
  readonly displayName: string;
  readonly photoUrl: string | null;
  readonly bio: string;
  readonly city: string | null;
  readonly state: string | null;
  readonly church: string | null;
  readonly yearsBaptized: number | null;
  readonly verified: boolean;
  readonly presence: "online" | "recently" | "offline";
}

export interface ProfileAppearance {
  readonly backgroundUrl: string | null;
  readonly frameUrl: string | null;
  readonly auraUrl: string | null;
  readonly nameGradient: readonly [string, string] | null;
}

export interface ProfileGalleryItem {
  readonly id: string;
  readonly url: string;
  readonly category: string | null;
}

export interface ProfileHighlight {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly imageUrl: string | null;
}

export interface ProfileModuleData {
  readonly text?: string;
  readonly items?: readonly ProfileHighlight[];
  readonly gallery?: readonly ProfileGalleryItem[];
}

export interface ProfileModule {
  readonly type: ProfileModuleType;
  readonly order: number;
  readonly visible: boolean;
  readonly audience: ProfileAudience;
  readonly data: ProfileModuleData;
}

export interface ProfileSnapshot {
  readonly identity: ProfileIdentity;
  readonly appearance: ProfileAppearance;
  readonly modules: readonly ProfileModule[];
  readonly owner: boolean;
  readonly configurationUpdatedAt: string | null;
}

export interface ProfileRepository {
  loadProfile(viewerUserId: string, profileUserId: string): Promise<ProfileSnapshot>;
  saveModules(
    userId: string,
    modules: readonly ProfileModule[],
    expectedUpdatedAt: string | null,
  ): Promise<string>;
}

export function isProfileModuleType(value: unknown): value is ProfileModuleType {
  return typeof value === "string" && PROFILE_MODULE_TYPES.includes(value as ProfileModuleType);
}

export function isProfileAudience(value: unknown): value is ProfileAudience {
  return (
    value === "public" || value === "community" || value === "connections" || value === "private"
  );
}

export function normalizeProfileModules(
  modules: readonly ProfileModule[],
): readonly ProfileModule[] {
  const unique = new Map<ProfileModuleType, ProfileModule>();
  for (const module of [...modules].sort((left, right) => left.order - right.order)) {
    if (!unique.has(module.type)) unique.set(module.type, module);
  }
  return [...unique.values()].map((module, order) => ({ ...module, order }));
}

export function moveProfileModule(
  modules: readonly ProfileModule[],
  type: ProfileModuleType,
  direction: -1 | 1,
): readonly ProfileModule[] {
  const normalized = normalizeProfileModules(modules);
  const index = normalized.findIndex((module) => module.type === type);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= normalized.length) return normalized;
  const reordered = [...normalized];
  [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
  return reordered.map((module, order) => ({ ...module, order }));
}

export function updateProfileModule(
  modules: readonly ProfileModule[],
  type: ProfileModuleType,
  patch: Partial<Pick<ProfileModule, "visible" | "audience">>,
): readonly ProfileModule[] {
  return normalizeProfileModules(
    modules.map((module) => (module.type === type ? { ...module, ...patch } : module)),
  );
}

export function restoreProfileModuleDefaults(
  modules: readonly ProfileModule[],
): readonly ProfileModule[] {
  const byType = new Map(modules.map((module) => [module.type, module]));
  return PROFILE_MODULE_TYPES.filter((type) => byType.has(type)).map((type, order) => ({
    type,
    order,
    visible: type !== "relationship",
    audience:
      type === "relationship"
        ? "private"
        : type === "about" || type === "faith"
          ? "community"
          : "connections",
    data: byType.get(type)?.data ?? {},
  }));
}

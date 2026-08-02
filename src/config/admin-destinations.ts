import type { AppRole } from "@/lib/roles";

export type AdminNavigationGroupId =
  | "overview"
  | "trust"
  | "content"
  | "catalog"
  | "economy"
  | "live";

export type AdminIconKey =
  | "dashboard"
  | "verification"
  | "photos"
  | "gifts"
  | "stickers"
  | "backgrounds"
  | "frames"
  | "auras"
  | "gradients"
  | "avatar"
  | "pets"
  | "economy"
  | "live";

export type AdminDestination = {
  id: string;
  path: string;
  match: "exact" | "prefix";
  title: string;
  shortLabel: string;
  group: AdminNavigationGroupId;
  icon: AdminIconKey;
  allowedRoles: readonly AppRole[];
};

const allStaff = ["super_admin", "admin", "moderador", "apresentador"] as const;
const administrators = ["super_admin", "admin"] as const;
const superAdminOnly = ["super_admin"] as const;

export const adminDestinations = [
  {
    id: "admin-overview",
    path: "/admin",
    match: "exact",
    title: "Administração",
    shortLabel: "Painel",
    group: "overview",
    icon: "dashboard",
    allowedRoles: allStaff,
  },
  {
    id: "admin-verifications",
    path: "/admin/verificacoes",
    match: "exact",
    title: "Verificações",
    shortLabel: "Verificações",
    group: "trust",
    icon: "verification",
    allowedRoles: administrators,
  },
  {
    id: "admin-photos",
    path: "/admin/fotos",
    match: "exact",
    title: "Moderação de fotos",
    shortLabel: "Fotos",
    group: "trust",
    icon: "photos",
    allowedRoles: administrators,
  },
  {
    id: "admin-gifts",
    path: "/admin/presentes",
    match: "exact",
    title: "Presentes",
    shortLabel: "Presentes",
    group: "content",
    icon: "gifts",
    allowedRoles: allStaff,
  },
  {
    id: "admin-stickers",
    path: "/admin/stickers",
    match: "exact",
    title: "Stickers",
    shortLabel: "Stickers",
    group: "content",
    icon: "stickers",
    allowedRoles: superAdminOnly,
  },
  {
    id: "admin-backgrounds",
    path: "/admin/fundos",
    match: "exact",
    title: "Fundos",
    shortLabel: "Fundos",
    group: "catalog",
    icon: "backgrounds",
    allowedRoles: administrators,
  },
  {
    id: "admin-frames",
    path: "/admin/molduras",
    match: "exact",
    title: "Molduras",
    shortLabel: "Molduras",
    group: "catalog",
    icon: "frames",
    allowedRoles: administrators,
  },
  {
    id: "admin-auras",
    path: "/admin/auras",
    match: "exact",
    title: "Auras",
    shortLabel: "Auras",
    group: "catalog",
    icon: "auras",
    allowedRoles: administrators,
  },
  {
    id: "admin-name-gradients",
    path: "/admin/gradientes-nome",
    match: "exact",
    title: "Gradientes de nome",
    shortLabel: "Gradientes",
    group: "catalog",
    icon: "gradients",
    allowedRoles: administrators,
  },
  {
    id: "admin-avatar",
    path: "/admin/avatar",
    match: "exact",
    title: "Avatar",
    shortLabel: "Avatar",
    group: "catalog",
    icon: "avatar",
    allowedRoles: superAdminOnly,
  },
  {
    id: "admin-pets",
    path: "/admin/pets",
    match: "exact",
    title: "Pets",
    shortLabel: "Pets",
    group: "catalog",
    icon: "pets",
    allowedRoles: administrators,
  },
  {
    id: "admin-economy",
    path: "/admin/economia",
    match: "exact",
    title: "Economia",
    shortLabel: "Economia",
    group: "economy",
    icon: "economy",
    allowedRoles: administrators,
  },
  {
    id: "admin-live-team",
    path: "/admin/equipe-live",
    match: "exact",
    title: "Equipe da Live",
    shortLabel: "Equipe Live",
    group: "live",
    icon: "live",
    allowedRoles: administrators,
  },
] as const satisfies readonly AdminDestination[];

export function getAdminDestination(pathname: string): AdminDestination | undefined {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return adminDestinations.find((destination) =>
    destination.match === "exact"
      ? destination.path === normalized
      : normalized === destination.path || normalized.startsWith(`${destination.path}/`),
  );
}

export function getAdminDestinationById(id: string): AdminDestination | undefined {
  return adminDestinations.find((destination) => destination.id === id);
}

export function canRoleAccessAdminDestination(
  role: AppRole,
  destination: AdminDestination,
): boolean {
  return destination.allowedRoles.includes(role);
}

export function getAdminNavigationForRole(role: AppRole): readonly AdminDestination[] {
  return adminDestinations.filter((destination) =>
    canRoleAccessAdminDestination(role, destination),
  );
}

export function isAdminShellRole(role: AppRole): boolean {
  return role !== "user";
}

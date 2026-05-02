import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type RoleColor =
  | "coral"
  | "gold"
  | "silver"
  | "purple"
  | "red"
  | "blue"
  | "green";

export type RoleConfig = {
  label: string;
  description: string;
  defaultColor: RoleColor;
  availableColors: RoleColor[];
  /** Roles that can have a badge displayed */
  hasBadge: boolean;
};

export const ROLE_CONFIG: Record<AppRole, RoleConfig> = {
  super_admin: {
    label: "Super Admin",
    description: "Equipe central · gestão completa",
    defaultColor: "gold",
    availableColors: ["coral", "gold"],
    hasBadge: true,
  },
  admin: {
    label: "Admin",
    description: "Equipe de moderação · aprovações",
    defaultColor: "gold",
    availableColors: ["gold", "silver"],
    hasBadge: true,
  },
  apresentador: {
    label: "Apresentador",
    description: "Equipe · cadastros presenciais",
    defaultColor: "purple",
    availableColors: ["purple", "red", "blue", "green"],
    hasBadge: true,
  },
  moderador: {
    label: "Moderador",
    description: "Equipe · cuida da comunidade",
    defaultColor: "blue",
    availableColors: ["purple", "blue", "green"],
    hasBadge: true,
  },
  user: {
    label: "Usuário",
    description: "",
    defaultColor: "gold",
    availableColors: [],
    hasBadge: false,
  },
};

export const COLOR_HEX: Record<RoleColor, { fg: string; bg: string; ring: string; name: string }> = {
  coral: { fg: "#7a1f17", bg: "#ff6f61", ring: "#ff6f61", name: "Coral" },
  gold: { fg: "#5b3a00", bg: "#e9b949", ring: "#e9b949", name: "Dourado" },
  silver: { fg: "#3d4452", bg: "#c8cdd4", ring: "#c8cdd4", name: "Prata" },
  purple: { fg: "#3a1758", bg: "#a47bd6", ring: "#a47bd6", name: "Roxo" },
  red: { fg: "#5c0f12", bg: "#e15155", ring: "#e15155", name: "Vermelho" },
  blue: { fg: "#0e2f55", bg: "#5aa3e6", ring: "#5aa3e6", name: "Azul" },
  green: { fg: "#0d3b22", bg: "#5db98a", ring: "#5db98a", name: "Verde" },
};

export const ROLE_PRIORITY: AppRole[] = [
  "super_admin",
  "admin",
  "apresentador",
  "moderador",
  "user",
];

export function pickPrimaryRole(roles: AppRole[]): AppRole {
  for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r;
  return "user";
}

export function isStaffRole(role: AppRole): boolean {
  return role !== "user";
}
import type { AppRole } from "@/lib/roles";

export const ADMIN_MODULE_IDS = [
  "overview",
  "users",
  "verification",
  "moderation",
  "community",
  "dating",
  "conversations",
  "content",
  "economy",
  "catalogs",
  "pets",
  "games",
  "cinema",
  "notifications",
  "support",
  "team",
  "audit",
] as const;
export type AdminModuleId = (typeof ADMIN_MODULE_IDS)[number];

export interface AdminModuleDescriptor {
  readonly id: AdminModuleId;
  readonly label: string;
  readonly description: string;
  readonly legacyDestination: string;
  readonly allowedRoles: readonly AppRole[];
  readonly capability: string;
  readonly sensitive: boolean;
}

const ALL_ADMIN: readonly AppRole[] = ["super_admin", "admin"];
const MODERATION: readonly AppRole[] = ["super_admin", "admin", "moderador"];
const OPERATIONS: readonly AppRole[] = ["super_admin", "admin", "moderador", "apresentador"];

export const ADMIN_MODULES: readonly AdminModuleDescriptor[] = Object.freeze([
  {
    id: "overview",
    label: "Visão geral",
    description: "Filas operacionais que exigem ação.",
    legacyDestination: "/admin",
    allowedRoles: OPERATIONS,
    capability: "admin.overview.read",
    sensitive: false,
  },
  {
    id: "users",
    label: "Usuários e aprovação",
    description: "Cadastros, estados e revisão de acesso.",
    legacyDestination: "/admin",
    allowedRoles: OPERATIONS,
    capability: "identity.review",
    sensitive: true,
  },
  {
    id: "verification",
    label: "Verificação",
    description: "Fila de foto e identidade com decisão humana.",
    legacyDestination: "/admin/verificacoes",
    allowedRoles: OPERATIONS,
    capability: "verification.review",
    sensitive: true,
  },
  {
    id: "moderation",
    label: "Moderação",
    description: "Casos contextuais, evidência e recurso.",
    legacyDestination: "/admin",
    allowedRoles: MODERATION,
    capability: "moderation.case.review",
    sensitive: true,
  },
  {
    id: "community",
    label: "Comunidade",
    description: "Espaços, eventos e segurança comunitária.",
    legacyDestination: "/admin",
    allowedRoles: MODERATION,
    capability: "community.moderate",
    sensitive: true,
  },
  {
    id: "dating",
    label: "Namoro",
    description: "Elegibilidade e segurança romântica.",
    legacyDestination: "/admin",
    allowedRoles: MODERATION,
    capability: "dating.moderate",
    sensitive: true,
  },
  {
    id: "conversations",
    label: "Conversas e denúncias",
    description: "Casos de mensagem, bloqueio e evidência.",
    legacyDestination: "/admin",
    allowedRoles: MODERATION,
    capability: "messaging.moderate",
    sensitive: true,
  },
  {
    id: "content",
    label: "Conteúdo e Verbo",
    description: "Integridade editorial e fontes licenciadas.",
    legacyDestination: "/admin",
    allowedRoles: ALL_ADMIN,
    capability: "content.publish",
    sensitive: true,
  },
  {
    id: "economy",
    label: "Economia",
    description: "Reconciliação e anomalias, sem saldo no cliente.",
    legacyDestination: "/admin/economia",
    allowedRoles: ALL_ADMIN,
    capability: "economy.audit",
    sensitive: true,
  },
  {
    id: "catalogs",
    label: "Catálogos",
    description: "Itens, molduras, fundos e personalização.",
    legacyDestination: "/admin/avatar",
    allowedRoles: ALL_ADMIN,
    capability: "catalog.manage",
    sensitive: true,
  },
  {
    id: "pets",
    label: "Pets",
    description: "Catálogo, cuidado e preservação das famílias.",
    legacyDestination: "/admin/pets",
    allowedRoles: ALL_ADMIN,
    capability: "pets.manage",
    sensitive: true,
  },
  {
    id: "games",
    label: "Jogos e recompensas",
    description: "Saúde do arcade e autoridade de reward.",
    legacyDestination: "/admin/pets",
    allowedRoles: ALL_ADMIN,
    capability: "games.audit",
    sensitive: true,
  },
  {
    id: "cinema",
    label: "Cinema e mídia",
    description: "Processamento, sessões, direitos e moderação.",
    legacyDestination: "/admin",
    allowedRoles: ALL_ADMIN,
    capability: "cinema.manage",
    sensitive: true,
  },
  {
    id: "notifications",
    label: "Notificações e jobs",
    description: "Fila, falhas e dispatch sem conteúdo privado.",
    legacyDestination: "/admin",
    allowedRoles: ALL_ADMIN,
    capability: "notifications.audit",
    sensitive: true,
  },
  {
    id: "support",
    label: "Suporte",
    description: "Tickets, escalonamentos e tempos conhecidos.",
    legacyDestination: "/suporte",
    allowedRoles: OPERATIONS,
    capability: "support.handle",
    sensitive: true,
  },
  {
    id: "team",
    label: "Equipe e permissões",
    description: "Papéis e capacidades com impacto explícito.",
    legacyDestination: "/admin",
    allowedRoles: ["super_admin"],
    capability: "team.permissions.manage",
    sensitive: true,
  },
  {
    id: "audit",
    label: "Auditoria e sistema",
    description: "Ações, request IDs, jobs e saúde.",
    legacyDestination: "/admin",
    allowedRoles: ["super_admin"],
    capability: "audit.read",
    sensitive: true,
  },
]);

export interface AdminHealthMetric {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly status: "healthy" | "attention" | "critical" | "unknown";
  readonly actionModule: AdminModuleId;
}

export interface AdminConsoleSnapshot {
  readonly serverNow: string;
  readonly metrics: readonly AdminHealthMetric[];
  readonly recentAuditCount: number;
  readonly dataFreshness: "live" | "stale" | "unknown";
}

export interface AdminConsoleRepository {
  loadDashboard(): Promise<AdminConsoleSnapshot>;
}

export function adminModulesForRole(role: AppRole): readonly AdminModuleDescriptor[] {
  return ADMIN_MODULES.filter((module) => module.allowedRoles.includes(role));
}

export const adminSafetyContract = Object.freeze({
  clientGrantsCapabilities: false,
  clientCalculatesBalance: false,
  clientChangesMatch: false,
  clientChangesPurpose: false,
  clientGrantsReward: false,
  sensitiveActionsRequireReason: true,
  sensitiveActionsRequireRequestId: true,
  auditStoresPrivateContent: false,
  vanityMetricsAllowed: false,
});

export type V2OfflineBehavior =
  | "cacheable-read"
  | "local-draft"
  | "blocked"
  | "idempotent-outbox"
  | "explicit-download";

export type V2OfflineAction =
  | "community.read"
  | "community.compose-draft"
  | "community.publish"
  | "messaging.read"
  | "messaging.compose-draft"
  | "messaging.send"
  | "profile.read"
  | "profile.edit"
  | "content.read"
  | "content.download"
  | "content.progress"
  | "cinema.join"
  | "cinema.control"
  | "economy.purchase"
  | "economy.equip"
  | "admin.command"
  | "storage.upload";

export interface V2OfflinePolicy {
  readonly action: V2OfflineAction;
  readonly behavior: V2OfflineBehavior;
  readonly userMessage: string;
  readonly requiresServerIdempotency: boolean;
  readonly containsPrivateData: boolean;
}

const BLOCKED_MESSAGE = "Disponível online. Reconecte-se para concluir esta ação.";

export const V2_OFFLINE_POLICIES: Readonly<Record<V2OfflineAction, V2OfflinePolicy>> =
  Object.freeze({
    "community.read": {
      action: "community.read",
      behavior: "cacheable-read",
      userMessage: "Mostrando conteúdo carregado anteriormente.",
      requiresServerIdempotency: false,
      containsPrivateData: false,
    },
    "community.compose-draft": {
      action: "community.compose-draft",
      behavior: "local-draft",
      userMessage: "Rascunho salvo somente neste dispositivo.",
      requiresServerIdempotency: false,
      containsPrivateData: true,
    },
    "community.publish": {
      action: "community.publish",
      behavior: "blocked",
      userMessage: BLOCKED_MESSAGE,
      requiresServerIdempotency: true,
      containsPrivateData: true,
    },
    "messaging.read": {
      action: "messaging.read",
      behavior: "cacheable-read",
      userMessage: "Mostrando conversas carregadas anteriormente.",
      requiresServerIdempotency: false,
      containsPrivateData: true,
    },
    "messaging.compose-draft": {
      action: "messaging.compose-draft",
      behavior: "local-draft",
      userMessage: "Mensagem mantida como rascunho neste dispositivo.",
      requiresServerIdempotency: false,
      containsPrivateData: true,
    },
    "messaging.send": {
      action: "messaging.send",
      behavior: "blocked",
      userMessage: BLOCKED_MESSAGE,
      requiresServerIdempotency: true,
      containsPrivateData: true,
    },
    "profile.read": {
      action: "profile.read",
      behavior: "cacheable-read",
      userMessage: "Mostrando o perfil carregado anteriormente.",
      requiresServerIdempotency: false,
      containsPrivateData: true,
    },
    "profile.edit": {
      action: "profile.edit",
      behavior: "blocked",
      userMessage: BLOCKED_MESSAGE,
      requiresServerIdempotency: true,
      containsPrivateData: true,
    },
    "content.read": {
      action: "content.read",
      behavior: "cacheable-read",
      userMessage: "Mostrando conteúdo já disponível neste dispositivo.",
      requiresServerIdempotency: false,
      containsPrivateData: false,
    },
    "content.download": {
      action: "content.download",
      behavior: "explicit-download",
      userMessage: "Disponível offline somente após download explícito.",
      requiresServerIdempotency: false,
      containsPrivateData: false,
    },
    "content.progress": {
      action: "content.progress",
      behavior: "idempotent-outbox",
      userMessage: "Progresso aguardando sincronização.",
      requiresServerIdempotency: true,
      containsPrivateData: true,
    },
    "cinema.join": {
      action: "cinema.join",
      behavior: "blocked",
      userMessage: "A Sala de Cinema exige conexão ativa.",
      requiresServerIdempotency: false,
      containsPrivateData: true,
    },
    "cinema.control": {
      action: "cinema.control",
      behavior: "blocked",
      userMessage: "Os controles sincronizados exigem conexão ativa.",
      requiresServerIdempotency: true,
      containsPrivateData: true,
    },
    "economy.purchase": {
      action: "economy.purchase",
      behavior: "blocked",
      userMessage: "Compras exigem conexão para proteger o saldo.",
      requiresServerIdempotency: true,
      containsPrivateData: true,
    },
    "economy.equip": {
      action: "economy.equip",
      behavior: "blocked",
      userMessage: BLOCKED_MESSAGE,
      requiresServerIdempotency: true,
      containsPrivateData: true,
    },
    "admin.command": {
      action: "admin.command",
      behavior: "blocked",
      userMessage: "Ações administrativas nunca são executadas offline.",
      requiresServerIdempotency: true,
      containsPrivateData: true,
    },
    "storage.upload": {
      action: "storage.upload",
      behavior: "blocked",
      userMessage: "Uploads exigem conexão ativa.",
      requiresServerIdempotency: true,
      containsPrivateData: true,
    },
  });

export function resolveOfflinePolicy(action: V2OfflineAction): V2OfflinePolicy {
  return V2_OFFLINE_POLICIES[action];
}

export function canQueueOffline(
  action: V2OfflineAction,
  serverIdempotencyConfirmed = false,
): boolean {
  const policy = resolveOfflinePolicy(action);
  return (
    policy.behavior === "idempotent-outbox" &&
    policy.requiresServerIdempotency &&
    serverIdempotencyConfirmed
  );
}

/**
 * Named invariants for compatibility work. They are intentionally data-model
 * agnostic at this stage: the published Supabase contract must be reconciled
 * before adapters or migrations are introduced.
 */
export const LEGACY_PRESERVATION_INVARIANTS = [
  "auth-users-and-sessions",
  "profiles-photos-and-verification",
  "interests-matches-messages-and-purpose",
  "notifications-push-subscriptions-and-queue",
  "coins-xp-achievements-ledgers-and-purchases",
  "inventories-decorations-gifts-and-stickers",
  "avatars-pets-games-missions-and-progress",
  "privacy-roles-moderation-and-admin-data",
  "storage-buckets-and-object-ownership",
  "vault-secrets-cron-and-push-job",
] as const;

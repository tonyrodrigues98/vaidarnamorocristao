import type { V2FeatureFlag } from "@/v2/platform/feature-flags";

export type V2DomainId =
  | "community"
  | "dating"
  | "messaging"
  | "profile"
  | "economy"
  | "customization"
  | "pets"
  | "admin";

export type V2DomainDescriptor = Readonly<{
  id: V2DomainId;
  featureFlag: V2FeatureFlag;
  owns: readonly string[];
  mayDependOn: readonly (V2DomainId | "platform")[];
}>;

export const v2DomainRegistry = [
  {
    id: "community",
    featureFlag: "community",
    owns: ["feed", "posts", "comments", "reactions", "status", "connections", "groups", "events"],
    mayDependOn: ["profile", "messaging", "platform"],
  },
  {
    id: "dating",
    featureFlag: "dating",
    owns: ["availability", "preferences", "interests", "matches", "anonymous-messages", "purpose"],
    mayDependOn: ["profile", "messaging", "platform"],
  },
  {
    id: "messaging",
    featureFlag: "messaging",
    owns: ["threads", "messages", "delivery", "read-state", "drafts", "attachments"],
    mayDependOn: ["profile", "platform"],
  },
  {
    id: "profile",
    featureFlag: "profile",
    owns: ["public-identity", "photos", "profile-modules", "privacy", "presentation"],
    mayDependOn: ["customization", "platform"],
  },
  {
    id: "economy",
    featureFlag: "economy",
    owns: ["coins", "ledger", "shop", "purchases", "inventory", "gifts"],
    mayDependOn: ["profile", "customization", "platform"],
  },
  {
    id: "customization",
    featureFlag: "customization",
    owns: ["frames", "auras", "backgrounds", "gradients", "stickers", "avatar-items"],
    mayDependOn: ["platform"],
  },
  {
    id: "pets",
    featureFlag: "pets",
    owns: ["pets", "care", "progression", "missions", "arcade", "rewards"],
    mayDependOn: ["economy", "platform"],
  },
  {
    id: "admin",
    featureFlag: "admin",
    owns: ["roles", "moderation", "support", "operations", "audit"],
    mayDependOn: ["platform"],
  },
] as const satisfies readonly V2DomainDescriptor[];

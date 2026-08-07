declare const __VDN_BUILD_COMMIT__: string;
declare const __VDN_BUILD_CHANNEL__: string;

const COMMIT_PATTERN = /^[a-f0-9]{7,40}$/i;

export function normalizeBuildCommit(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  const normalized = value.trim();
  return COMMIT_PATTERN.test(normalized) ? normalized.toLowerCase() : "unknown";
}

function readDefinedCommit(): string {
  if (typeof __VDN_BUILD_COMMIT__ === "undefined") return "unknown";
  return normalizeBuildCommit(__VDN_BUILD_COMMIT__);
}

function readDefinedChannel(): string {
  if (typeof __VDN_BUILD_CHANNEL__ === "undefined") return "unknown";
  const channel = __VDN_BUILD_CHANNEL__.trim();
  return channel || "unknown";
}

/**
 * Non-sensitive metadata embedded at build time so a published artifact can
 * be reconciled with its source commit without relying on hashed asset names.
 */
export const appBuildInfo = Object.freeze({
  commit: readDefinedCommit(),
  channel: readDefinedChannel(),
});

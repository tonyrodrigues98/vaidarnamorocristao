import { supabase } from "@/integrations/supabase/client";
import type {
  AdminConsoleRepository,
  AdminConsoleSnapshot,
  AdminHealthMetric,
  AdminModuleId,
} from "./contracts";

type JsonRecord = Record<string, unknown>;
const SAFE_ERROR = "Não foi possível carregar a saúde operacional agora.";

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseMetric(value: unknown): AdminHealthMetric | null {
  const row = record(value);
  if (!text(row.id) || !text(row.label)) return null;
  return {
    id: text(row.id),
    label: text(row.label),
    value: typeof row.value === "number" ? Math.max(0, Math.trunc(row.value)) : 0,
    status: text(row.status, "unknown") as AdminHealthMetric["status"],
    actionModule: text(row.action_module, "overview") as AdminModuleId,
  };
}

export function parseAdminConsole(value: unknown): AdminConsoleSnapshot {
  const row = record(value);
  return {
    serverNow: text(row.server_now),
    metrics: Array.isArray(row.metrics)
      ? row.metrics.map(parseMetric).filter((item): item is AdminHealthMetric => item !== null)
      : [],
    recentAuditCount:
      typeof row.recent_audit_count === "number" ? Math.max(0, row.recent_audit_count) : 0,
    dataFreshness:
      row.data_freshness === "live" || row.data_freshness === "stale"
        ? row.data_freshness
        : "unknown",
  };
}

export const supabaseAdminConsoleRepository: AdminConsoleRepository = {
  async loadDashboard() {
    const { data, error } = await supabase.rpc("get_admin_console_v2" as never);
    if (error) throw new Error(SAFE_ERROR);
    return parseAdminConsole(data);
  },
};

export const adminRepositoryBoundaries = Object.freeze({
  rawUserRowsExposed: false,
  privateContentExposed: false,
  balancesExposed: false,
  serviceRoleInBrowser: false,
  commandsImplementedInPresentation: false,
});

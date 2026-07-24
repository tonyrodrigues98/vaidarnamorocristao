import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const V2_MIGRATION_PATTERN = /^202607230000(?:0[1-9]|1[0-6])_v2_.*\.sql$/;

const metadata = {
  "20260723000001_v2_trusted_reward_capabilities.sql": {
    objective: "Restringir capacidades de recompensa e cuidado a comandos confiáveis.",
    dependencies: ["legacy reward RPCs", "user_pets_v2", "user_xp"],
    risk: "alto",
    reversible: "roll-forward; grants anteriores exigem inventário",
  },
  "20260723000002_v2_atomic_push_dispatch.sql": {
    objective: "Adicionar claim atômico, lease, retry e dead-letter à fila push.",
    dependencies: ["push_queue", "pgcrypto/gen_random_uuid"],
    risk: "alto",
    reversible: "feature kill switch e roll-forward",
  },
  "20260723000003_v2_photo_repair_audit.sql": {
    objective: "Criar auditoria append-only para reparo administrativo de fotos.",
    dependencies: ["profiles", "profile_photos", "auth.uid"],
    risk: "médio",
    reversible: "desativar fluxo; preservar auditoria",
  },
  "20260723000004_v2_community_onboarding_dating_opt_in.sql": {
    objective: "Separar onboarding comunitário e adesão explícita ao Namoro.",
    dependencies: ["profiles", "profile_preferences", "blocks"],
    risk: "alto",
    reversible: "flags e leitura compatível",
  },
  "20260723000005_v2_social_home_links_status.sql": {
    objective: "Criar conexões sociais, feed inicial e Status de 24 horas.",
    dependencies: ["profiles", "blocks", "Storage"],
    risk: "alto",
    reversible: "flags e preservação das tabelas aditivas",
  },
  "20260723000006_v2_community_spaces_events.sql": {
    objective: "Criar espaços comunitários, membros, eventos e chat contextual.",
    dependencies: ["profiles", "blocks", "global_messages"],
    risk: "alto",
    reversible: "flags e roll-forward",
  },
  "20260723000007_v2_conversation_core.sql": {
    objective: "Criar núcleo de conversas sociais, paginação e idempotência.",
    dependencies: ["profiles", "blocks", "messages", "matches"],
    risk: "alto",
    reversible: "adapter legado e roll-forward",
  },
  "20260723000008_v2_modular_profiles.sql": {
    objective: "Adicionar módulos de perfil e projeção pública controlada.",
    dependencies: ["profiles", "profile_photos", "inventários", "user_pets_v2"],
    risk: "alto",
    reversible: "flag e perfil legado",
  },
  "20260723000009_v2_optional_dating_mode.sql": {
    objective: "Criar descoberta romântica opt-in sem afetar a comunidade.",
    dependencies: ["dating membership V2", "profiles", "interests", "matches"],
    risk: "alto",
    reversible: "flag e rotas legadas",
  },
  "20260723000010_v2_purpose_anonymous_contextual_gifts.sql": {
    objective: "Contextualizar Propósito, recados anônimos e presentes românticos.",
    dependencies: ["matches", "anonymous messages", "virtual gifts", "dating V2"],
    risk: "alto",
    reversible: "flags e histórico preservado",
  },
  "20260723000011_v2_economy_authority.sql": {
    objective: "Centralizar autoridade de saldo, loja e inventário em comandos.",
    dependencies: ["user_coins", "coin_transactions", "store_items", "inventários"],
    risk: "crítico",
    reversible: "kill switch, reconciliação e roll-forward",
  },
  "20260723000012_v2_pets_care_authority.sql": {
    objective: "Tornar cuidado e recompensas de pets server-authoritative.",
    dependencies: ["user_pets", "user_pets_v2", "pet care", "economia"],
    risk: "alto",
    reversible: "flag e runtime legado",
  },
  "20260723000013_v2_christian_content_verbo.sql": {
    objective: "Criar conteúdo cristão e dados privados do Verbo.",
    dependencies: ["profiles", "devocionais", "Storage futuro"],
    risk: "médio",
    reversible: "flag e conteúdo legado",
  },
  "20260723000014_v2_cinema_watch_party.sql": {
    objective: "Criar catálogo e sessões sincronizadas de Cinema.",
    dependencies: ["profiles", "blocks", "conversation core"],
    risk: "alto",
    reversible: "kill switch e flag",
  },
  "20260723000015_v2_notifications_trust_support.sql": {
    objective: "Unificar eventos de notificação, confiança, moderação e suporte.",
    dependencies: ["notifications", "push_queue", "blocks", "reports"],
    risk: "alto",
    reversible: "flags, fila preservada e roll-forward",
  },
  "20260723000016_v2_admin_console_metrics.sql": {
    objective: "Criar métricas administrativas agregadas e sem PII.",
    dependencies: ["user_roles", "audit logs", "domínios V2"],
    risk: "alto",
    reversible: "flag e admin legado",
  },
};

const count = (source, expression) => source.match(expression)?.length ?? 0;

export function analyzeMigration(name, source) {
  const normalized = source.replace(/\r\n/g, "\n");
  const operations = {
    createTable: count(normalized, /\bCREATE\s+TABLE\b/gi),
    alterTable: count(normalized, /\bALTER\s+TABLE\b/gi),
    createFunction: count(normalized, /\bCREATE\s+OR\s+REPLACE\s+FUNCTION\b/gi),
    securityDefiner: count(normalized, /\bSECURITY\s+DEFINER\b/gi),
    createPolicy: count(normalized, /\bCREATE\s+POLICY\b/gi),
    enableRls: count(normalized, /\bENABLE\s+ROW\s+LEVEL\s+SECURITY\b/gi),
    createTrigger: count(normalized, /\bCREATE\s+TRIGGER\b/gi),
    createIndex: count(normalized, /\bCREATE\s+(?:UNIQUE\s+)?INDEX\b/gi),
    update: count(normalized, /\bUPDATE\s+(?:public\.)?[a-z_][a-z0-9_]*\b/gi),
    delete: count(normalized, /\bDELETE\s+FROM\b/gi),
    dropTableOrColumn: count(normalized, /\bDROP\s+(?:TABLE|COLUMN)\b/gi),
    truncate: count(normalized, /\bTRUNCATE\b/gi),
    rename: count(normalized, /\bRENAME\s+(?:TO|COLUMN)\b/gi),
    typeChange: count(normalized, /\bALTER\s+COLUMN\b[\s\S]{0,80}\bTYPE\b/gi),
    setNotNull: count(normalized, /\bSET\s+NOT\s+NULL\b/gi),
    storage: count(normalized, /\bstorage\.(?:buckets|objects)\b/gi),
    realtime: count(normalized, /\bsupabase_realtime\b|\bREPLICA\s+IDENTITY\b/gi),
  };
  const destructive = operations.dropTableOrColumn > 0 || operations.truncate > 0;
  return {
    order: Number(name.slice(10, 14)),
    migration: name,
    ...metadata[name],
    destructive,
    operations,
    sha256Source: createHash("sha256").update(source).digest("hex"),
  };
}

export function buildMigrationInventory(root = process.cwd()) {
  const migrationDirectory = resolve(root, "supabase", "migrations");
  const all = readdirSync(migrationDirectory)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const v2 = all.filter((name) => V2_MIGRATION_PATTERN.test(name));
  if (v2.length !== 16) throw new Error(`Expected 16 V2 migrations, found ${v2.length}`);
  return {
    schemaVersion: 1,
    generatedFrom: "working-tree",
    totalHistoricalMigrations: all.length,
    v2MigrationCount: v2.length,
    preV2MigrationCount: all.length - v2.length,
    migrations: v2.map((name) =>
      analyzeMigration(name, readFileSync(resolve(migrationDirectory, name), "utf8")),
    ),
  };
}

function main() {
  const inventory = buildMigrationInventory();
  const json = `${JSON.stringify(inventory, null, 2)}\n`;
  const writeIndex = process.argv.indexOf("--write");
  if (writeIndex >= 0) {
    const target = process.argv[writeIndex + 1];
    if (!target) throw new Error("--write requires a target");
    writeFileSync(resolve(target), json, "utf8");
  } else {
    process.stdout.write(json);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();

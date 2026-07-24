import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

export function assertDisposableUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (!["127.0.0.1", "localhost"].includes(url.hostname)) {
    throw new Error("Refusing to seed a non-local Supabase URL");
  }
  return url;
}

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

async function must(label, promise) {
  const result = await promise;
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function main() {
  const url = required("SUPABASE_URL");
  assertDisposableUrl(url);
  const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const suffix = "vdn-release-validation";
  const specs = [
    { key: "active-a", status: "approved" },
    { key: "active-b", status: "approved" },
    { key: "private", status: "approved" },
    { key: "deactivated", status: "approved", deactivated: true },
    { key: "deletion", status: "approved", deletion: true },
    { key: "banned", status: "banned" },
    { key: "partial", status: "pending" },
    { key: "admin", status: "approved", role: "admin" },
  ];
  const users = {};

  for (const [index, spec] of specs.entries()) {
    const email = `${spec.key}-${suffix}@example.invalid`;
    const data = await must(
      `create ${spec.key}`,
      admin.auth.admin.createUser({
        email,
        password: "Synthetic-Only-123!",
        email_confirm: true,
        user_metadata: { fixture: suffix },
      }),
    );
    const id = data.user.id;
    users[spec.key] = id;
    const now = new Date().toISOString();
    await must(
      `profile ${spec.key}`,
      admin.from("profiles").upsert({
        id,
        full_name: `Synthetic User ${index + 1}`,
        age: 30 + index,
        sex: index % 2 === 0 ? "masculino" : "feminino",
        marital: "solteiro",
        city: "Cidade Sintética",
        state: "SP",
        church: "Comunidade de Teste",
        years_baptized: 5,
        status: spec.status,
        deactivated_at: spec.deactivated ? now : null,
        deletion_requested_at: spec.deletion ? now : null,
        deletion_scheduled_for: spec.deletion
          ? new Date(Date.now() + 30 * 86400_000).toISOString()
          : null,
        banned_at: spec.status === "banned" ? now : null,
        banned_reason: spec.status === "banned" ? "synthetic_fixture" : null,
      }),
    );
    if (spec.role) {
      await must(
        `role ${spec.key}`,
        admin.from("user_roles").upsert({ user_id: id, role: spec.role }),
      );
    }
    await must(
      `coins ${spec.key}`,
      admin.from("user_coins").upsert({ user_id: id, balance: 100 + index }),
    );
  }

  const [userA, userB] = [users["active-a"], users["active-b"]].sort();
  const match = await must(
    "match",
    admin.from("matches").insert({ user_a: userA, user_b: userB }).select("id").single(),
  );
  await must(
    "message",
    admin
      .from("messages")
      .insert({ match_id: match.id, sender_id: users["active-a"], content: "synthetic-message" }),
  );
  await must(
    "block",
    admin.from("blocks").insert({
      blocker_id: users["private"],
      blocked_id: users["active-b"],
    }),
  );
  await must(
    "report",
    admin.from("reports").insert({
      reporter_id: users["active-a"],
      reported_id: users["banned"],
      reason: "synthetic-report",
    }),
  );
  await must(
    "transaction",
    admin.from("coin_transactions").insert({
      user_id: users["active-a"],
      kind: "synthetic_validation",
      direction: "in",
      amount: 10,
      balance_after: 110,
      title: "Synthetic validation",
    }),
  );

  const summary = {
    fixture: suffix,
    syntheticUsers: Object.keys(users).length,
    containsPersonalData: false,
    tablesSeeded: [
      "auth.users",
      "profiles",
      "user_roles",
      "user_coins",
      "matches",
      "messages",
      "blocks",
      "reports",
      "coin_transactions",
    ],
  };
  const output = process.argv[2];
  if (output) writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "synthetic_seed_failed");
    process.exitCode = 1;
  });
}

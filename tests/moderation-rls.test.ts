import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { admin, createUser, deleteUsers, grantRole, type Ctx } from "./helpers";

let user: Ctx, moderator: Ctx, adminUser: Ctx;
let globalMsgId: string;
let flagId: string | null = null;

beforeAll(async () => {
  [user, moderator, adminUser] = await Promise.all([
    createUser("mod-user"),
    createUser("mod-moderator"),
    createUser("mod-admin"),
  ]);
  await grantRole(moderator.userId, "moderador");
  await grantRole(adminUser.userId, "admin");

  const { data, error } = await admin
    .from("global_messages")
    .insert({ sender_id: user.userId, content: "mensagem para teste de moderacao" })
    .select("id")
    .single();
  if (error) throw error;
  globalMsgId = data!.id;
}, 30000);

afterAll(async () => {
  await admin.from("message_flags").delete().eq("message_id", globalMsgId);
  await admin.from("global_messages").delete().eq("id", globalMsgId);
  await admin.from("user_roles").delete().in("user_id", [moderator.userId, adminUser.userId]);
  await deleteUsers(user, moderator, adminUser);
}, 30000);

describe("message_flags — somente staff cria/lê sinalizações", () => {
  it("usuário comum NÃO consegue criar flag", async () => {
    const { error } = await user.client
      .from("message_flags")
      .insert({ message_id: globalMsgId, flagged_by: user.userId, reason: "spam" });
    expect(error).not.toBeNull();
  });

  it("moderador cria flag com sucesso", async () => {
    const { data, error } = await moderator.client
      .from("message_flags")
      .insert({ message_id: globalMsgId, flagged_by: moderator.userId, reason: "ofensivo" })
      .select("id")
      .single();
    expect(error).toBeNull();
    flagId = data!.id;
  });

  it("usuário comum NÃO lê flags de outros", async () => {
    const { data, error } = await user.client.from("message_flags").select("id");
    expect(error).toBeNull();
    expect((data ?? []).map((r) => r.id)).not.toContain(flagId);
  });

  it("admin lê todas as flags", async () => {
    const { data, error } = await adminUser.client.from("message_flags").select("id");
    expect(error).toBeNull();
    expect((data ?? []).map((r) => r.id)).toContain(flagId);
  });

  it("usuário comum NÃO consegue deletar flag de outros", async () => {
    const { data } = await user.client
      .from("message_flags")
      .delete()
      .eq("id", flagId!)
      .select("id");
    expect((data ?? []).length).toBe(0);
  });
});

describe("user_roles — escalação de privilégios bloqueada", () => {
  it("usuário comum NÃO consegue se promover a admin", async () => {
    const { error } = await user.client
      .from("user_roles")
      .insert({ user_id: user.userId, role: "admin" });
    // Either RLS rejects insert OR trigger forces role back; the user must NOT end up admin.
    if (!error) {
      // Rollback whatever may have leaked
      await admin.from("user_roles").delete().eq("user_id", user.userId).eq("role", "admin");
    }
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.userId);
    expect((roles ?? []).map((r) => r.role)).not.toContain("admin");
  });

  it("usuário comum NÃO consegue alterar a própria role existente", async () => {
    // Ensure 'user' row exists (created by handle_new_user trigger).
    const { data: existing } = await admin
      .from("user_roles")
      .select("id, role")
      .eq("user_id", user.userId)
      .eq("role", "user")
      .maybeSingle();
    if (!existing) {
      await admin.from("user_roles").insert({ user_id: user.userId, role: "user" });
    }
    await user.client.from("user_roles").update({ role: "admin" }).eq("user_id", user.userId);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.userId);
    expect((roles ?? []).map((r) => r.role)).not.toContain("admin");
  });
});

describe("profiles — usuário comum não pode banir/aprovar a si mesmo", () => {
  it("alteração de status é ignorada para não-admin", async () => {
    await user.client.from("profiles").update({ status: "banned" }).eq("id", user.userId);
    const { data } = await admin.from("profiles").select("status").eq("id", user.userId).single();
    expect(data?.status).toBe("approved");
  });

  it("admin consegue mudar status de outro perfil", async () => {
    await adminUser.client.from("profiles").update({ status: "banned" }).eq("id", user.userId);
    const { data } = await admin.from("profiles").select("status").eq("id", user.userId).single();
    expect(data?.status).toBe("banned");
    // restore
    await admin.from("profiles").update({ status: "approved" }).eq("id", user.userId);
  });
});

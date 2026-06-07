import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SubscribePayload = {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string | null;
};

function validatePayload(input: unknown): SubscribePayload {
  if (!input || typeof input !== "object") throw new Error("invalid payload");
  const data = input as Record<string, unknown>;
  const endpoint = typeof data.endpoint === "string" ? data.endpoint.trim() : "";
  const p256dh = typeof data.p256dh === "string" ? data.p256dh.trim() : "";
  const auth = typeof data.auth === "string" ? data.auth.trim() : "";
  if (!endpoint || endpoint.length > 2048) throw new Error("invalid endpoint");
  if (!p256dh || p256dh.length > 512) throw new Error("invalid p256dh");
  if (!auth || auth.length > 256) throw new Error("invalid auth");
  const ua = typeof data.user_agent === "string" ? data.user_agent.slice(0, 512) : null;
  return { endpoint, p256dh, auth, user_agent: ua };
}

export const subscribePush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => validatePayload(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          user_agent: data.user_agent,
        },
        { onConflict: "endpoint" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unsubscribePush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const endpoint = typeof d.endpoint === "string" ? d.endpoint.trim() : "";
    if (!endpoint) throw new Error("invalid endpoint");
    return { endpoint };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", data.endpoint);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { sendPushToUser } = await import("@/lib/pushDispatch.server");
    const results = await sendPushToUser(context.userId, {
      title: "VaiDarNamoro",
      body: "Notificação de teste — está funcionando! 🎉",
      url: "/notificacoes",
    });
    return { results };
  });
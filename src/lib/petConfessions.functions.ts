import { createServerFn } from "@tanstack/react-start";

export type PetConfessionDto = {
  id: string;
  text: string;
  category: string;
  effect_kind: string | null;
  effect_delta: number | null;
};

export const getRandomPetConfession = createServerFn({ method: "GET" }).handler(
  async ({ context }): Promise<PetConfessionDto | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId =
      typeof context === "object" &&
      context !== null &&
      "userId" in context &&
      typeof context.userId === "string"
        ? context.userId
        : null;

    const { data, error } = await supabaseAdmin
      .from("pet_confessions")
      .select("id, text, category, effect_kind, effect_delta")
      .eq("active", true)
      .limit(500);

    if (error) throw new Error(error.message);
    if (!data?.length) return null;

    const pick = data[Math.floor(Math.random() * data.length)] ?? null;
    if (pick && userId) {
      await supabaseAdmin.from("user_pet_confession_log").insert({
        user_id: userId,
        confession_id: pick.id,
      });
    }

    return pick;
  },
);
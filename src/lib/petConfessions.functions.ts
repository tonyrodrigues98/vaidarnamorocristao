import { createServerFn } from "@tanstack/react-start";

export type PetConfessionDto = {
  id: string;
  text: string;
  category: string;
  effect_kind: string | null;
  effect_delta: number | null;
};

export const getRandomPetConfession = createServerFn({ method: "GET" }).handler(
  async (): Promise<PetConfessionDto | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("pet_confessions")
      .select("id, text, category, effect_kind, effect_delta")
      .eq("active", true)
      .limit(500);

    if (error) throw new Error(error.message);
    if (!data?.length) return null;

    return data[Math.floor(Math.random() * data.length)] ?? null;
  },
);
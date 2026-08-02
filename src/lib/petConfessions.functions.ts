import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PetConfessionDto = {
  id: string;
  text: string;
  category: string;
  effect_kind: string | null;
  effect_delta: number | null;
};

const InputSchema = z
  .object({
    personalitySlug: z
      .string()
      .min(1)
      .max(60)
      .regex(/^[a-z0-9_-]+$/i)
      .nullable()
      .optional(),
  })
  .optional();

export const getRandomPetConfession = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<PetConfessionDto | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const slug = data?.personalitySlug ?? null;

    // Quando há personalidade, prioriza frases dela; cai para genéricas se não houver.
    if (slug) {
      const { data: matched, error: e1 } = await supabaseAdmin
        .from("pet_confessions")
        .select("id, text, category, effect_kind, effect_delta")
        .eq("active", true)
        .eq("personality_slug", slug)
        .limit(500);
      if (e1) throw new Error(e1.message);
      // 70% chance de pegar uma específica da personalidade quando existir
      if (matched && matched.length > 0 && Math.random() < 0.7) {
        return matched[Math.floor(Math.random() * matched.length)] ?? null;
      }
    }

    const { data: generic, error: e2 } = await supabaseAdmin
      .from("pet_confessions")
      .select("id, text, category, effect_kind, effect_delta")
      .eq("active", true)
      .is("personality_slug", null)
      .limit(500);
    if (e2) throw new Error(e2.message);
    if (!generic?.length) return null;
    return generic[Math.floor(Math.random() * generic.length)] ?? null;
  });

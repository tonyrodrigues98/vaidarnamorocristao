import { supabase } from "@/integrations/supabase/client";

export type PetImageKind = "baby" | "adult" | "category";

export type GeneratePetImageInput = {
  kind: PetImageKind;
  subject: string;
  animals?: string[];
  scope?: string;
};

export async function generatePetImage(input: GeneratePetImageInput): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");

  const resp = await fetch("/api/admin/generate-pet-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    let msg = `Falha (${resp.status})`;
    try {
      const j = JSON.parse(txt);
      msg = j.reason || j.detail || j.error || msg;
    } catch {
      if (txt) msg = txt;
    }
    throw new Error(msg);
  }
  const json = (await resp.json()) as { path: string };
  return json.path;
}

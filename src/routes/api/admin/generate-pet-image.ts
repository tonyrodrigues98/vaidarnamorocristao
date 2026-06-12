import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Gera imagem de pet/categoria via Lovable AI Gateway (gemini-3-pro-image-preview),
 * valida (PNG 1024x1024 com alpha + revisão por IA de visão), faz upload no bucket
 * `pets` e retorna o storage path. Tenta até 3 vezes (1 inicial + 2 retries) com
 * prompt cada vez mais rígido quando a validação falha.
 */

type Kind = "baby" | "adult" | "category";

type Body = {
  kind: Kind;
  subject: string; // ex.: "Golden Retriever", "Periquito-australiano", "Roedores e pequenos pets"
  animals?: string[]; // só para kind=category
  scope?: "pet_species" | "pet_variants" | "pet_categories" | string;
};

const BUCKET = "pets";
const MODEL_IMAGE = "google/gemini-3-pro-image-preview";
const MODEL_VISION = "google/gemini-2.5-flash";
const MAX_ATTEMPTS = 3;

function buildPrompt(body: Body, attempt: number): string {
  const stricter =
    attempt === 0
      ? ""
      : attempt === 1
        ? " RESPEITE rigorosamente: fundo 100% TRANSPARENTE real, sem cor de fundo, sem checker, nenhum elemento tocando bordas, sem texto/letras/rótulos."
        : " ÚLTIMA TENTATIVA: gere SOMENTE o assunto pedido, ocupando no MÁXIMO 60% do canvas, centralizado, margem transparente uniforme generosa, fundo totalmente transparente, sem texto algum, sem animais extras.";

  if (body.kind === "baby") {
    return `Imagem quadrada 1024x1024, fundo 100% transparente real, PNG, asset premium para aplicativo. Criar ${body.subject} filhote/bebê, com aparência claramente jovem, proporções delicadas, cabeça levemente maior, corpo pequeno, olhos expressivos e doces, pose fofa e amigável. Estilo ilustração premium semi-realista fofa, textura suave, sombreamento macio, acabamento de alta qualidade, não realista demais, não fotográfico. Composição centralizada real, ocupando no máximo 65% da largura e 65% da altura do canvas, com margem transparente uniforme em todos os lados. Nenhuma parte do animal ou detalhe decorativo pode tocar ou ultrapassar as bordas. Sem texto, sem letras, sem fundo falso, sem overflow horizontal, sem overflow vertical, sem recortes.${stricter}`;
  }
  if (body.kind === "adult") {
    return `Imagem quadrada 1024x1024, fundo 100% transparente real, PNG, asset premium para aplicativo. Criar ${body.subject} adulto, com aparência claramente adulta, proporções naturais e maduras, corpo bem definido, postura firme, expressão natural, sem aparência de filhote. Estilo realista HD premium, próximo de fotografia profissional ou render hiper-realista, com textura realista de pelo, penas, escamas, pele ou casco, iluminação natural, detalhes nítidos e acabamento de alta definição. Não usar estilo cartoon, não usar olhos gigantes, não usar expressão infantil/kawaii. Composição centralizada real, ocupando no máximo 65% da largura e 65% da altura do canvas, com margem transparente uniforme em todos os lados. Nenhuma parte do animal ou detalhe decorativo pode tocar ou ultrapassar as bordas. Sem texto, sem letras, sem fundo falso, sem overflow horizontal, sem overflow vertical, sem recortes.${stricter}`;
  }
  const list = (body.animals ?? []).filter(Boolean).join(", ") || body.subject;
  return `Imagem quadrada 1024x1024, fundo 100% transparente real, PNG, asset de categoria para aplicativo. Mostrar SOMENTE os animais solicitados: ${list}. Todos juntos em uma pequena base natural coerente com a categoria "${body.subject}", interagindo de forma fofa e harmoniosa. Máximo de 6 a 8 animais. Estilo ilustração premium semi-realista fofa, com sombreamento realista suave, textura bem trabalhada, olhos expressivos, acabamento premium, não realista demais. Composição centralizada real, ocupando no máximo 65% da largura e 65% da altura do canvas, com margem transparente uniforme em todos os lados. Nenhum animal, cauda, pata, orelha, asa, folha, galho, pedra, água ou detalhe pode tocar ou ultrapassar as bordas. Sem texto, sem letras, sem animais extras, sem overflow horizontal, sem overflow vertical, sem recortes.${stricter}`;
}

/** Parse PNG IHDR. Returns null se não for PNG válido. */
function parsePng(buf: Uint8Array): { width: number; height: number; colorType: number } | null {
  if (buf.length < 33) return null;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) return null;
  // IHDR começa em offset 8: length(4) + "IHDR"(4) + data(13 bytes)
  if (
    buf[12] !== 0x49 || // I
    buf[13] !== 0x48 || // H
    buf[14] !== 0x44 || // D
    buf[15] !== 0x52 // R
  ) {
    return null;
  }
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  const colorType = buf[25];
  return { width, height, colorType };
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as number[]);
  }
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function generateOnce(apiKey: string, prompt: string): Promise<Uint8Array | null> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL_IMAGE,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    console.error("[generate-pet-image] gen failed", resp.status, txt);
    return null;
  }
  const json = await resp.json();
  const b64 = json?.data?.[0]?.b64_json as string | undefined;
  if (!b64) {
    console.error("[generate-pet-image] no b64_json in response", JSON.stringify(json).slice(0, 500));
    return null;
  }
  return base64ToBytes(b64);
}

async function visionReview(
  apiKey: string,
  bytes: Uint8Array,
  body: Body,
): Promise<{ ok: boolean; reason: string }> {
  const dataUrl = `data:image/png;base64,${bytesToBase64(bytes)}`;
  const expected =
    body.kind === "category"
      ? `Categoria "${body.subject}" mostrando: ${(body.animals ?? []).join(", ")}`
      : `${body.subject} ${body.kind === "baby" ? "filhote/bebê (aparência claramente jovem)" : "adulto (aparência claramente madura, sem cara de filhote)"}`;

  const prompt = `Você está validando um asset de aplicativo. Esperado: ${expected}.
Devolva SOMENTE JSON neste formato:
{"ok": boolean, "has_text": boolean, "wrong_subject": boolean, "wrong_age": boolean, "extra_animals": boolean, "touches_edges": boolean, "fake_background": boolean, "reason": "curto em pt-br"}

ok=true SOMENTE se: não há nenhum texto/letra/rótulo, o assunto está correto, ${body.kind !== "category" ? "a fase de vida está correta," : ""} nenhum elemento toca as bordas, fundo é transparente (não cor sólida nem checker), e ${body.kind === "category" ? "apenas os animais pedidos aparecem" : "apenas o animal pedido aparece"}.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL_VISION,
      messages: [
        { role: "system", content: "Você valida assets visuais e responde SOMENTE com JSON válido." },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) {
    // Vision falhou — aceita por padrão (não bloqueia upload por erro de infra).
    return { ok: true, reason: "vision_unavailable" };
  }
  const json = await resp.json();
  const raw = json?.choices?.[0]?.message?.content;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed === "object") {
      return { ok: !!parsed.ok, reason: String(parsed.reason ?? "") };
    }
  } catch {
    // ignore
  }
  return { ok: true, reason: "vision_parse_fallback" };
}

export const Route = createFileRoute("/api/admin/generate-pet-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization") ?? "";
          if (!auth.toLowerCase().startsWith("bearer ")) {
            return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
          }
          const token = auth.slice(7).trim();

          const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
          const supabaseKey =
            process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          if (!supabaseUrl || !supabaseKey) {
            return new Response(JSON.stringify({ error: "server_misconfig" }), { status: 500 });
          }

          // Autentica como usuário + verifica role admin via RPC has_role.
          const sb = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: userRes, error: userErr } = await sb.auth.getUser();
          if (userErr || !userRes.user) {
            return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
          }
          const userId = userRes.user.id;
          const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
            sb.rpc("has_role" as any, { _user_id: userId, _role: "admin" }),
            sb.rpc("has_role" as any, { _user_id: userId, _role: "super_admin" }),
          ]);
          if (!isAdmin && !isSuper) {
            return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
          }

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "ai_unavailable" }), { status: 503 });
          }

          const body = (await request.json()) as Body;
          if (!body?.kind || !body?.subject) {
            return new Response(JSON.stringify({ error: "invalid_input" }), { status: 400 });
          }
          if (!["baby", "adult", "category"].includes(body.kind)) {
            return new Response(JSON.stringify({ error: "invalid_kind" }), { status: 400 });
          }

          let lastReason = "";
          for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const prompt = buildPrompt(body, attempt);
            const bytes = await generateOnce(apiKey, prompt);
            if (!bytes) {
              lastReason = "generation_failed";
              continue;
            }

            // Validação leve (PNG + 1024 + alpha).
            const info = parsePng(bytes);
            if (!info) {
              lastReason = "not_png";
              continue;
            }
            if (info.width !== 1024 || info.height !== 1024) {
              lastReason = `wrong_size_${info.width}x${info.height}`;
              continue;
            }
            // colorType 4 = grayscale+alpha, 6 = RGBA. Outros = sem alpha.
            if (info.colorType !== 4 && info.colorType !== 6) {
              lastReason = `no_alpha_channel_${info.colorType}`;
              continue;
            }

            // Revisão por IA.
            const review = await visionReview(apiKey, bytes, body);
            if (!review.ok) {
              lastReason = `vision_rejected:${review.reason}`;
              continue;
            }

            // Upload (admin client — bypassa RLS do bucket).
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const path = `catalog/ai/${body.kind}/${crypto.randomUUID()}.png`;
            const { error: upErr } = await supabaseAdmin.storage
              .from(BUCKET)
              .upload(path, bytes, {
                contentType: "image/png",
                cacheControl: "31536000",
                upsert: false,
              });
            if (upErr) {
              console.error("[generate-pet-image] upload failed", upErr);
              return new Response(
                JSON.stringify({ error: "upload_failed", detail: upErr.message }),
                { status: 500 },
              );
            }
            return new Response(
              JSON.stringify({ path, attempts: attempt + 1, vision_reason: review.reason }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          return new Response(
            JSON.stringify({ error: "validation_failed", reason: lastReason }),
            { status: 422, headers: { "Content-Type": "application/json" } },
          );
        } catch (e) {
          console.error("[generate-pet-image] fatal", e);
          return new Response(
            JSON.stringify({ error: "internal", detail: (e as Error).message }),
            { status: 500 },
          );
        }
      },
    },
  },
});

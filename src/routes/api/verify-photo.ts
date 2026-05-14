import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type VerifyResult = {
  is_human: boolean;
  is_real_photo: boolean;
  has_single_face: boolean;
  confidence: number;
  reason: string;
};

const SYSTEM_PROMPT = `Você analisa fotos de perfil para um app de relacionamento cristão.
Devolva SOMENTE JSON com este formato exato:
{"is_human": boolean, "is_real_photo": boolean, "has_single_face": boolean, "confidence": number entre 0 e 1, "reason": "explicação curta em pt-br"}

Regras:
- is_human=false para desenhos, ilustrações, anime, animais, objetos, paisagens, logos, prints/screenshots, memes.
- is_real_photo=false para imagens claramente artificiais, IA, fortemente editadas, capa de revista, foto de outra tela.
- has_single_face=true APENAS se houver exatamente um rosto humano claramente visível.
- confidence: o quanto você está certo da análise (0 a 1).
- reason: motivo curto. Se reprovar, indique o que está errado.`;

export const Route = createFileRoute("/api/verify-photo")({
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
          const sb = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: userRes, error: userErr } = await sb.auth.getUser();
          if (userErr || !userRes.user) {
            return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
          }

          const body = await request.json().catch(() => null);
          const imageBase64: string | undefined = body?.imageBase64;
          const mimeType: string = typeof body?.mimeType === "string" ? body.mimeType : "image/jpeg";
          if (!imageBase64 || typeof imageBase64 !== "string" || imageBase64.length < 100) {
            return new Response(JSON.stringify({ error: "invalid_input" }), { status: 400 });
          }
          if (imageBase64.length > 8_000_000) {
            return new Response(JSON.stringify({ error: "image_too_large" }), { status: 413 });
          }

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(
              JSON.stringify({ soft: true, error: "ai_unavailable" }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          const dataUrl = `data:${mimeType};base64,${imageBase64}`;

          const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                  role: "user",
                  content: [
                    { type: "text", text: "Analise esta foto de perfil." },
                    { type: "image_url", image_url: { url: dataUrl } },
                  ],
                },
              ],
              response_format: { type: "json_object" },
            }),
          });

          if (aiResp.status === 429 || aiResp.status === 402) {
            return new Response(
              JSON.stringify({ soft: true, error: "ai_rate_limited" }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }
          if (!aiResp.ok) {
            const txt = await aiResp.text();
            console.error("AI gateway error", aiResp.status, txt);
            return new Response(
              JSON.stringify({ soft: true, error: "ai_error" }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          const aiJson = await aiResp.json();
          const raw = aiJson?.choices?.[0]?.message?.content;
          let parsed: VerifyResult | null = null;
          try {
            parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          } catch {
            parsed = null;
          }
          if (!parsed || typeof parsed !== "object") {
            return new Response(
              JSON.stringify({ soft: true, error: "ai_parse_error" }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          const result: VerifyResult = {
            is_human: !!parsed.is_human,
            is_real_photo: !!parsed.is_real_photo,
            has_single_face: !!parsed.has_single_face,
            confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
            reason: typeof parsed.reason === "string" ? parsed.reason : "",
          };

          const pass =
            result.is_human && result.is_real_photo && result.has_single_face;
          const approved = pass && result.confidence >= 0.7;
          const needsReview = pass && !approved && result.confidence >= 0.5;

          return new Response(
            JSON.stringify({ approved, needsReview, result }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (e) {
          console.error("verify-photo error", e);
          return new Response(
            JSON.stringify({ soft: true, error: "exception" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
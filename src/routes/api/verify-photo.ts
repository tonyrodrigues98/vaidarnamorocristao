import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type VerifyResult = {
  is_human: boolean;
  is_real_photo: boolean;
  has_single_face: boolean;
  confidence: number;
  reason: string;
};

const SYSTEM_PROMPT_MAIN = `Você analisa fotos de perfil para um app de relacionamento cristão.
Devolva SOMENTE JSON com este formato exato:
{"is_human": boolean, "is_real_photo": boolean, "has_single_face": boolean, "confidence": number entre 0 e 1, "reason": "explicação curta em pt-br"}

Regras:
- is_human=false para desenhos, ilustrações, anime, animais, objetos, paisagens, logos, prints/screenshots, memes.
- is_real_photo=false para imagens claramente artificiais, IA, fortemente editadas, capa de revista, foto de outra tela.
- has_single_face=true APENAS se houver exatamente um rosto humano claramente visível.
- confidence: o quanto você está certo da análise (0 a 1).
- reason: motivo curto. Se reprovar, indique o que está errado.`;

const SYSTEM_PROMPT_EXTRA = `Você modera fotos adicionais em um app de relacionamento cristão.
Devolva SOMENTE JSON com este formato exato:
{"is_safe": boolean, "is_explicit": boolean, "confidence": number entre 0 e 1, "reason": "explicação curta em pt-br"}

Regras:
- is_explicit=true se houver nudez, conteúdo sexual, pornografia, lingerie sugestiva, partes íntimas expostas, violência gráfica, drogas ou conteúdo ofensivo.
- is_safe=true para qualquer outra foto: pessoa, paisagem, pet, comida, hobby, família, viagem, igreja, etc. Desenhos e memes não-ofensivos são permitidos.
- confidence: o quanto você está certo (0 a 1).
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
          const scope: "main" | "extra" = body?.scope === "extra" ? "extra" : "main";
          const photoUrl: string | null = typeof body?.photoUrl === "string" ? body.photoUrl : null;
          const dbScope = scope === "main" ? "avatar" : "extra";

          // Load admin-configured thresholds (singleton row).
          const { data: settings } = await sb
            .from("photo_moderation_settings")
            .select("extra_reject_threshold, extra_review_threshold, main_approve_threshold, main_review_threshold")
            .eq("id", true)
            .maybeSingle();
          const extraReject = Number(settings?.extra_reject_threshold ?? 0.6);
          const extraReview = Number(settings?.extra_review_threshold ?? 0.4);
          const mainApprove = Number(settings?.main_approve_threshold ?? 0.7);
          const mainReview = Number(settings?.main_review_threshold ?? 0.5);

          const logDecision = async (
            decision: "approved" | "needs_review" | "rejected" | "soft_fail",
            confidence: number | null,
            reason: string,
            aiResult: unknown
          ) => {
            try {
              await sb.from("photo_moderation_log").insert({
                user_id: userRes.user!.id,
                scope: dbScope,
                photo_url: photoUrl,
                decision,
                confidence,
                reason,
                ai_result: (aiResult as Record<string, unknown>) ?? {},
              });
            } catch (err) {
              console.error("photo log insert failed", err);
            }
          };
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
                { role: "system", content: scope === "extra" ? SYSTEM_PROMPT_EXTRA : SYSTEM_PROMPT_MAIN },
                {
                  role: "user",
                  content: [
                    { type: "text", text: scope === "extra" ? "Analise esta foto adicional." : "Analise esta foto de perfil." },
                    { type: "image_url", image_url: { url: dataUrl } },
                  ],
                },
              ],
              response_format: { type: "json_object" },
            }),
          });

          if (aiResp.status === 429 || aiResp.status === 402) {
            await logDecision("soft_fail", null, "ai_rate_limited", { status: aiResp.status });
            return new Response(
              JSON.stringify({ soft: true, error: "ai_rate_limited" }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }
          if (!aiResp.ok) {
            const txt = await aiResp.text();
            console.error("AI gateway error", aiResp.status, txt);
            await logDecision("soft_fail", null, "ai_error", { status: aiResp.status });
            return new Response(
              JSON.stringify({ soft: true, error: "ai_error" }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          const aiJson = await aiResp.json();
          const raw = aiJson?.choices?.[0]?.message?.content;
          let parsed: any = null;
          try {
            parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          } catch {
            parsed = null;
          }
          if (!parsed || typeof parsed !== "object") {
            await logDecision("soft_fail", null, "ai_parse_error", { raw });
            return new Response(
              JSON.stringify({ soft: true, error: "ai_parse_error" }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          if (scope === "extra") {
            const isExplicit = !!parsed.is_explicit;
            const isSafe = parsed.is_safe === undefined ? !isExplicit : !!parsed.is_safe;
            const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;
            const reason = typeof parsed.reason === "string" ? parsed.reason : "";
            const result = { is_safe: isSafe, is_explicit: isExplicit, confidence, reason };
            if (isExplicit && confidence >= extraReject) {
              await logDecision("rejected", confidence, reason, result);
              return new Response(
                JSON.stringify({ approved: false, needsReview: false, result: { ...result, reason: reason || "Conteúdo não permitido nesta foto." } }),
                { status: 200, headers: { "Content-Type": "application/json" } }
              );
            }
            if (isExplicit && confidence >= extraReview) {
              await logDecision("needs_review", confidence, reason, result);
              return new Response(
                JSON.stringify({ approved: false, needsReview: true, result }),
                { status: 200, headers: { "Content-Type": "application/json" } }
              );
            }
            await logDecision("approved", confidence, reason, result);
            return new Response(
              JSON.stringify({ approved: true, needsReview: false, result }),
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

          const pass = result.is_human && result.is_real_photo && result.has_single_face;
          const approved = pass && result.confidence >= mainApprove;
          const needsReview = pass && !approved && result.confidence >= mainReview;
          await logDecision(
            approved ? "approved" : needsReview ? "needs_review" : "rejected",
            result.confidence,
            result.reason,
            result
          );
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
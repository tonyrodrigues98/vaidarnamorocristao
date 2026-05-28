import { supabase } from "@/integrations/supabase/client";
import { detectFaceCount } from "./faceDetection";

export type PhotoScope = "main" | "extra";

export type VerifyOutcome =
  | { ok: true; approved: true; needsReview: false; confidence: number }
  | { ok: true; approved: false; needsReview: true; confidence: number; reason: string; aiResult: unknown }
  | { ok: false; reason: string }
  | { ok: true; soft: true; approved: false; needsReview: false; confidence: 0 };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("read_error"));
    r.onload = () => {
      const s = String(r.result ?? "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.readAsDataURL(file);
  });
}

/**
 * Two-stage verification: face-api.js (browser) then Lovable AI (server).
 * Returns soft=true if AI is unavailable so the upload can proceed unflagged.
 */
export async function verifyProfilePhoto(
  file: File,
  scope: PhotoScope = "main",
  photoUrl?: string | null
): Promise<VerifyOutcome> {
  // Stage 1 — face count (only for main avatar).
  // We HARD-block only the unambiguous case of "more than one face".
  // "Zero faces" can be a false negative (HEIC the browser can't decode,
  // low light, sunglasses, angle, etc.), so we let the server AI decide
  // and route ambiguous photos to manual review instead of bouncing the user.
  if (scope === "main") {
    try {
      const faceCount = await detectFaceCount(file);
      if (faceCount > 1) {
        return { ok: false, reason: "Envie uma foto somente com você (mais de um rosto detectado)." };
      }
    } catch (e) {
      console.warn("face-api failed, deferring to server AI", e);
    }
  }

  // Stage 2 — AI server
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) return { ok: false, reason: "Sessão expirada. Faça login novamente." };

  const imageBase64 = await fileToBase64(file);
  let resp: Response;
  try {
    resp = await fetch("/api/verify-photo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imageBase64, mimeType: file.type || "image/jpeg", scope, photoUrl: photoUrl ?? null }),
    });
  } catch {
    return { ok: true, soft: true, approved: false, needsReview: false, confidence: 0 };
  }

  const data = await resp.json().catch(() => ({}));
  if (data?.soft) {
    return { ok: true, soft: true, approved: false, needsReview: false, confidence: 0 };
  }
  if (!resp.ok) {
    return { ok: false, reason: "Não foi possível verificar a foto agora. Tente novamente." };
  }
  const result = data?.result ?? {};
  if (data?.approved) {
    return { ok: true, approved: true, needsReview: false, confidence: result.confidence ?? 1 };
  }
  if (data?.needsReview) {
    return {
      ok: true,
      approved: false,
      needsReview: true,
      confidence: result.confidence ?? 0,
      reason: result.reason ?? "Foto enviada para análise.",
      aiResult: result,
    };
  }
  return {
    ok: false,
    reason:
      result.reason ||
      "Esta imagem não parece ser uma foto sua real. Envie uma foto de rosto, sem filtros pesados.",
  };
}
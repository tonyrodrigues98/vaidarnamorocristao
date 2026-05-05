/**
 * Translate raw Supabase / PostgREST errors into friendly Portuguese messages.
 * Especially handles RLS violations caused by:
 *  - terms version updated (user must re-accept)
 *  - profile not yet approved (still pending review)
 */
export function friendlyError(error: unknown, fallback = "Não foi possível concluir a ação."): string {
  if (!error) return fallback;
  const msg = (error as { message?: string })?.message || String(error);
  const code = (error as { code?: string })?.code || "";

  // RLS violation
  if (
    code === "42501" ||
    /row-level security/i.test(msg) ||
    /violates row-level/i.test(msg)
  ) {
    return "Para continuar, aceite os Termos atualizados e confirme que seu perfil foi aprovado.";
  }

  // Custom check_violation thrown by triggers (e.g. terms required, restricted words)
  if (code === "23514" || /check_violation/i.test(msg)) {
    if (/terms acceptance required/i.test(msg)) {
      return "Você precisa aceitar os Termos atualizados antes de continuar.";
    }
    if (/conteúdo restrito|restricted/i.test(msg)) {
      return "Sua mensagem contém conteúdo não permitido.";
    }
  }

  // Unique violation
  if (code === "23505") return "Este registro já existe.";

  return msg || fallback;
}

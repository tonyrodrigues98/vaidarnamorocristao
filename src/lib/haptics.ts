/**
 * Pequenos pulsos de vibração para feedback tátil no mobile.
 * Silencioso em desktops ou navegadores sem suporte.
 */
function safeVibrate(pattern: number | number[]) {
  try {
    if (typeof navigator === "undefined") return;
    if (typeof navigator.vibrate !== "function") return;
    navigator.vibrate(pattern);
  } catch {
    /* noop */
  }
}

export const haptics = {
  /** Toque sutil — abrir menu, hover ativo */
  tap: () => safeVibrate(8),
  /** Confirmação leve — escolher item */
  pick: () => safeVibrate(12),
  /** Conquista — level up, missão completa */
  success: () => safeVibrate([18, 40, 28]),
  /** Erro / negação */
  error: () => safeVibrate([30, 30, 30]),
};
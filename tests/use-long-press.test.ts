/**
 * Reproduz o cenário de long press do menu de ações do chat e valida
 * que o click sintético subsequente NÃO é suprimido — isso é o que
 * permitia o "primeiro toque morto" relatado em mobile.
 *
 * Observação: testes de UI completos (renderização do bubble + menu +
 * overlay e simulação real de touch nas coordenadas do menu) requerem
 * Playwright com login autenticado no preview. Aqui validamos a unidade
 * crítica que regrediu — o hook useLongPress.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useLongPress } from "../src/hooks/use-long-press";

// Minimal React hook host: chamamos o hook fora de uma árvore React usando
// o truque conhecido — não funciona para hooks que dependem de useState
// updates re-renderizarem. Por isso usamos uma renderização simulada via
// react-dom/test-utils. Para evitar adicionar @testing-library, validamos
// apenas a lógica pura dos handlers através de uma extração funcional:
// chamamos useLongPress via um render mínimo de react.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

function makeTouch(x: number, y: number) {
  return {
    touches: [{ clientX: x, clientY: y }],
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.TouchEvent;
}

// Hook pode ser testado capturando o retorno via componente.
let captured: ReturnType<typeof useLongPress> | null = null;
function Probe({ cb, delay }: { cb: () => void; delay: number }) {
  captured = useLongPress(cb, delay);
  return null;
}

describe("useLongPress (chat action menu)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    captured = null;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("dispara onLongPress após o delay", () => {
    const onLong = vi.fn();
    renderToStaticMarkup(React.createElement(Probe, { cb: onLong, delay: 450 }));
    const h = captured!.handlers;
    h.onTouchStart(makeTouch(100, 100));
    vi.advanceTimersByTime(449);
    expect(onLong).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(onLong).toHaveBeenCalledTimes(1);
  });

  it("cancela ao mover além do threshold", () => {
    const onLong = vi.fn();
    renderToStaticMarkup(React.createElement(Probe, { cb: onLong, delay: 450 }));
    const h = captured!.handlers;
    h.onTouchStart(makeTouch(100, 100));
    h.onTouchMove(makeTouch(120, 100)); // 20px > 10px threshold
    vi.advanceTimersByTime(500);
    expect(onLong).not.toHaveBeenCalled();
  });

  it("NÃO chama preventDefault no touchend após long press (permite click sintético no menu)", () => {
    const onLong = vi.fn();
    renderToStaticMarkup(React.createElement(Probe, { cb: onLong, delay: 450 }));
    const h = captured!.handlers;
    h.onTouchStart(makeTouch(100, 100));
    vi.advanceTimersByTime(500);
    expect(onLong).toHaveBeenCalled();
    const end = makeTouch(100, 100);
    h.onTouchEnd(end);
    // Regressão: chamadas anteriores chamavam preventDefault aqui e isso
    // matava o primeiro tap no botão do menu.
    expect(end.preventDefault as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
    expect(end.stopPropagation as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("right-click abre o menu (desktop)", () => {
    const onLong = vi.fn();
    renderToStaticMarkup(React.createElement(Probe, { cb: onLong, delay: 450 }));
    const h = captured!.handlers;
    const ev = { preventDefault: vi.fn() } as unknown as React.MouseEvent;
    h.onContextMenu(ev);
    expect(onLong).toHaveBeenCalledTimes(1);
    expect(ev.preventDefault as ReturnType<typeof vi.fn>).toHaveBeenCalled();
  });
});

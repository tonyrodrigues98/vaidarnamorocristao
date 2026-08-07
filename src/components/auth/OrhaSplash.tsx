import { useNavigate } from "@tanstack/react-router";
import { useRef } from "react";

import { OrhaMark } from "@/components/auth/OrhaMark";

/** The route advances only from the final animation event, never from a timer. */
export function OrhaSplash() {
  const navigate = useNavigate();
  const advanced = useRef(false);

  function continueToLogin() {
    if (advanced.current) return;
    advanced.current = true;
    navigate({ to: "/auth/login", replace: true });
  }

  return (
    <main className="orha-splash" aria-label="Inicializando ORHA">
      <div className="orha-splash__glow" aria-hidden="true" />
      <div className="orha-splash__content">
        <OrhaMark size="display" />
        <p className="orha-splash__words" aria-label="Conexões, presença e propósito">
          <span>CONEXÕES</span>
          <i aria-hidden="true">•</i>
          <span>PRESENÇA</span>
          <i aria-hidden="true">•</i>
          <span>PROPÓSITO</span>
        </p>
        <span
          className="orha-splash__loader"
          aria-label="Carregando"
          role="status"
          onAnimationEnd={(event) => {
            if (event.animationName === "orha-splash-complete") continueToLogin();
          }}
        />
      </div>
    </main>
  );
}

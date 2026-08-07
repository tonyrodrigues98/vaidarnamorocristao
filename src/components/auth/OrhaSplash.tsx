import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/lib/auth";

/** The public entry route: official logo, one complete three-second animation, then redirect. */
export function OrhaSplash() {
  const navigate = useNavigate();
  const { user, initialResolutionFinished } = useAuth();
  const [animationFinished, setAnimationFinished] = useState(false);
  const advanced = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimationFinished(true), 3_000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!animationFinished || !initialResolutionFinished || advanced.current) return;
    advanced.current = true;
    navigate({ to: user ? "/inicio" : "/auth/login", replace: true });
  }, [animationFinished, initialResolutionFinished, navigate, user]);

  return (
    <main className="orha-splash" aria-label="Inicializando ORHA">
      <div className="orha-splash__content">
        <img
          src="/brand/orha-mark-ink.png"
          alt="ORHA"
          className="orha-splash__logo"
        />
      </div>
    </main>
  );
}

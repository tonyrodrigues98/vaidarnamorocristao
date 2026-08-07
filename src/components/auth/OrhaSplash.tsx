import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";

import { OrhaMark } from "@/components/auth/OrhaMark";
import { useAuth } from "@/lib/auth";

/** The entry route advances only after its three-second visual sequence and session resolution. */
export function OrhaSplash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const advanced = useRef(false);
  const sequenceComplete = useRef(false);

  const continueToDestination = useCallback(() => {
    if (advanced.current) return;
    if (loading || !sequenceComplete.current) return;
    advanced.current = true;
    navigate({ to: user ? "/inicio" : "/auth/login", replace: true });
  }, [loading, navigate, user]);

  useEffect(() => {
    continueToDestination();
  }, [continueToDestination]);

  return (
    <main className="orha-splash" aria-label="Abrindo ORHA">
      <div className="orha-splash__content">
        <OrhaMark size="display" tone="ink" />
        <span
          className="orha-splash__completion"
          aria-hidden="true"
          onAnimationEnd={(event) => {
            if (event.animationName !== "orha-splash-complete") return;
            sequenceComplete.current = true;
            continueToDestination();
          }}
        />
      </div>
    </main>
  );
}

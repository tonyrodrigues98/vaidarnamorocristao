import { useCallback, useEffect, useMemo, useState } from "react";

type BeforeInstallPromptOutcome = "accepted" | "dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: BeforeInstallPromptOutcome; platform: string }>;
};

function isBeforeInstallPromptEvent(event: Event): event is BeforeInstallPromptEvent {
  return "prompt" in event && "userChoice" in event;
}

function detectStandalone() {
  if (typeof window === "undefined") return false;

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function detectIos() {
  if (typeof window === "undefined") return false;

  const { userAgent, platform, maxTouchPoints } = window.navigator;
  const isiPhoneOrPad = /iPad|iPhone|iPod/.test(userAgent);
  const isModernIpad = platform === "MacIntel" && maxTouchPoints > 1;

  return isiPhoneOrPad || isModernIpad;
}

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsStandalone(detectStandalone());
    setIsIos(detectIos());

    const handleBeforeInstallPrompt = (event: Event) => {
      if (!isBeforeInstallPromptEvent(event)) return;

      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const canPromptInstall = Boolean(installPrompt);

  const install = useCallback(async () => {
    if (!installPrompt) {
      return null;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === "accepted") {
      setIsStandalone(detectStandalone());
    }

    return choice;
  }, [installPrompt]);

  return useMemo(
    () => ({
      isStandalone,
      isIos,
      canPromptInstall,
      isInstallAvailable: !isStandalone && (isIos || canPromptInstall),
      install,
    }),
    [canPromptInstall, install, isIos, isStandalone],
  );
}

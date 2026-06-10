/**
 * Native runtime bridge para Capacitor.
 *
 * Tudo aqui é no-op no navegador. Os imports são dinâmicos para que o
 * bundle web não puxe módulos nativos sem necessidade.
 */
import { Capacitor } from "@capacitor/core";

export const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const nativePlatform = (): "ios" | "android" | "web" => {
  try {
    const p = Capacitor.getPlatform();
    if (p === "ios" || p === "android") return p;
  } catch {
    // ignore
  }
  return "web";
};

let initialized = false;

export async function initNativeShell() {
  if (initialized || !isNative()) return;
  initialized = true;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Default });
    if (nativePlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#fff7f8" });
    }
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn("[native] status bar init failed", err);
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch (err) {
    console.warn("[native] splash hide failed", err);
  }

  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    Keyboard.addListener("keyboardWillShow", (info) => {
      document.documentElement.style.setProperty(
        "--keyboard-height",
        `${info.keyboardHeight}px`,
      );
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.setProperty("--keyboard-height", "0px");
    });
  } catch (err) {
    console.warn("[native] keyboard listeners failed", err);
  }

  try {
    const { App } = await import("@capacitor/app");
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else App.exitApp();
    });
  } catch (err) {
    console.warn("[native] app listeners failed", err);
  }
}

export type HapticKind = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection";

/**
 * Vibração tátil. No web é no-op; no iOS/Android usa @capacitor/haptics.
 */
export async function haptic(kind: HapticKind = "light") {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    switch (kind) {
      case "light":
        return Haptics.impact({ style: ImpactStyle.Light });
      case "medium":
        return Haptics.impact({ style: ImpactStyle.Medium });
      case "heavy":
        return Haptics.impact({ style: ImpactStyle.Heavy });
      case "success":
        return Haptics.notification({ type: NotificationType.Success });
      case "warning":
        return Haptics.notification({ type: NotificationType.Warning });
      case "error":
        return Haptics.notification({ type: NotificationType.Error });
      case "selection":
        return Haptics.selectionChanged();
    }
  } catch {
    // best-effort
  }
}

/**
 * Registra push nativo (APNs/FCM) e retorna o token. Use no lugar de Web
 * Push quando rodar dentro do app nativo.
 */
export async function registerNativePush(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const perm = await PushNotifications.checkPermissions();
    let granted = perm.receive === "granted";
    if (!granted) {
      const req = await PushNotifications.requestPermissions();
      granted = req.receive === "granted";
    }
    if (!granted) return null;

    return await new Promise<string | null>((resolve) => {
      const reg = PushNotifications.addListener("registration", (token) => {
        reg.then((h) => h.remove());
        err.then((h) => h.remove());
        resolve(token.value);
      });
      const err = PushNotifications.addListener("registrationError", () => {
        reg.then((h) => h.remove());
        err.then((h) => h.remove());
        resolve(null);
      });
      PushNotifications.register();
    });
  } catch (e) {
    console.warn("[native] push register failed", e);
    return null;
  }
}
import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config para empacotar o app como iOS/Android nativo.
 *
 * Como este app é SSR (TanStack Start + Cloudflare), não há um bundle
 * 100% estático. O `webDir` é um fallback mínimo que redireciona, e o
 * runtime real carrega a app publicada via `server.url`.
 *
 * Para apontar pro preview durante desenvolvimento, defina
 * CAP_SERVER_URL=https://id-preview--<...>.lovable.app antes de `cap sync`.
 */
const serverUrl = process.env.CAP_SERVER_URL || "https://vaidarnamoro.com";

const config: CapacitorConfig = {
  appId: "com.vaidarnamoro.app",
  appName: "Vaidarnamoro",
  webDir: "public/capacitor-fallback",
  server: {
    url: serverUrl,
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
  },
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#fff7f8",
  },
  android: {
    backgroundColor: "#fff7f8",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#fff7f8",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DEFAULT",
      backgroundColor: "#fff7f8",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
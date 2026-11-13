import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL || "https://figura-linguistica.vercel.app";

const config: CapacitorConfig = {
  appId: "ao.figuralinguistica.app",
  appName: "FiguraLinguística",
  webDir: "native-shell",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    allowNavigation: ["*"],
    errorPath: "index.html",
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: false,
    backgroundColor: "#F2F6FA",
    preferredContentMode: "mobile",
  },
  android: {
    backgroundColor: "#F2F6FA",
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;

import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-sans-jp/700.css";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { SWRegister } from "@/components/SWRegister";

export const metadata: Metadata = {
  title: "FiguraLinguística — Inglês, Francês e Japonês",
  description: "Aprende a conversar em inglês, francês e japonês em 10 a 15 minutos por dia.",
  manifest: "/manifest.webmanifest",
  applicationName: "FiguraLinguística",
  appleWebApp: { capable: true, title: "FiguraLinguística", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#F2F6FA",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt">
      <body className="antialiased">
        <StoreProvider>{children}</StoreProvider>
        <SWRegister />
      </body>
    </html>
  );
}

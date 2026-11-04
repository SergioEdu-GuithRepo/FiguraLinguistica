import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // evita que o Next infira a raiz errada quando existe outro package-lock.json acima
  outputFileTracingRoot: __dirname,
  // motor de voz neural (WebSocket para os serviços de voz Microsoft) corre como dependência Node nativa
  serverExternalPackages: ["msedge-tts", "ws"],
};

export default nextConfig;

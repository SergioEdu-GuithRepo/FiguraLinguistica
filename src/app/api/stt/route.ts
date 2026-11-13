import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/server/guard";

export const runtime = "nodejs";

function sttProvider(): "groq" | "openai" | "gemini" | "none" {
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  if ((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim()) return "gemini";
  return "none";
}

export async function GET() {
  const provider = sttProvider();
  return NextResponse.json({ enabled: provider !== "none", provider });
}

export async function POST(req: Request) {
  if (!rateLimit(`stt:${clientIp(req)}`, 25, 60_000)) {
    return NextResponse.json({ error: "Demasiados pedidos de áudio. Aguarda um momento." }, { status: 429 });
  }
  const provider = sttProvider();
  if (provider === "none") {
    return NextResponse.json({ error: "Reconhecimento de voz na nuvem não configurado." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Áudio inválido." }, { status: 400 });
  }

  const file = form.get("audio");
  const langRaw = String(form.get("lang") || "en").slice(0, 5);
  const lang = langRaw === "fr" || langRaw === "ja" ? langRaw : "en";

  if (!(file instanceof Blob) || file.size < 200 || file.size > 4_000_000) {
    return NextResponse.json({ error: "Gravação vazia ou demasiado longa." }, { status: 400 });
  }

  try {
    if (provider === "groq" || provider === "openai") {
      const isGroq = provider === "groq";
      const key = (isGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY)!.trim();
      const endpoint = isGroq
        ? "https://api.groq.com/openai/v1/audio/transcriptions"
        : "https://api.openai.com/v1/audio/transcriptions";
      const model = isGroq ? "whisper-large-v3-turbo" : "whisper-1";
      const upstream = new FormData();
      upstream.append("file", file, "speech.webm");
      upstream.append("model", model);
      upstream.append("language", lang);
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: upstream,
      });
      if (!r.ok) throw new Error(`STT HTTP ${r.status}`);
      const j = (await r.json()) as { text?: string };
      return NextResponse.json({ transcript: (j.text ?? "").trim(), confidence: 0.92 });
    }

    // Gemini multimodal transcription
    const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)!.trim();
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const buf = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "audio/webm";
    const langLabel = lang === "ja" ? "Japanese" : lang === "fr" ? "French" : "English";
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Transcribe the spoken ${langLabel} audio verbatim. Reply ONLY with the exact spoken words in ${langLabel}, with no quotes or extra explanation.`,
                },
                {
                  inlineData: {
                    mimeType,
                    data: buf.toString("base64"),
                  },
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 120, temperature: 0.1 },
        }),
      },
    );
    if (!r.ok) throw new Error(`Gemini STT HTTP ${r.status}`);
    const j = (await r.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const transcript = (j.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    return NextResponse.json({ transcript, confidence: 0.9 });
  } catch (e) {
    console.error("[stt] erro na transcrição:", (e as Error).message);
    return NextResponse.json({ error: "Não foi possível transcrever o áudio." }, { status: 502 });
  }
}

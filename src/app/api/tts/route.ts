import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/server/guard";
import { neuralEnabled, peekCache, synthesize, TTS_ENGINE } from "@/lib/server/tts";
import { isNeuralVoice, NEURAL_VOICES, normalizeTtsText, rateToProsody, roundRate } from "@/lib/voices";

export const runtime = "nodejs";

const QuerySchema = z.object({
  lang: z.enum(["en", "fr", "ja"]),
  voice: z.string().max(60).optional(),
  rate: z.coerce.number().min(0.5).max(1.5).default(1),
  text: z
    .string()
    .transform(normalizeTtsText)
    .pipe(z.string().min(1).max(400)),
});

/**
 * GET /api/tts?lang=en&voice=en-GB-SoniaNeural&rate=1&text=Hello
 * → audio/mpeg (MP3 mono 24 kHz / 96 kbps), cabeçalho X-TTS-Engine: edge-neural-hd.
 * GET /api/tts (sem texto) → estado do motor e catálogo de vozes.
 * O URL é determinístico, por isso a resposta é cacheável para sempre (browser + service worker).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!url.searchParams.has("text")) {
    return Response.json(
      { engine: TTS_ENGINE, enabled: neuralEnabled(), format: "audio-24khz-96kbitrate-mono-mp3", voices: NEURAL_VOICES },
      { headers: { "X-TTS-Engine": TTS_ENGINE } },
    );
  }
  if (!neuralEnabled()) return Response.json({ error: "Voz neural desactivada" }, { status: 503 });

  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return Response.json({ error: "Pedido inválido" }, { status: 400 });
  const { lang, text } = parsed.data;
  const voice = isNeuralVoice(lang, parsed.data.voice) ? parsed.data.voice : NEURAL_VOICES[lang][0].id;
  const prosody = rateToProsody(roundRate(parsed.data.rate));

  // limite só conta sínteses novas, não respostas da cache
  const ip = clientIp(req);
  try {
    const res = await synthesizeLimited(ip, voice, text, prosody);
    if (!res) return Response.json({ error: "Demasiados pedidos de voz" }, { status: 429, headers: { "Retry-After": "30" } });
    return new Response(new Uint8Array(res.audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(res.audio.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-TTS-Engine": TTS_ENGINE,
        "X-TTS-Voice": voice,
        "X-TTS-Cache": res.cache,
        "Accept-Ranges": "none",
      },
    });
  } catch (e) {
    console.error("[tts] falha na síntese:", (e as Error).message);
    return Response.json({ error: "Voz neural indisponível" }, { status: 502, headers: { "X-TTS-Engine": TTS_ENGINE } });
  }
}

async function synthesizeLimited(ip: string, voice: string, text: string, prosody: string) {
  const cached = await peekCache(voice, text, prosody);
  if (cached) return cached;
  if (!rateLimit(`tts:${ip}`, 90, 60_000)) return null;
  return synthesize(voice, text, prosody);
}

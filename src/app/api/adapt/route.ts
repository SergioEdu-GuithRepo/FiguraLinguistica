import { NextResponse } from "next/server";
import { z } from "zod";
import { aiEnabled, complete } from "@/lib/server/ai";
import { clientIp, moderate, rateLimit } from "@/lib/server/guard";
import { extractJson } from "@/lib/tutor";
import { LANGS, TOTAL_LEVELS } from "@/lib/langs";

export const runtime = "nodejs";

const Req = z.object({
  lang: z.enum(["en", "fr", "ja"]),
  level: z.number().int().min(1).max(TOTAL_LEVELS),
  text: z.string().min(1).max(2000),
});

const Res = z.object({
  texto_adaptado: z.string().min(1).max(3000),
  traducao_pt: z.string().max(3000),
  vocabulario: z.array(z.object({ texto: z.string(), pt: z.string() })).max(15),
  perguntas: z.array(z.object({ pergunta: z.string(), resposta: z.string() })).max(5),
});

/** Importar texto: adapta um texto ao nível do aluno (simplifica, anota, vocabulário e perguntas). */
export async function POST(req: Request) {
  if (!aiEnabled()) return NextResponse.json({ error: "IA não configurada" }, { status: 501 });
  if (!rateLimit(`adapt:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Demasiados pedidos. Espera um minuto." }, { status: 429 });
  }
  const parsed = Req.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  const { lang, level, text } = parsed.data;
  if (!moderate(text)) return NextResponse.json({ error: "Texto não permitido" }, { status: 400 });
  const system = [
    `És um professor de ${LANGS[lang].name.toLowerCase()} para falantes de português. Nível do aluno: ${level}/${TOTAL_LEVELS}.`,
    `Adapta o texto do aluno: reescreve-o em ${LANGS[lang].name.toLowerCase()} simples (frases curtas, vocabulário frequente), mantendo o sentido.`,
    lang === "ja" ? "Usa です/ます e kana com poucos kanji; separa as palavras com espaços." : "",
    `Responde APENAS com JSON: {"texto_adaptado": string, "traducao_pt": string, "vocabulario": [{"texto","pt"}] (até 10), "perguntas": [{"pergunta","resposta"}] (3 perguntas de compreensão no idioma-alvo, respostas curtas)}.`,
  ]
    .filter(Boolean)
    .join("\n");
  try {
    const out = await complete(system, [{ role: "user", content: text }], level);
    return NextResponse.json(Res.parse(extractJson(out)));
  } catch (e) {
    console.error("[adapt]", (e as Error).message);
    return NextResponse.json({ error: "Não foi possível adaptar o texto agora." }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { getUnit, CONTENT } from "@/content";
import { aiEnabled, complete } from "@/lib/server/ai";
import { clientIp, moderate, rateLimit } from "@/lib/server/guard";
import {
  TutorReplySchema,
  TutorRequestSchema,
  buildSystemPrompt,
  extractJson,
  offlineFreeTurn,
  offlineTurn,
} from "@/lib/tutor";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ai: aiEnabled() });
}

export async function POST(req: Request) {
  if (!rateLimit(`tutor:${clientIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ error: "Demasiados pedidos. Espera um minuto." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = TutorRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  const r = parsed.data;
  const unit = getUnit(r.unitId);
  if (!unit || unit.lang !== r.lang || r.stepIndex >= unit.conversation.steps.length) {
    return NextResponse.json({ error: "Unidade inválida" }, { status: 400 });
  }
  if (!moderate(r.userText)) {
    return NextResponse.json({
      source: "moderation",
      reply: {
        resposta_do_tutor: "Vamos voltar à nossa cena? 🙂",
        traducao_pt: "Vamos voltar à nossa cena?",
        avaliacao: "incompreensivel",
        correccao: null,
        novas_palavras: [],
        proximo_passo: "repetir",
        ajuda_sugerida: r.mode === "desafio" ? null : unit.conversation.steps[r.stepIndex].hint,
      },
    });
  }

  const dict = CONTENT[r.lang].dictionary;
  const runOffline = () =>
    r.mode === "livre"
      ? offlineFreeTurn({ unit, stepIndex: r.stepIndex, userText: r.userText, dict })
      : offlineTurn({
          unit,
          stepIndex: r.stepIndex,
          userText: r.userText,
          dict,
          attempt: r.mode === "desafio" ? 2 : 0,
        });

  if (!aiEnabled()) {
    return NextResponse.json({ source: "offline", reply: runOffline() });
  }

  try {
    const system = buildSystemPrompt(unit, r.level, r.stepIndex, r.furigana, r.mode);
    const msgs = r.history.slice(-10).map((h) => ({
      role: h.author === "tutor" ? ("assistant" as const) : ("user" as const),
      content: h.text,
    }));
    // a conversa tem de começar com "user"
    while (msgs.length && msgs[0].role === "assistant") msgs.shift();
    msgs.push({ role: "user", content: r.userText });
    const text = await complete(system, msgs, r.level);
    const json = TutorReplySchema.parse(extractJson(text));
    return NextResponse.json({ source: "ai", reply: json });
  } catch (e) {
    console.error("[tutor] falha na IA, a usar motor offline:", (e as Error).message);
    return NextResponse.json({
      source: "offline",
      reply: runOffline(),
    });
  }
}

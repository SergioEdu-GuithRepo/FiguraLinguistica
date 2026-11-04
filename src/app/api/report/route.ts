import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/server/guard";

export const runtime = "nodejs";

const ReportSchema = z.object({
  ref: z.string().min(1).max(120),
  text: z.string().max(800),
  reason: z.string().min(1).max(500),
});

/** Botão "Reportar erro": guarda em data/reports.jsonl para a rede de validação (secção 5.6). */
export async function POST(req: Request) {
  if (!rateLimit(`report:${clientIp(req)}`, 20, 60_000)) {
    return NextResponse.json({ error: "Demasiados pedidos" }, { status: 429 });
  }
  const parsed = ReportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  const entry = { ...parsed.data, at: new Date().toISOString(), estado: "aberto" };
  try {
    const dir = path.join(process.cwd(), "data");
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(path.join(dir, "reports.jsonl"), JSON.stringify(entry) + "\n", "utf8");
  } catch (e) {
    console.error("[report] não foi possível gravar:", (e as Error).message);
    return NextResponse.json({ ok: true, stored: false });
  }
  return NextResponse.json({ ok: true, stored: true });
}

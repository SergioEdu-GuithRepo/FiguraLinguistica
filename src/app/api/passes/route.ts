import { z } from "zod";
import { redeemPassCode } from "@/lib/server/cloud-db";
import { clientIp, rateLimit } from "@/lib/server/guard";

export const runtime = "nodejs";

const RedeemSchema = z.object({
  userId: z.string().min(1).max(64),
  email: z.string().email().max(120).optional(),
  token: z.string().min(16).max(200),
  code: z.string().min(4).max(40),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`passes:${ip}`, 15, 60_000)) {
    return Response.json({ error: "Demasiadas tentativas. Aguarda um minuto." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = RedeemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Indica um código válido." }, { status: 400 });
  }

  const res = await redeemPassCode(parsed.data);
  if (!res.ok) return Response.json({ error: res.error }, { status: res.status });
  return Response.json(res);
}

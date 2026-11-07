import { z } from "zod";
import { authenticateToken, cloudProvider, syncCloudState } from "@/lib/server/cloud-db";
import { clientIp, rateLimit } from "@/lib/server/guard";
import type { UserState } from "@/lib/state";

export const runtime = "nodejs";

const SyncBodySchema = z.object({
  userId: z.string().min(1).max(64),
  email: z.string().email().max(120).optional(),
  token: z.string().min(16).max(200),
  state: z.record(z.string(), z.unknown()),
  updatedAt: z.number().optional(),
  forceReplace: z.boolean().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!userId || !token) {
    return Response.json({ enabled: true, provider: cloudProvider() });
  }

  const row = await authenticateToken(userId, token);
  if (!row) {
    return Response.json({ error: "Sessão inválida." }, { status: 401 });
  }

  return Response.json({
    ok: true,
    provider: cloudProvider(),
    state: row.state,
    updatedAt: row.updated_at,
  });
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`sync:${ip}`, 120, 60_000)) {
    return Response.json({ error: "Demasiados pedidos de sincronização." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = SyncBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Formato de sincronização inválido." }, { status: 400 });
  }

  const { userId, email, token, state, updatedAt, forceReplace } = parsed.data;
  const res = await syncCloudState({
    userId,
    email,
    token,
    clientState: state as unknown as UserState,
    clientUpdatedAt: updatedAt ?? Date.now(),
    forceReplace,
  });

  if (!res.ok) {
    return Response.json({ error: res.error }, { status: res.status });
  }

  return Response.json({
    ok: true,
    provider: res.provider,
    state: res.state,
    updatedAt: res.updatedAt,
  });
}

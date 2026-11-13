import { z } from "zod";
import {
  changeAccountPassword,
  cloudProvider,
  confirmPasswordReset,
  deleteCloudAccount,
  loginCloudAccount,
  registerOrSyncAccount,
  requestPasswordReset,
} from "@/lib/server/cloud-db";
import { clientIp, rateLimit } from "@/lib/server/guard";
import type { UserState } from "@/lib/state";

export const runtime = "nodejs";

const AuthBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("register"),
    id: z.string().max(64).optional(),
    name: z.string().min(1).max(80),
    email: z.string().email().max(120),
    password: z.string().min(6).max(200),
    state: z.unknown().optional(),
  }),
  z.object({
    action: z.literal("login"),
    email: z.string().email().max(120),
    password: z.string().min(1).max(200),
    state: z.unknown().optional(),
    updatedAt: z.number().optional(),
  }),
  z.object({
    action: z.literal("delete"),
    userId: z.string().min(1).max(64),
    token: z.string().min(16).max(200),
  }),
  z.object({
    action: z.literal("request-reset"),
    email: z.string().email().max(120),
  }),
  z.object({
    action: z.literal("confirm-reset"),
    email: z.string().email().max(120),
    code: z.string().min(6).max(6),
    newPassword: z.string().min(6).max(200),
  }),
  z.object({
    action: z.literal("change-password"),
    userId: z.string().min(1).max(64),
    email: z.string().email().max(120).optional(),
    token: z.string().min(16).max(200),
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(6).max(200),
  }),
]);

export async function GET() {
  return Response.json({
    enabled: true,
    provider: cloudProvider(),
  });
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`auth:${ip}`, 30, 60_000)) {
    return Response.json({ error: "Demasiadas tentativas. Aguarda um momento." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = AuthBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Dados de autenticação inválidos." }, { status: 400 });
  }

  const data = parsed.data;
  if (data.action === "register") {
    const res = await registerOrSyncAccount({
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      initialState: data.state as UserState | undefined,
    });
    if (!res.ok) return Response.json({ error: res.error }, { status: res.status });
    return Response.json(res);
  }

  if (data.action === "login") {
    const res = await loginCloudAccount({
      email: data.email,
      password: data.password,
      localState: data.state as UserState | undefined,
      localUpdatedAt: data.updatedAt,
    });
    if (!res.ok) return Response.json({ error: res.error }, { status: res.status });
    return Response.json(res);
  }

  if (data.action === "request-reset") {
    if (!rateLimit(`reset:${ip}`, 8, 60_000)) {
      return Response.json({ error: "Demasiados pedidos de código. Tenta dentro de 1 minuto." }, { status: 429 });
    }
    const res = await requestPasswordReset(data.email);
    if (!res.ok) return Response.json({ error: res.error }, { status: res.status });
    return Response.json(res);
  }

  if (data.action === "confirm-reset") {
    const res = await confirmPasswordReset({
      email: data.email,
      code: data.code,
      newPassword: data.newPassword,
    });
    if (!res.ok) return Response.json({ error: res.error }, { status: res.status });
    return Response.json(res);
  }

  if (data.action === "change-password") {
    const res = await changeAccountPassword({
      userId: data.userId,
      email: data.email,
      token: data.token,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    if (!res.ok) return Response.json({ error: res.error }, { status: res.status });
    return Response.json(res);
  }

  const deleted = await deleteCloudAccount(data.userId, data.token);
  return Response.json({ ok: deleted });
}

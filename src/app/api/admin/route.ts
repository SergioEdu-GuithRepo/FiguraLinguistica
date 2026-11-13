import { z } from "zod";
import {
  adminCreatePassCode,
  adminDeletePassCode,
  adminGenerateResetForUser,
  adminSetUserPlan,
  authenticateAdmin,
  getAdminOverview,
} from "@/lib/server/cloud-db";
import { clientIp, rateLimit } from "@/lib/server/guard";

export const runtime = "nodejs";

const PlanEnum = z.enum(["free", "premium", "lifetime", "pass-week", "pass-month", "school"]);

const AdminActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create-pass"),
    plan: PlanEnum,
    days: z.number().int().min(1).max(3650).nullable(),
    maxUses: z.number().int().min(1).max(500).default(1),
    note: z.string().max(80).optional(),
    customCode: z.string().max(28).optional(),
  }),
  z.object({
    action: z.literal("delete-pass"),
    code: z.string().min(1).max(40),
  }),
  z.object({
    action: z.literal("set-plan"),
    targetEmail: z.string().email().max(120),
    plan: PlanEnum,
    days: z.number().int().min(1).max(3650).nullable(),
  }),
  z.object({
    action: z.literal("generate-reset"),
    targetEmail: z.string().email().max(120),
  }),
]);

async function requireAdmin(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const userId = req.headers.get("x-user-id")?.trim() || "";
  const email = req.headers.get("x-user-email")?.trim() || undefined;
  return authenticateAdmin(userId, token, email);
}

export async function GET(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`admin:${ip}`, 40, 60_000)) {
    return Response.json({ error: "Demasiados pedidos." }, { status: 429 });
  }
  const admin = await requireAdmin(req);
  if (!admin) {
    return Response.json({ error: "Acesso reservado ao fundador." }, { status: 403 });
  }
  const overview = await getAdminOverview();
  return Response.json({ ok: true, ...overview });
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`admin:${ip}`, 40, 60_000)) {
    return Response.json({ error: "Demasiados pedidos." }, { status: 429 });
  }
  const admin = await requireAdmin(req);
  if (!admin) {
    return Response.json({ error: "Acesso reservado ao fundador." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = AdminActionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Acção inválida." }, { status: 400 });
  }

  const d = parsed.data;
  if (d.action === "create-pass") {
    const pass = await adminCreatePassCode({
      plan: d.plan,
      days: d.days,
      maxUses: d.maxUses,
      note: d.note,
      customCode: d.customCode,
    });
    return Response.json({ ok: true, pass });
  }

  if (d.action === "delete-pass") {
    await adminDeletePassCode(d.code);
    return Response.json({ ok: true });
  }

  if (d.action === "set-plan") {
    const ok = await adminSetUserPlan({
      targetEmail: d.targetEmail,
      plan: d.plan,
      days: d.days,
    });
    if (!ok) return Response.json({ error: "Utilizador não encontrado." }, { status: 404 });
    return Response.json({ ok: true });
  }

  const code = await adminGenerateResetForUser(d.targetEmail);
  if (!code) return Response.json({ error: "Utilizador não encontrado." }, { status: 404 });
  return Response.json({ ok: true, code });
}

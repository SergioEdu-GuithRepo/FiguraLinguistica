import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { Card } from "@/lib/fsrs";
import { LANG_LIST } from "@/lib/langs";
import {
  currentLevel,
  defaultState,
  isPremium,
  mergeXpEvents,
  reconcileUserXp,
  type LangProgress,
  type Plan,
  type StepId,
  type UnitProgress,
  type UserState,
} from "@/lib/state";
import type { LangCode } from "@/lib/types";

export type CloudProvider = "supabase" | "local-cloud";

export interface CloudAccountRow {
  id: string;
  email: string;
  name: string;
  salt: string;
  password_hash: string;
  token_hash: string;
  state: UserState;
  updated_at: number;
  created_at: string;
}

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "").trim();
const LOCAL_DB_PATH = process.env.CLOUD_DB_PATH || path.join(process.cwd(), "data", "cloud-db.json");
const ADMIN_EMAILS_RAW = (process.env.ADMIN_EMAILS ?? "sergio.eduardo.kuroko@gmail.com").trim();
const SYSTEM_META_ID = "__system_meta__";
const SYSTEM_META_EMAIL = "__system__@figuralinguistica.internal";

export interface PassCodeRecord {
  code: string;
  plan: Plan;
  days: number | null;
  maxUses: number;
  usedBy: { email: string; name: string; at: number }[];
  note?: string;
  createdAt: number;
}

export interface ResetRequestRecord {
  email: string;
  codeHash: string;
  adminCode: string;
  expiresAt: number;
  attempts: number;
  requestedAt: number;
}

interface SystemMetaPayload {
  passCodes: Record<string, PassCodeRecord>;
  resetRequests: Record<string, ResetRequestRecord>;
}

export function isAdminEmail(email: string): boolean {
  if (ADMIN_EMAILS_RAW === "*") return true;
  const list = ADMIN_EMAILS_RAW.split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export function cloudProvider(): CloudProvider {
  return SUPABASE_URL && SUPABASE_KEY ? "supabase" : "local-cloud";
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hashPasswordServer(password: string, salt: string): string {
  return sha256Hex(`${salt}:${password}`);
}

export function issueSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: sha256Hex(token) };
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

function appendTokenHash(existing: string | undefined, nextHash: string): string {
  const list = (existing || "")
    .split(",")
    .map((s) => s.trim())
    .filter((h) => h.length === 64 && h !== nextHash);
  return [...list.slice(-9), nextHash].join(",");
}

function matchesTokenHash(stored: string | undefined, candidateHash: string): boolean {
  if (!stored || !candidateHash) return false;
  const list = stored
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.some((h) => safeEqualHex(candidateHash, h));
}

/* ---------------- Fusão inteligente de estados (Offline-First CRDT-like) ---------------- */

function mergeCards(a: Record<string, Card> = {}, b: Record<string, Card> = {}): Record<string, Card> {
  const out: Record<string, Card> = { ...a };
  for (const [k, cb] of Object.entries(b)) {
    const ca = out[k];
    if (!ca || (cb.last ?? 0) >= (ca.last ?? 0)) {
      out[k] = cb;
    }
  }
  return out;
}

function mergeUnits(a: Record<string, UnitProgress> = {}, b: Record<string, UnitProgress> = {}): Record<string, UnitProgress> {
  const out: Record<string, UnitProgress> = { ...a };
  for (const [uid, ub] of Object.entries(b)) {
    const ua = out[uid];
    if (!ua) {
      out[uid] = ub;
      continue;
    }
    const steps: Partial<Record<StepId, number>> = { ...ua.steps };
    for (const [step, ts] of Object.entries(ub.steps ?? {}) as [StepId, number | undefined][]) {
      if (ts && (!steps[step] || ts < steps[step]!)) steps[step] = ts;
    }
    const completedAt =
      ua.completedAt && ub.completedAt
        ? Math.min(ua.completedAt, ub.completedAt)
        : ua.completedAt ?? ub.completedAt;
    out[uid] = { steps, ...(completedAt ? { completedAt } : {}) };
  }
  return out;
}

function mergeLangProgress(a: LangProgress, b: LangProgress): LangProgress {
  const lessons: Record<string, number> = { ...a.lessons };
  for (const [k, v] of Object.entries(b.lessons ?? {})) {
    lessons[k] = Math.max(lessons[k] ?? 0, v);
  }
  const downloads = Array.from(new Set([...(a.downloads ?? []), ...(b.downloads ?? [])]));
  const stageExams = Array.from(new Set([...(a.stageExams ?? []), ...(b.stageExams ?? [])])).sort((x, y) => x - y);
  const ra = a.responseStats ?? { count: 0, totalMs: 0, helpFree: 0, totalConv: 0 };
  const rb = b.responseStats ?? { count: 0, totalMs: 0, helpFree: 0, totalConv: 0 };
  const responseStats = ra.totalConv >= rb.totalConv ? ra : rb;

  return {
    xp: Math.max(a.xp ?? 0, b.xp ?? 0),
    placedLevel: Math.max(a.placedLevel ?? 1, b.placedLevel ?? 1),
    units: mergeUnits(a.units, b.units),
    lessons,
    downloads,
    stageExams,
    responseStats,
  };
}

export function mergeUserStates(
  baseRaw: UserState | null | undefined,
  incomingRaw: UserState | null | undefined,
  baseTime = 0,
  incomingTime = Date.now(),
  fallbackName = "Aluno",
): UserState {
  const def = defaultState(fallbackName);
  if (!baseRaw && !incomingRaw) return def;
  if (!baseRaw) return reconcileUserXp({ ...def, ...incomingRaw });
  if (!incomingRaw) return reconcileUserXp({ ...def, ...baseRaw });

  const primary = incomingTime >= baseTime ? incomingRaw : baseRaw;
  const secondary = incomingTime >= baseTime ? baseRaw : incomingRaw;

  const progress = {} as Record<LangCode, LangProgress>;
  const srs = {} as Record<LangCode, Record<string, Card>>;
  const errors = { ...def.errors };

  for (const l of LANG_LIST) {
    progress[l] = mergeLangProgress(
      baseRaw.progress?.[l] ?? def.progress[l],
      incomingRaw.progress?.[l] ?? def.progress[l],
    );
    srs[l] = mergeCards(baseRaw.srs?.[l], incomingRaw.srs?.[l]);
    const errMap = { ...(secondary.errors?.[l] ?? {}) };
    for (const [cat, stat] of Object.entries(primary.errors?.[l] ?? {})) {
      const prev = errMap[cat];
      if (!prev || stat.count >= prev.count) errMap[cat] = stat;
    }
    errors[l] = errMap;
  }

  // Conversas: união por id (ordenadas por data decrescente, máx. 60)
  const convMap = new Map<string, UserState["conversations"][number]>();
  for (const c of [...(secondary.conversations ?? []), ...(primary.conversations ?? [])]) {
    if (c?.id) convMap.set(c.id, c);
  }
  const conversations = Array.from(convMap.values())
    .sort((x, y) => y.at - x.at)
    .slice(0, 60);

  // Eventos de XP: união sem duplicados entre dispositivos
  const xpEvents = mergeXpEvents(baseRaw.xpEvents ?? [], incomingRaw.xpEvents ?? []);

  // Dias de actividade: máximo por dia
  const days: UserState["days"] = { ...(secondary.days ?? {}) };
  for (const [d, st] of Object.entries(primary.days ?? {})) {
    const prev = days[d];
    days[d] = prev
      ? { activities: Math.max(prev.activities, st.activities), conversations: Math.max(prev.conversations, st.conversations) }
      : st;
  }

  const streak =
    (primary.streak?.count ?? 0) >= (secondary.streak?.count ?? 0)
      ? primary.streak
      : secondary.streak;

  const isLifetime = baseRaw.plan === "lifetime" || incomingRaw.plan === "lifetime";

  return reconcileUserXp({
    ...def,
    ...secondary,
    ...primary,
    plan: isLifetime ? "lifetime" : primary.plan,
    planExpires: isLifetime ? undefined : primary.planExpires,
    onboarded: Boolean(baseRaw.onboarded || incomingRaw.onboarded),
    settings: { ...def.settings, ...(secondary.settings ?? {}), ...(primary.settings ?? {}) },
    progress,
    srs,
    kana: mergeCards(baseRaw.kana, incomingRaw.kana),
    xpEvents,
    errors,
    conversations,
    days,
    streak: streak ?? def.streak,
  });
}

/* ---------------- Persistência Local-Cloud (data/cloud-db.json) ---------------- */

interface LocalCloudFile {
  accounts: Record<string, CloudAccountRow>;
}

let localCache: LocalCloudFile | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function readLocalCloud(): Promise<LocalCloudFile> {
  if (localCache) return localCache;
  try {
    const raw = await fs.readFile(LOCAL_DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as LocalCloudFile;
    if (parsed && typeof parsed.accounts === "object") {
      localCache = parsed;
      return parsed;
    }
  } catch {
    /* ficheiro ainda não existe */
  }
  localCache = { accounts: {} };
  return localCache;
}

async function writeLocalCloud(db: LocalCloudFile): Promise<void> {
  localCache = db;
  const run = writeQueue.then(async () => {
    try {
      await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
      const tmp = `${LOCAL_DB_PATH}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
      await fs.rename(tmp, LOCAL_DB_PATH);
    } catch (e) {
      console.warn("[cloud-db] aviso ao gravar em disco:", (e as Error).message);
    }
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

/* ---------------- Persistência Supabase (PostgREST) ---------------- */

async function sbFetch(queryPath: string, init?: RequestInit): Promise<Response> {
  const isOpaqueSecret = SUPABASE_KEY.startsWith("sb_secret_");
  return fetch(`${SUPABASE_URL}/rest/v1/${queryPath}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      ...(isOpaqueSecret ? {} : { Authorization: `Bearer ${SUPABASE_KEY}` }),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function normalizeRow(row: CloudAccountRow | undefined): CloudAccountRow | null {
  if (!row) return null;
  return {
    ...row,
    updated_at: Number(row.updated_at) || 0,
  };
}

// Conta do fundador criada em local-cloud antes da migração para o Supabase:
// migrada automaticamente na primeira consulta caso ainda não exista na tabela fl_accounts.
const FOUNDER_BOOTSTRAP: Record<string, CloudAccountRow> = {
  "sergio.eduardo.kuroko@gmail.com": {
    id: "xdfikngffxkmw18u8p6",
    email: "sergio.eduardo.kuroko@gmail.com",
    name: "Sergio",
    salt: "20c03d68eac39b362de89f3b2ba45ea8",
    password_hash: "71282020868dd5cf5836f64469134ef9354bd3986eca7d91a24c7f7b094c6f99",
    token_hash: "bee9b39c2d12f3032426a32e506c7eb1e6bbd196918f02ce68822b7113942888",
    state: {
      ...defaultState("Sergio"),
      onboarded: true,
      plan: "lifetime",
    },
    updated_at: 1793743982411,
    created_at: "2026-11-03T22:12:42.112Z",
  },
};

async function findByEmail(email: string): Promise<CloudAccountRow | null> {
  const e = email.trim().toLowerCase();
  if (cloudProvider() === "supabase") {
    const res = await sbFetch(`fl_accounts?email=eq.${encodeURIComponent(e)}&select=*&limit=1`);
    if (res.ok) {
      const rows = (await res.json()) as CloudAccountRow[];
      if (rows[0]) return normalizeRow(rows[0]);
      const seed = FOUNDER_BOOTSTRAP[e];
      if (seed) {
        await upsertAccount(seed);
        return normalizeRow(seed);
      }
      return null;
    }
  }
  const db = await readLocalCloud();
  return normalizeRow(db.accounts[e] ?? FOUNDER_BOOTSTRAP[e]);
}

async function findById(id: string): Promise<CloudAccountRow | null> {
  if (cloudProvider() === "supabase") {
    const res = await sbFetch(`fl_accounts?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (res.ok) {
      const rows = (await res.json()) as CloudAccountRow[];
      if (rows[0]) return normalizeRow(rows[0]);
      const seed = Object.values(FOUNDER_BOOTSTRAP).find((a) => a.id === id);
      if (seed) {
        await upsertAccount(seed);
        return normalizeRow(seed);
      }
      return null;
    }
  }
  const db = await readLocalCloud();
  return normalizeRow(Object.values(db.accounts).find((a) => a.id === id) ?? Object.values(FOUNDER_BOOTSTRAP).find((a) => a.id === id));
}

async function upsertAccount(row: CloudAccountRow): Promise<void> {
  const e = row.email.trim().toLowerCase();
  if (cloudProvider() === "supabase") {
    const res = await sbFetch("fl_accounts?on_conflict=email", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(row),
    });
    if (res.ok) return;
    const errText = await res.text().catch(() => "");
    console.warn("[cloud-db] fallback para local-cloud após erro Supabase:", res.status, errText);
  }
  const db = await readLocalCloud();
  db.accounts[e] = row;
  await writeLocalCloud(db);
}

async function removeAccount(row: CloudAccountRow): Promise<void> {
  const e = row.email.trim().toLowerCase();
  if (cloudProvider() === "supabase") {
    await sbFetch(`fl_accounts?id=eq.${encodeURIComponent(row.id)}`, { method: "DELETE" }).catch(() => undefined);
  }
  const db = await readLocalCloud();
  delete db.accounts[e];
  await writeLocalCloud(db);
}

/* ---------------- Operações Públicas de Autenticação e Sincronização ---------------- */

export async function registerOrSyncAccount(params: {
  id?: string;
  name: string;
  email: string;
  password: string;
  initialState?: UserState;
}): Promise<
  | { ok: true; user: { id: string; name: string; email: string }; token: string; state: UserState; updatedAt: number; provider: CloudProvider; isAdmin: boolean }
  | { ok: false; error: string; status: number }
> {
  const email = params.email.trim().toLowerCase();
  if (email === SYSTEM_META_EMAIL || email.endsWith(".internal")) {
    return { ok: false, error: "Email reservado pelo sistema.", status: 400 };
  }
  const admin = isAdminEmail(email);
  const name = params.name.trim();
  const existing = await findByEmail(email);

  if (existing) {
    // Se a conta já existe e a palavra-passe coincide, faz login + merge (útil para contas criadas offline)
    const candidateHash = hashPasswordServer(params.password, existing.salt);
    if (!safeEqualHex(candidateHash, existing.password_hash)) {
      return { ok: false, error: "Já existe uma conta na nuvem com este email.", status: 409 };
    }
    const { token, tokenHash } = issueSessionToken();
    const now = Date.now();
    const merged = mergeUserStates(existing.state, params.initialState, existing.updated_at, now, existing.name);
    if (admin) {
      merged.plan = "lifetime";
      merged.planExpires = undefined;
    } else {
      merged.plan = existing.state?.plan ?? "free";
      merged.planExpires = existing.state?.planExpires;
    }
    const updated: CloudAccountRow = {
      ...existing,
      token_hash: appendTokenHash(existing.token_hash, tokenHash),
      state: merged,
      updated_at: now,
    };
    await upsertAccount(updated);
    return {
      ok: true,
      user: { id: updated.id, name: updated.name, email: updated.email },
      token,
      state: merged,
      updatedAt: now,
      provider: cloudProvider(),
      isAdmin: admin,
    };
  }

  const id = params.id && /^[a-z0-9-]{8,64}$/i.test(params.id) ? params.id : randomUUID();
  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPasswordServer(params.password, salt);
  const { token, tokenHash } = issueSessionToken();
  const now = Date.now();
  const state = mergeUserStates(defaultState(name), params.initialState, 0, now, name);
  if (admin) {
    state.plan = "lifetime";
    state.planExpires = undefined;
  } else {
    state.plan = "free";
    state.planExpires = undefined;
  }

  const row: CloudAccountRow = {
    id,
    email,
    name,
    salt,
    password_hash: passwordHash,
    token_hash: tokenHash,
    state,
    updated_at: now,
    created_at: new Date(now).toISOString(),
  };

  await upsertAccount(row);
  return {
    ok: true,
    user: { id: row.id, name: row.name, email: row.email },
    token,
    state,
    updatedAt: now,
    provider: cloudProvider(),
    isAdmin: admin,
  };
}

export async function loginCloudAccount(params: {
  email: string;
  password: string;
  localState?: UserState;
  localUpdatedAt?: number;
}): Promise<
  | { ok: true; user: { id: string; name: string; email: string }; token: string; state: UserState; updatedAt: number; provider: CloudProvider; isAdmin: boolean }
  | { ok: false; error: string; status: number }
> {
  const email = params.email.trim().toLowerCase();
  if (email === SYSTEM_META_EMAIL || email.endsWith(".internal")) {
    return { ok: false, error: "Não encontrámos uma conta com este email.", status: 404 };
  }
  const row = await findByEmail(email);
  if (!row) {
    return { ok: false, error: "Não encontrámos uma conta com este email.", status: 404 };
  }
  const candidateHash = hashPasswordServer(params.password, row.salt);
  if (!safeEqualHex(candidateHash, row.password_hash)) {
    return { ok: false, error: "Palavra-passe incorrecta.", status: 401 };
  }

  const admin = isAdminEmail(email);
  const { token, tokenHash } = issueSessionToken();
  const now = Date.now();
  const merged = params.localState
    ? mergeUserStates(row.state, params.localState, row.updated_at, params.localUpdatedAt ?? now, row.name)
    : reconcileUserXp({ ...defaultState(row.name), ...row.state });
  if (admin) {
    merged.plan = "lifetime";
    merged.planExpires = undefined;
  } else {
    merged.plan = row.state?.plan ?? "free";
    merged.planExpires = row.state?.planExpires;
  }

  const updated: CloudAccountRow = {
    ...row,
    token_hash: appendTokenHash(row.token_hash, tokenHash),
    state: merged,
    updated_at: now,
  };
  await upsertAccount(updated);

  return {
    ok: true,
    user: { id: updated.id, name: updated.name, email: updated.email },
    token,
    state: merged,
    updatedAt: now,
    provider: cloudProvider(),
    isAdmin: admin,
  };
}

export async function authenticateToken(userId: string, bearerToken: string, email?: string): Promise<CloudAccountRow | null> {
  if ((!userId && !email) || !bearerToken) return null;
  const row = (userId ? await findById(userId) : null) ?? (email ? await findByEmail(email) : null);
  if (!row) return null;
  const candidate = sha256Hex(bearerToken);
  if (matchesTokenHash(row.token_hash, candidate)) return row;
  // Adopta sessão criada no aparelho antes da migração para o Supabase
  if (/^[a-f0-9]{32,128}$/i.test(bearerToken) && (row.id === userId || (email && row.email === email.trim().toLowerCase()))) {
    row.token_hash = appendTokenHash(row.token_hash, candidate);
    return row;
  }
  return null;
}

export async function syncCloudState(params: {
  userId: string;
  email?: string;
  token: string;
  clientState: UserState;
  clientUpdatedAt: number;
  forceReplace?: boolean;
}): Promise<
  | { ok: true; state: UserState; updatedAt: number; provider: CloudProvider; isAdmin: boolean }
  | { ok: false; error: string; status: number }
> {
  const row = await authenticateToken(params.userId, params.token, params.email);
  if (!row || row.id === SYSTEM_META_ID) {
    return { ok: false, error: "Sessão na nuvem inválida ou expirada.", status: 401 };
  }
  const now = Date.now();
  const nextState = params.forceReplace
    ? reconcileUserXp({ ...defaultState(row.name), ...params.clientState })
    : mergeUserStates(row.state, params.clientState, row.updated_at, params.clientUpdatedAt || now, row.name);
  const admin = isAdminEmail(row.email);
  if (admin) {
    nextState.plan = "lifetime";
    nextState.planExpires = undefined;
  } else {
    // Impede adulteração local do plano: apenas códigos de passe ou o painel /admin alteram o plano no servidor
    nextState.plan = row.state?.plan ?? "free";
    nextState.planExpires = row.state?.planExpires;
  }

  const updated: CloudAccountRow = {
    ...row,
    name: nextState.name || row.name,
    state: nextState,
    updated_at: now,
  };
  await upsertAccount(updated);
  return {
    ok: true,
    state: nextState,
    updatedAt: now,
    provider: cloudProvider(),
    isAdmin: admin,
  };
}

export async function deleteCloudAccount(userId: string, token: string): Promise<boolean> {
  const row = await authenticateToken(userId, token);
  if (!row || row.id === SYSTEM_META_ID) return false;
  await removeAccount(row);
  return true;
}

/* ---------------- Metadados do Sistema (Passes + Recuperação de Palavra-passe) ---------------- */

async function readSystemMeta(): Promise<SystemMetaPayload> {
  const row = await findById(SYSTEM_META_ID);
  const raw = (row?.state ?? {}) as unknown as Partial<SystemMetaPayload>;
  return {
    passCodes: raw.passCodes && typeof raw.passCodes === "object" ? raw.passCodes : {},
    resetRequests: raw.resetRequests && typeof raw.resetRequests === "object" ? raw.resetRequests : {},
  };
}

async function writeSystemMeta(meta: SystemMetaPayload): Promise<void> {
  const now = Date.now();
  const row: CloudAccountRow = {
    id: SYSTEM_META_ID,
    email: SYSTEM_META_EMAIL,
    name: "Sistema FiguraLinguística",
    salt: "system",
    password_hash: "locked",
    token_hash: "",
    state: meta as unknown as UserState,
    updated_at: now,
    created_at: new Date(now).toISOString(),
  };
  await upsertAccount(row);
}

/* ---------------- Recuperação e Alteração de Palavra-passe ---------------- */

export async function changeAccountPassword(params: {
  userId: string;
  email?: string;
  token: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true; token: string } | { ok: false; error: string; status: number }> {
  if (params.newPassword.length < 6) {
    return { ok: false, error: "A nova palavra-passe deve ter pelo menos 6 caracteres.", status: 400 };
  }
  const row = await authenticateToken(params.userId, params.token, params.email);
  if (!row || row.id === SYSTEM_META_ID) {
    return { ok: false, error: "Sessão inválida. Entra novamente.", status: 401 };
  }
  const curHash = hashPasswordServer(params.currentPassword, row.salt);
  if (!safeEqualHex(curHash, row.password_hash)) {
    return { ok: false, error: "A palavra-passe actual está incorrecta.", status: 401 };
  }
  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPasswordServer(params.newPassword, salt);
  const { token, tokenHash } = issueSessionToken();
  await upsertAccount({
    ...row,
    salt,
    password_hash: passwordHash,
    token_hash: tokenHash,
    updated_at: Date.now(),
  });
  return { ok: true, token };
}

async function sendResetEmailIfConfigured(toEmail: string, name: string, code: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) return false;
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "FiguraLinguística <onboarding@resend.dev>";
  const domain = (process.env.NEXT_PUBLIC_APP_DOMAIN || "figura-linguistica.vercel.app").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const textBody = `Olá ${name},\n\nO teu código de recuperação da FiguraLinguística é: ${code}\n(válido durante 15 minutos).\n\nSe não pediste este código, podes ignorar esta mensagem.\n\n@${domain} #${code}`;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [toEmail],
        subject: `${code} é o teu código de recuperação — FiguraLinguística`,
        text: textBody,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function requestPasswordReset(emailRaw: string): Promise<
  | { ok: true; delivery: "email" | "support" }
  | { ok: false; error: string; status: number }
> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || email === SYSTEM_META_EMAIL || email.endsWith(".internal")) {
    return { ok: false, error: "Não encontrámos uma conta com este email.", status: 404 };
  }
  const row = await findByEmail(email);
  if (!row) {
    return { ok: false, error: "Não encontrámos uma conta com este email.", status: 404 };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = Date.now();
  const meta = await readSystemMeta();
  // Limpa códigos expirados
  for (const [k, v] of Object.entries(meta.resetRequests)) {
    if (v.expiresAt < now) delete meta.resetRequests[k];
  }
  meta.resetRequests[email] = {
    email,
    codeHash: sha256Hex(code),
    adminCode: code,
    expiresAt: now + 15 * 60_000,
    attempts: 0,
    requestedAt: now,
  };
  await writeSystemMeta(meta);
  const sent = await sendResetEmailIfConfigured(email, row.name, code);
  return { ok: true, delivery: sent ? "email" : "support" };
}

export async function confirmPasswordReset(params: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<
  | { ok: true; user: { id: string; name: string; email: string }; token: string; state: UserState; updatedAt: number; provider: CloudProvider; isAdmin: boolean }
  | { ok: false; error: string; status: number }
> {
  const email = params.email.trim().toLowerCase();
  const code = params.code.trim();
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: "O código deve ter exactamente 6 dígitos.", status: 400 };
  }
  if (params.newPassword.length < 6) {
    return { ok: false, error: "A nova palavra-passe deve ter pelo menos 6 caracteres.", status: 400 };
  }
  const row = await findByEmail(email);
  if (!row || row.id === SYSTEM_META_ID) {
    return { ok: false, error: "Conta não encontrada.", status: 404 };
  }
  const meta = await readSystemMeta();
  const reqRec = meta.resetRequests[email];
  const now = Date.now();
  if (!reqRec || reqRec.expiresAt < now) {
    delete meta.resetRequests[email];
    await writeSystemMeta(meta);
    return { ok: false, error: "Código expirado ou inexistente. Pede um novo código.", status: 400 };
  }
  if (reqRec.attempts >= 5) {
    delete meta.resetRequests[email];
    await writeSystemMeta(meta);
    return { ok: false, error: "Demasiadas tentativas incorrectas. Pede um novo código.", status: 429 };
  }
  const candidate = sha256Hex(code);
  if (!safeEqualHex(candidate, reqRec.codeHash)) {
    reqRec.attempts += 1;
    meta.resetRequests[email] = reqRec;
    await writeSystemMeta(meta);
    return { ok: false, error: "Código de 6 dígitos incorrecto.", status: 401 };
  }

  delete meta.resetRequests[email];
  await writeSystemMeta(meta);

  const admin = isAdminEmail(email);
  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPasswordServer(params.newPassword, salt);
  const { token, tokenHash } = issueSessionToken();
  const state = reconcileUserXp({ ...defaultState(row.name), ...row.state });
  if (admin) {
    state.plan = "lifetime";
    state.planExpires = undefined;
  }
  const updated: CloudAccountRow = {
    ...row,
    salt,
    password_hash: passwordHash,
    token_hash: tokenHash,
    state,
    updated_at: now,
  };
  await upsertAccount(updated);
  return {
    ok: true,
    user: { id: updated.id, name: updated.name, email: updated.email },
    token,
    state,
    updatedAt: now,
    provider: cloudProvider(),
    isAdmin: admin,
  };
}

/* ---------------- Códigos de Passe / Subscrição ---------------- */

export async function redeemPassCode(params: {
  userId: string;
  email?: string;
  token: string;
  code: string;
}): Promise<
  | { ok: true; plan: Plan; planExpires?: number; state: UserState; updatedAt: number }
  | { ok: false; error: string; status: number }
> {
  const row = await authenticateToken(params.userId, params.token, params.email);
  if (!row || row.id === SYSTEM_META_ID) {
    return { ok: false, error: "Sessão inválida. Entra novamente na tua conta.", status: 401 };
  }
  const clean = params.code.trim().toUpperCase();
  if (clean.length < 4) {
    return { ok: false, error: "Indica um código de activação válido.", status: 400 };
  }
  const meta = await readSystemMeta();
  const pass = meta.passCodes[clean];
  if (!pass) {
    return { ok: false, error: "Código não reconhecido. Verifica as letras e os números.", status: 404 };
  }
  if (pass.usedBy.some((u) => u.email === row.email)) {
    return { ok: false, error: "Já activaste este código na tua conta.", status: 409 };
  }
  if (pass.usedBy.length >= pass.maxUses) {
    return { ok: false, error: "Este código já atingiu o limite máximo de utilizações.", status: 410 };
  }

  const now = Date.now();
  const baseStart = row.state?.planExpires && row.state.planExpires > now ? row.state.planExpires : now;
  const planExpires = pass.days ? baseStart + pass.days * 86_400_000 : undefined;
  const nextState: UserState = reconcileUserXp({
    ...defaultState(row.name),
    ...row.state,
    plan: pass.plan,
    planExpires,
  });

  pass.usedBy.push({ email: row.email, name: row.name, at: now });
  meta.passCodes[clean] = pass;
  await writeSystemMeta(meta);
  await upsertAccount({
    ...row,
    state: nextState,
    updated_at: now,
  });

  return {
    ok: true,
    plan: pass.plan,
    planExpires,
    state: nextState,
    updatedAt: now,
  };
}

/* ---------------- Painel do Fundador (/admin) ---------------- */

export async function authenticateAdmin(userId: string, token: string, email?: string): Promise<CloudAccountRow | null> {
  const row = await authenticateToken(userId, token, email);
  if (!row || row.id === SYSTEM_META_ID) return null;
  return isAdminEmail(row.email) ? row : null;
}

async function listAllAccounts(): Promise<CloudAccountRow[]> {
  if (cloudProvider() === "supabase") {
    const res = await sbFetch("fl_accounts?select=*&order=updated_at.desc&limit=500");
    if (res.ok) {
      const rows = (await res.json()) as CloudAccountRow[];
      return rows
        .map((r) => normalizeRow(r))
        .filter((r): r is CloudAccountRow => Boolean(r && r.id !== SYSTEM_META_ID && r.email !== SYSTEM_META_EMAIL));
    }
  }
  const db = await readLocalCloud();
  return Object.values(db.accounts)
    .map((r) => normalizeRow(r))
    .filter((r): r is CloudAccountRow => Boolean(r && r.id !== SYSTEM_META_ID && r.email !== SYSTEM_META_EMAIL))
    .sort((a, b) => b.updated_at - a.updated_at);
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  planExpires?: number;
  premiumActive: boolean;
  activeLang: LangCode;
  level: number;
  xpEn: number;
  xpFr: number;
  xpJa: number;
  totalXp: number;
  conversations: number;
  streak: number;
  updatedAt: number;
  createdAt: string;
}

export async function getAdminOverview() {
  const [rows, meta] = await Promise.all([listAllAccounts(), readSystemMeta()]);
  const now = Date.now();
  const dayAgo = now - 86_400_000;
  const weekAgo = now - 7 * 86_400_000;

  let active24h = 0;
  let active7d = 0;
  let premiumCount = 0;
  let totalXpAll = 0;
  let totalConvsAll = 0;
  const reports: { userEmail: string; ref: string; text: string; reason: string; at: number }[] = [];

  const users: AdminUserSummary[] = rows.map((r) => {
    const st = reconcileUserXp({ ...defaultState(r.name), ...(r.state ?? {}) });
    const xpEn = st.progress?.en?.xp ?? 0;
    const xpFr = st.progress?.fr?.xp ?? 0;
    const xpJa = st.progress?.ja?.xp ?? 0;
    const totalXp = xpEn + xpFr + xpJa;
    const convs = st.conversations?.length ?? 0;
    const prem = isPremium(st, now);

    if (r.updated_at >= dayAgo) active24h++;
    if (r.updated_at >= weekAgo) active7d++;
    if (prem) premiumCount++;
    totalXpAll += totalXp;
    totalConvsAll += convs;

    for (const rep of st.reports ?? []) {
      reports.push({
        userEmail: r.email,
        ref: rep.ref,
        text: rep.text,
        reason: rep.reason,
        at: rep.at,
      });
    }

    const activeLang = st.activeLang ?? "en";
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      plan: st.plan ?? "free",
      planExpires: st.planExpires,
      premiumActive: prem,
      activeLang,
      level: currentLevel(st, activeLang),
      xpEn,
      xpFr,
      xpJa,
      totalXp,
      conversations: convs,
      streak: st.streak?.count ?? 0,
      updatedAt: r.updated_at,
      createdAt: r.created_at,
    };
  });

  const activeResets = Object.values(meta.resetRequests)
    .filter((x) => x.expiresAt > now)
    .sort((a, b) => b.requestedAt - a.requestedAt);

  const passCodes = Object.values(meta.passCodes).sort((a, b) => b.createdAt - a.createdAt);

  return {
    provider: cloudProvider(),
    stats: {
      totalUsers: users.length,
      active24h,
      active7d,
      premiumCount,
      totalXpAll,
      totalConvsAll,
    },
    users,
    passCodes,
    resetRequests: activeResets,
    reports: reports.sort((a, b) => b.at - a.at).slice(0, 40),
  };
}

export async function adminCreatePassCode(params: {
  plan: Plan;
  days: number | null;
  maxUses: number;
  note?: string;
  customCode?: string;
}): Promise<PassCodeRecord> {
  const meta = await readSystemMeta();
  const prefix =
    params.plan === "pass-week"
      ? "SEMANA"
      : params.plan === "pass-month"
        ? "MES"
        : params.plan === "lifetime"
          ? "VITAL"
          : params.plan === "school"
            ? "ESCOLA"
            : "PREMIUM";
  const rand = randomBytes(3).toString("hex").toUpperCase();
  const code = (params.customCode?.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "") || `FL-${prefix}-${rand}`).slice(0, 28);
  const rec: PassCodeRecord = {
    code,
    plan: params.plan,
    days: params.days,
    maxUses: Math.max(1, Math.min(500, Math.round(params.maxUses || 1))),
    usedBy: [],
    note: params.note?.trim().slice(0, 80) || undefined,
    createdAt: Date.now(),
  };
  meta.passCodes[code] = rec;
  await writeSystemMeta(meta);
  return rec;
}

export async function adminDeletePassCode(code: string): Promise<void> {
  const meta = await readSystemMeta();
  delete meta.passCodes[code.trim().toUpperCase()];
  await writeSystemMeta(meta);
}

export async function adminSetUserPlan(params: {
  targetEmail: string;
  plan: Plan;
  days: number | null;
}): Promise<boolean> {
  const row = await findByEmail(params.targetEmail);
  if (!row || row.id === SYSTEM_META_ID) return false;
  const now = Date.now();
  const planExpires = params.days ? now + params.days * 86_400_000 : undefined;
  const nextState: UserState = reconcileUserXp({
    ...defaultState(row.name),
    ...row.state,
    plan: params.plan,
    planExpires,
  });
  await upsertAccount({
    ...row,
    state: nextState,
    updated_at: now,
  });
  return true;
}

export async function adminGenerateResetForUser(targetEmail: string): Promise<string | null> {
  const e = targetEmail.trim().toLowerCase();
  const row = await findByEmail(e);
  if (!row || row.id === SYSTEM_META_ID) return null;
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = Date.now();
  const meta = await readSystemMeta();
  meta.resetRequests[e] = {
    email: e,
    codeHash: sha256Hex(code),
    adminCode: code,
    expiresAt: now + 30 * 60_000,
    attempts: 0,
    requestedAt: now,
  };
  await writeSystemMeta(meta);
  return code;
}

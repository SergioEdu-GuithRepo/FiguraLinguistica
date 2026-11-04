import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { Card } from "@/lib/fsrs";
import { LANG_LIST } from "@/lib/langs";
import { defaultState, type LangProgress, type StepId, type UnitProgress, type UserState } from "@/lib/state";
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
const ADMIN_EMAILS_RAW = (process.env.ADMIN_EMAILS ?? "*").trim();

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
  if (!baseRaw) return { ...def, ...incomingRaw };
  if (!incomingRaw) return { ...def, ...baseRaw };

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

  return {
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
    errors,
    conversations,
    days,
    streak: streak ?? def.streak,
  };
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

async function findByEmail(email: string): Promise<CloudAccountRow | null> {
  const e = email.trim().toLowerCase();
  if (cloudProvider() === "supabase") {
    const res = await sbFetch(`fl_accounts?email=eq.${encodeURIComponent(e)}&select=*&limit=1`);
    if (res.ok) {
      const rows = (await res.json()) as CloudAccountRow[];
      return normalizeRow(rows[0]);
    }
  }
  const db = await readLocalCloud();
  return normalizeRow(db.accounts[e]);
}

async function findById(id: string): Promise<CloudAccountRow | null> {
  if (cloudProvider() === "supabase") {
    const res = await sbFetch(`fl_accounts?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (res.ok) {
      const rows = (await res.json()) as CloudAccountRow[];
      return normalizeRow(rows[0]);
    }
  }
  const db = await readLocalCloud();
  return normalizeRow(Object.values(db.accounts).find((a) => a.id === id));
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
  | { ok: true; user: { id: string; name: string; email: string }; token: string; state: UserState; updatedAt: number; provider: CloudProvider }
  | { ok: false; error: string; status: number }
> {
  const email = params.email.trim().toLowerCase();
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
    if (isAdminEmail(email)) {
      merged.plan = "lifetime";
      merged.planExpires = undefined;
    }
    const updated: CloudAccountRow = {
      ...existing,
      token_hash: tokenHash,
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
    };
  }

  const id = params.id && /^[a-z0-9-]{8,64}$/i.test(params.id) ? params.id : randomUUID();
  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPasswordServer(params.password, salt);
  const { token, tokenHash } = issueSessionToken();
  const now = Date.now();
  const state = mergeUserStates(defaultState(name), params.initialState, 0, now, name);
  if (isAdminEmail(email)) {
    state.plan = "lifetime";
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
  };
}

export async function loginCloudAccount(params: {
  email: string;
  password: string;
  localState?: UserState;
  localUpdatedAt?: number;
}): Promise<
  | { ok: true; user: { id: string; name: string; email: string }; token: string; state: UserState; updatedAt: number; provider: CloudProvider }
  | { ok: false; error: string; status: number }
> {
  const email = params.email.trim().toLowerCase();
  const row = await findByEmail(email);
  if (!row) {
    return { ok: false, error: "Não encontrámos uma conta com este email.", status: 404 };
  }
  const candidateHash = hashPasswordServer(params.password, row.salt);
  if (!safeEqualHex(candidateHash, row.password_hash)) {
    return { ok: false, error: "Palavra-passe incorrecta.", status: 401 };
  }

  const { token, tokenHash } = issueSessionToken();
  const now = Date.now();
  const merged = params.localState
    ? mergeUserStates(row.state, params.localState, row.updated_at, params.localUpdatedAt ?? now, row.name)
    : row.state;
  if (isAdminEmail(email)) {
    merged.plan = "lifetime";
    merged.planExpires = undefined;
  }

  const updated: CloudAccountRow = {
    ...row,
    token_hash: tokenHash,
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
  };
}

export async function authenticateToken(userId: string, bearerToken: string): Promise<CloudAccountRow | null> {
  if (!userId || !bearerToken) return null;
  const row = await findById(userId);
  if (!row) return null;
  const candidate = sha256Hex(bearerToken);
  if (!safeEqualHex(candidate, row.token_hash)) return null;
  return row;
}

export async function syncCloudState(params: {
  userId: string;
  token: string;
  clientState: UserState;
  clientUpdatedAt: number;
  forceReplace?: boolean;
}): Promise<
  | { ok: true; state: UserState; updatedAt: number; provider: CloudProvider }
  | { ok: false; error: string; status: number }
> {
  const row = await authenticateToken(params.userId, params.token);
  if (!row) {
    return { ok: false, error: "Sessão na nuvem inválida ou expirada.", status: 401 };
  }
  const now = Date.now();
  const nextState = params.forceReplace
    ? { ...defaultState(row.name), ...params.clientState }
    : mergeUserStates(row.state, params.clientState, row.updated_at, params.clientUpdatedAt || now, row.name);
  if (isAdminEmail(row.email)) {
    nextState.plan = "lifetime";
    nextState.planExpires = undefined;
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
  };
}

export async function deleteCloudAccount(userId: string, token: string): Promise<boolean> {
  const row = await authenticateToken(userId, token);
  if (!row) return false;
  await removeAccount(row);
  return true;
}

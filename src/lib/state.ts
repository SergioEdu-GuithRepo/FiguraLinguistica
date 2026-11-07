import type { Card, Rating } from "./fsrs";
import { review, isStrong } from "./fsrs";
import type { LangCode } from "./types";
import { CONTENT } from "@/content";
import { TOTAL_LEVELS, STAGES } from "./langs";

export type StepId = "ouvir" | "moldes" | "vocabulario" | "montar" | "falar" | "conversa";
export const STEPS: { id: StepId; title: string; desc: string; icon: string }[] = [
  { id: "ouvir", title: "Ouvir e tocar", desc: "Diálogo com texto interactivo", icon: "headphones" },
  { id: "moldes", title: "Molde vivo", desc: "Troca a palavra e cria frases", icon: "puzzle" },
  { id: "vocabulario", title: "Vocabulário-chave", desc: "Palavras da cena", icon: "cards" },
  { id: "montar", title: "Montar a frase", desc: "Ordena os blocos", icon: "blocks" },
  { id: "falar", title: "Dizer em voz alta", desc: "Repete e recebe nota", icon: "mic" },
  { id: "conversa", title: "Conversa final", desc: "Fala com o tutor na cena", icon: "chat" },
];

export type Plan = "free" | "premium" | "lifetime" | "pass-week" | "pass-month" | "school";
export type ConversationMode = "guiado" | "livre" | "desafio";

export interface Settings {
  dailyGoalMin: 5 | 10 | 15;
  supportLang: "pt";
  voices: Partial<Record<LangCode, string>>;
  /** "neural" = vozes neurais HD Azure (por defeito); "device" = voz do aparelho (Web Speech API) */
  voiceEngine: "neural" | "device";
  neuralVoices: Partial<Record<LangCode, string>>;
  audioRate: number;
  romaji: boolean;
  furigana: boolean;
  /** Esconder a furigana nos kanji que o aluno já domina (módulo de kanji) */
  furiganaAuto: boolean;
  notifications: boolean;
  tutorVoice: boolean;
  voiceConsent: boolean | null;
  interests: string[];
  /** Tema visual: claro, escuro ou automático conforme o sistema */
  theme?: "light" | "dark" | "system";
  /** Modo leve (poupar dados móveis: evita pré-carregamentos pesados) */
  dataSaver?: boolean;
  /** Modo desenvolvedor: desbloquear todas as 45 unidades sem exigir conclusão sequencial */
  unlockAllLevels?: boolean;
}

export interface UnitProgress {
  steps: Partial<Record<StepId, number>>; // timestamp de conclusão
  completedAt?: number;
}

export interface ResponseStats {
  count: number;
  totalMs: number;
  helpFree: number;
  totalConv: number;
}

export interface LangProgress {
  xp: number;
  units: Record<string, UnitProgress>;
  /** nível inicial (teste de colocação) */
  placedLevel: number;
  lessons: Record<string, number>; // progresso 0..1 de cada lição
  downloads: string[];
  /** etapas (1..5) cujo exame de etapa foi aprovado */
  stageExams?: number[];
  /** métricas de fluência (velocidade de resposta e autonomia sem ajuda) */
  responseStats?: ResponseStats;
}

export interface XpEvent {
  lang: LangCode;
  type: string;
  value: number;
  at: number;
}

export interface ErrorStat {
  count: number;
  example: string;
  last: number;
}

export interface ConversationLog {
  id: string;
  lang: LangCode;
  unitId: string;
  mode: ConversationMode;
  at: number;
  summary: { good: string; takeaways: { text: string; pt: string }[]; improve: string };
  messages: { author: "tutor" | "user"; text: string }[];
  usedHelp: boolean;
  avgResponseMs?: number;
}

export interface Report {
  id: string;
  ref: string;
  text: string;
  reason: string;
  at: number;
}

export interface DayStats {
  activities: number;
  conversations: number;
}

export interface AppNotification {
  id: string;
  text: string;
  at: number;
  read: boolean;
  href?: string;
}

export interface UserState {
  version: 1;
  name: string;
  onboarded: boolean;
  activeLang: LangCode;
  plan: Plan;
  planExpires?: number;
  settings: Settings;
  progress: Record<LangCode, LangProgress>;
  /** Cartões de repetição espaçada: chave "w:<palavra>" ou "p:<idMolde>" */
  srs: Record<LangCode, Record<string, Card>>;
  kana: Record<string, Card>;
  xpEvents: XpEvent[];
  errors: Record<LangCode, Record<string, ErrorStat>>;
  conversations: ConversationLog[];
  reports: Report[];
  days: Record<string, DayStats>;
  streak: { count: number; lastDay: string | null; freezeWeek: string | null };
  notifications: AppNotification[];
}

const emptyLang = (): LangProgress => ({
  xp: 0,
  units: {},
  placedLevel: 1,
  lessons: {},
  downloads: [],
  stageExams: [],
  responseStats: { count: 0, totalMs: 0, helpFree: 0, totalConv: 0 },
});

export function defaultState(name: string): UserState {
  return {
    version: 1,
    name,
    onboarded: false,
    activeLang: "en",
    plan: "free",
    settings: {
      dailyGoalMin: 10,
      supportLang: "pt",
      voices: {},
      voiceEngine: "neural",
      neuralVoices: {},
      audioRate: 1,
      romaji: true,
      furigana: true,
      furiganaAuto: false,
      notifications: false,
      tutorVoice: true,
      voiceConsent: null,
      interests: [],
      theme: "light",
      dataSaver: false,
    },
    progress: { en: emptyLang(), fr: emptyLang(), ja: emptyLang() },
    srs: { en: {}, fr: {}, ja: {} },
    kana: {},
    xpEvents: [],
    errors: { en: {}, fr: {}, ja: {} },
    conversations: [],
    reports: [],
    days: {},
    streak: { count: 0, lastDay: null, freezeWeek: null },
    notifications: [],
  };
}

/* ---------- datas ---------- */

export function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function weekKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${week}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export function lastNDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

/* ---------- planos ---------- */

export function isPremium(s: UserState, now = Date.now()): boolean {
  if (s.plan === "lifetime") return true;
  if (s.plan === "premium" || s.plan === "school") return !s.planExpires || s.planExpires > now;
  if (s.plan === "pass-week" || s.plan === "pass-month") return (s.planExpires ?? 0) > now;
  return false;
}

export const FREE_CONVERSATIONS_PER_DAY = 5;

export function conversationsLeft(s: UserState): number {
  if (isPremium(s)) return Infinity;
  return Math.max(0, FREE_CONVERSATIONS_PER_DAY - (s.days[dayKey()]?.conversations ?? 0));
}

/* ---------- objectivo diário ---------- */

export function dailyGoalActivities(min: number): number {
  return min <= 5 ? 2 : min <= 10 ? 3 : 5;
}

export function todayProgress(s: UserState): { done: number; goal: number; pct: number } {
  const goal = dailyGoalActivities(s.settings.dailyGoalMin);
  const done = s.days[dayKey()]?.activities ?? 0;
  return { done, goal, pct: Math.min(100, Math.round((done / goal) * 100)) };
}

/* ---------- mutações puras (devolvem novo estado) ---------- */

function touchStreak(s: UserState): UserState["streak"] {
  const today = dayKey();
  const st = { ...s.streak };
  if (st.lastDay === today) return st;
  if (!st.lastDay) return { count: 1, lastDay: today, freezeWeek: st.freezeWeek };
  const gap = daysBetween(st.lastDay, today);
  if (gap === 1) return { ...st, count: st.count + 1, lastDay: today };
  // "congelamento" semanal: uma falta por semana não quebra a sequência
  if (gap === 2 && st.freezeWeek !== weekKey()) return { count: st.count + 1, lastDay: today, freezeWeek: weekKey() };
  return { count: 1, lastDay: today, freezeWeek: st.freezeWeek };
}

/** Sequência actual (considerando se já expirou). */
export function currentStreak(s: UserState): number {
  if (!s.streak.lastDay) return 0;
  const gap = daysBetween(s.streak.lastDay, dayKey());
  if (gap <= 1) return s.streak.count;
  if (gap === 2 && s.streak.freezeWeek !== weekKey()) return s.streak.count;
  return 0;
}

export function addActivity(
  s: UserState,
  lang: LangCode,
  type: string,
  xp: number,
  opts: { conversation?: boolean } = {},
): UserState {
  const today = dayKey();
  const day = s.days[today] ?? { activities: 0, conversations: 0 };
  const beforeGoal = todayProgress(s);
  const next: UserState = {
    ...s,
    days: {
      ...s.days,
      [today]: { activities: day.activities + 1, conversations: day.conversations + (opts.conversation ? 1 : 0) },
    },
    xpEvents: [...s.xpEvents, { lang, type, value: xp, at: Date.now() }].slice(-2000),
    progress: { ...s.progress, [lang]: { ...s.progress[lang], xp: s.progress[lang].xp + xp } },
    streak: touchStreak(s),
  };
  const afterGoal = todayProgress(next);
  if (beforeGoal.pct < 100 && afterGoal.pct >= 100) {
    next.notifications = pushNotif(next.notifications, "🎯 Tarefa diária cumprida! Volta amanhã para manter a sequência.");
  }
  return next;
}

export function pushNotif(list: AppNotification[], text: string, href?: string): AppNotification[] {
  return [{ id: Math.random().toString(36).slice(2), text, at: Date.now(), read: false, href }, ...list].slice(0, 30);
}

export function completeStep(s: UserState, unitId: string, step: StepId, xp: number): UserState {
  const lang = unitId.split("-")[0] as LangCode;
  const lp = s.progress[lang];
  const up: UnitProgress = lp.units[unitId] ?? { steps: {} };
  const firstTime = !up.steps[step];
  const steps = { ...up.steps, [step]: up.steps[step] ?? Date.now() };
  const allDone = STEPS.every((st) => steps[st.id]);
  const justCompleted = allDone && !up.completedAt;
  let next: UserState = {
    ...s,
    progress: {
      ...s.progress,
      [lang]: {
        ...lp,
        units: { ...lp.units, [unitId]: { steps, completedAt: up.completedAt ?? (allDone ? Date.now() : undefined) } },
      },
    },
  };
  next = addActivity(next, lang, `step:${step}`, firstTime ? xp : Math.round(xp / 2));
  if (justCompleted) {
    next = addActivity(next, lang, "unit-complete", 25);
    const unit = CONTENT[lang].units.find((u) => u.id === unitId);
    if (unit) {
      next.notifications = pushNotif(
        next.notifications,
        `🏅 Unidade concluída: ${unit.title}. Nível ${unit.level + 1} desbloqueado!`,
        "/cursos",
      );
    }
  }
  return next;
}

export function rateItem(s: UserState, lang: LangCode, key: string, rating: Rating): UserState {
  const card = review(s.srs[lang][key], rating);
  return { ...s, srs: { ...s.srs, [lang]: { ...s.srs[lang], [key]: card } } };
}

export function recordError(s: UserState, lang: LangCode, category: string, example: string): UserState {
  const cur = s.errors[lang][category];
  return {
    ...s,
    errors: {
      ...s.errors,
      [lang]: { ...s.errors[lang], [category]: { count: (cur?.count ?? 0) + 1, example, last: Date.now() } },
    },
  };
}

export function recordResponseMetric(s: UserState, lang: LangCode, avgMs: number, usedHelp: boolean): UserState {
  const lp = s.progress[lang];
  const prev = lp.responseStats ?? { count: 0, totalMs: 0, helpFree: 0, totalConv: 0 };
  const clampedMs = Math.max(500, Math.min(60_000, Math.round(avgMs || 5000)));
  return {
    ...s,
    progress: {
      ...s.progress,
      [lang]: {
        ...lp,
        responseStats: {
          count: prev.count + 1,
          totalMs: prev.totalMs + clampedMs,
          helpFree: prev.helpFree + (usedHelp ? 0 : 1),
          totalConv: prev.totalConv + 1,
        },
      },
    },
  };
}

export function passStageExam(s: UserState, lang: LangCode, stageIdx: number): UserState {
  const lp = s.progress[lang];
  const prevExams = lp.stageExams ?? [];
  const nextExams = prevExams.includes(stageIdx) ? prevExams : [...prevExams, stageIdx];
  const stage = STAGES[stageIdx - 1];
  const nextPlaced = stage ? Math.min(TOTAL_LEVELS, Math.max(lp.placedLevel, stage.to + 1)) : lp.placedLevel;
  let next: UserState = {
    ...s,
    progress: {
      ...s.progress,
      [lang]: {
        ...lp,
        stageExams: nextExams,
        placedLevel: nextPlaced,
      },
    },
  };
  next = addActivity(next, lang, `stage-exam:${stageIdx}`, 50);
  if (stage && !prevExams.includes(stageIdx)) {
    next.notifications = pushNotif(
      next.notifications,
      `🎓 Etapa «${stage.name}» certificada! Certificado disponível em Marcos.`,
      "/marcos",
    );
  }
  return next;
}

/* ---------- derivados ---------- */

export function unitDone(s: UserState, unitId: string): boolean {
  const lang = unitId.split("-")[0] as LangCode;
  return !!s.progress[lang].units[unitId]?.completedAt;
}

export function unitProgressPct(s: UserState, unitId: string): number {
  const lang = unitId.split("-")[0] as LangCode;
  const up = s.progress[lang].units[unitId];
  if (!up) return 0;
  return Math.round((STEPS.filter((st) => up.steps[st.id]).length / STEPS.length) * 100);
}

/** Nível actual (1..45): unidades concluídas seguidas + 1, no mínimo o nível de colocação. */
export function currentLevel(s: UserState, lang: LangCode): number {
  const units = CONTENT[lang].units;
  let lvl = 1;
  for (const u of units) {
    if (unitDone(s, u.id) || u.level < s.progress[lang].placedLevel) lvl = u.level + 1;
    else break;
  }
  return Math.min(TOTAL_LEVELS, Math.max(lvl, s.progress[lang].placedLevel));
}

export function isUnitUnlocked(s: UserState, unitId: string): boolean {
  if (s.settings?.unlockAllLevels) return true;
  const lang = unitId.split("-")[0] as LangCode;
  const unit = CONTENT[lang].units.find((u) => u.id === unitId);
  if (!unit) return false;
  return unit.level <= currentLevel(s, lang);
}

/** Próxima unidade a estudar (primeira desbloqueada não concluída). */
export function nextUnitId(s: UserState, lang: LangCode): string | null {
  const units = CONTENT[lang].units;
  const u = units.find((x) => isUnitUnlocked(s, x.id) && !unitDone(s, x.id));
  return u?.id ?? units[units.length - 1]?.id ?? null;
}

export function xpLastDays(s: UserState, lang: LangCode, n = 7): { day: string; xp: number }[] {
  const days = lastNDays(n);
  const map = new Map(days.map((d) => [d, 0]));
  for (const e of s.xpEvents) {
    if (e.lang !== lang) continue;
    const k = dayKey(new Date(e.at));
    if (map.has(k)) map.set(k, (map.get(k) ?? 0) + e.value);
  }
  return days.map((d) => ({ day: d, xp: map.get(d) ?? 0 }));
}

export const VOCAB_TARGET = 500;

export function vocabStats(s: UserState, lang: LangCode) {
  const cards = Object.entries(s.srs[lang]).filter(([k]) => k.startsWith("w:"));
  const strong = cards.filter(([, c]) => isStrong(c)).length;
  const pct = Math.min(100, Math.round((strong / VOCAB_TARGET) * 100));
  const label = pct < 20 ? "Iniciante" : pct < 50 ? "Básico" : pct < 80 ? "Intermédio" : "Fluente";
  return { learned: cards.length, strong, pct, label };
}

export function dueItems(s: UserState, lang: LangCode, now = Date.now()): string[] {
  return Object.entries(s.srs[lang])
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([k]) => k);
}

/** Modelo do aluno completo (Secção 5.4: vocabulário, estruturas, erros, velocidade e autonomia). */
export function studentModelSummary(s: UserState, lang: LangCode) {
  const srsEntries = Object.entries(s.srs[lang]);
  const wordCards = srsEntries.filter(([k]) => k.startsWith("w:"));
  const patternCards = srsEntries.filter(([k]) => k.startsWith("p:"));
  const strongWords = wordCards.filter(([, c]) => isStrong(c)).length;
  const strongPatterns = patternCards.filter(([, c]) => isStrong(c)).length;

  const rs = s.progress[lang].responseStats;
  const convsForLang = s.conversations.filter((c) => c.lang === lang);
  const totalConv = rs?.totalConv || convsForLang.length;
  const helpFreeCount =
    rs && rs.totalConv > 0 ? rs.helpFree : convsForLang.filter((c) => !c.usedHelp).length;
  const helpFreeRate = totalConv > 0 ? Math.round((helpFreeCount / totalConv) * 100) : 100;

  const avgResponseSec =
    rs && rs.count > 0 ? Math.round((rs.totalMs / rs.count / 100)) / 10 : null;
  const speedLabel =
    avgResponseSec === null
      ? "Sem dados ainda"
      : avgResponseSec <= 6
        ? "Rápida (< 6s)"
        : avgResponseSec <= 12
          ? "Natural (6–12s)"
          : "Em consolidação (> 12s)";

  const topErrors = Object.entries(s.errors[lang])
    .map(([category, stat]) => ({ category, count: stat.count, example: stat.example }))
    .sort((a, b) => b.count - a.count);

  return {
    learnedWords: wordCards.length,
    strongWords,
    learnedPatterns: patternCards.length,
    strongPatterns,
    totalConv,
    helpFreeRate,
    avgResponseSec,
    speedLabel,
    topErrors,
    dueCount: dueItems(s, lang).length,
  };
}

const INTERESTS_MAP: Record<string, string[]> = {
  viagens: ["Direcções", "Compras", "Horas", "Transportes", "Planos", "Viagens", "Experiências"],
  comida: ["Comida", "Restaurante", "Compras"],
  negócios: ["Apresentações", "Números", "Horas", "Encontros", "Transportes", "Trabalho", "Pedidos", "Opinião"],
  música: ["Cumprimentos", "Rotina", "Tempo livre", "Cultura", "Expressões"],
  futebol: ["Números", "Rotina", "Tempo livre", "Encontros", "Conversa"],
  estudos: ["Rotina", "Apresentações", "Família", "Casa", "Opinião", "Actualidade"],
};

/** Pacote recomendado personalizado com justificação do Modelo do Aluno (Secções 3.5 e 5.4). */
export function recommendedPack(s: UserState, lang: LangCode): {
  unitId: string;
  reason: string;
  badge: string;
  focusWords: string[];
} | null {
  const allUnits = CONTENT[lang].units;
  const unlocked = allUnits.filter((u) => isUnitUnlocked(s, u.id));
  if (!unlocked.length) return null;

  const notDone = unlocked.filter((u) => !unitDone(s, u.id));
  const model = studentModelSummary(s, lang);

  // 1) Se houver erros recorrentes, priorizar uma unidade que trabalhe estruturas/vocabulário relacionados
  if (model.topErrors.length > 0 && model.topErrors[0].count >= 2) {
    const topErr = model.topErrors[0];
    const target = notDone[0] ?? unlocked[unlocked.length - 1];
    return {
      unitId: target.id,
      badge: "Reforço personalizado",
      reason: `Adaptado para reduzir erros de ${topErr.category} (${topErr.count}× recentes)`,
      focusWords: target.vocab.slice(0, 4),
    };
  }

  // 2) Se o aluno declarou interesses, escolher unidade desbloqueada não concluída desse interesse
  const wanted = new Set(s.settings.interests.flatMap((i) => INTERESTS_MAP[i] ?? []));
  const byInterest = notDone.find((u) => wanted.has(u.category));
  if (byInterest) {
    const matchedInterest = s.settings.interests.find((i) => (INTERESTS_MAP[i] ?? []).includes(byInterest.category)) ?? "teu interesse";
    return {
      unitId: byInterest.id,
      badge: `Interesse: ${matchedInterest}`,
      reason: `Escolhido pelo teu interesse em ${matchedInterest} (${byInterest.category})`,
      focusWords: byInterest.vocab.slice(0, 4),
    };
  }

  // 3) Próxima unidade do percurso
  if (notDone.length) {
    const next = notDone[0];
    return {
      unitId: next.id,
      badge: `Nível ${next.level}`,
      reason: `Próximo passo natural da tua etapa actual (${next.category})`,
      focusWords: next.vocab.slice(0, 4),
    };
  }

  // 4) Tudo concluído: recomendar revisão da unidade com conversa mais antiga
  const fallback = unlocked[unlocked.length - 1];
  return {
    unitId: fallback.id,
    badge: "Revisão de fluência",
    reason: "Pratica em modo Livre ou Desafio para manter a velocidade de resposta",
    focusWords: fallback.vocab.slice(0, 4),
  };
}

/** Recomendação: unidade com mais relação aos erros recorrentes / interesses, ou a próxima. */
export function recommendedUnitId(s: UserState, lang: LangCode): string | null {
  return recommendedPack(s, lang)?.unitId ?? null;
}

const STEP_BASE_XP: Record<StepId, number> = {
  ouvir: 10,
  moldes: 10,
  vocabulario: 10,
  montar: 15,
  falar: 15,
  conversa: 20,
};

/** Une eventos de XP reais de dois estados sem duplicar o mesmo evento. */
export function mergeXpEvents(a: XpEvent[] = [], b: XpEvent[] = []): XpEvent[] {
  const seen = new Map<string, XpEvent>();
  for (const e of [...a, ...b]) {
    if (!e || typeof e.value !== "number" || e.value <= 0 || e.type === "sync:reconcile") continue;
    const key = `${e.lang}:${e.type}:${e.value}:${e.at}`;
    if (!seen.has(key)) seen.set(key, e);
  }
  return Array.from(seen.values())
    .sort((x, y) => x.at - y.at)
    .slice(-2000);
}

/**
 * Reconcilia de forma idempotente (CRDT) o XP de cada idioma (`progress[lang].xp`),
 * o histórico `xpEvents` e os passos/unidades/lições/exames concluídos.
 */
export function reconcileUserXp(s: UserState): UserState {
  const langs: LangCode[] = ["en", "fr", "ja"];
  let xpEvents = mergeXpEvents(s.xpEvents ?? [], []);
  const nextProgress: Record<LangCode, LangProgress> = { ...s.progress };

  for (const l of langs) {
    const lp = nextProgress[l];
    if (!lp) continue;

    let floorXp = 0;
    let latestAt = 0;
    for (const up of Object.values(lp.units ?? {})) {
      for (const [stId, ts] of Object.entries(up.steps ?? {}) as [StepId, number | undefined][]) {
        if (ts) {
          floorXp += STEP_BASE_XP[stId] ?? 10;
          if (ts > latestAt) latestAt = ts;
        }
      }
      if (up.completedAt) {
        floorXp += 25;
        if (up.completedAt > latestAt) latestAt = up.completedAt;
      }
    }
    for (const v of Object.values(lp.lessons ?? {})) {
      if (v >= 1) floorXp += 10;
    }
    floorXp += (lp.stageExams?.length ?? 0) * 50;

    const langEvents = xpEvents.filter((e) => e.lang === l);
    const realEventsSum = langEvents.reduce((acc, e) => acc + e.value, 0);
    for (const e of langEvents) {
      if (e.at > latestAt) latestAt = e.at;
    }
    for (const c of s.conversations ?? []) {
      if (c.lang === l && c.at > latestAt) latestAt = c.at;
    }

    const targetXp = Math.max(lp.xp ?? 0, realEventsSum, floorXp);
    nextProgress[l] = { ...lp, xp: targetXp };

    if (realEventsSum < targetXp) {
      const diff = targetXp - realEventsSum;
      const reconcileAt = latestAt > 0 ? latestAt : Date.now();
      xpEvents = [...xpEvents, { lang: l, type: "sync:reconcile", value: diff, at: reconcileAt }];
    }
  }

  xpEvents = xpEvents.sort((x, y) => x.at - y.at).slice(-2000);
  return {
    ...s,
    progress: nextProgress,
    xpEvents,
  };
}

/**
 * Prática de partículas japonesas (Fase 2): exercícios gerados a partir do conteúdo curado.
 * Cada frase das unidades com uma partícula dá um item "escolhe a partícula que falta".
 * Não se inventa conteúdo: só se esconde uma partícula de frases já validadas.
 */
import type { Dictionary, Unit } from "./types";
import { fillTemplate, tokenize } from "./tokenize";

export interface ParticleInfo {
  particle: string;
  romaji: string;
  /** Regra curta em português. */
  rule: string;
}

export const PARTICLES: ParticleInfo[] = [
  { particle: "は", romaji: "wa", rule: "marca o tópico — «quanto a…». Lê-se «wa»." },
  { particle: "が", romaji: "ga", rule: "marca o sujeito (informação nova) e vai com すき, あります, います, できます." },
  { particle: "を", romaji: "o", rule: "marca o objecto directo da acção (o que se come, bebe, compra…). Lê-se «o»." },
  { particle: "に", romaji: "ni", rule: "marca a hora exacta, o destino ou o lugar onde algo existe." },
  { particle: "で", romaji: "de", rule: "marca o lugar onde a acção acontece ou o meio (de autocarro, com…)." },
  { particle: "へ", romaji: "e", rule: "marca a direcção do movimento (para…). Lê-se «e»." },
  { particle: "と", romaji: "to", rule: "«com» (alguém) ou «e» entre nomes." },
  { particle: "も", romaji: "mo", rule: "«também» — substitui は, が ou を." },
  { particle: "の", romaji: "no", rule: "liga dois nomes: posse ou descrição («de»)." },
  { particle: "から", romaji: "kara", rule: "«desde / de» (ponto de partida ou origem)." },
  { particle: "まで", romaji: "made", rule: "«até» (ponto de chegada ou limite)." },
];

export const PARTICLE_INFO: Record<string, ParticleInfo> = Object.fromEntries(PARTICLES.map((p) => [p.particle, p]));

/** Grupos de partículas que os alunos costumam confundir (para distractores e filtros). */
export const PARTICLE_GROUPS: { id: string; label: string; particles: string[] }[] = [
  { id: "wa-ga", label: "は・が", particles: ["は", "が"] },
  { id: "ni-de-e", label: "に・で・へ", particles: ["に", "で", "へ"] },
  { id: "o", label: "を", particles: ["を"] },
  { id: "to-mo-no", label: "と・も・の", particles: ["と", "も", "の"] },
  { id: "kara-made", label: "から・まで", particles: ["から", "まで"] },
];

/**
 * Distractores por partícula. Evitam-se pares em que ambas seriam gramaticais na mesma frase
 * (に/へ, は/が, と/も, に/まで), para haver sempre uma só resposta certa.
 */
const CONFUSABLE: Record<string, string[]> = {
  は: ["を", "に", "で"],
  が: ["を", "と", "の"],
  を: ["が", "に", "で"],
  に: ["で", "を", "が"],
  で: ["に", "を", "が"],
  へ: ["で", "を", "が"],
  と: ["の", "を", "が"],
  も: ["は", "が", "を"],
  の: ["と", "を", "に"],
  から: ["まで", "を", "で"],
  まで: ["から", "を", "で"],
};

export interface ParticleItem {
  id: string;
  unitId: string;
  level: number;
  /** tokens da frase (sem "|"); o token em `blank` é a partícula escondida */
  tokens: string[];
  blank: number;
  answer: string;
  options: string[];
  pt: string;
  romaji?: string;
  /** frase completa com "|" (para ouvir) */
  text: string;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Ordem determinística dos distractores (para testes estáveis); a página baralha na apresentação. */
function optionsFor(answer: string, seed: string): string[] {
  const conf = CONFUSABLE[answer] ?? ["は", "を", "に"];
  const opts = [answer, ...conf.slice(0, 3)];
  const h = hash(seed);
  return opts.map((o, i) => ({ o, k: (h >> (i * 3)) & 7 })).sort((a, b) => a.k - b.k).map((x) => x.o);
}

/** Gera os itens de prática a partir das unidades (diálogos, moldes preenchidos e frases de montar). */
export function buildParticleItems(units: Unit[], dict: Dictionary): ParticleItem[] {
  const out: ParticleItem[] = [];
  const seen = new Set<string>();
  const add = (unit: Unit, text: string, pt: string, romaji?: string) => {
    const toks = tokenize(text, "ja", dict);
    const words = toks.map((t) => t.text);
    toks.forEach((t, i) => {
      if (t.isPunct || t.entry?.pos !== "particle" || !PARTICLE_INFO[t.text]) return;
      if (i === 0) return; // partícula no início não faz sentido como exercício
      const id = `${words.join("")}#${i}`;
      if (seen.has(id)) return;
      seen.add(id);
      out.push({ id, unitId: unit.id, level: unit.level, tokens: words, blank: i, answer: t.text, options: optionsFor(t.text, id), pt, romaji, text });
    });
  };
  for (const u of units) {
    if (u.lang !== "ja") continue;
    u.dialogue.forEach((d) => add(u, d.text, d.pt, d.romaji));
    u.patterns.forEach((p) => p.slots.forEach((s) => add(u, fillTemplate(p.template, s.text), fillTemplate(p.pt, s.pt), p.romaji ? fillTemplate(p.romaji, s.romaji ?? "") : undefined)));
    u.build.forEach((b) => add(u, b.chunks.join("|"), b.pt, b.romaji));
  }
  return out;
}

/** Esconde a partícula no romaji (primeira ocorrência da palavra isolada a partir da posição aproximada). */
export function maskRomaji(romaji: string | undefined, item: ParticleItem): string | undefined {
  if (!romaji) return undefined;
  const p = PARTICLE_INFO[item.answer]?.romaji;
  if (!p) return romaji;
  const words = romaji.split(/\s+/);
  // quantas vezes a mesma partícula aparece antes do espaço em branco
  const before = item.tokens.slice(0, item.blank).filter((t) => t === item.answer).length;
  let n = 0;
  for (let i = 0; i < words.length; i++) {
    const clean = words[i].toLowerCase().replace(/[.,!?]/g, "");
    if (clean === p) {
      if (n === before) {
        words[i] = words[i].replace(new RegExp(p, "i"), "___");
        return words.join(" ");
      }
      n++;
    }
  }
  return romaji;
}

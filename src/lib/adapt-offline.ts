/**
 * "Importar texto" sem IA (Fase 2): adapta um texto colado pelo aluno usando só o dicionário curado.
 *  - segmenta o japonês com o dicionário (maior correspondência) e, no que sobra, com Intl.Segmenter;
 *  - classifica cada frase pela percentagem de palavras conhecidas (fácil / médio / difícil);
 *  - extrai o vocabulário da app presente no texto e as palavras novas;
 *  - cria perguntas de preenchimento (cloze) a partir das frases mais acessíveis.
 * Com a chave da Anthropic, a rota /api/adapt faz uma adaptação completa (reescrita + tradução).
 */
import type { Dictionary, LangCode, PartOfSpeech } from "./types";
import { tokenize, type RToken } from "./tokenize";

const JA_PUNCT = /[。、！？!?.,「」『』（）()・〜~\s]/;

/** Segmenta japonês: maior correspondência com as chaves do dicionário; o resto via Intl.Segmenter. */
export function segmentJa(text: string, dict: Dictionary): string {
  const keys = Object.keys(dict);
  const maxLen = Math.min(12, keys.reduce((m, k) => Math.max(m, k.length), 1));
  const out: string[] = [];
  let pending = "";
  const flush = () => {
    if (!pending) return;
    let parts: string[];
    try {
      const seg = new Intl.Segmenter("ja", { granularity: "word" });
      parts = Array.from(seg.segment(pending)).map((s) => s.segment);
    } catch {
      parts = Array.from(pending);
    }
    out.push(...parts.filter((p) => p.trim()));
    pending = "";
  };
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (JA_PUNCT.test(ch)) {
      flush();
      if (ch.trim()) out.push(ch);
      i++;
      continue;
    }
    let matched = "";
    for (let n = Math.min(maxLen, text.length - i); n >= 1; n--) {
      const cand = text.slice(i, i + n);
      if (dict[cand.toLowerCase()]) {
        matched = cand;
        break;
      }
    }
    if (matched) {
      flush();
      out.push(matched);
      i += matched.length;
    } else {
      pending += ch;
      i++;
    }
  }
  flush();
  return out.join("|");
}

/** Divide em parágrafos e, no japonês, insere os separadores "|". */
export function prepareText(text: string, lang: LangCode, dict: Dictionary): string[] {
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return lang === "ja" ? paragraphs.map((p) => segmentJa(p, dict)) : paragraphs;
}

/** Divide um parágrafo (já preparado) em frases. */
export function splitSentences(paragraph: string, lang: LangCode): string[] {
  if (lang === "ja") {
    const out: string[] = [];
    let cur: string[] = [];
    for (const t of paragraph.split("|")) {
      cur.push(t);
      if (/^[。！？!?]$/.test(t)) {
        out.push(cur.join("|"));
        cur = [];
      }
    }
    if (cur.join("").trim()) out.push(cur.join("|"));
    return out;
  }
  return paragraph.match(/[^.!?…]+[.!?…]*\s*/g)?.map((s) => s.trim()).filter(Boolean) ?? [paragraph];
}

export type Difficulty = "fácil" | "médio" | "difícil";

export interface SentenceInfo {
  text: string;
  coverage: number;
  difficulty: Difficulty;
}

export interface VocabItem {
  key: string;
  text: string;
  pt: string;
  pos: PartOfSpeech;
}

export interface ClozeQuestion {
  sentence: string;
  tokens: RToken[];
  blank: number;
  answer: string;
  options: string[];
}

export interface OfflineAdaptation {
  sentences: SentenceInfo[];
  coverage: number;
  vocab: VocabItem[];
  unknown: string[];
  cloze: ClozeQuestion[];
}

const CONTENT_POS: PartOfSpeech[] = ["noun", "verb", "adj", "adv"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Ordenação pseudo-aleatória mas estável (o mesmo texto dá sempre as mesmas perguntas). */
function stableShuffle<T>(arr: T[], seed: string, key: (t: T) => string): T[] {
  return [...arr].sort((a, b) => hash(seed + key(a)) - hash(seed + key(b)));
}

export function adaptOffline(paragraphs: string[], lang: LangCode, dict: Dictionary): OfflineAdaptation {
  const sentences: SentenceInfo[] = [];
  const vocab = new Map<string, VocabItem>();
  const unknown = new Set<string>();
  let total = 0;
  let known = 0;
  for (const p of paragraphs) {
    for (const s of splitSentences(p, lang)) {
      const toks = tokenize(s, lang, dict).filter((t) => !t.isPunct);
      if (!toks.length) continue;
      const k = toks.filter((t) => t.entry).length;
      total += toks.length;
      known += k;
      const coverage = k / toks.length;
      sentences.push({ text: s, coverage, difficulty: coverage >= 0.9 ? "fácil" : coverage >= 0.7 ? "médio" : "difícil" });
      for (const t of toks) {
        if (t.entry && t.key && t.entry.pos !== "num" && dict[t.key]) {
          if (!vocab.has(t.key)) vocab.set(t.key, { key: t.key, text: t.text, pt: t.entry.pt, pos: t.entry.pos });
        } else if (!t.entry && !/^\d/.test(t.text)) unknown.add(t.text);
      }
    }
  }

  // perguntas: frases fáceis/médias, esconder uma palavra de conteúdo conhecida
  const seed = paragraphs.join("\n");
  const pool = Object.entries(dict);
  const cloze: ClozeQuestion[] = [];
  const usedAnswers = new Set<string>();
  for (const s of stableShuffle(
    sentences.filter((x) => x.difficulty !== "difícil"),
    seed,
    (x) => x.text,
  )) {
    if (cloze.length >= 3) break;
    const toks = tokenize(s.text, lang, dict);
    const cands = toks.map((t, i) => ({ t, i })).filter(({ t }) => !t.isPunct && t.entry && CONTENT_POS.includes(t.entry.pos) && !t.chunk && !usedAnswers.has(t.text.toLowerCase()));
    if (!cands.length || toks.filter((t) => !t.isPunct).length < 3) continue;
    const { t, i } = stableShuffle(cands, seed, (c) => c.t.text)[0];
    const pos = t.entry!.pos;
    const distract = stableShuffle(
      pool.filter(([k, e]) => e.pos === pos && k !== t.key && !k.includes(" ") && k !== t.text.toLowerCase()),
      seed + t.text,
      ([k]) => k,
    )
      .slice(0, 3)
      .map(([k]) => k);
    if (distract.length < 2) continue;
    usedAnswers.add(t.text.toLowerCase());
    const answer = lang === "ja" ? t.text : t.text.toLowerCase();
    cloze.push({ sentence: s.text, tokens: toks, blank: i, answer, options: stableShuffle([answer, ...distract], seed, (x) => x) });
  }

  return {
    sentences,
    coverage: total ? known / total : 0,
    vocab: [...vocab.values()].filter((v) => CONTENT_POS.includes(v.pos) || v.pos === "expr").slice(0, 15),
    unknown: [...unknown].slice(0, 15),
    cloze,
  };
}

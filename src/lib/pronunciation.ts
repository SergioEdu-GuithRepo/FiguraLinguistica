/**
 * Avaliação de pronúncia (secção 6 "Dizer em voz alta: repetir frase e receber nota de pronúncia" e Fase 2).
 *
 * O reconhecimento de voz do navegador devolve 1–3 transcrições alternativas com confiança.
 * Aqui alinhamos essas transcrições com a frase-alvo para dar:
 *  - nota 0–100;
 *  - estado de cada palavra (certa / quase / em falta);
 *  - no máximo 2 dicas de pronúncia (regra de ouro: nunca corrigir tudo de uma vez).
 *
 * EN/FR: alinhamento palavra a palavra (programação dinâmica com custo de substituição = 1 − semelhança).
 * JA: alinhamento por caracteres em kana (convertendo kanji para leitura com o dicionário).
 */
import type { Dictionary, LangCode } from "./types";
import { normalizeAnswer, plainText, similarity, tokenize } from "./tokenize";

export type WordStatus = "ok" | "close" | "miss";

export interface WordResult {
  text: string;
  key: string | null;
  status: WordStatus;
  /** o que o reconhecimento ouviu no lugar desta palavra (EN/FR) */
  heard?: string;
}

export interface Alternative {
  transcript: string;
  confidence?: number;
}

export interface PronunciationResult {
  score: number;
  words: WordResult[];
  tips: string[];
  /** transcrição usada (a melhor das alternativas) */
  heard: string;
}

/* ---------------- números (o reconhecimento escreve "7" em vez de "seven") ---------------- */

const NUM_WORDS: Record<"en" | "fr", string[]> = {
  en: "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split(" "),
  fr: "zero un deux trois quatre cinq six sept huit neuf dix onze douze treize quatorze quinze seize dix-sept dix-huit dix-neuf vingt".split(" "),
};
const TENS: Record<"en" | "fr", Record<number, string>> = {
  en: { 30: "thirty", 40: "forty", 50: "fifty", 60: "sixty", 100: "a hundred" },
  fr: { 30: "trente", 40: "quarante", 50: "cinquante", 60: "soixante", 100: "cent" },
};

function numToWords(n: number, lang: "en" | "fr"): string | null {
  if (n >= 0 && n <= 20) return NUM_WORDS[lang][n];
  if (TENS[lang][n]) return TENS[lang][n];
  if (n > 20 && n < 70) {
    const t = Math.floor(n / 10) * 10;
    const u = n % 10;
    const tw = t === 20 ? (lang === "en" ? "twenty" : "vingt") : TENS[lang][t];
    if (lang === "en") return `${tw}-${NUM_WORDS.en[u]}`;
    return u === 1 ? `${tw} et un` : `${tw}-${NUM_WORDS.fr[u]}`;
  }
  return null;
}

function expandNumbers(s: string, lang: "en" | "fr"): string {
  return s
    .replace(/(\d{1,2})[:h](\d{2})/g, (_, h, m) => `${h} ${m === "00" ? "" : m}`)
    .replace(/\d+/g, (d) => numToWords(Number(d), lang) ?? d);
}

/* ---------------- EN / FR: alinhamento por palavras ---------------- */

function normWord(w: string, lang: LangCode): string {
  return normalizeAnswer(w, lang, true).replace(/['-]/g, "");
}

function splitWords(s: string, lang: LangCode): string[] {
  return normalizeAnswer(s, lang, true)
    .split(/[\s-]+/)
    .map((w) => w.replace(/['-]/g, ""))
    .filter(Boolean);
}

/** Alinha palavras-alvo (cada uma pode ter várias sub-palavras, ex.: chunks) com as ouvidas. */
function alignWords(target: string[], heard: string[]): { sim: number; heard?: string }[] {
  const n = target.length;
  const m = heard.length;
  // dp[i][j] = custo mínimo de alinhar target[0..i) com heard[0..j)
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const back: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    dp[i][0] = i;
    back[i][0] = 1;
  }
  for (let j = 1; j <= m; j++) {
    dp[0][j] = j * 0.6;
    back[0][j] = 2;
  }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sub = dp[i - 1][j - 1] + (1 - similarity(target[i - 1], heard[j - 1]));
      const del = dp[i - 1][j] + 1; // palavra-alvo não dita
      const ins = dp[i][j - 1] + 0.6; // palavra extra ouvida
      const best = Math.min(sub, del, ins);
      dp[i][j] = best;
      back[i][j] = best === sub ? 0 : best === del ? 1 : 2;
    }
  }
  const out: { sim: number; heard?: string }[] = new Array(n).fill(null).map(() => ({ sim: 0 }));
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const b = back[i][j];
    if (i > 0 && j > 0 && b === 0) {
      out[i - 1] = { sim: similarity(target[i - 1], heard[j - 1]), heard: heard[j - 1] };
      i--;
      j--;
    } else if (i > 0 && (j === 0 || b === 1)) {
      out[i - 1] = { sim: 0 };
      i--;
    } else {
      j--;
    }
  }
  return out;
}

/* ---------------- JA: kana ---------------- */

function kataToHira(s: string): string {
  return s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** Leituras de palavras muito comuns que o reconhecimento escreve em kanji. */
const COMMON_READINGS: Record<string, string> = {
  お願い: "おねがい",
  願い: "ねがい",
  来ます: "きます",
  来ました: "きました",
  来て: "きて",
  水: "みず",
  私: "わたし",
  珈琲: "こーひー",
  有難う: "ありがとう",
  御座います: "ございます",
  下さい: "ください",
  今日は: "こんにちは",
  今晩は: "こんばんは",
  お早う: "おはよう",
  何時: "なんじ",
  幾ら: "いくら",
};

/** Converte texto japonês (com kanji) para hiragana usando as leituras do dicionário. */
export function toKana(text: string, dict: Dictionary, extra: Record<string, string> = {}): string {
  let s = text.replace(/[\s。、！？!?.,「」・~〜|]/g, "");
  const fromDict: [string, string][] = [];
  for (const [k, e] of Object.entries(dict)) {
    if (e.reading && /[\u4e00-\u9faf\u30a0-\u30ff]/.test(k)) fromDict.push([k, e.reading]);
    // a chave em kana mas o lema em kanji (ex.: "みず" → lema "水")
    if (/[\u4e00-\u9faf]/.test(e.lemma) && !/[\u4e00-\u9faf]/.test(k) && e.lemma.length <= 4) fromDict.push([e.lemma, e.reading ?? k]);
  }
  const pairs: [string, string][] = [...fromDict, ...Object.entries(COMMON_READINGS), ...Object.entries(extra)].sort((a, b) => b[0].length - a[0].length);
  for (const [k, r] of pairs) if (s.includes(k)) s = s.split(k).join(r);
  return kataToHira(s).replace(/ー/g, "");
}

/** LCS por caracteres: devolve, para cada posição de `a`, se foi emparelhada em `b`. */
function lcsMatched(a: string, b: string): boolean[] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const matched = new Array(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      matched[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return matched;
}

/* ---------------- dicas ---------------- */

function tipFor(word: string, lang: LangCode, dict: Dictionary): string | null {
  const key = word.toLowerCase();
  const e = dict[key];
  const w = normWord(word, lang);
  if (e?.note && /pronún|pronun|diz-se|lê-se|som/i.test(e.note)) return `«${word}»: ${e.note}`;
  if (lang === "en") {
    if (/th/.test(w)) return `«${word}»: o «th» faz-se com a ponta da língua entre os dentes${e?.pron ? ` (≈ ${e.pron})` : ""}.`;
    if (/^h/.test(w) && !/^(hour|honest)/.test(w)) return `«${word}»: o «h» inicial é aspirado, como um sopro${e?.pron ? ` (≈ ${e.pron})` : ""}.`;
    if (/ed$/.test(w) && w.length > 4) return `«${word}»: o «-ed» quase não se ouve — não digas «-ed» com vogal${e?.pron ? ` (≈ ${e.pron})` : ""}.`;
  }
  if (lang === "fr") {
    if (/(an|en|on|in|un|ain|ein)(?![aeiouyn])/.test(w)) return `«${word}»: vogal nasal — sem fechar a boca no «n»${e?.pron ? ` (≈ ${e.pron})` : ""}.`;
    if (/r/.test(w)) return `«${word}»: o «r» francês faz-se na garganta, suave${e?.pron ? ` (≈ ${e.pron})` : ""}.`;
    if (/(e|s|t|x|d)$/.test(w) && w.length > 3 && !/[éèêë]$/.test(key)) return `«${word}»: a consoante final é muda${e?.pron ? ` (≈ ${e.pron})` : ""}.`;
  }
  if (lang === "ja") {
    const r = e?.reading ?? word;
    const rom = e?.romaji;
    if (/っ/.test(r)) return `«${word}»: o «っ» é uma pequena pausa antes da consoante seguinte${rom ? ` (${rom})` : ""}.`;
    if (/ー|おう|えい|うう|おお/.test(r)) return `«${word}»: vogal longa — dura o dobro (2 moras)${rom ? ` (${rom})` : ""}.`;
    if (/ん/.test(r)) return `«${word}»: o «ん» conta como uma mora inteira${rom ? ` (${rom})` : ""}.`;
    return `«${word}»: diz cada mora com a mesma duração${rom ? ` (${rom})` : ""}.`;
  }
  return e?.pron ? `«${word}»: pronuncia-se ≈ «${e.pron}».` : null;
}

/* ---------------- avaliação ---------------- */

function assessOne(transcript: string, target: string, lang: LangCode, dict: Dictionary, kanaExtra: Record<string, string>): PronunciationResult {
  const toks = tokenize(target, lang, dict).filter((t) => !t.isPunct);
  let words: WordResult[];
  let charSim: number;

  if (lang === "ja") {
    const parts = toks.map((t) => toKana(t.text, dict, kanaExtra));
    const tgt = parts.join("");
    const heardKana = toKana(normalizeAnswer(transcript, "ja"), dict, kanaExtra);
    const matched = lcsMatched(tgt, heardKana);
    let pos = 0;
    words = toks.map((t, i) => {
      const len = parts[i].length;
      const got = matched.slice(pos, pos + len).filter(Boolean).length;
      pos += len;
      const r = len ? got / len : 1;
      return { text: t.text, key: t.key, status: r >= 0.85 ? "ok" : r >= 0.5 ? "close" : "miss" };
    });
    charSim = similarity(tgt, heardKana);
  } else {
    const heardWords = splitWords(expandNumbers(transcript.toLowerCase(), lang), lang);
    // cada token-alvo pode ser um chunk com várias palavras: alinhar por sub-palavras e agregar
    const sub: { tok: number; w: string }[] = [];
    toks.forEach((t, ti) => splitWords(t.text, lang).forEach((w) => sub.push({ tok: ti, w })));
    const al = alignWords(
      sub.map((s) => s.w),
      heardWords,
    );
    words = toks.map((t, ti) => {
      const mine = al.filter((_, k) => sub[k].tok === ti);
      const sim = mine.length ? mine.reduce((a, b) => a + b.sim, 0) / mine.length : 1;
      const heard = mine
        .map((m) => m.heard)
        .filter(Boolean)
        .join(" ");
      return { text: t.text, key: t.key, status: sim >= 0.8 ? "ok" : sim >= 0.5 ? "close" : "miss", heard: heard || undefined };
    });
    charSim = similarity(normalizeAnswer(plainText(target, lang), lang, true), normalizeAnswer(expandNumbers(transcript.toLowerCase(), lang), lang, true));
  }

  const acc = words.length ? words.reduce((a, w) => a + (w.status === "ok" ? 1 : w.status === "close" ? 0.5 : 0), 0) / words.length : 0;
  const score = Math.max(0, Math.min(100, Math.round((0.75 * acc + 0.25 * charSim) * 100)));
  const tips: string[] = [];
  for (const w of words) {
    if (tips.length >= 2) break;
    if (w.status === "ok") continue;
    const e = w.key ? dict[w.key] : undefined;
    const say = e?.romaji ?? e?.pron;
    const tip = w.status === "miss" && lang === "ja" ? `Não ouvimos «${w.text}» — diz devagar${say ? `: ${say}` : ""}.` : tipFor(w.text, lang, dict);
    if (tip && !tips.includes(tip)) tips.push(tip);
  }
  return { score, words, tips, heard: transcript };
}

/**
 * Avalia a pronúncia a partir das alternativas do reconhecimento de voz (usa a melhor).
 * `kanaExtra`: leituras adicionais para converter kanji (ex.: exemplos do módulo de kanji).
 */
export function assessPronunciation(
  alternatives: Alternative[],
  target: string,
  lang: LangCode,
  dict: Dictionary,
  kanaExtra: Record<string, string> = {},
): PronunciationResult {
  const alts = alternatives.filter((a) => a.transcript.trim());
  if (!alts.length) {
    const toks = tokenize(target, lang, dict).filter((t) => !t.isPunct);
    return { score: 0, words: toks.map((t) => ({ text: t.text, key: t.key, status: "miss" })), tips: [], heard: "" };
  }
  let best: PronunciationResult | null = null;
  for (const a of alts) {
    const r = assessOne(a.transcript, target, lang, dict, kanaExtra);
    // confiança muito baixa do reconhecedor penaliza ligeiramente (fala pouco clara)
    if (typeof a.confidence === "number" && a.confidence > 0 && a.confidence < 0.5) r.score = Math.round(r.score * (0.85 + 0.3 * a.confidence));
    if (!best || r.score > best.score) best = r;
  }
  return best as PronunciationResult;
}

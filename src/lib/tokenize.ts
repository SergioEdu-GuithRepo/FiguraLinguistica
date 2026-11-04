import type { DictEntry, Dictionary, LangCode } from "./types";

export interface RToken {
  /** Texto mostrado. */
  text: string;
  /** Chave do dicionário (minúsculas) ou null para pontuação. */
  key: string | null;
  entry?: DictEntry;
  isPunct: boolean;
  /** Se há espaço depois deste token na apresentação. */
  spaceAfter: boolean;
  /** FR: liaison obrigatória com a palavra seguinte. */
  liaison?: boolean;
  /** EN/FR: token resultante de um chunk (expressão fixa / phrasal verb). */
  chunk?: boolean;
}

const PUNCT_RE = /^[\s.,!?;:…"'«»“”‘’()\[\]¿¡\-–—。、！？「」『』（）・〜~]+$/;
const LEAD_RE = /^([¿¡"«“‘(\[]*)/;
const TRAIL_RE = /([.,!?;:…"»”’)\]]*)$/;
const NUM_RE = /^[\d:.,h]+$/;

export function normalizeKey(s: string): string {
  return s.replace(/[’‘]/g, "'").toLowerCase().trim();
}

export function isPunct(s: string): boolean {
  return PUNCT_RE.test(s);
}

/** Remove marcadores internos ("|" e "‿") para mostrar/ler em voz alta. */
export function plainText(text: string, lang: LangCode): string {
  if (lang === "ja") return text.split("|").join("").trim();
  return text.replace(/‿/g, " ").replace(/\s+/g, " ").trim();
}

/** Preenche um molde "{x}". */
export function fillTemplate(template: string, value: string): string {
  return template.split("{x}").join(value);
}

function lookup(dict: Dictionary, key: string): DictEntry | undefined {
  if (dict[key]) return dict[key];
  if (NUM_RE.test(key) && /\d/.test(key)) {
    return { lemma: key, pos: "num", pt: key };
  }
  return undefined;
}

export function tokenize(text: string, lang: LangCode, dict: Dictionary): RToken[] {
  if (lang === "ja") {
    return text
      .split("|")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => {
        const punct = isPunct(t);
        const key = punct ? null : normalizeKey(t);
        return {
          text: t,
          key,
          entry: key ? lookup(dict, key) : undefined,
          isPunct: punct,
          spaceAfter: false,
        };
      });
  }

  // EN / FR
  const raw: RToken[] = [];
  const words = text.trim().split(/\s+/).filter(Boolean);
  for (const w of words) {
    const parts = w.split("‿");
    parts.forEach((part, pi) => {
      const liaison = pi < parts.length - 1;
      if (isPunct(part)) {
        // pontuação isolada (ex.: francês "Bonjour !")
        if (raw.length) raw[raw.length - 1].spaceAfter = true;
        raw.push({ text: part, key: null, isPunct: true, spaceAfter: true });
        return;
      }
      const lead = part.match(LEAD_RE)?.[1] ?? "";
      let rest = part.slice(lead.length);
      const trail = rest.match(TRAIL_RE)?.[1] ?? "";
      rest = rest.slice(0, rest.length - trail.length);
      if (lead) raw.push({ text: lead, key: null, isPunct: true, spaceAfter: false });
      if (rest) {
        const key = normalizeKey(rest);
        raw.push({
          text: rest,
          key,
          entry: lookup(dict, key),
          isPunct: false,
          spaceAfter: !trail && !liaison,
          liaison,
        });
      }
      if (trail) raw.push({ text: trail, key: null, isPunct: true, spaceAfter: !liaison });
      if (!rest && !trail && lead) raw[raw.length - 1].spaceAfter = true;
      if (liaison && raw.length) raw[raw.length - 1].spaceAfter = false;
    });
  }

  // Juntar chunks (expressões com espaços no dicionário), guloso de 4 a 2 palavras.
  const out: RToken[] = [];
  let i = 0;
  while (i < raw.length) {
    let merged = false;
    for (let n = 4; n >= 2; n--) {
      const slice = raw.slice(i, i + n);
      if (slice.length < n || slice.some((t) => t.isPunct)) continue;
      // só junta se as palavras estiverem separadas por espaço/liaison (sem pontuação entre elas)
      const key = slice.map((t) => t.key).join(" ");
      const entry = dict[key];
      if (entry) {
        const last = slice[slice.length - 1];
        out.push({
          text: slice.map((t) => t.text).join(" "),
          key,
          entry,
          isPunct: false,
          spaceAfter: last.spaceAfter,
          chunk: true,
          liaison: slice.some((t) => t.liaison),
        });
        i += n;
        merged = true;
        break;
      }
    }
    if (!merged) {
      out.push(raw[i]);
      i++;
    }
  }
  return out;
}

/** Normaliza uma resposta do aluno para comparação. */
export function normalizeAnswer(s: string, lang: LangCode, stripAccents = false): string {
  let r = s.replace(/[’‘]/g, "'").replace(/‿/g, " ").toLowerCase();
  if (lang === "ja") {
    r = r.split("|").join("");
    r = r.replace(/[\s。、！？!?.,「」・~〜]/g, "");
    // romaji: normaliza vogais longas
    r = r.replace(/ō/g, "ou").replace(/ū/g, "uu").replace(/ā/g, "aa").replace(/ē/g, "ee").replace(/ī/g, "ii");
    r = r.replace(/oo/g, "ou");
    return r;
  }
  r = r.replace(/[.,!?;:…"«»“”()¿¡]/g, " ").replace(/\s+/g, " ").trim();
  if (stripAccents) r = r.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return r;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1).fill(0).map((_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Semelhança 0..1 */
export function similarity(a: string, b: string): number {
  const m = Math.max(a.length, b.length);
  if (m === 0) return 1;
  return 1 - levenshtein(a, b) / m;
}

const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf]/;
export function hasKanji(s: string): boolean {
  return KANJI_RE.test(s);
}

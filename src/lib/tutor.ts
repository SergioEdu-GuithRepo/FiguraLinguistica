import { z } from "zod";
import { LANGS } from "./langs";
import { normalizeAnswer, similarity, plainText } from "./tokenize";
import type { ConversationStep, Dictionary, LangCode, Unit } from "./types";

/* ---------------- Contrato de resposta do tutor (secção 8.4) ---------------- */

export const ERROR_CATEGORIES = [
  "vocabulario",
  "ordem",
  "conjugacao",
  "particula",
  "pronuncia",
  "ortografia",
  "genero",
] as const;
export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];

export const CATEGORY_PT: Record<ErrorCategory, string> = {
  vocabulario: "vocabulário",
  ordem: "ordem das palavras",
  conjugacao: "conjugação",
  particula: "partícula",
  pronuncia: "pronúncia",
  ortografia: "ortografia",
  genero: "género / artigo",
};

export const TutorReplySchema = z.object({
  resposta_do_tutor: z.string().min(1).max(800),
  traducao_pt: z.string().max(800).nullish(),
  avaliacao: z.enum(["correcta", "pouco_natural", "incompreensivel"]),
  correccao: z
    .object({
      frase_natural: z.string().min(1).max(300),
      explicacao: z.string().min(1).max(240),
      categoria: z.enum(ERROR_CATEGORIES),
    })
    .nullish(),
  novas_palavras: z
    .array(z.object({ texto: z.string().max(80), pt: z.string().max(120) }))
    .max(5)
    .default([]),
  proximo_passo: z.enum(["continuar", "repetir", "concluir"]),
  ajuda_sugerida: z.string().max(240).nullish(),
});
export type TutorReply = z.infer<typeof TutorReplySchema>;

export const TutorRequestSchema = z.object({
  lang: z.enum(["en", "fr", "ja"]),
  unitId: z.string().max(20),
  stepIndex: z.number().int().min(0).max(20),
  userText: z.string().min(1).max(400),
  mode: z.enum(["guiado", "livre", "desafio"]).default("guiado"),
  history: z
    .array(z.object({ author: z.enum(["tutor", "user"]), text: z.string().max(800) }))
    .max(30)
    .default([]),
  level: z.number().int().min(1).max(45),
  furigana: z.boolean().default(true),
});
export type TutorRequest = z.infer<typeof TutorRequestSchema>;

/* ---------------- Motor offline (sem chave de IA) ---------------- */

function words(s: string, lang: LangCode): string[] {
  if (lang === "ja") return Array.from(normalizeAnswer(s, lang));
  return normalizeAnswer(s, lang).split(" ").filter(Boolean);
}

/** Lista de ajuda em escada: dica → início da frase → frase completa → tradução */
export function helpLadder(step: ConversationStep, lang: LangCode): { label: string; text: string }[] {
  return [
    { label: "Dica", text: step.hint },
    { label: "Começa assim", text: step.starter + "…" },
    { label: "Frase completa", text: step.model + (lang === "ja" && step.model_romaji ? `  (${step.model_romaji})` : "") },
    { label: "Tradução", text: step.model_pt },
  ];
}

interface Diagnosis {
  avaliacao: TutorReply["avaliacao"];
  best: string;
  correccao: TutorReply["correccao"];
}

function isRomaji(s: string) {
  return /^[a-zA-Z\s.,!?'’-]+$/.test(s.trim());
}

export function diagnose(userText: string, step: ConversationStep, lang: LangCode, dict: Dictionary): Diagnosis {
  const u = normalizeAnswer(userText, lang);
  const uNoAcc = normalizeAnswer(userText, lang, true);
  const userIsRomaji = lang === "ja" && isRomaji(userText);

  let best = step.model;
  let bestSim = -1;
  for (const e of step.expected) {
    if (lang === "ja" && userIsRomaji !== isRomaji(e)) continue;
    const n = normalizeAnswer(e, lang);
    if (n === u) return { avaliacao: "correcta", best: e, correccao: null };
    if (normalizeAnswer(e, lang, true) === uNoAcc) {
      return {
        avaliacao: "correcta",
        best: e,
        correccao: { frase_natural: e, explicacao: "Atenção aos acentos — o resto está perfeito.", categoria: "ortografia" },
      };
    }
    const sim = similarity(normalizeAnswer(e, lang, true), uNoAcc);
    if (sim > bestSim) {
      bestSim = sim;
      best = e;
    }
  }
  if (bestSim < 0) {
    // utilizador escreveu numa escrita diferente das variantes: compara com todas
    for (const e of step.expected) {
      const sim = similarity(normalizeAnswer(e, lang, true), uNoAcc);
      if (sim > bestSim) {
        bestSim = sim;
        best = e;
      }
    }
  }

  const kwHits = step.keywords.filter((k) => {
    const nk = normalizeAnswer(k, lang, true);
    return uNoAcc.includes(nk);
  });
  const kwOk = kwHits.length === step.keywords.length || (step.keywords.length > 2 && kwHits.length >= step.keywords.length - 1);

  // Explicação curta (no máximo 1-2 pontos)
  const bw = words(best, lang);
  const uw = words(userText, lang);
  let categoria: ErrorCategory = "vocabulario";
  let explicacao = "";
  if (lang !== "ja") {
    const missing = bw.filter((w) => !uw.includes(w));
    const extra = uw.filter((w) => !bw.includes(w));
    const sameSet = missing.length === 0 && extra.length === 0;
    if (sameSet) {
      categoria = "ordem";
      explicacao = "As palavras estão certas, mas a ordem natural é outra.";
    } else {
      // palavra parecida mas diferente → conjugação / género
      const pairs: [string, string][] = [];
      for (const m of missing) {
        const close = extra.find((x) => similarity(x, m) >= 0.5);
        if (close) pairs.push([close, m]);
      }
      if (pairs.length) {
        const [wrong, right] = pairs[0];
        const pos = dict[right]?.pos;
        categoria = pos === "verb" || pos === "aux" ? "conjugacao" : pos === "det" ? "genero" : "ortografia";
        explicacao = `Diz-se «${right}» e não «${wrong}».`;
        if (pairs[1]) explicacao += ` E «${pairs[1][1]}» em vez de «${pairs[1][0]}».`;
      } else if (missing.length) {
        const m = missing.slice(0, 2).map((x) => `«${x}»`).join(" e ");
        const det = missing.some((x) => dict[x]?.pos === "det");
        categoria = det ? "genero" : "vocabulario";
        explicacao = `Falta ${m} para soar natural.`;
      } else if (extra.length) {
        explicacao = `Podes tirar ${extra.slice(0, 2).map((x) => `«${x}»`).join(" e ")}.`;
      }
    }
  } else {
    const particles = ["は", "が", "を", "に", "で", "と", "の", "も", "へ"];
    const bp = particles.filter((p) => best.includes(p));
    const missingP = bp.filter((p) => !userText.includes(p));
    if (!userIsRomaji && missingP.length) {
      categoria = "particula";
      explicacao = `Repara na partícula «${missingP[0]}».`;
    } else {
      explicacao = "Compara com a versão natural e repete-a.";
    }
  }

  if (bestSim >= 0.72 || (kwOk && bestSim >= 0.45)) {
    return {
      avaliacao: "pouco_natural",
      best,
      correccao: { frase_natural: best, explicacao: explicacao || "Assim soa mais natural.", categoria },
    };
  }
  return {
    avaliacao: "incompreensivel",
    best,
    correccao: { frase_natural: step.model, explicacao: explicacao || "Tenta usar o molde da cena.", categoria },
  };
}

export function offlineTurn(params: {
  unit: Unit;
  stepIndex: number;
  userText: string;
  dict: Dictionary;
  attempt: number;
}): TutorReply {
  const { unit, stepIndex, userText, dict, attempt } = params;
  const lang = unit.lang;
  const meta = LANGS[lang];
  const steps = unit.conversation.steps;
  const step = steps[stepIndex];
  const d = diagnose(userText, step, lang, dict);
  const isLast = stepIndex >= steps.length - 1;
  const praise = meta.praise[Math.floor(Math.random() * meta.praise.length)];

  if (d.avaliacao === "incompreensivel" && attempt < 2) {
    return {
      resposta_do_tutor: meta.repeat,
      traducao_pt: lang === "en" ? "Desculpa, podes repetir?" : lang === "fr" ? "Desculpa? Podes repetir?" : "Desculpa, mais uma vez, por favor.",
      avaliacao: d.avaliacao,
      correccao: attempt === 1 ? d.correccao : null,
      novas_palavras: [],
      proximo_passo: "repetir",
      ajuda_sugerida: attempt === 0 ? step.hint : `${step.starter}…`,
    };
  }

  const nextStep = steps[stepIndex + 1];
  const nextLine = isLast ? unit.conversation.closing : plainText(nextStep.tutor, lang);
  const nextPt = isLast ? unit.conversation.closing_pt : nextStep.tutor_pt;
  const lead = d.avaliacao === "correcta" ? praise + " " : "";
  return {
    resposta_do_tutor: lead + nextLine,
    traducao_pt: nextPt,
    avaliacao: d.avaliacao,
    correccao: d.correccao,
    novas_palavras: [],
    proximo_passo: isLast ? "concluir" : "continuar",
    ajuda_sugerida: null,
  };
}

/** Turno offline para o modo «Livre» (conversa aberta sobre o tema da unidade). */
export function offlineFreeTurn(params: {
  unit: Unit;
  stepIndex: number;
  userText: string;
  dict: Dictionary;
}): TutorReply {
  const { unit, stepIndex, userText, dict } = params;
  const lang = unit.lang;
  const meta = LANGS[lang];
  const steps = unit.conversation.steps;
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLast = stepIndex >= steps.length - 1;
  const praise = meta.praise[Math.floor(Math.random() * meta.praise.length)];

  const trimmed = userText.trim();
  const tokenList = words(trimmed, lang);
  const minLen = lang === "ja" ? 2 : 2;

  if (tokenList.length < minLen && trimmed.length < 3) {
    return {
      resposta_do_tutor: meta.repeat,
      traducao_pt: "Podes desenvolver um pouco mais a tua resposta?",
      avaliacao: "incompreensivel",
      correccao: {
        frase_natural: step.model,
        explicacao: "No modo livre, tenta responder com uma frase completa sobre o tema.",
        categoria: "vocabulario",
      },
      novas_palavras: [],
      proximo_passo: "repetir",
      ajuda_sugerida: `Ideia: ${step.model_pt}`,
    };
  }

  // Verifica se o aluno usou vocabulário válido do dicionário ou respondeu próximo ao esperado
  const d = diagnose(userText, step, lang, dict);
  const knownTokens = tokenList.filter((w) => w in dict || step.keywords.some((k) => normalizeAnswer(k, lang, true) === w));
  const avaliacao: TutorReply["avaliacao"] =
    d.avaliacao === "correcta" || knownTokens.length >= Math.min(2, tokenList.length)
      ? "correcta"
      : "pouco_natural";

  const correccao =
    avaliacao === "correcta"
      ? d.correccao
      : {
          frase_natural: step.model,
          explicacao: `Boa iniciativa! Uma forma muito natural neste tema é: «${step.model}».`,
          categoria: "vocabulario" as ErrorCategory,
        };

  const sampleVocab = unit.vocab
    .slice(stepIndex * 2, stepIndex * 2 + 2)
    .filter((k) => dict[k])
    .map((k) => ({ texto: k, pt: dict[k].pt }));

  const nextStep = steps[stepIndex + 1];
  const nextLine = isLast ? unit.conversation.closing : plainText(nextStep.tutor, lang);
  const nextPt = isLast ? unit.conversation.closing_pt : nextStep.tutor_pt;

  return {
    resposta_do_tutor: `${praise} ${nextLine}`,
    traducao_pt: nextPt,
    avaliacao,
    correccao,
    novas_palavras: sampleVocab,
    proximo_passo: isLast ? "concluir" : "continuar",
    ajuda_sugerida: null,
  };
}

/* ---------------- Prompt de sistema (secção 8.5) ---------------- */

export function buildSystemPrompt(
  unit: Unit,
  level: number,
  stepIndex: number,
  furigana: boolean,
  mode: "guiado" | "livre" | "desafio" = "guiado",
): string {
  const meta = LANGS[unit.lang];
  const steps = unit.conversation.steps;
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const next = steps[stepIndex + 1];
  const vocab = unit.vocab.join(", ");
  const isLast = stepIndex >= steps.length - 1;

  if (mode === "livre") {
    return [
      `És ${meta.tutor.name}, tutor(a) de ${meta.name.toLowerCase()} de ${meta.tutor.city}, simpático(a) e informal, na app FiguraLinguística.`,
      `MODO CONVERSA LIVRE sobre o tema "${unit.title}" (${unit.category}). Nível do aluno: ${level} de 45.`,
      `Vocabulário sugerido da cena: ${vocab}. Adapta-te ao que o aluno disser com liberdade, mantendo frases curtas e naturais para o nível ${level}.`,
      isLast
        ? `Este é o último turno (${stepIndex + 1}/${steps.length}): responde naturalmente ao aluno, elogia e encerra a conversa (proximo_passo="concluir").`
        : `Turno ${stepIndex + 1}/${steps.length}: reage ao que o aluno disse e faz uma pergunta aberta sobre o tema (podes inspirar-te em "${plainText((next ?? step).tutor, unit.lang)}") com proximo_passo="continuar".`,
      `Corrige apenas se houver algo que impeça a compreensão ou soe pouco natural (1 ponto no máximo, explicação curta em português).`,
      unit.lang === "ja"
        ? `Usa forma adequada ao nível (${level >= 37 ? "podes aceitar forma casual ou です/ます" : "usa forma です/ます"}). ${furigana ? "Para palavras com kanji, indica a leitura em kana entre parênteses." : ""}`
        : "",
      `Responde APENAS com JSON válido (sem markdown) com os campos: resposta_do_tutor, traducao_pt, avaliacao ("correcta"|"pouco_natural"|"incompreensivel"), correccao (null ou {frase_natural, explicacao, categoria: um de ${ERROR_CATEGORIES.join("|")}}), novas_palavras (lista de {texto, pt}, máx 2), proximo_passo ("continuar"|"repetir"|"concluir"), ajuda_sugerida (string ou null).`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `És ${meta.tutor.name}, tutor(a) de ${meta.name.toLowerCase()} de ${meta.tutor.city}, simpático(a) e informal, na app FiguraLinguística.`,
    `O aluno fala português (Angola/Portugal/Brasil). Nível do aluno: ${level} de 45.`,
    `Cena: "${unit.title}" (${unit.titleTarget}). Objectivo da cena: ${unit.objective}`,
    `Vocabulário permitido (prioritário): ${vocab}. Não uses vocabulário fora do nível sem glosa em português.`,
    `Passo actual da conversa ${mode === "desafio" ? "em MODO DESAFIO (sem dicas)" : "guiada"} (${stepIndex + 1}/${steps.length}): perguntaste "${plainText(step.tutor, unit.lang)}" e esperas algo como "${step.model}".`,
    isLast
      ? `Este é o último passo: se a resposta for compreensível, fecha a cena com uma frase curta (ex.: "${unit.conversation.closing}") e usa proximo_passo="concluir".`
      : `Se a resposta for compreensível, reage brevemente e faz a próxima pergunta, próxima de: "${plainText(next.tutor, unit.lang)}" (proximo_passo="continuar").`,
    mode === "desafio"
      ? `No modo desafio, avança sempre (proximo_passo="${isLast ? "concluir" : "continuar"}") e deixa ajuda_sugerida=null.`
      : `Se a resposta for incompreensível, pede para repetir de forma natural (ex.: "${meta.repeat}") e usa proximo_passo="repetir" com uma ajuda_sugerida em português.`,
    `Regras: frases curtas, uma pergunta de cada vez, tom encorajador. Corrige no máximo 1 a 2 pontos, com explicação em português numa linha. Nunca corrijas tudo de uma vez.`,
    unit.lang === "ja"
      ? `Usa forma です/ます. ${furigana ? "Para palavras com kanji, indica a leitura em kana entre parênteses a seguir à palavra." : ""}`
      : "",
    `Temas sensíveis: sai graciosamente e volta à cena.`,
    `Responde APENAS com JSON válido (sem markdown) com os campos: resposta_do_tutor (no idioma-alvo), traducao_pt, avaliacao ("correcta"|"pouco_natural"|"incompreensivel"), correccao (null ou {frase_natural, explicacao, categoria: um de ${ERROR_CATEGORIES.join("|")}}), novas_palavras (lista de {texto, pt}, no máximo 2), proximo_passo ("continuar"|"repetir"|"concluir"), ajuda_sugerida (string ou null).`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("sem JSON");
  return JSON.parse(text.slice(start, end + 1));
}

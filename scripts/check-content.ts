/**
 * Valida o conteúdo curado: cobertura do dicionário, estrutura das unidades, referências.
 * Uso: npm run check:content                  (todos)
 *      npm run check:content -- en            (só um idioma)
 *      npm run check:content -- en 19-27      (só um intervalo de níveis)
 */
import { CONTENT, DICT_PARTS } from "../src/content";
import { CONTEXT_EXTRA_DICT } from "../src/content/contexts-dict";
import { KANJI, KANJI_ORDER } from "../src/content/ja/kanji";
import { CONTEXT_PACKS } from "../src/lib/contexts";
import { tokenize, plainText, fillTemplate, normalizeAnswer } from "../src/lib/tokenize";
import type { Dictionary, LangCode, Unit } from "../src/lib/types";

const only = process.argv[2] as LangCode | undefined;
const rangeArg = process.argv[3];
const [rangeFrom, rangeTo] = rangeArg ? rangeArg.split("-").map(Number) : [undefined, undefined];
const langs: LangCode[] = only ? [only] : ["en", "fr", "ja"];

let errors = 0;
let warnings = 0;
const err = (m: string) => {
  errors++;
  console.log("  ✗ " + m);
};
const warn = (m: string) => {
  warnings++;
  console.log("  ! " + m);
};

for (const lang of langs) {
  const parts = DICT_PARTS[lang];
  const stageIdx =
    rangeFrom === 19 ? 2 : rangeFrom === 28 ? 3 : rangeFrom === 37 ? 4 : rangeFrom === 46 ? 5 : undefined;
  const dictionary: Dictionary =
    stageIdx !== undefined ? Object.assign({}, ...parts.slice(0, stageIdx + 1)) : CONTENT[lang].dictionary;
  const allLangUnits = CONTENT[lang].units;
  const units =
    rangeFrom !== undefined && rangeTo !== undefined
      ? allLangUnits.filter((u) => u.level >= rangeFrom && u.level <= rangeTo)
      : allLangUnits;

  console.log(
    `\n=== ${lang.toUpperCase()}${rangeArg ? ` (${rangeArg})` : ""} — ${units.length} unidades, ${Object.keys(dictionary).length} entradas ===`
  );
  const missing = new Map<string, string[]>();

  const dictToInspect = stageIdx !== undefined ? parts[stageIdx] : dictionary;
  for (const [k, e] of Object.entries(dictToInspect)) {
    if (k !== k.toLowerCase()) err(`chave do dicionário não está em minúsculas: "${k}"`);
    if (!e.pt) err(`entrada sem "pt": "${k}"`);
    if (lang === "ja" && !e.romaji) err(`entrada japonesa sem romaji: "${k}"`);
    if (lang === "fr" && e.pos === "noun" && !e.gender) warn(`substantivo FR sem género: "${k}"`);
  }
  // chaves repetidas entre etapas (a etapa posterior não deve redefinir entradas)
  if (stageIdx !== undefined) {
    for (const k of Object.keys(parts[stageIdx])) {
      if (parts.slice(0, stageIdx).some((p) => k in p)) {
        err(`chave repetida no dicionário da etapa ${stageIdx + 1} (já existe nas etapas anteriores): "${k}"`);
      }
    }
  } else {
    for (let i = 1; i < parts.length; i++) {
      for (const k of Object.keys(parts[i])) {
        if (parts.slice(0, i).some((p) => k in p)) err(`chave repetida no dicionário da etapa ${i + 1} (já existe antes): "${k}"`);
      }
    }
    for (const [k, e] of Object.entries(CONTEXT_EXTRA_DICT[lang])) {
      if (k !== k.toLowerCase()) err(`CONTEXT_EXTRA_DICT[${lang}] chave não está em minúsculas: "${k}"`);
      if (!e.pt) err(`CONTEXT_EXTRA_DICT[${lang}] entrada sem "pt": "${k}"`);
      if (lang === "ja" && !e.romaji) err(`CONTEXT_EXTRA_DICT[ja] sem romaji: "${k}"`);
      if (lang === "fr" && e.pos === "noun" && !e.gender) warn(`CONTEXT_EXTRA_DICT[fr] substantivo sem género: "${k}"`);
    }
    for (const pack of CONTEXT_PACKS) {
      const pData = pack.byLang[lang];
      for (const vk of pData.vocabKeys) {
        if (!dictionary[vk.toLowerCase()]) {
          err(`contexto "${pack.id}" (${lang}): vocabKey "${vk}" não existe no dicionário`);
        }
      }
      for (const sit of pData.situations) {
        if (!sit.options.includes(sit.correct)) {
          err(`contexto "${pack.id}" (${lang}) situação ${sit.id}: resposta correcta não está em options`);
        }
      }
    }
  }
  if (lang === "ja") {
    const allowed = new Set([...KANJI_ORDER]);
    const bad = new Set<string>();
    for (const [k, e] of Object.entries(dictToInspect)) {
      for (const ch of k.match(/[\u4e00-\u9faf]/g) ?? []) if (!allowed.has(ch)) bad.add(ch);
      if (/[\u4e00-\u9faf\u30a0-\u30ff]/.test(k) && !e.reading) err(`entrada japonesa com kanji/katakana sem reading: "${k}"`);
    }
    if (bad.size) err(`kanji fora do conjunto permitido (KANJI_ORDER em ja/kanji.ts): ${[...bad].join(" ")}`);
  }

  const checkText = (text: string, where: string) => {
    if (lang === "ja" && text.length > 1 && !text.includes("|") && /[ぁ-んァ-ン一-龯]/.test(text) && text.length > 4)
      warn(`${where}: texto japonês sem separadores "|": ${text}`);
    for (const t of tokenize(text, lang, dictionary)) {
      if (!t.isPunct && !t.entry && t.key) {
        const arr = missing.get(t.key) ?? [];
        arr.push(where);
        missing.set(t.key, arr);
      }
    }
  };

  if (rangeFrom !== undefined && rangeTo !== undefined) {
    const expectedCount = rangeTo - rangeFrom + 1;
    if (units.length !== expectedCount) {
      err(`esperadas ${expectedCount} unidades (${rangeFrom}–${rangeTo}), encontradas ${units.length}`);
    }
  }

  const ids = new Set<string>();
  units.forEach((u: Unit, idx) => {
    const expectedLevel = rangeFrom !== undefined ? rangeFrom + idx : idx + 1;
    const W = u.id;
    if (ids.has(u.id)) err(`id duplicado ${u.id}`);
    ids.add(u.id);
    if (u.id !== `${lang}-${expectedLevel}`) err(`${W}: id esperado ${lang}-${expectedLevel}`);
    if (u.lang !== lang) err(`${W}: lang errada`);
    if (u.level !== expectedLevel) err(`${W}: level esperado ${expectedLevel}`);
    if (u.dialogue.length < 5) err(`${W}: diálogo curto (${u.dialogue.length})`);
    if (u.patterns.length < 2) err(`${W}: menos de 2 moldes`);
    if (u.vocab.length < 8) err(`${W}: menos de 8 palavras de vocabulário`);
    if (u.build.length < 3) err(`${W}: menos de 3 exercícios de montar`);
    if (u.conversation.steps.length < 3) err(`${W}: conversa com menos de 3 passos`);

    const pids = new Set(u.patterns.map((p) => p.id));
    u.dialogue.forEach((d, i) => {
      checkText(d.text, `${W} diálogo#${i + 1}`);
      if (!d.pt) err(`${W} diálogo#${i + 1}: sem pt`);
      if (lang === "ja" && !d.romaji) err(`${W} diálogo#${i + 1}: sem romaji`);
      if (d.patternId && !pids.has(d.patternId)) err(`${W} diálogo#${i + 1}: patternId inexistente ${d.patternId}`);
    });
    u.patterns.forEach((p) => {
      if (!p.template.includes("{x}")) err(`${W} molde ${p.id}: sem {x}`);
      if (!p.pt.includes("{x}")) err(`${W} molde ${p.id}: pt sem {x}`);
      if (lang === "ja" && !p.romaji) err(`${W} molde ${p.id}: sem romaji`);
      if (p.slots.length < 3) err(`${W} molde ${p.id}: menos de 3 opções`);
      p.slots.forEach((s, si) => {
        checkText(fillTemplate(p.template, s.text), `${W} molde ${p.id} opção#${si + 1}`);
        if (lang === "ja" && !s.romaji) err(`${W} molde ${p.id} opção#${si + 1}: sem romaji`);
      });
    });
    u.vocab.forEach((v) => {
      if (!dictionary[v]) err(`${W}: vocab "${v}" não existe no dicionário`);
    });
    u.build.forEach((b, bi) => {
      const sep = lang === "ja" ? "|" : " ";
      checkText(b.chunks.join(sep), `${W} montar#${bi + 1}`);
      (b.distractors ?? []).forEach((d) => checkText(d, `${W} montar#${bi + 1} distractor`));
      if (lang === "ja" && !b.romaji) err(`${W} montar#${bi + 1}: sem romaji`);
      if (b.chunks.length < 3) err(`${W} montar#${bi + 1}: menos de 3 blocos`);
    });
    u.conversation.steps.forEach((s, si) => {
      const w = `${W} conversa#${si + 1}`;
      checkText(s.tutor, w + " tutor");
      if (lang === "ja" && !s.tutor_romaji) err(`${w}: sem tutor_romaji`);
      if (lang === "ja" && !s.model_romaji) err(`${w}: sem model_romaji`);
      if (s.expected.length < 2) err(`${w}: menos de 2 respostas aceites`);
      if (!s.keywords.length) err(`${w}: sem keywords`);
      const nModel = normalizeAnswer(s.model, lang);
      const okModel = s.expected.some((e) => normalizeAnswer(e, lang) === nModel);
      if (!okModel) err(`${w}: o "model" deve estar também em "expected"`);
      if (s.model.includes("|")) err(`${w}: model não deve ter "|"`);
      s.expected.forEach((e) => {
        if (e.includes("|")) err(`${w}: expected não deve ter "|"`);
      });
      for (const kw of s.keywords) {
        const inModel = normalizeAnswer(s.model, lang, true).includes(normalizeAnswer(kw, lang, true));
        const inRomaji = s.model_romaji ? normalizeAnswer(s.model_romaji, lang, true).includes(normalizeAnswer(kw, lang, true)) : false;
        if (!inModel && !inRomaji) err(`${w}: keyword "${kw}" não aparece no model`);
      }
      if (lang === "ja") {
        const hasRomaji = s.expected.some((e) => /^[a-zA-Z\s.,!?'-]+$/.test(e));
        if (!hasRomaji) err(`${w}: em japonês, incluir pelo menos uma variante em romaji em "expected"`);
      }
    });
    if (lang === "ja" && plainText(u.titleTarget, lang).includes("|")) err(`${W}: titleTarget com "|"`);
  });

  if (missing.size) {
    err(`${missing.size} palavras em falta no dicionário:`);
    for (const [k, w] of missing) console.log(`      "${k}"  ← ${w.slice(0, 2).join(", ")}${w.length > 2 ? ` (+${w.length - 2})` : ""}`);
  }
}

if (langs.includes("ja")) {
  console.log(`\n=== KANJI — ${KANJI.length} de ${[...KANJI_ORDER].length} ===`);
  const order = [...KANJI_ORDER];
  if (new Set(order).size !== order.length) err("KANJI_ORDER tem caracteres repetidos");
  if (KANJI.length !== order.length) err(`KANJI tem ${KANJI.length} entradas; KANJI_ORDER tem ${order.length}`);
  KANJI.forEach((k, i) => {
    if (k.char !== order[i]) err(`KANJI[${i}] é "${k.char}", esperado "${order[i]}" (mesma ordem de KANJI_ORDER)`);
    if (!k.meaning) err(`kanji ${k.char}: sem meaning`);
    if (!k.on.length && !k.kun.length) err(`kanji ${k.char}: sem leituras`);
    if (!(k.strokes > 0)) err(`kanji ${k.char}: strokes inválido`);
    if (k.examples.length < 2) err(`kanji ${k.char}: menos de 2 exemplos`);
    k.examples.forEach((e) => {
      if (!e.word.includes(k.char)) err(`kanji ${k.char}: exemplo "${e.word}" não contém o kanji`);
      if (!e.reading || /[\u4e00-\u9faf]/.test(e.reading)) err(`kanji ${k.char}: exemplo "${e.word}" com reading inválido`);
      if (!e.romaji || !e.pt) err(`kanji ${k.char}: exemplo "${e.word}" sem romaji/pt`);
    });
  });
}

console.log(`\n${errors} erros, ${warnings} avisos`);
process.exit(errors ? 1 : 0);

/**
 * Testes de lógica (sem browser): motor do tutor offline, tokenização, FSRS e progressão.
 * Uso: npm run test:logic
 */
import assert from "node:assert/strict";
import { CONTENT } from "@/content";
import type { LangCode } from "@/lib/types";
import { diagnose, offlineTurn, offlineFreeTurn, extractJson, TutorReplySchema } from "@/lib/tutor";
import { tokenize, fillTemplate, normalizeAnswer } from "@/lib/tokenize";
import { review, isStrong } from "@/lib/fsrs";
import { assessPronunciation, toKana } from "@/lib/pronunciation";
import { buildParticleItems, maskRomaji, PARTICLE_INFO } from "@/lib/particles";
import { adaptOffline, prepareText, segmentJa } from "@/lib/adapt-offline";
import { KANJI, KANJI_ORDER } from "@/content/ja/kanji";
import { DEFAULT_NEURAL, isNeuralVoice, NEURAL_VOICES, neuralVoiceFor, normalizeTtsText, rateToProsody, ttsUrl, voiceForSpeaker } from "@/lib/voices";
import { buildQuickResponsePrompts, buildTranslateSensePrompts, buildStageExam, STAGE_MILESTONES } from "@/lib/fluencia";
import { COUNTERS, POLITENESS_ROWS, buildCortesiaQuiz } from "@/lib/cortesia";
import { CONTEXT_PACKS, buildContextualVocabDrill, searchDictionary } from "@/lib/contexts";
import { mergeUserStates } from "@/lib/server/cloud-db";
import {
  defaultState,
  completeStep,
  STEPS,
  currentLevel,
  isUnitUnlocked,
  nextUnitId,
  unitDone,
  todayProgress,
  currentStreak,
  rateItem,
  saveWordsBatch,
  dueItems,
  conversationsLeft,
  addActivity,
  recordError,
  recordResponseMetric,
  passStageExam,
  studentModelSummary,
  recommendedPack,
} from "@/lib/state";

let passed = 0;
const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`✗ ${name}: ${(e as Error).message}`);
  }
}

const LANGS: LangCode[] = ["en", "fr", "ja"];

/* ---------- 1. Motor do tutor ---------- */
for (const lang of LANGS) {
  const { units, dictionary } = CONTENT[lang];
  for (const unit of units) {
    unit.conversation.steps.forEach((step, i) => {
      for (const e of step.expected) {
        check(`${unit.id} passo ${i}: variante «${e}» é correcta`, () => {
          const d = diagnose(e, step, lang, dictionary);
          assert.equal(d.avaliacao, "correcta");
        });
      }
      check(`${unit.id} passo ${i}: resposta sem sentido → incompreensível`, () => {
        const d = diagnose(lang === "ja" ? "ぬぬぬ" : "zzz qqq", step, lang, dictionary);
        assert.equal(d.avaliacao, "incompreensivel");
        assert.ok(d.correccao?.frase_natural);
      });
      if (lang !== "ja") {
        const ws = step.model.split(" ");
        const near = ws.filter((_, k) => k !== ws.length - 2).join(" ");
        const isVariant = step.expected.some((e) => normalizeAnswer(e, lang, true) === normalizeAnswer(near, lang, true));
        if (ws.length >= 4 && !isVariant) {
          check(`${unit.id} passo ${i}: quase certo «${near}» → corrigido`, () => {
            const d = diagnose(near, step, lang, dictionary);
            assert.notEqual(d.avaliacao, "correcta");
            assert.ok(d.correccao && d.correccao.explicacao.length > 0);
          });
        }
      }
      check(`${unit.id} passo ${i}: offlineTurn devolve resposta válida`, () => {
        const r = offlineTurn({ unit, stepIndex: i, userText: step.model, dict: dictionary, attempt: 0 });
        TutorReplySchema.parse(r);
        assert.equal(r.avaliacao, "correcta");
        assert.equal(r.proximo_passo, i === unit.conversation.steps.length - 1 ? "concluir" : "continuar");
        assert.ok(!r.resposta_do_tutor.includes("|"), "texto do tutor não deve conter '|'");
      });
      check(`${unit.id} passo ${i}: tentativa falhada pede repetição com ajuda`, () => {
        const r = offlineTurn({ unit, stepIndex: i, userText: "xx", dict: dictionary, attempt: 0 });
        assert.equal(r.proximo_passo, "repetir");
        assert.ok(r.ajuda_sugerida);
        const r3 = offlineTurn({ unit, stepIndex: i, userText: "xx", dict: dictionary, attempt: 2 });
        assert.notEqual(r3.proximo_passo, "repetir");
      });
    });

    /* ---------- 2. Tokenização: sem tokens desconhecidos ---------- */
    check(`${unit.id}: todos os tokens do diálogo e moldes têm entrada no dicionário`, () => {
      const texts = [
        ...unit.dialogue.map((l) => l.text),
        ...unit.patterns.flatMap((p) => p.slots.map((s) => fillTemplate(p.template, s.text))),
      ];
      for (const t of texts) {
        for (const tok of tokenize(t, lang, dictionary)) {
          if (!tok.isPunct && !/^[\d:.,h]+$/.test(tok.text)) assert.ok(tok.entry, `sem entrada: «${tok.text}» em «${t}»`);
        }
      }
    });
  }
}

/* ---------- 3. Normalização ---------- */
check("Voz neural: personagens diferentes têm vozes diferentes", () => {
  for (const lang of LANGS) {
    const tutor = DEFAULT_NEURAL[lang];
    const name = { en: "Emma", fr: "Claire", ja: "Haruto" }[lang];
    assert.equal(voiceForSpeaker(lang, name, name, tutor), tutor);
    assert.notEqual(voiceForSpeaker(lang, "Tu", name, tutor), tutor);
    assert.ok(NEURAL_VOICES[lang].some((v) => v.id === voiceForSpeaker(lang, "Empregado", name, tutor)));
  }
});
check("Voz neural: prosódia, normalização e URL", () => {
  assert.equal(rateToProsody(1), "+0%");
  assert.equal(rateToProsody(0.6), "-40%");
  assert.equal(rateToProsody(1.25), "+25%");
  assert.equal(normalizeTtsText("コーヒー|を|ください|。"), "コーヒーをください。");
  assert.equal(normalizeTtsText("Vous‿êtes  portugaise ?"), "Vous êtes portugaise ?");
  const u = new URL("http://x" + ttsUrl("Hello|", "en", "en-GB-SoniaNeural", 0.93));
  assert.equal(u.searchParams.get("rate"), "0.95");
  assert.equal(u.searchParams.get("text"), "Hello");
  assert.ok(!isNeuralVoice("en", "ja-JP-KeitaNeural"));
  assert.equal(neuralVoiceFor("fr", "inexistente"), DEFAULT_NEURAL.fr);
});
check("normalizeAnswer ignora maiúsculas/pontuação (en)", () => {
  assert.equal(normalizeAnswer("Hello, Emma!", "en"), normalizeAnswer("hello emma", "en"));
});
check("normalizeAnswer remove acentos quando pedido (fr)", () => {
  assert.equal(normalizeAnswer("Ça va très bien", "fr", true), normalizeAnswer("ca va tres bien", "fr", true));
});
check("normalizeAnswer ignora espaços e '|' (ja)", () => {
  assert.equal(normalizeAnswer("コーヒー|を|ください|。", "ja"), normalizeAnswer("コーヒー を ください", "ja"));
});
check("extractJson tolera texto à volta", () => {
  assert.deepEqual(extractJson('Aqui está:\n```json\n{"a":1}\n```'), { a: 1 });
});

/* ---------- 4. FSRS ---------- */
check("FSRS: intervalos crescem com respostas 'Bom'", () => {
  const t0 = Date.now();
  let c = review(undefined, 3, t0);
  const first = c.due - t0;
  let now = c.due;
  for (let k = 0; k < 3; k++) {
    c = review(c, 3, now);
    now = c.due;
  }
  assert.ok(c.due - c.last! > first, "intervalo final deve ser maior que o primeiro");
  assert.ok(isStrong(c, c.last!), "cartão deve ficar forte");
});
check("FSRS: 'Errei' encurta o intervalo", () => {
  const t0 = Date.now();
  const good = review(review(undefined, 3, t0), 3, t0 + 86400000);
  const lapse = review(good, 1, good.due);
  assert.ok(lapse.due - good.due < good.due - (t0 + 86400000));
});

/* ---------- 5. Progressão ---------- */
for (const lang of LANGS) {
  check(`${lang}: completar todos os passos conclui a unidade e desbloqueia a seguinte`, () => {
    let s = defaultState("Teste");
    const [u1, u2] = CONTENT[lang].units;
    assert.equal(currentLevel(s, lang), 1);
    assert.ok(isUnitUnlocked(s, u1.id));
    assert.ok(!isUnitUnlocked(s, u2.id));
    for (const st of STEPS) s = completeStep(s, u1.id, st.id, 10);
    assert.ok(unitDone(s, u1.id));
    assert.equal(currentLevel(s, lang), 2);
    assert.ok(isUnitUnlocked(s, u2.id));
    assert.equal(nextUnitId(s, lang), u2.id);
    assert.ok(s.progress[lang].xp >= STEPS.length * 10 + 25);
    assert.equal(todayProgress(s).pct, 100);
    assert.equal(currentStreak(s), 1);
  });
}
check("Colocação: placedLevel desbloqueia níveis anteriores", () => {
  const s = defaultState("T");
  s.progress.fr.placedLevel = 4;
  assert.equal(currentLevel(s, "fr"), 4);
  assert.ok(isUnitUnlocked(s, "fr-4"));
  assert.ok(!isUnitUnlocked(s, "fr-5"));
});
check("SRS: item avaliado fica agendado (não devido já)", () => {
  let s = defaultState("T");
  s = rateItem(s, "en", "w:hello", 3);
  assert.equal(dueItems(s, "en").length, 0);
  assert.equal(dueItems(s, "en", Date.now() + 30 * 86400000).length, 1);
});
check("Plano gratuito: 5 conversas por dia", () => {
  let s = defaultState("T");
  for (let k = 0; k < 5; k++) s = addActivity(s, "en", "conversation", 5, { conversation: true });
  assert.equal(conversationsLeft(s), 0);
  s.plan = "premium";
  assert.equal(conversationsLeft(s), Infinity);
});

/* ---------------- Fase 2: pronúncia ---------------- */
{
  const P = (lang: LangCode, heard: string, target: string) => assessPronunciation([{ transcript: heard, confidence: 0.9 }], target, lang, CONTENT[lang].dictionary);
  check("Pronúncia EN: frase igual = 100", () => assert.equal(P("en", "I'd like a coffee please", "I'd like a coffee, please.").score, 100));
  check("Pronúncia EN: números em dígitos contam como palavras", () => assert.equal(P("en", "it's half past 7", "It's half past seven.").score, 100));
  check("Pronúncia EN: palavra trocada fica marcada e baixa a nota", () => {
    const r = P("en", "I like a copy please", "I'd like a coffee, please.");
    assert.ok(r.score < 80 && r.score > 30, String(r.score));
    assert.equal(r.words.find((w) => w.text === "coffee")?.status, "miss");
    assert.ok(r.tips.length >= 1 && r.tips.length <= 2);
  });
  check("Pronúncia EN: frase incompleta marca palavras em falta", () => {
    const r = P("en", "thank you", "Thank you very much!");
    assert.ok(r.words.filter((w) => w.status === "miss").length >= 2);
  });
  check("Pronúncia FR: acentos e pontuação ignorados", () => assert.equal(P("fr", "je voudrais un cafe s'il vous plait", "Je voudrais un café, s'il vous plaît.").score, 100));
  check("Pronúncia FR: dica não diz que «café» tem final mudo", () => {
    const r = P("fr", "je vous drais un caca", "Je voudrais un café, s'il vous plaît.");
    assert.ok(!r.tips.some((t) => t.includes("café") && t.includes("muda")), r.tips.join(" | "));
  });
  check("Pronúncia JA: kanji do reconhecimento convertidos em kana", () => {
    assert.equal(P("ja", "珈琲をください", "コーヒー|を|ください|。").score, 100);
    assert.equal(P("ja", "水をお願いします", "みず|を|おねがいします|。").score, 100);
  });
  check("Pronúncia JA: nada ouvido = 0", () => assert.equal(assessPronunciation([], "コーヒー|を|ください|。", "ja", CONTENT.ja.dictionary).score, 0));
  check("Pronúncia: usa a melhor alternativa", () => {
    const r = assessPronunciation([{ transcript: "I like a copy please" }, { transcript: "I'd like a coffee please" }], "I'd like a coffee, please.", "en", CONTENT.en.dictionary);
    assert.equal(r.score, 100);
  });
  check("toKana: katakana → hiragana", () => assert.equal(toKana("コーヒー", {}), "こひ"));
}

/* ---------------- Fase 2: partículas ---------------- */
{
  const items = buildParticleItems(CONTENT.ja.units, CONTENT.ja.dictionary);
  check("Partículas: há itens para は, を, に, で, が", () => {
    for (const p of ["は", "を", "に", "で", "が"]) assert.ok(items.some((i) => i.answer === p), p);
  });
  check("Partículas: cada item tem 4 opções distintas com a resposta", () => {
    for (const it of items) {
      assert.equal(new Set(it.options).size, 4, it.id);
      assert.ok(it.options.includes(it.answer), it.id);
      assert.ok(PARTICLE_INFO[it.answer], it.id);
      assert.equal(it.tokens[it.blank], it.answer, it.id);
    }
  });
  check("Partículas: distractores nunca incluem pares ambíguos (に/へ, は/が, と/も)", () => {
    const bad: Record<string, string> = { に: "へ", へ: "に", は: "が", が: "は", と: "も" };
    for (const it of items) assert.ok(!it.options.includes(bad[it.answer] ?? "∅"), it.id);
  });
  check("Partículas: itens de todas as unidades 1–18", () => {
    const units = new Set(items.map((i) => i.unitId));
    assert.ok(units.size >= 15, String(units.size));
  });
  check("Partículas: romaji esconde a partícula certa", () => {
    const it = items.find((i) => i.romaji && i.answer === "を");
    assert.ok(it);
    const m = maskRomaji(it!.romaji, it!)!;
    assert.ok(m.includes("___"), m);
  });
}

/* ---------------- Fase 2: kanji ---------------- */
check("Kanji: todos os kanji do conteúdo japonês têm ficha no módulo", () => {
  const set = new Set(KANJI.map((k) => k.char));
  const used = new Set(Object.keys(CONTENT.ja.dictionary).join("").match(/[\u4e00-\u9faf]/g) ?? []);
  for (const ch of used) assert.ok(set.has(ch), ch);
  assert.equal(KANJI.length, [...KANJI_ORDER].length);
});

/* ---------------- Fase 2: importar texto sem IA ---------------- */
check("Importar texto JA: segmentação usa o dicionário", () => {
  const seg = segmentJa("コーヒーをください。", CONTENT.ja.dictionary);
  assert.equal(seg, "コーヒー|を|ください|。");
});
for (const lang of LANGS) {
  check(`Importar texto ${lang}: diálogo da unidade 1 é quase todo conhecido e gera perguntas`, () => {
    const raw = CONTENT[lang].units[0].dialogue.map((d) => d.text.split("|").join("").replace(/‿/g, " ")).join("\n");
    const a = adaptOffline(prepareText(raw, lang, CONTENT[lang].dictionary), lang, CONTENT[lang].dictionary);
    assert.ok(a.coverage > 0.9, String(a.coverage));
    assert.ok(a.vocab.length >= 3, String(a.vocab.length));
    assert.ok(a.cloze.length >= 1, String(a.cloze.length));
    for (const q of a.cloze) assert.ok(q.options.includes(q.answer) && q.options.length >= 3);
  });
}
check("Importar texto: frase desconhecida é «difícil»", () => {
  const a = adaptOffline(["Quantum chromodynamics describes gluons."], "en", CONTENT.en.dictionary);
  assert.equal(a.sentences[0].difficulty, "difícil");
  assert.ok(a.unknown.length >= 3);
});
check("Currículo completo (Etapas 1–6): 54 unidades por idioma", () => {
  for (const lang of LANGS) assert.equal(CONTENT[lang].units.length, 54, `${lang}: ${CONTENT[lang].units.length}`);
});
check("Moldes: {x} substituído em todas as ocorrências", () => {
  assert.equal(fillTemplate("Sou de {x}. (Vim de {x}.)", "Angola"), "Sou de Angola. (Vim de Angola.)");
  for (const lang of LANGS)
    for (const u of CONTENT[lang].units)
      for (const p of u.patterns)
        for (const s of p.slots) {
          for (const txt of [fillTemplate(p.template, s.text), fillTemplate(p.pt, s.pt), p.romaji ? fillTemplate(p.romaji, s.romaji ?? "") : ""])
            assert.ok(!txt.includes("{x}"), `${u.id}/${p.id}: ${txt}`);
        }
});

/* ---------------- Fase 3: Modos Livre/Desafio, Modelo do Aluno, Marcos e Cortesia ---------------- */
for (const lang of LANGS) {
  check(`Tutor Modo Livre (${lang}): offlineFreeTurn valida resposta aberta e sugere vocabulário`, () => {
    const u = CONTENT[lang].units[0];
    const r = offlineFreeTurn({ unit: u, stepIndex: 0, userText: u.conversation.steps[0].model, dict: CONTENT[lang].dictionary });
    TutorReplySchema.parse(r);
    assert.equal(r.avaliacao, "correcta");
    assert.equal(r.proximo_passo, "continuar");
  });
  check(`Fluência (${lang}): Responder rápido e Traduzir o sentido geram exercícios válidos`, () => {
    const qr = buildQuickResponsePrompts(lang, 27, 5);
    assert.equal(qr.length, 5);
    assert.ok(qr.every((q) => q.timeLimitSec === 8 && q.tutor.length > 0));
    const ts = buildTranslateSensePrompts(lang, 27, 5);
    assert.equal(ts.length, 5);
    assert.ok(ts.every((t) => t.options.includes(t.step.model) && t.options.length >= 2));
  });
  check(`Marcos e Exames de Etapa (${lang}): 6 etapas geram 6 perguntas cada`, () => {
    assert.equal(STAGE_MILESTONES.length, 6);
    for (let st = 1; st <= 6; st++) {
      const exam = buildStageExam(lang, st);
      assert.equal(exam.length, 6, `${lang} stage ${st}`);
      for (const q of exam) {
        assert.ok(q.options.includes(q.correct), `${q.id} options include correct`);
      }
    }
  });
  check(`Contextos Reais, Pesquisa de Dicionário e Treino em Frase (${lang})`, () => {
    assert.equal(CONTEXT_PACKS.length, 8);
    for (const pack of CONTEXT_PACKS) {
      const data = pack.byLang[lang];
      assert.ok(data.vocabKeys.length >= 6, `${pack.id} ${lang} vocabKeys`);
      assert.ok(data.phrases.length >= 4, `${pack.id} ${lang} phrases`);
      assert.ok(data.situations.length >= 2, `${pack.id} ${lang} situations`);
      for (const vk of data.vocabKeys) {
        assert.ok(CONTENT[lang].dictionary[vk.toLowerCase()], `missing ${vk} in ${lang}`);
      }
      for (const sit of data.situations) {
        assert.ok(sit.options.includes(sit.correct), `${sit.id} correct option`);
      }
      const drill = buildContextualVocabDrill(lang, {}, 9, { packId: pack.id, count: 4 });
      assert.ok(drill.length >= 3, `${pack.id} ${lang} contextual drill (${drill.length})`);
      for (const q of drill) {
        assert.ok(q.options.includes(q.surfaceAnswer), `${q.id} includes surfaceAnswer`);
        assert.ok(q.maskedSentence.includes("＿＿＿"), `${q.id} masked`);
      }
    }
    const sr = searchDictionary(lang, "", { onlyNotes: true });
    assert.ok(sr.total >= 5, `${lang} dictionary notes (${sr.total})`);
  });
}

check("Modelo do Aluno e Pacote Recomendado: regista velocidade, autonomia, erros e certificação de etapa", () => {
  let s = defaultState("Tester");
  s = recordResponseMetric(s, "en", 4500, false);
  s = recordResponseMetric(s, "en", 5500, true);
  s = recordError(s, "en", "conjugacao", "He lives in London.");
  s = recordError(s, "en", "conjugacao", "She works here.");
  const m = studentModelSummary(s, "en");
  assert.equal(m.avgResponseSec, 5);
  assert.equal(m.helpFreeRate, 50);
  assert.equal(m.speedLabel, "Rápida (< 6s)");
  assert.equal(m.topErrors[0].category, "conjugacao");

  const pack = recommendedPack(s, "en");
  assert.ok(pack);
  assert.equal(pack!.badge, "Reforço personalizado");

  s = passStageExam(s, "en", 1);
  assert.ok(s.progress.en.stageExams?.includes(1));
  assert.ok(s.progress.en.placedLevel >= 10);
});

check("Japonês Avançado (Contadores e Keigo): dados completos e quiz válido", () => {
  assert.ok(COUNTERS.length >= 5);
  for (const c of COUNTERS) {
    assert.equal(c.items.length, 10, c.id);
  }
  assert.ok(POLITENESS_ROWS.length >= 6);
  const qz = buildCortesiaQuiz();
  assert.ok(qz.length >= 6);
  for (const q of qz) {
    assert.ok(q.options.some((o) => o.label === q.correct), q.id);
  }
});

check("Base de dados na nuvem: mergeUserStates preserva progresso de dois dispositivos", () => {
  let devA = defaultState("Ana");
  devA = completeStep(devA, "en-1", "ouvir", 10);
  devA = passStageExam(devA, "en", 1);

  let devB = defaultState("Ana");
  devB = completeStep(devB, "fr-1", "moldes", 15);
  devB.settings.theme = "dark";

  const merged = mergeUserStates(devA, devB, 1000, 2000, "Ana");
  assert.ok(merged.progress.en.units["en-1"]?.steps.ouvir);
  assert.ok(merged.progress.fr.units["fr-1"]?.steps.moldes);
  assert.ok(merged.progress.en.stageExams?.includes(1));
  assert.equal(merged.settings.theme, "dark");
});

check("Reconciliação de XP entre dispositivos (CRDT xpEvents + definições v1.2)", () => {
  let pc = defaultState("Sérgio");
  pc = completeStep(pc, "en-1", "ouvir", 10);
  pc = completeStep(pc, "en-1", "moldes", 15);

  let phone = defaultState("Sérgio");
  phone = completeStep(phone, "en-1", "vocabulario", 15);

  const merged = mergeUserStates(pc, phone, 1000, 2000, "Sérgio");
  assert.equal(merged.progress.en.xp, 40);
  assert.equal(merged.settings.soundEffects, true);
  assert.equal(merged.settings.reminderHour, "19:30");
});

check("saveWordsBatch: guarda pacote de palavras sem sobrescrever cartões existentes", () => {
  let s = defaultState("Sérgio");
  s = rateItem(s, "en", "w:passport", 4);
  const prevStability = s.srs.en["w:passport"].s;
  s = saveWordsBatch(s, "en", ["passport", "boarding pass", "layover", "__inexistente__"], 2);
  assert.equal(s.srs.en["w:passport"].s, prevStability);
  assert.ok(s.srs.en["w:boarding pass"]);
  assert.ok(s.srs.en["w:layover"]);
  assert.equal(s.srs.en["w:__inexistente__"], undefined);
});

console.log(`\n${passed} testes passaram, ${failures.length} falharam.`);
if (failures.length) {
  console.log(failures.slice(0, 60).join("\n"));
  if (failures.length > 60) console.log(`… e mais ${failures.length - 60}`);
  process.exit(1);
}

/**
 * Pré-gera o áudio neural HD de todo o currículo para a cache em disco (data/tts-cache),
 * para que as lições toquem instantaneamente com a voz neural.
 *
 * Uso: npm run tts:pregen            (todas as línguas)
 *      npm run tts:pregen -- ja       (só japonês)
 */
import { CONTENT } from "@/content";
import { KANJI } from "@/content/ja/kanji";
import { HIRAGANA_DAKUTEN, HIRAGANA_ROWS, KATAKANA_DAKUTEN, KATAKANA_ROWS } from "@/content/kana";
import { COUNTERS, POLITENESS_ROWS } from "@/lib/cortesia";
import { LANGS } from "@/lib/langs";
import { peekCache, synthesize } from "@/lib/server/tts";
import { fillTemplate, plainText } from "@/lib/tokenize";
import type { LangCode } from "@/lib/types";
import { DEFAULT_NEURAL, NEURAL_VOICES, normalizeTtsText, rateToProsody, voiceForSpeaker } from "@/lib/voices";

const only = process.argv[2] as LangCode | undefined;
const langs: LangCode[] = only ? [only] : ["en", "fr", "ja"];

interface Job {
  voice: string;
  text: string;
  rate: number;
}

function jobsFor(lang: LangCode): Job[] {
  const tutorVoice = DEFAULT_NEURAL[lang];
  const tutorName = LANGS[lang].tutor.name;
  const out: Job[] = [];
  const add = (text: string, voice = tutorVoice, rate = 1) => {
    const t = normalizeTtsText(plainText(text, lang));
    if (t) out.push({ voice, text: t, rate });
  };
  // Saudações de teste de todas as vozes no ecrã de Perfil + frases do tutor
  for (const v of NEURAL_VOICES[lang]) {
    add(LANGS[lang].hello, v.id, 1);
  }
  for (const p of LANGS[lang].praise) add(p);
  add(LANGS[lang].repeat);

  for (const u of CONTENT[lang].units) {
    for (const l of u.dialogue) {
      add(l.text); // botão de cada frase
      add(l.text, voiceForSpeaker(lang, l.speaker, tutorName, tutorVoice)); // diálogo completo, voz por personagem
    }
    for (const p of u.patterns) for (const s of p.slots) add(fillTemplate(p.template, s.text));
    for (const k of u.vocab) {
      add(k);
      add(k, tutorVoice, 0.6); // "ouvir devagar"
    }
    for (const b of u.build) add(b.chunks.join(lang === "ja" ? "" : " "));
    for (const s of u.conversation.steps) {
      add(s.tutor);
      add(s.model);
    }
    add(u.conversation.closing);
  }
  if (lang === "ja") {
    for (const row of [...HIRAGANA_ROWS, ...HIRAGANA_DAKUTEN, ...KATAKANA_ROWS, ...KATAKANA_DAKUTEN]) {
      for (const [k] of row) if (k) add(k);
    }
    for (const kj of KANJI) {
      for (const ex of kj.examples) add(ex.reading);
    }
    for (const c of COUNTERS) {
      add(c.example.reading);
      for (const item of c.items) add(item.reading);
    }
    for (const r of POLITENESS_ROWS) {
      add(r.casual.ja);
      add(r.casual.ja.replace(/ \(.*\)/, ""));
      add(r.polite.ja);
      add(r.keigo.ja.split("/")[0].trim());
    }
  }
  // sem duplicados
  const seen = new Set<string>();
  return out.filter((j) => {
    const k = `${j.voice}|${j.rate}|${j.text}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

(async () => {
  let made = 0;
  let cached = 0;
  const retryList: Job[] = [];
  const allJobs: Job[] = [];
  for (const lang of langs) {
    const jobs = jobsFor(lang);
    console.log(`=== ${lang.toUpperCase()} — ${jobs.length} frases ===`);
    allJobs.push(...jobs);
  }

  // Filtra primeiro o que já está em disco para distribuir apenas o trabalho em falta
  const missingByVoice = new Map<string, Job[]>();
  for (const j of allJobs) {
    const prosody = rateToProsody(j.rate);
    if (await peekCache(j.voice, j.text, prosody)) {
      cached++;
    } else {
      const list = missingByVoice.get(j.voice) ?? [];
      list.push(j);
      missingByVoice.set(j.voice, list);
    }
  }

  const totalMissing = allJobs.length - cached;
  console.log(`Já em cache: ${cached}/${allJobs.length}. A sintetizar: ${totalMissing} frases em ${missingByVoice.size} vozes...`);

  const voiceWorkers: Promise<void>[] = [];
  for (const [voice, jobs] of missingByVoice.entries()) {
    let idx = 0;
    const workersForVoice = Math.min(2, jobs.length);
    for (let w = 0; w < workersForVoice; w++) {
      voiceWorkers.push(
        (async () => {
          while (idx < jobs.length) {
            const j = jobs[idx++];
            const prosody = rateToProsody(j.rate);
            try {
              await synthesize(j.voice, j.text, prosody);
              made++;
              if (made % 100 === 0 || made === totalMissing) {
                console.log(`  [${made}/${totalMissing} novas (${Math.round((made / totalMissing) * 100)}%), ${cached} cache] última: ${voice}`);
              }
            } catch (e) {
              retryList.push(j);
              console.warn(`  ✗ «${j.text}» (${j.voice}): ${(e as Error).message}`);
            }
          }
        })(),
      );
    }
  }

  await Promise.all(voiceWorkers);

  let failed = 0;
  if (retryList.length > 0) {
    console.log(`\nA repetir ${retryList.length} frases que falharam...`);
    for (const j of retryList) {
      try {
        await synthesize(j.voice, j.text, rateToProsody(j.rate));
        made++;
      } catch (e) {
        failed++;
        console.warn(`  ✗ falha final «${j.text}» (${j.voice}): ${(e as Error).message}`);
      }
    }
  }

  console.log(`\nConcluído: ${made} novas, ${cached} já em cache, ${failed} falhas (total=${made + cached}/${allJobs.length}).`);
  process.exit(failed ? 1 : 0);
})();

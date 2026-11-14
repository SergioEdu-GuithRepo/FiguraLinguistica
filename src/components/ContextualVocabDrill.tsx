"use client";

import { useEffect, useState } from "react";
import { CONTENT } from "@/content";
import { buildContextualVocabDrill, type ContextualVocabQuestion } from "@/lib/contexts";
import { LANGS, POS_PT } from "@/lib/langs";
import { sfxError, sfxSuccess } from "@/lib/sfx";
import { addActivity, currentLevel, rateItem } from "@/lib/state";
import { useApp } from "@/lib/store";
import type { LangCode } from "@/lib/types";
import { Icon } from "./Icon";
import { CelebrationBurst, Empty, SpeakButton, useSpeaker } from "./ui";

export function ContextualVocabDrill({
  lang,
  packId,
  onlyWeak = false,
  count = 6,
  title = "Treino de vocabulário em contexto",
  onDone,
}: {
  lang: LangCode;
  packId?: string;
  onlyWeak?: boolean;
  count?: number;
  title?: string;
  onDone?: () => void;
}) {
  const { state, update } = useApp();
  const { say } = useSpeaker();
  const sfxOn = state.settings.soundEffects !== false;
  const speechLang = LANGS[lang].speechLang;
  const dict = CONTENT[lang].dictionary;

  const [round, setRound] = useState(0);
  const [questions, setQuestions] = useState<ContextualVocabQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const lvl = currentLevel(state, lang);
    const built = buildContextualVocabDrill(lang, state.srs[lang], lvl, { packId, onlyWeak, count });
    setQuestions(built);
    setIdx(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    // Snapshot por ronda/idioma/filtro para que actualizar o FSRS a meio da ronda não baralhe a pergunta activa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, packId, onlyWeak, count, round]);

  if (questions.length === 0) {
    return (
      <Empty
        icon="cards"
        title="Sem frases disponíveis para este filtro"
        text="Guarda mais palavras nas unidades ou nos pacotes de contexto para treinar aqui."
      />
    );
  }

  if (done) {
    return (
      <div className="card fade-in p-6 text-center" data-testid="contextual-vocab-done">
        <div className="trophy-pop text-4xl">🧠</div>
        <CelebrationBurst xp={20} label="Memória reforçada" />
        <h3 className="mt-2 text-xl font-extrabold">Ronda concluída!</h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Acertaste {score} de {questions.length} palavras em frase real · Cartões actualizados na revisão espaçada.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={() => setRound((r) => r + 1)}
          >
            <Icon name="refresh" size={18} /> Nova ronda
          </button>
          {onDone && (
            <button type="button" className="btn btn-ghost flex-1" onClick={onDone}>
              Voltar
            </button>
          )}
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const answered = picked !== null;

  const choose = (opt: string) => {
    if (answered) return;
    setPicked(opt);
    const ok = opt === q.surfaceAnswer;
    if (ok) {
      setScore((s) => s + 1);
      sfxSuccess(sfxOn);
    } else {
      sfxError(sfxOn);
    }
    update((s) => rateItem(s, lang, `w:${q.wordKey}`, ok ? 3 : 1));
    if (state.settings.tutorVoice) {
      say(q.fullSentence, lang);
    }
  };

  const next = () => {
    setPicked(null);
    if (idx + 1 >= questions.length) {
      update((s) => addActivity(s, lang, packId ? `context-vocab:${packId}` : "vocab-context", 20));
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  return (
    <div className="card p-5" data-testid="contextual-vocab-drill">
      <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--color-muted)]">
        <span className="truncate">🧩 {title}</span>
        <span className="shrink-0 rounded-full bg-[var(--color-bg)] px-2.5 py-1">
          {idx + 1}/{questions.length}
        </span>
      </div>

      <div className="mt-3 rounded-2xl bg-[var(--color-bg)] p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
          <span className="rounded-full bg-white px-2.5 py-0.5 font-bold text-[var(--color-ink)]">
            {POS_PT[q.pos] ?? q.pos}
          </span>
          <span>Pista: «{q.ptWord}»</span>
        </div>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{q.ptSentence}</p>
        <p
          lang={speechLang}
          className={`target mt-2 text-lg font-extrabold leading-snug ${lang === "ja" ? "jp" : ""}`}
        >
          {answered ? q.fullSentence : q.maskedSentence}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {q.options.map((opt) => {
          const isCorrect = opt === q.surfaceAnswer;
          const isPicked = opt === picked;
          const optEntry = dict[opt.toLowerCase()];
          let cls = "border-[var(--color-line)] bg-white hover:border-[var(--color-ink)]/40";
          if (answered) {
            if (isCorrect) cls = "border-[var(--color-good)] bg-[var(--color-good-soft)] text-[var(--color-ink)]";
            else if (isPicked) cls = "border-[var(--color-coral)] bg-[var(--color-coral-soft)] text-[var(--color-coral)]";
            else cls = "border-[var(--color-line)] bg-white opacity-60";
          }
          return (
            <button
              key={opt}
              type="button"
              disabled={answered}
              onClick={() => choose(opt)}
              className={`flex min-h-[48px] items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-left font-bold transition active:scale-[0.99] ${cls}`}
            >
              <span lang={speechLang} className={`target ${lang === "ja" ? "jp" : ""}`}>
                {opt}
                {lang === "ja" && state.settings.romaji && optEntry?.romaji && (
                  <span className="ml-1.5 text-xs font-normal text-[var(--color-muted)]">({optEntry.romaji})</span>
                )}
              </span>
              {answered && isCorrect && <Icon name="check" size={18} className="shrink-0 text-[var(--color-good)]" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="fade-in mt-4 space-y-3">
          <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-yellow-soft)]/70 p-3.5 text-sm">
            <SpeakButton text={q.fullSentence} lang={lang} size={38} className="!bg-white" label="Ouvir frase completa" />
            <div className="min-w-0 flex-1">
              <div className="font-extrabold">
                <span lang={speechLang} className={`target ${lang === "ja" ? "jp" : ""}`}>
                  {q.surfaceAnswer}
                </span>
                {q.reading && <span className="ml-1.5 text-xs font-semibold text-[var(--color-muted)]">({q.reading})</span>}
                {" — "}
                <span className="font-semibold">{q.ptWord}</span>
              </div>
              {q.note && <p className="mt-1 text-xs text-[#6e530e]">💡 {q.note}</p>}
            </div>
          </div>
          <button type="button" className="btn btn-primary w-full" onClick={next}>
            {idx + 1 >= questions.length ? "Ver resultado" : "Seguinte"}
          </button>
        </div>
      )}
    </div>
  );
}

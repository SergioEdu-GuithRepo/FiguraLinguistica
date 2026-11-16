"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CONTENT } from "@/content";
import {
  buildContextualVocabDrill,
  evaluateTypedVocabAnswer,
  type ContextualVocabQuestion,
  type VocabDrillMode,
} from "@/lib/contexts";
import { useImeSafeEnter } from "@/lib/ime";
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
  networkId,
  onlyWeak = false,
  count = 6,
  title = "Treino de vocabulário em contexto",
  onDone,
}: {
  lang: LangCode;
  packId?: string;
  networkId?: string;
  onlyWeak?: boolean;
  count?: number;
  title?: string;
  onDone?: () => void;
}) {
  const { state, update } = useApp();
  const { say } = useSpeaker();
  const writeInputId = useId();
  const sfxOn = state.settings.soundEffects !== false;
  const speechLang = LANGS[lang].speechLang;
  const dict = CONTENT[lang].dictionary;

  const [round, setRound] = useState(0);
  const [drillMode, setDrillMode] = useState<VocabDrillMode>("mixed");
  const [questions, setQuestions] = useState<ContextualVocabQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState("");
  const [typedResult, setTypedResult] = useState<{ ok: boolean; accentNote?: boolean } | null>(null);
  const [usedHint, setUsedHint] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const spokenListenRef = useRef<string>("");

  useEffect(() => {
    const lvl = currentLevel(state, lang);
    const built = buildContextualVocabDrill(lang, state.srs[lang], lvl, {
      packId,
      networkId,
      onlyWeak,
      count,
      seed: round,
      mode: drillMode,
    });
    setQuestions(built);
    setIdx(0);
    setPicked(null);
    setTypedInput("");
    setTypedResult(null);
    setUsedHint(false);
    setScore(0);
    setDone(false);
    spokenListenRef.current = "";
    // Snapshot por ronda/idioma/filtro para que actualizar o FSRS a meio da ronda não baralhe a pergunta activa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, packId, networkId, onlyWeak, count, round, drillMode]);

  const q = questions[idx];
  const isWrite = q?.questionType === "write";
  const answered = isWrite ? typedResult !== null : picked !== null;

  // No modo «Ouvir», lê automaticamente a frase completa 1 vez ao abrir a pergunta
  useEffect(() => {
    if (!q || done || q.questionType !== "listen") return;
    if (spokenListenRef.current !== q.id) {
      spokenListenRef.current = q.id;
      if (state.settings.tutorVoice) {
        say(q.fullSentence, lang);
      }
    }
  }, [q, done, state.settings.tutorVoice, say, lang]);

  const submitTyped = () => {
    if (!q || answered || !typedInput.trim()) return;
    const res = evaluateTypedVocabAnswer(typedInput, q, lang);
    setTypedResult(res);
    if (res.ok) {
      setScore((s) => s + 1);
      sfxSuccess(sfxOn);
    } else {
      sfxError(sfxOn);
    }
    update((s) => rateItem(s, lang, `w:${q.wordKey}`, res.ok ? (usedHint ? 3 : 4) : 1));
    if (state.settings.tutorVoice) {
      say(q.fullSentence, lang);
    }
  };

  const imeWrite = useImeSafeEnter(submitTyped);

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
    const xpEarned = drillMode === "write" ? 25 : 20;
    return (
      <div className="card fade-in p-6 text-center" data-testid="contextual-vocab-done">
        <div className="trophy-pop text-4xl">🧠</div>
        <CelebrationBurst xp={xpEarned} label="Memória reforçada" />
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

  const revealFirstChars = () => {
    if (answered) return;
    setUsedHint(true);
    const target = q.surfaceAnswer;
    const prefix = target.slice(0, Math.min(2, Math.max(1, Math.ceil(target.length / 3))));
    if (!typedInput.toLowerCase().startsWith(prefix.toLowerCase())) {
      setTypedInput(prefix);
    }
  };

  const next = () => {
    setPicked(null);
    setTypedInput("");
    setTypedResult(null);
    setUsedHint(false);
    if (idx + 1 >= questions.length) {
      const xpEarned = drillMode === "write" ? 25 : 20;
      const activityTag = packId
        ? `context-vocab:${packId}`
        : networkId
          ? `vocab-net:${networkId}`
          : "vocab-context";
      update((s) => addActivity(s, lang, activityTag, xpEarned));
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

      <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Modo de treino">
        {(
          [
            ["mixed", "🔀 Misto"],
            ["cloze", "🧩 Completar"],
            ["recall", "🎯 Activar"],
            ["listen", "🎧 Ouvir"],
            ["write", "✍️ Escrever"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            aria-pressed={drillMode === m}
            onClick={() => setDrillMode(m)}
            className={`chip min-h-[34px] !px-2.5 !py-1 text-[11px] ${
              drillMode === m ? "!bg-[var(--color-ink)] text-white" : ""
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-2xl bg-[var(--color-bg)] p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
          <span className="rounded-full bg-white px-2.5 py-0.5 font-bold text-[var(--color-ink)]">
            {POS_PT[q.pos] ?? q.pos}
          </span>
          {q.questionType === "recall" ? (
            <span className="font-bold text-[var(--color-coral)]">
              🎯 Como dizes «{q.ptWord}» nesta frase?
            </span>
          ) : q.questionType === "listen" ? (
            <span className="font-bold text-[#2a6b64]">
              🎧 Ouve a frase e identifica a palavra em falta
            </span>
          ) : q.questionType === "write" ? (
            <span className="font-bold text-[var(--color-lilac)]">
              ✍️ Escreve «{q.ptWord}» em {LANGS[lang].name.toLowerCase()}
            </span>
          ) : (
            <span>Pista: «{q.ptWord}»</span>
          )}
        </div>

        {q.questionType === "recall" ? (
          <>
            <p className="mt-2 text-base font-extrabold leading-snug text-[var(--color-ink)]">{q.ptSentence}</p>
            {answered ? (
              <p
                lang={speechLang}
                className={`target mt-2 text-lg font-extrabold leading-snug text-[var(--color-teal)] ${lang === "ja" ? "jp" : ""}`}
              >
                {q.fullSentence}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                Escolhe o termo natural em {LANGS[lang].name.toLowerCase()} para activar a memória:
              </p>
            )}
          </>
        ) : q.questionType === "listen" ? (
          <div className="mt-2.5 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <SpeakButton text={q.fullSentence} lang={lang} size={42} className="!bg-white" label="Ouvir frase normal" />
              <SpeakButton
                text={q.fullSentence}
                lang={lang}
                size={42}
                slow
                className="!bg-[var(--color-teal-soft)]"
                label="Ouvir frase devagar"
              />
              <span className="text-xs text-[var(--color-muted)]">Ouvir · Devagar 🐢 · Significado: «{q.ptWord}»</span>
            </div>
            <p
              lang={speechLang}
              className={`target text-lg font-extrabold leading-snug ${lang === "ja" ? "jp" : ""}`}
            >
              {answered ? q.fullSentence : q.maskedSentence}
            </p>
            {answered && <p className="text-sm text-[var(--color-muted)]">{q.ptSentence}</p>}
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{q.ptSentence}</p>
            <p
              lang={speechLang}
              className={`target mt-2 text-lg font-extrabold leading-snug ${lang === "ja" ? "jp" : ""}`}
            >
              {answered ? q.fullSentence : q.maskedSentence}
            </p>
          </>
        )}
      </div>

      {isWrite ? (
        <div className="mt-4">
          {!answered ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitTyped();
              }}
              className="space-y-2.5"
            >
              <label htmlFor={writeInputId} className="block text-xs font-extrabold text-[var(--color-muted)]">
                A tua resposta{lang === "ja" ? " (japonês ou romaji)" : ""}
              </label>
              <div className="flex gap-2">
                <input
                  id={writeInputId}
                  name="vocab-answer"
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  onCompositionStart={imeWrite.onCompositionStart}
                  onCompositionEnd={imeWrite.onCompositionEnd}
                  onKeyDown={imeWrite.onKeyDown}
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="send"
                  lang={speechLang}
                  placeholder={lang === "ja" ? "Escreve em kana, kanji ou romaji…" : `Escreve «${q.ptWord}»…`}
                  className="input target min-h-[48px] flex-1 text-base"
                />
                <button type="submit" className="btn btn-primary min-h-[48px] px-5">
                  Verificar
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={revealFirstChars}
                  className="chip min-h-[34px] !px-3 !py-1 text-xs"
                >
                  💡 {usedHint ? `Começa por «${q.surfaceAnswer.slice(0, 2)}…»` : "Pista (início da palavra)"}
                </button>
                <span className="text-[11px] text-[var(--color-muted)]">+25 XP · Produção activa</span>
              </div>
            </form>
          ) : (
            <div
              className={`rounded-2xl border-2 px-4 py-3 text-sm font-bold ${
                typedResult?.ok
                  ? "border-[var(--color-good)] bg-[var(--color-good-soft)] text-[var(--color-ink)]"
                  : "border-[var(--color-coral)] bg-[var(--color-coral-soft)] text-[var(--color-coral)]"
              }`}
            >
              {typedResult?.ok ? (
                <span>
                  ✓ Exacto! Escreveste «<span lang={speechLang} className="target">{typedInput.trim()}</span>».
                  {typedResult.accentNote && " (Atenção apenas aos acentos na grafia padrão.)"}
                </span>
              ) : (
                <span>
                  Quase! Escreveste «{typedInput.trim()}» — a forma exacta é{" "}
                  <strong lang={speechLang} className="target text-[var(--color-ink)]">
                    {q.surfaceAnswer}
                  </strong>
                  .
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
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
      )}

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

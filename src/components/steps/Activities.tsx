"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { DialogueReader, TokenLine, WordSheet } from "@/components/Reader";
import { Sheet } from "@/components/Sheet";
import { SpeakButton, useSpeaker } from "@/components/ui";
import { CONTENT } from "@/content";
import { KANJI } from "@/content/ja/kanji";
import { completeStep, rateItem, recordError, type StepId } from "@/lib/state";
import { listen, recorderSupported, startRecording, sttSupported, ttsSupported, type RecorderHandle } from "@/lib/speech";
import { assessPronunciation, type Alternative, type PronunciationResult } from "@/lib/pronunciation";
import { useApp } from "@/lib/store";
import { fillTemplate, plainText, type RToken } from "@/lib/tokenize";
import type { LangCode, Unit } from "@/lib/types";
import { StepDone } from "./StepShell";

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export const STEP_XP: Record<StepId, number> = { ouvir: 10, moldes: 10, vocabulario: 10, montar: 15, falar: 15, conversa: 20 };

function useFinish(unit: Unit, step: StepId) {
  const { update } = useApp();
  const [done, setDone] = useState<number | null>(null);
  const finish = (xp = STEP_XP[step], extra?: (s: ReturnType<typeof useApp>["state"]) => ReturnType<typeof useApp>["state"]) => {
    update((s) => completeStep(extra ? extra(s) : s, unit.id, step, xp));
    setDone(xp);
    window.scrollTo({ top: 0 });
  };
  return { done, finish };
}

/* ======================= 1. Ouvir e tocar ======================= */

export function ListenStep({ unit }: { unit: Unit }) {
  const { sayMany, stop } = useSpeaker();
  const [active, setActive] = useState<number | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(!ttsSupported());
  const { done, finish } = useFinish(unit, "ouvir");
  const cancelRef = useRef<() => void>(() => {});

  if (done !== null) return <StepDone unit={unit} step="ouvir" xp={done} />;

  const playAll = () => {
    if (playing) {
      cancelRef.current();
      stop();
      setPlaying(false);
      setActive(undefined);
      return;
    }
    setPlaying(true);
    cancelRef.current = sayMany(
      unit.dialogue.map((l) => l.text),
      unit.lang,
      (i) => setActive(i),
      () => {
        setPlaying(false);
        setActive(undefined);
        setHeard(true);
      },
      unit.dialogue.map((l) => l.speaker),
    );
  };

  return (
    <div>
      <p className="mb-4 text-[var(--color-muted)]">
        Ouve o diálogo. <b>Toca numa palavra</b> para ver o significado, ou em <Icon name="layers" size={14} className="inline" /> para analisar a frase.
      </p>
      <button className={`btn mb-5 w-full ${playing ? "btn-dark" : "btn-ghost"}`} onClick={playAll}>
        <Icon name={playing ? "stop" : "play"} size={20} /> {playing ? "Parar" : "Ouvir o diálogo todo"}
      </button>
      <DialogueReader lines={unit.dialogue} lang={unit.lang} patterns={unit.patterns} activeIndex={active} />
      <button className="btn btn-primary mt-6 w-full" disabled={!heard} onClick={() => finish()}>
        {heard ? "Já percebi — continuar" : "Ouve o diálogo primeiro"}
      </button>
      {!heard && (
        <button className="mt-2 w-full text-center text-sm text-[var(--color-muted)] underline" onClick={() => setHeard(true)}>
          Não consigo ouvir agora (sem som)
        </button>
      )}
    </div>
  );
}

/* ======================= 2. Molde vivo ======================= */

export function PatternsStep({ unit }: { unit: Unit }) {
  const { say } = useSpeaker();
  const { state } = useApp();
  const [tried, setTried] = useState<Record<string, Set<number>>>({});
  const [sel, setSel] = useState<Record<string, number>>({});
  const [why, setWhy] = useState<Record<string, boolean>>({});
  const [word, setWord] = useState<RToken | null>(null);
  const { done, finish } = useFinish(unit, "moldes");
  const lang = unit.lang;

  if (done !== null) return <StepDone unit={unit} step="moldes" xp={done} />;
  const need = 2;
  const ready = unit.patterns.every((p) => (tried[p.id]?.size ?? 0) >= Math.min(need, p.slots.length));

  return (
    <div className={`lang-${lang}`}>
      <p className="mb-4 text-[var(--color-muted)]">
        Cada molde gera muitas frases. <b>Troca a palavra</b> e ouve o resultado (experimenta pelo menos {need} em cada molde).
      </p>
      <div className="flex flex-col gap-4">
        {unit.patterns.map((p) => {
          const i = sel[p.id];
          const slot = i !== undefined ? p.slots[i] : undefined;
          const filled = slot ? fillTemplate(p.template, slot.text) : undefined;
          const [before, after] = plainText(p.template, lang).split("{x}");
          return (
            <section key={p.id} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-coral)]">Molde</span>
                <span className="text-xs text-[var(--color-muted)]">
                  {tried[p.id]?.size ?? 0}/{Math.min(need, p.slots.length)} ✓
                </span>
              </div>
              <div className="target mt-2 text-xl font-bold">
                {before}
                <span className="mx-1 inline-block min-w-12 rounded-xl border-2 border-dashed border-[var(--color-coral)] bg-[var(--color-coral-soft)] px-2 text-center text-[var(--color-coral)]">
                  {slot ? plainText(slot.text, lang) : "…"}
                </span>
                {after}
              </div>
              <div className="text-sm text-[var(--color-muted)]">{p.pt.replaceAll("{x}", slot ? slot.pt : "…")}</div>
              {lang === "ja" && state.settings.romaji && p.romaji && (
                <div className="text-sm italic text-[var(--color-muted)]">{p.romaji.replaceAll("{x}", slot?.romaji ?? "…")}</div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {p.slots.map((s, si) => (
                  <button
                    key={si}
                    className={`chip target ${i === si ? "!bg-[var(--color-ink)] text-white" : ""} ${tried[p.id]?.has(si) ? "ring-1 ring-[var(--color-good)]" : ""}`}
                    onClick={() => {
                      setSel((x) => ({ ...x, [p.id]: si }));
                      setTried((t) => ({ ...t, [p.id]: new Set([...(t[p.id] ?? []), si]) }));
                      say(fillTemplate(p.template, s.text), lang);
                    }}
                  >
                    {plainText(s.text, lang)}
                  </button>
                ))}
              </div>
              {filled && (
                <div className="fade-in mt-4 flex items-center gap-3 rounded-2xl bg-[var(--color-bg)] p-3">
                  <div className="flex-1 text-lg font-semibold">
                    <TokenLine text={filled} lang={lang} onWord={setWord} />
                  </div>
                  <SpeakButton text={filled} lang={lang} size={36} />
                </div>
              )}
              <button className="mt-3 text-sm font-bold text-[var(--color-lilac)]" onClick={() => setWhy((w) => ({ ...w, [p.id]: !w[p.id] }))} aria-expanded={!!why[p.id]}>
                {why[p.id] ? "Esconder" : "Porquê?"}
              </button>
              {why[p.id] && <div className="fade-in mt-2 rounded-2xl bg-[var(--color-lilac-soft)] p-3 text-sm">💡 {p.note}</div>}
            </section>
          );
        })}
      </div>
      <button
        className="btn btn-primary mt-6 w-full"
        disabled={!ready}
        onClick={() =>
          finish(undefined, (s) => unit.patterns.reduce((acc, p) => rateItem(acc, lang, `p:${p.id}`, 3), s))
        }
      >
        {ready ? "Continuar" : "Experimenta mais palavras nos moldes"}
      </button>
      <WordSheet tok={word} lang={lang} onClose={() => setWord(null)} />
    </div>
  );
}

/* ======================= 3. Vocabulário-chave ======================= */

export function VocabStep({ unit }: { unit: Unit }) {
  const { update } = useApp();
  const { say } = useSpeaker();
  const lang = unit.lang;
  const dict = CONTENT[lang].dictionary;
  const [i, setI] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [known, setKnown] = useState(0);
  const { done, finish } = useFinish(unit, "vocabulario");
  const items = unit.vocab.filter((k) => dict[k]);
  const key = items[i];
  const e = dict[key];

  useEffect(() => {
    if (key && done === null) say(key, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  if (done !== null)
    return <StepDone unit={unit} step="vocabulario" xp={done} extra={<p className="mt-2 text-sm">Já sabias {known} de {items.length} palavras. As outras vão voltar na revisão.</p>} />;

  const answer = (rating: 1 | 3) => {
    update((s) => rateItem(s, lang, `w:${key}`, rating));
    if (rating === 3) setKnown((k) => k + 1);
    if (i + 1 >= items.length) finish();
    else {
      setI(i + 1);
      setReveal(false);
    }
  };

  return (
    <div className={`lang-${lang}`}>
      <div className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
        Palavra {i + 1} de {items.length}
      </div>
      <div key={i} className="card fade-in flex min-h-[300px] flex-col items-center justify-center p-6 text-center">
        <div className="target text-4xl font-extrabold">{e.reading && lang === "ja" ? <ruby>{key}<rt>{e.reading}</rt></ruby> : key}</div>
        <div className="mt-1 text-sm text-[var(--color-muted)]">{[e.romaji, e.pron && `[${e.pron}]`].filter(Boolean).join(" · ")}</div>
        <div className="mt-3 flex gap-2">
          <SpeakButton text={key} lang={lang} size={48} />
          <SpeakButton text={key} lang={lang} size={48} slow label="Ouvir devagar" />
        </div>
        {reveal ? (
          <div className="fade-in mt-5 w-full">
            <div className="text-2xl font-bold">{e.pt}</div>
            {e.gender && <div className="text-sm text-[var(--color-muted)]">{e.gender === "m" ? "masculino" : "feminino"}</div>}
            {e.example && (
              <div className="mt-3 rounded-2xl bg-[var(--color-bg)] p-3 text-left">
                <div className="target font-semibold">{plainText(e.example.text, lang)}</div>
                <div className="text-sm text-[var(--color-muted)]">{e.example.pt}</div>
              </div>
            )}
            {e.note && <div className="mt-2 rounded-2xl bg-[var(--color-yellow-soft)] p-3 text-left text-sm">💡 {e.note}</div>}
          </div>
        ) : (
          <button className="btn btn-soft mt-6" onClick={() => setReveal(true)}>
            <Icon name="eye" size={18} /> Mostrar significado
          </button>
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button className="btn btn-ghost" onClick={() => answer(1)}>
          Ainda não sei
        </button>
        <button className="btn btn-primary" onClick={() => answer(3)}>
          Já sei
        </button>
      </div>
    </div>
  );
}

/* ======================= 4. Montar a frase ======================= */

interface Piece {
  id: number;
  text: string;
}

export function joinChunks(chunks: string[], lang: LangCode): string {
  if (lang === "ja") return chunks.join("");
  return chunks
    .join(" ")
    .replace(/\s+([,.!?;:])/g, lang === "fr" ? " $1" : "$1")
    .replace(/\s+,/g, ",")
    .replace(/‿/g, " ");
}

export function BuildStep({ unit }: { unit: Unit }) {
  const { update, state } = useApp();
  const { say } = useSpeaker();
  const lang = unit.lang;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<Piece[]>([]);
  const [result, setResult] = useState<null | "ok" | "bad">(null);
  const [errors, setErrors] = useState(0);
  const { done, finish } = useFinish(unit, "montar");
  const ex = unit.build[i];
  const pool = useMemo<Piece[]>(() => (ex ? shuffle([...ex.chunks, ...(ex.distractors ?? [])].map((t, id) => ({ id, text: t }))) : []), [ex]);

  if (done !== null)
    return <StepDone unit={unit} step="montar" xp={done} extra={<p className="mt-2 text-sm">{errors === 0 ? "Sem erros! 🌟" : `${errors} ${errors === 1 ? "frase" : "frases"} para treinar mais.`}</p>} />;

  const available = pool.filter((p) => !picked.some((x) => x.id === p.id));
  const correctText = joinChunks(ex.chunks, lang);

  const check = () => {
    const ok = picked.length === ex.chunks.length && picked.every((p, k) => p.text === ex.chunks[k]);
    setResult(ok ? "ok" : "bad");
    say(ex.chunks.join(lang === "ja" ? "" : " "), lang);
    if (!ok) {
      setErrors((n) => n + 1);
      const usedDistractor = picked.some((p) => (ex.distractors ?? []).includes(p.text));
      update((s) => recordError(s, lang, lang === "ja" && usedDistractor ? "particula" : usedDistractor ? "vocabulario" : "ordem", correctText));
    }
  };
  const next = () => {
    if (i + 1 >= unit.build.length) finish(errors === 0 ? STEP_XP.montar + 5 : STEP_XP.montar);
    else {
      setI(i + 1);
      setPicked([]);
      setResult(null);
    }
  };

  return (
    <div className={`lang-${lang}`}>
      <div className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
        Frase {i + 1} de {unit.build.length} {lang === "ja" && "· não te esqueças das partículas"}
      </div>
      <div className="card p-5">
        <div className="text-xs font-bold text-[var(--color-muted)]">DIZ EM {lang === "en" ? "INGLÊS" : lang === "fr" ? "FRANCÊS" : "JAPONÊS"}:</div>
        <div className="mt-1 text-xl font-bold">{ex.pt}</div>
      </div>
      <div
        className={`mt-4 flex min-h-[72px] flex-wrap content-start gap-2 rounded-3xl border-2 border-dashed p-3 ${
          result === "ok" ? "border-[var(--color-good)] bg-[var(--color-good-soft)]" : result === "bad" ? "shake border-[var(--color-bad)] bg-[var(--color-bad-soft)]" : "border-[var(--color-line)] bg-white/60"
        }`}
        aria-label="A tua frase"
      >
        {picked.length === 0 && <span className="self-center px-2 text-sm text-[var(--color-muted)]">Toca nos blocos por ordem…</span>}
        {picked.map((p) => (
          <button
            key={p.id}
            className="chip target !text-base"
            disabled={!!result}
            onClick={() => setPicked((xs) => xs.filter((x) => x.id !== p.id))}
          >
            {plainText(p.text, lang)}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {available.map((p) => (
          <button key={p.id} className="chip target !bg-[var(--color-lilac-soft)] !text-base" disabled={!!result} onClick={() => setPicked((xs) => [...xs, p])}>
            {plainText(p.text, lang)}
          </button>
        ))}
      </div>

      {result && (
        <div className={`fade-in mt-5 rounded-3xl p-4 ${result === "ok" ? "bg-[var(--color-good-soft)]" : "bg-[var(--color-bad-soft)]"}`}>
          <div className={`font-extrabold ${result === "ok" ? "text-[var(--color-good)]" : "text-[var(--color-bad)]"}`}>
            {result === "ok" ? "Correcto! 🎉" : "Quase! A frase natural é:"}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="target flex-1 text-lg font-semibold">{correctText}</span>
            <SpeakButton text={ex.chunks.join(lang === "ja" ? "|" : " ")} lang={lang} size={36} />
          </div>
          {lang === "ja" && state.settings.romaji && ex.romaji && <div className="text-sm italic text-[var(--color-muted)]">{ex.romaji}</div>}
        </div>
      )}

      <div className="mt-5 flex gap-2">
        {!result ? (
          <>
            <button className="btn btn-soft" onClick={() => setPicked([])} disabled={!picked.length}>
              <Icon name="refresh" size={18} />
            </button>
            <button className="btn btn-primary flex-1" disabled={!picked.length} onClick={check}>
              Verificar
            </button>
          </>
        ) : (
          <button className="btn btn-primary flex-1" onClick={next}>
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}

/* ======================= 5. Dizer em voz alta ======================= */

/** Leituras extra (exemplos do módulo de kanji) para converter kanji ouvidos em kana. */
const KANA_EXTRA: Record<string, string> = Object.fromEntries(KANJI.flatMap((k) => k.examples.map((e) => [e.word, e.reading])));

export function assessSpeech(alts: Alternative[], target: string, lang: LangCode): PronunciationResult {
  return assessPronunciation(alts, target, lang, CONTENT[lang].dictionary, lang === "ja" ? KANA_EXTRA : {});
}

export function scoreSpeech(heard: string, target: string, lang: LangCode): number {
  return assessSpeech([{ transcript: heard }], target, lang).score;
}

export function VoiceConsentSheet({ open, onAnswer }: { open: boolean; onAnswer: (ok: boolean) => void }) {
  return (
    <Sheet open={open} onClose={() => onAnswer(false)} title="Usar o microfone?">
      <p className="text-[var(--color-muted)]">
        Para avaliar a tua pronúncia, o navegador converte a tua voz em texto. <b>Não guardamos gravações de áudio</b> — só o texto reconhecido,
        e apenas neste dispositivo. Podes mudar isto no Perfil.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <button className="btn btn-primary" onClick={() => onAnswer(true)}>
          <Icon name="mic" size={18} /> Aceito
        </button>
        <button className="btn btn-soft" onClick={() => onAnswer(false)}>
          Agora não (praticar sem microfone)
        </button>
      </div>
    </Sheet>
  );
}

export function SpeakStep({ unit }: { unit: Unit }) {
  const { state, update } = useApp();
  const { say } = useSpeaker();
  const lang = unit.lang;
  const lines = useMemo(() => {
    const mine = unit.dialogue.filter((l) => /^(tu|você|eu)$/i.test(l.speaker));
    return (mine.length >= 2 ? mine : unit.dialogue).slice(0, 3);
  }, [unit]);
  const [i, setI] = useState(0);
  const [heard, setHeard] = useState("");
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [listening, setListening] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [askConsent, setAskConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [myAudio, setMyAudio] = useState<string | null>(null);
  const handle = useRef<{ stop: () => void } | null>(null);
  const recRef = useRef<RecorderHandle | null>(null);
  const { done, finish } = useFinish(unit, "falar");
  const canStt = sttSupported() && state.settings.voiceConsent !== false;
  const canRecord = recorderSupported() && state.settings.voiceConsent !== false;
  const line = lines[i];
  const score = result?.score ?? null;

  // liberta a gravação anterior (só existe em memória)
  useEffect(() => () => void (myAudio && URL.revokeObjectURL(myAudio)), [myAudio]);

  if (done !== null) {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return <StepDone unit={unit} step="falar" xp={done} extra={avg !== null ? <p className="mt-2 text-sm">Nota média de pronúncia: {avg}/100</p> : undefined} />;
  }

  const start = () => {
    if (state.settings.voiceConsent === null) return setAskConsent(true);
    setErr(null);
    setHeard("");
    setResult(null);
    setListening(true);
    handle.current = listen(lang, {
      onInterim: (t) => setHeard(t),
      onFinal: (t, confidence, alts) => {
        setHeard(t);
        const r = assessSpeech(alts.length ? alts : [{ transcript: t, confidence }], line.text, lang);
        setResult(r);
        if (r.heard) setHeard(r.heard);
        if (r.score < 60) update((s) => recordError(s, lang, "pronuncia", plainText(line.text, lang)));
      },
      onError: (m) => {
        setErr(m);
        setListening(false);
      },
      onEnd: () => setListening(false),
    });
    if (!handle.current) setListening(false);
  };

  const toggleRecord = async () => {
    if (state.settings.voiceConsent === null) return setAskConsent(true);
    if (recording) {
      const url = (await recRef.current?.stop()) ?? null;
      recRef.current = null;
      setRecording(false);
      if (url) {
        setMyAudio(url);
        void new Audio(url).play().catch(() => undefined);
      } else setErr("Não foi possível gravar.");
      return;
    }
    setErr(null);
    const h = await startRecording();
    if (!h) return setErr("Não foi possível aceder ao microfone.");
    recRef.current = h;
    setRecording(true);
  };

  const compare = () => {
    say(line.text, lang, () => {
      if (myAudio) setTimeout(() => void new Audio(myAudio).play().catch(() => undefined), 300);
    });
  };

  const next = (sc: number) => {
    const all = [...scores, sc];
    setScores(all);
    if (i + 1 >= lines.length) finish();
    else {
      setI(i + 1);
      setHeard("");
      setResult(null);
      setMyAudio(null);
    }
  };

  const wordClass = (st: "ok" | "close" | "miss") =>
    st === "ok" ? "bg-[var(--color-good-soft)] text-[var(--color-good)]" : st === "close" ? "bg-[var(--color-yellow-soft)]" : "bg-[var(--color-bad-soft)] text-[var(--color-bad)]";

  return (
    <div className={`lang-${lang}`}>
      <div className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
        Frase {i + 1} de {lines.length}
      </div>
      <div className="card p-6 text-center">
        {result ? (
          <div className="target flex flex-wrap justify-center gap-1.5 text-2xl font-bold leading-relaxed" data-testid="pron-words">
            {result.words.map((w, k) => (
              <span key={k} className={`rounded-xl px-1.5 ${wordClass(w.status)}`} title={w.heard ? `ouvimos: ${w.heard}` : undefined} data-status={w.status}>
                {w.text}
              </span>
            ))}
          </div>
        ) : (
          <div className="target text-2xl font-bold leading-relaxed">{plainText(line.text, lang)}</div>
        )}
        {line.romaji && <div className="mt-1 text-sm italic text-[var(--color-muted)]">{line.romaji}</div>}
        <div className="mt-1 text-sm text-[var(--color-muted)]">{line.pt}</div>
        <div className="mt-4 flex justify-center gap-2">
          <SpeakButton text={line.text} lang={lang} size={44} />
          <SpeakButton text={line.text} lang={lang} size={44} slow label="Ouvir devagar" />
        </div>
      </div>

      {canStt ? (
        <div className="mt-6 flex flex-col items-center">
          <button
            className={`grid h-20 w-20 place-items-center rounded-full text-white shadow-lg transition ${listening ? "pulse-ring bg-[var(--color-bad)]" : "bg-[var(--color-coral)]"}`}
            onClick={() => (listening ? handle.current?.stop() : start())}
            aria-label={listening ? "Parar" : "Falar"}
          >
            <Icon name={listening ? "stop" : "mic"} size={34} />
          </button>
          <div className="mt-2 text-sm text-[var(--color-muted)]">{listening ? "A ouvir… fala agora" : "Toca e diz a frase"}</div>
          {heard && <div className="mt-3 rounded-2xl bg-white px-4 py-2 text-center italic">“{heard}”</div>}
          {err && <div className="mt-3 rounded-2xl bg-[var(--color-bad-soft)] px-4 py-2 text-sm text-[var(--color-bad)]">{err}</div>}
        </div>
      ) : (
        <div className="card mt-6 p-5 text-center text-sm text-[var(--color-muted)]">
          {state.settings.voiceConsent === false
            ? "Microfone desactivado no Perfil."
            : "O teu navegador não avalia a pronúncia automaticamente (experimenta o Chrome)."}{" "}
          {canRecord ? "Grava-te, compara com a voz nativa e avalia-te:" : "Ouve a frase, repete-a em voz alta 2 vezes e avalia-te:"}
          {canRecord && (
            <div className="mt-4 flex justify-center gap-2">
              <button className={`btn ${recording ? "btn-primary pulse-ring" : "btn-soft"}`} onClick={toggleRecord}>
                <Icon name={recording ? "stop" : "mic"} size={18} /> {recording ? "Parar gravação" : myAudio ? "Gravar outra vez" : "Gravar-me"}
              </button>
              {myAudio && (
                <button className="btn btn-soft" onClick={compare}>
                  <Icon name="headphones" size={18} /> Comparar
                </button>
              )}
            </div>
          )}
          {canRecord && <div className="mt-2 text-xs">A gravação fica só neste ecrã e não é guardada.</div>}
          {err && <div className="mt-3 rounded-2xl bg-[var(--color-bad-soft)] px-4 py-2 text-sm text-[var(--color-bad)]">{err}</div>}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn btn-ghost" onClick={() => next(50)}>
              Foi difícil
            </button>
            <button className="btn btn-primary" onClick={() => next(85)}>
              Consegui!
            </button>
          </div>
        </div>
      )}

      {result && score !== null && (
        <div
          className={`fade-in mt-5 rounded-3xl p-4 ${score >= 80 ? "bg-[var(--color-good-soft)]" : score >= 60 ? "bg-[var(--color-yellow-soft)]" : "bg-[var(--color-bad-soft)]"}`}
          data-testid="pron-result"
        >
          <div className="flex items-center justify-between">
            <div className="font-extrabold">{score >= 80 ? "Excelente pronúncia! 🌟" : score >= 60 ? "Bom! Quase lá." : "Vamos tentar outra vez."}</div>
            <div className="text-2xl font-extrabold">{score}</div>
          </div>
          <div className="mt-1 flex gap-3 text-xs text-[var(--color-muted)]">
            <span>🟩 certa</span>
            <span>🟨 quase</span>
            <span>🟥 a treinar</span>
          </div>
          {result.tips.length > 0 && score < 95 && (
            <ul className="mt-2 space-y-1 text-sm">
              {result.tips.map((t) => (
                <li key={t}>💡 {t}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            <button className="btn btn-soft flex-1" onClick={start}>
              <Icon name="refresh" size={18} /> Repetir
            </button>
            <button className="btn btn-primary flex-1" onClick={() => next(score)}>
              Continuar
            </button>
          </div>
        </div>
      )}
      {canStt && score === null && (
        <button className="mt-6 w-full text-center text-sm text-[var(--color-muted)] underline" onClick={() => next(70)}>
          Não posso falar agora — saltar esta frase
        </button>
      )}
      <VoiceConsentSheet
        open={askConsent}
        onAnswer={(ok) => {
          setAskConsent(false);
          update((s) => ({ ...s, settings: { ...s.settings, voiceConsent: ok } }));
        }}
      />
    </div>
  );
}

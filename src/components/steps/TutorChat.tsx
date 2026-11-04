"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { ReportSheet, TokenLine, WordSheet } from "@/components/Reader";
import { CelebrationBurst, useSpeaker } from "@/components/ui";
import { CONTENT } from "@/content";
import { LANGS } from "@/lib/langs";
import {
  addActivity,
  completeStep,
  conversationsLeft,
  currentLevel,
  recordError,
  recordResponseMetric,
  type ConversationLog,
  type ConversationMode,
} from "@/lib/state";
import { listen, sttSupported } from "@/lib/speech";
import { useApp } from "@/lib/store";
import { plainText, type RToken } from "@/lib/tokenize";
import { CATEGORY_PT, helpLadder, offlineFreeTurn, offlineTurn, type ErrorCategory, type TutorReply } from "@/lib/tutor";
import type { LangCode, Unit } from "@/lib/types";
import { VoiceConsentSheet } from "./Activities";

interface Msg {
  author: "tutor" | "user";
  text: string;
  pt?: string | null;
  reply?: TutorReply; // análise da mensagem do utilizador
}

/** Segmenta japonês livre (ex.: respostas da IA) para o leitor interactivo. */
function segmentJa(text: string): string {
  if (text.includes("|")) return text;
  try {
    const seg = new Intl.Segmenter("ja", { granularity: "word" });
    return Array.from(seg.segment(text))
      .map((s) => s.segment)
      .filter((s) => s.trim())
      .join("|");
  } catch {
    return text;
  }
}

function displayText(text: string, lang: LangCode) {
  return lang === "ja" ? segmentJa(text) : text;
}

let aiStatus: boolean | null = null;
async function checkAi(): Promise<boolean> {
  if (aiStatus !== null) return aiStatus;
  try {
    const r = await fetch("/api/tutor");
    aiStatus = !!(await r.json()).ai;
  } catch {
    aiStatus = false;
  }
  return aiStatus;
}

export function TutorChat({
  unit,
  asStep,
  mode = "guiado",
  onFinished,
}: {
  unit: Unit;
  asStep: boolean;
  mode?: ConversationMode;
  onFinished?: (xp: number) => void;
}) {
  const { state, update } = useApp();
  const { say } = useSpeaker();
  const lang = unit.lang;
  const meta = LANGS[lang];
  const dict = CONTENT[lang].dictionary;
  const steps = unit.conversation.steps;
  const [msgs, setMsgs] = useState<Msg[]>([{ author: "tutor", text: steps[0].tutor, pt: steps[0].tutor_pt }]);
  const [stepIndex, setStepIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(0);
  const [usedHelp, setUsedHelp] = useState(false);
  const [ai, setAi] = useState<boolean | null>(null);
  const [finished, setFinished] = useState<ConversationLog["summary"] | null>(null);
  const [showPt, setShowPt] = useState<Record<number, boolean>>({});
  const [word, setWord] = useState<RToken | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [askConsent, setAskConsent] = useState(false);
  const [started] = useState(() => conversationsLeft(state) > 0);
  const [timeLeft, setTimeLeft] = useState(25);
  const endRef = useRef<HTMLDivElement>(null);
  const listenRef = useRef<{ stop: () => void } | null>(null);
  const spokenFirst = useRef(false);
  const turnStartRef = useRef<number>(Date.now());
  const turnTimesRef = useRef<number[]>([]);

  useEffect(() => {
    checkAi().then(setAi);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, help, finished]);

  useEffect(() => {
    if (!spokenFirst.current && started && state.settings.tutorVoice) {
      spokenFirst.current = true;
      say(steps[0].tutor, lang);
    }
  }, [started, state.settings.tutorVoice, say, steps, lang]);

  // Temporizador para o Modo Desafio (25s por turno)
  useEffect(() => {
    turnStartRef.current = Date.now();
    if (mode !== "desafio" || finished || busy) return;
    setTimeLeft(25);
    const id = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [mode, stepIndex, finished, busy]);

  if (!started) {
    return (
      <div className="card p-6 text-center">
        <div className="text-4xl">⏳</div>
        <div className="mt-2 text-lg font-extrabold">Chegaste ao limite de conversas de hoje</div>
        <p className="mt-1 text-sm text-[var(--color-muted)]">O plano gratuito inclui 5 conversas por dia. Volta amanhã ou experimenta o Premium para conversas ilimitadas.</p>
        <Link href="/planos" className="btn btn-primary mt-5">
          Ver planos
        </Link>
      </div>
    );
  }

  const ladder = helpLadder(steps[stepIndex], lang);

  const finish = (history: Msg[]) => {
    const userMsgs = history.filter((m) => m.author === "user" && m.reply);
    const good = userMsgs.filter((m) => m.reply?.avaliacao === "correcta").length;
    const cats: Record<string, number> = {};
    userMsgs.forEach((m) => {
      const c = m.reply?.correccao?.categoria;
      if (c && m.reply?.avaliacao !== "correcta") cats[c] = (cats[c] ?? 0) + 1;
    });
    const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0] as ErrorCategory | undefined;
    const improveMsg = userMsgs.find((m) => m.reply?.correccao?.categoria === topCat && m.reply?.avaliacao !== "correcta");
    const avgMs =
      turnTimesRef.current.length > 0
        ? Math.round(turnTimesRef.current.reduce((a, b) => a + b, 0) / turnTimesRef.current.length)
        : 5000;
    const avgSec = Math.round(avgMs / 100) / 10;

    const summary: ConversationLog["summary"] = {
      good:
        good === userMsgs.length
          ? `Respondeste bem a todas as ${userMsgs.length} perguntas${usedHelp ? "" : " sem ajuda"} (${avgSec}s/resposta)!`
          : `${good} de ${userMsgs.length} respostas naturais à primeira (${avgSec}s/resposta). Conseguiste completar a cena!`,
      takeaways: unit.conversation.takeaways.slice(0, 2),
      improve: topCat
        ? `${CATEGORY_PT[topCat]}: ${improveMsg?.reply?.correccao?.explicacao ?? ""} → «${improveMsg?.reply?.correccao?.frase_natural ?? ""}»`
        : "Nada a apontar — perfeito! Experimenta o modo Desafio da próxima vez.",
    };
    const xp = 20 + (usedHelp ? 0 : 10) + (mode === "desafio" ? 15 : mode === "livre" ? 5 : 0);
    const log: ConversationLog = {
      id: Math.random().toString(36).slice(2),
      lang,
      unitId: unit.id,
      mode,
      at: Date.now(),
      summary,
      messages: history.map((m) => ({ author: m.author, text: plainText(m.text, lang) })),
      usedHelp,
      avgResponseMs: avgMs,
    };
    update((s) => {
      let n: typeof s = { ...s, conversations: [...s.conversations, log].slice(-100) };
      n = recordResponseMetric(n, lang, avgMs, usedHelp);
      if (asStep) {
        n = completeStep(n, unit.id, "conversa", xp);
        const today = Object.keys(n.days).sort().pop()!;
        n = { ...n, days: { ...n.days, [today]: { ...n.days[today], conversations: n.days[today].conversations + 1 } } };
      } else {
        n = addActivity(n, lang, `conversation:${mode}`, xp, { conversation: true });
      }
      return n;
    });
    setFinished(summary);
    onFinished?.(xp);
  };

  const computeOfflineReply = (text: string) =>
    mode === "livre"
      ? offlineFreeTurn({ unit, stepIndex, userText: text, dict })
      : offlineTurn({ unit, stepIndex, userText: text, dict, attempt: mode === "desafio" ? 2 : attempt });

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || busy || finished) return;
    const elapsed = Math.max(500, Date.now() - turnStartRef.current);
    turnTimesRef.current.push(elapsed);
    setInput("");
    setBusy(true);
    const userMsg: Msg = { author: "user", text };
    const history = [...msgs, userMsg];
    setMsgs(history);

    let reply: TutorReply;
    if (ai) {
      try {
        const r = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lang,
            unitId: unit.id,
            stepIndex,
            userText: text.slice(0, 400),
            mode,
            history: msgs.map((m) => ({ author: m.author, text: plainText(m.text, lang).slice(0, 800) })).slice(-20),
            level: currentLevel(state, lang),
            furigana: state.settings.furigana,
          }),
        });
        if (!r.ok) throw new Error(String(r.status));
        reply = (await r.json()).reply as TutorReply;
      } catch {
        reply = computeOfflineReply(text);
      }
    } else {
      await new Promise((res) => setTimeout(res, 350)); // ritmo natural
      reply = computeOfflineReply(text);
    }

    // registar erros recorrentes (modelo do aluno)
    if (reply.correccao && reply.avaliacao !== "correcta") {
      const cat = reply.correccao.categoria;
      update((s) => recordError(s, lang, cat, reply.correccao!.frase_natural));
    }

    const withAnalysis = history.map((m, k) => (k === history.length - 1 ? { ...m, reply } : m));
    const tutorMsg: Msg = { author: "tutor", text: displayText(reply.resposta_do_tutor, lang), pt: reply.traducao_pt };
    const next = [...withAnalysis, tutorMsg];
    setMsgs(next);
    setBusy(false);
    if (state.settings.tutorVoice) say(reply.resposta_do_tutor, lang);

    if (reply.proximo_passo === "repetir" && mode !== "desafio") {
      setAttempt((a) => a + 1);
      if (reply.ajuda_sugerida && help < 1) setHelp(1);
      return;
    }
    setAttempt(0);
    setHelp(0);
    if (reply.proximo_passo === "concluir" || stepIndex >= steps.length - 1) {
      finish(next);
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const startListening = () => {
    if (state.settings.voiceConsent === null) return setAskConsent(true);
    if (state.settings.voiceConsent === false) return;
    setListening(true);
    listenRef.current = listen(lang, {
      onInterim: (t) => setInput(t),
      onFinal: (t) => {
        setInput(t);
        setListening(false);
      },
      onError: () => setListening(false),
      onEnd: () => setListening(false),
    });
    if (!listenRef.current) setListening(false);
  };

  const modeBadge =
    mode === "livre"
      ? { label: "Livre", cls: "bg-[var(--color-teal-soft)] text-[#2a6b64]" }
      : mode === "desafio"
        ? { label: "⚡ Desafio", cls: "bg-[var(--color-coral-soft)] text-[var(--color-coral)]" }
        : { label: ai ? "IA" : "Guiado", cls: ai ? "bg-[var(--color-lilac-soft)] text-[var(--color-lilac)]" : "bg-[var(--color-bg)] text-[var(--color-muted)]" };

  return (
    <div className={`lang-${lang} flex flex-col`} data-testid={`tutor-chat-${mode}`}>
      <div className="mb-3 flex items-center gap-3 rounded-3xl bg-white p-3 shadow-[var(--shadow-card)]">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--color-teal-soft)] text-2xl">{meta.tutor.avatar}</span>
        <div className="flex-1">
          <div className="font-extrabold">
            {meta.tutor.name} <span className="text-xs font-semibold text-[var(--color-muted)]">· {meta.tutor.city}</span>
          </div>
          <div className="text-xs text-[var(--color-muted)]">
            {mode === "livre" ? `💬 Conversa livre: ${unit.title}` : mode === "desafio" ? `⚡ Desafio sem ajudas: ${unit.conversation.goal}` : `🎯 ${unit.conversation.goal}`}
          </div>
        </div>
        {mode === "desafio" && !finished && (
          <span
            data-testid="challenge-timer"
            className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${timeLeft <= 7 ? "bg-[var(--color-bad-soft)] text-[var(--color-bad)]" : "bg-[var(--color-yellow-soft)] text-[#8a6a12]"}`}
          >
            ⏱ {timeLeft}s
          </span>
        )}
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${modeBadge.cls}`}>
          {modeBadge.label}
        </span>
      </div>
      {mode === "livre" && !finished && (
        <div className="mb-3 rounded-2xl bg-[var(--color-teal-soft)]/50 px-3 py-2 text-xs">
          <span className="font-bold text-[#2a6b64]">Vocabulário sugerido: </span>
          <span className="inline-flex flex-wrap gap-1.5">
            {unit.vocab.slice(0, 6).map((v) => (
              <button
                key={v}
                type="button"
                className="target rounded-full bg-white px-2 py-0.5 font-semibold shadow-sm hover:bg-[var(--color-yellow-soft)]"
                onClick={() => setInput((cur) => (cur ? `${cur} ${v}` : v))}
                title={dict[v]?.pt ?? v}
              >
                {v} <span className="text-[10px] text-[var(--color-muted)]">({dict[v]?.pt})</span>
              </button>
            ))}
          </span>
        </div>
      )}
      <div className="mb-3 flex gap-1.5" aria-label={`Passo ${stepIndex + 1} de ${steps.length}`}>
        {steps.map((_, k) => (
          <div key={k} className={`h-1.5 flex-1 rounded-full ${k < stepIndex || finished ? "bg-[var(--color-good)]" : k === stepIndex ? "bg-[var(--color-teal)]" : "bg-[var(--color-line)]"}`} />
        ))}
      </div>

      <div className="flex flex-col gap-3" aria-live="polite">
        {msgs.map((m, k) =>
          m.author === "tutor" ? (
            <div key={k} className="fade-in flex justify-start">
              <div className="max-w-[88%] rounded-3xl rounded-bl-lg bg-white p-4 shadow-[var(--shadow-card)]">
                <div className="text-lg font-semibold leading-relaxed">
                  <TokenLine text={m.text} lang={lang} onWord={setWord} />
                </div>
                {showPt[k] && m.pt && <div className="fade-in mt-1 text-sm text-[var(--color-muted)]">{m.pt}</div>}
                <div className="mt-2 flex gap-1.5">
                  <button className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-bg)]" aria-label="Ouvir" onClick={() => say(m.text, lang)}>
                    <Icon name="volume" size={16} />
                  </button>
                  {m.pt && (
                    <button
                      className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-bg)]"
                      aria-label="Tradução"
                      aria-pressed={!!showPt[k]}
                      onClick={() => setShowPt((s) => ({ ...s, [k]: !s[k] }))}
                    >
                      <Icon name="translate" size={16} />
                    </button>
                  )}
                  <button className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-bg)]" aria-label="Reportar erro" onClick={() => setReport(plainText(m.text, lang))}>
                    <Icon name="flag" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div key={k} className="fade-in flex flex-col items-end gap-2">
              <div className="target max-w-[85%] rounded-3xl rounded-br-lg bg-[var(--color-ink)] px-4 py-3 text-white">{m.text}</div>
              {m.reply && <Analysis reply={m.reply} lang={lang} />}
            </div>
          ),
        )}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-3xl bg-white px-4 py-3 shadow-[var(--shadow-card)]">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-muted)]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-muted)] [animation-delay:.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-muted)] [animation-delay:.3s]" />
              </span>
            </div>
          </div>
        )}
      </div>

      {finished ? (
        <div className="card fade-in mt-5 p-5">
          <div className="trophy-pop text-center text-4xl">🎉</div>
          <CelebrationBurst xp={20 + (usedHelp ? 0 : 10) + (mode === "desafio" ? 15 : mode === "livre" ? 5 : 0)} />
          <h2 className="mt-2 text-center text-xl font-extrabold">Cena concluída!</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <div className="rounded-2xl bg-[var(--color-good-soft)] p-3">
              <div className="font-bold">✅ O que correu bem</div>
              <div>{finished.good}</div>
            </div>
            <div className="rounded-2xl bg-[var(--color-yellow-soft)] p-3">
              <div className="font-bold">✨ 2 expressões novas</div>
              {finished.takeaways.map((t, k) => (
                <div key={k} className="mt-1 flex items-center gap-2">
                  <span className="target font-semibold">{t.text}</span>
                  <span className="text-[var(--color-muted)]">— {t.pt}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-[var(--color-lilac-soft)] p-3">
              <div className="font-bold">🎯 1 ponto a melhorar</div>
              <div className="target">{finished.improve}</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {help > 0 && mode !== "desafio" && (
            <div className="fade-in mt-4 rounded-3xl bg-[var(--color-yellow-soft)] p-4 text-sm">
              {ladder.slice(0, help).map((h, k) => (
                <div key={k} className={k ? "mt-1" : ""}>
                  <b>{h.label}:</b> <span className="target">{h.text}</span>
                </div>
              ))}
            </div>
          )}
          <div ref={endRef} />
          <div className="sticky bottom-0 -mx-5 mt-4 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)] to-transparent px-5 pb-4 pt-6">
            <div className="mb-2 flex items-center gap-2">
              {mode === "desafio" ? (
                <span className="rounded-full bg-[var(--color-coral-soft)] px-3 py-1 text-xs font-bold text-[var(--color-coral)]">
                  ⚡ Modo Desafio · Sem ajudas (+15 XP bónus)
                </span>
              ) : (
                <button
                  className="chip"
                  disabled={help >= ladder.length}
                  onClick={() => {
                    setHelp((h) => Math.min(ladder.length, h + 1));
                    setUsedHelp(true);
                  }}
                >
                  <Icon name="help" size={16} /> Ajuda {help}/{ladder.length}
                </button>
              )}
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                className="input target flex-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang === "ja" ? "Escreve em japonês ou romaji…" : `Responde em ${meta.name.toLowerCase()}…`}
                aria-label="A tua resposta"
                maxLength={400}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                lang={meta.speechLang}
              />
              {sttSupported() && state.settings.voiceConsent !== false && (
                <button
                  type="button"
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition active:scale-90 ${listening ? "pulse-ring bg-[var(--color-bad)] text-white" : "bg-white shadow-[var(--shadow-card)]"}`}
                  onClick={() => (listening ? listenRef.current?.stop() : startListening())}
                  aria-label={listening ? "Parar" : "Falar"}
                >
                  <Icon name={listening ? "stop" : "mic"} size={22} />
                </button>
              )}
              <button className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--color-coral)] text-white transition hover:-translate-y-0.5 active:scale-90 disabled:opacity-40" disabled={!input.trim() || busy} aria-label="Enviar">
                <Icon name="send" size={20} />
              </button>
            </form>
          </div>
        </>
      )}
      {finished && <div ref={endRef} />}
      <WordSheet tok={word} lang={lang} onClose={() => setWord(null)} />
      <ReportSheet open={!!report} onClose={() => setReport(null)} refId={`${lang}:tutor:${unit.id}`} text={report ?? ""} />
      <VoiceConsentSheet
        open={askConsent}
        onAnswer={(ok) => {
          setAskConsent(false);
          update((s) => ({ ...s, settings: { ...s.settings, voiceConsent: ok } }));
          if (ok) setTimeout(startListening, 100);
        }}
      />
    </div>
  );
}

function Analysis({ reply, lang }: { reply: TutorReply; lang: LangCode }) {
  const c = reply.correccao;
  if (reply.avaliacao === "correcta" && !c) {
    return <span className="correct-pop rounded-full bg-[var(--color-good-soft)] px-3 py-1 text-xs font-bold text-[var(--color-good)]">✓ Correcto</span>;
  }
  const tone =
    reply.avaliacao === "correcta"
      ? { bg: "var(--color-good-soft)", fg: "var(--color-good)", label: "✓ Correcto" }
      : reply.avaliacao === "pouco_natural"
        ? { bg: "var(--color-yellow-soft)", fg: "#9a7414", label: "Compreensível — mais natural assim:" }
        : { bg: "var(--color-bad-soft)", fg: "var(--color-bad)", label: "Não percebi bem. Experimenta:" };
  return (
    <div className="fade-in max-w-[85%] rounded-2xl p-3 text-sm" style={{ background: tone.bg }}>
      <div className="font-bold" style={{ color: tone.fg }}>
        {tone.label}
      </div>
      {c && (
        <>
          <div className={`target mt-1 text-base font-semibold ${lang === "ja" ? "jp" : ""}`}>{c.frase_natural}</div>
          <div className="mt-1">{c.explicacao}</div>
          <span className="mt-2 inline-block rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold">{CATEGORY_PT[c.categoria]}</span>
        </>
      )}
      {!c && reply.ajuda_sugerida && <div className="mt-1">💡 {reply.ajuda_sugerida}</div>}
    </div>
  );
}

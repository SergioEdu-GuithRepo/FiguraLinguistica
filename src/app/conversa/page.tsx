"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { AppFrame } from "@/components/Shell";
import { TutorChat } from "@/components/steps/TutorChat";
import { CelebrationBurst, TopBar, useSpeaker } from "@/components/ui";
import { CONTENT, getUnit } from "@/content";
import { buildQuickResponsePrompts, buildTranslateSensePrompts } from "@/lib/fluencia";
import { LANGS } from "@/lib/langs";
import {
  addActivity,
  currentLevel,
  isUnitUnlocked,
  nextUnitId,
  recordResponseMetric,
  type ConversationMode,
} from "@/lib/state";
import { useApp } from "@/lib/store";
import { diagnose } from "@/lib/tutor";

type TabMode = ConversationMode | "rapido" | "sentido";

function Timer() {
  const [left, setLeft] = useState(180);
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(left / 60);
  const s = String(left % 60).padStart(2, "0");
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-bold ${left === 0 ? "bg-[var(--color-good-soft)] text-[var(--color-good)]" : "bg-white shadow-[var(--shadow-card)]"}`}>
      ⏱ {left === 0 ? "3 min ✓" : `${m}:${s}`}
    </span>
  );
}

function QuickResponseDrill({ onDone }: { onDone: () => void }) {
  const { state, update } = useApp();
  const { say } = useSpeaker();
  const lang = state.activeLang;
  const dict = CONTENT[lang].dictionary;
  const lvl = currentLevel(state, lang);
  const prompts = useMemo(() => buildQuickResponsePrompts(lang, lvl, 5), [lang, lvl]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(8);
  const [feedback, setFeedback] = useState<{ ok: boolean; best: string; note?: string } | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const startRef = useRef<number>(Date.now());
  const timesRef = useRef<number[]>([]);
  const spokenIdxRef = useRef<number>(-1);

  const item = prompts[idx];

  // Fala cada pergunta apenas 1 vez por índice (evita loop com o relógio de 1s e com a escrita)
  useEffect(() => {
    if (!item || done) return;
    if (spokenIdxRef.current !== idx) {
      spokenIdxRef.current = idx;
      if (state.settings.tutorVoice) say(item.tutor, lang);
    }
  }, [idx, item, done, state.settings.tutorVoice, say, lang]);

  // Temporizador regressivo de 1s separado da voz
  useEffect(() => {
    if (!item || feedback || done) return;
    startRef.current = Date.now();
    setTimeLeft(item.timeLimitSec);
    const id = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [idx, item, feedback, done]);

  if (!item) return null;

  const submit = (textRaw?: string) => {
    const val = (textRaw ?? input).trim();
    if (!val || feedback) return;
    const elapsed = Math.max(400, Date.now() - startRef.current);
    timesRef.current.push(elapsed);
    const d = diagnose(val, item.step, lang, dict);
    const ok = d.avaliacao !== "incompreensivel";
    if (ok) setScore((s) => s + 1);
    setFeedback({
      ok,
      best: d.best,
      note: d.correccao?.explicacao,
    });
  };

  const next = () => {
    setFeedback(null);
    setInput("");
    if (idx + 1 >= prompts.length) {
      const avgMs =
        timesRef.current.length > 0
          ? Math.round(timesRef.current.reduce((a, b) => a + b, 0) / timesRef.current.length)
          : 4000;
      update((s) => {
        const n = recordResponseMetric(s, lang, avgMs, false);
        return addActivity(n, lang, "fluency:rapido", 25);
      });
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  if (done) {
    return (
      <div className="card fade-in p-6 text-center" data-testid="fluency-rapido-done">
        <div className="trophy-pop text-4xl">⚡</div>
        <CelebrationBurst xp={25} />
        <h2 className="mt-2 text-xl font-extrabold">Responder rápido concluído!</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Acertaste {score} de {prompts.length} respostas rápidas · +25 XP
        </p>
        <button className="btn btn-primary mt-5 w-full" onClick={onDone}>
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="card p-5" data-testid="fluency-rapido">
      <div className="flex items-center justify-between text-xs font-bold text-[var(--color-muted)]">
        <span>⚡ Responder rápido · {idx + 1}/{prompts.length}</span>
        <span className={timeLeft <= 3 ? "text-[var(--color-bad)]" : "text-[var(--color-teal)]"}>⏱ {timeLeft}s</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
        <div
          className="h-full bg-[var(--color-coral)] transition-all duration-300"
          style={{ width: `${(timeLeft / item.timeLimitSec) * 100}%` }}
        />
      </div>
      <div className="mt-4 rounded-2xl bg-[var(--color-bg)] p-4">
        <div className="text-xs font-semibold text-[var(--color-muted)]">Cena: {item.unitTitle}</div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="target text-lg font-extrabold">{item.tutor}</div>
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white shadow-sm"
            onClick={() => say(item.tutor, lang)}
            aria-label="Ouvir pergunta"
          >
            <Icon name="volume" size={16} />
          </button>
        </div>
        <div className="mt-1 text-xs text-[var(--color-muted)]">{item.tutorPt}</div>
      </div>

      {!feedback ? (
        <>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              className="input target flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Responde sem hesitar…"
              aria-label="Resposta rápida"
            />
            <button type="submit" className="btn btn-primary" disabled={!input.trim()}>
              Enviar
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="rapido-quick-answer"
              className="chip text-xs"
              onClick={() => submit(item.step.model)}
            >
              💡 {item.step.starter}…
            </button>
          </div>
        </>
      ) : (
        <div className={`fade-in mt-4 rounded-2xl p-4 text-sm ${feedback.ok ? "bg-[var(--color-good-soft)]" : "bg-[var(--color-yellow-soft)]"}`}>
          <div className="font-extrabold">{feedback.ok ? "✓ Boa resposta rápida!" : "Quase! Resposta natural:"}</div>
          <div className="target mt-1 font-semibold">{feedback.best}</div>
          {feedback.note && <div className="mt-1 text-xs text-[var(--color-muted)]">{feedback.note}</div>}
          <button type="button" data-testid="rapido-next" className="btn btn-primary mt-3 w-full" onClick={next}>
            {idx + 1 >= prompts.length ? "Concluir" : "Seguinte"}
          </button>
        </div>
      )}
    </div>
  );
}

function TranslateSenseDrill({ onDone }: { onDone: () => void }) {
  const { state, update } = useApp();
  const { say } = useSpeaker();
  const lang = state.activeLang;
  const lvl = currentLevel(state, lang);
  const prompts = useMemo(() => buildTranslateSensePrompts(lang, lvl, 5), [lang, lvl]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const item = prompts[idx];
  if (!item) return null;

  const choose = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const ok = opt === item.step.model;
    if (ok) setScore((s) => s + 1);
    if (state.settings.tutorVoice) say(item.step.model, lang);
  };

  const next = () => {
    setPicked(null);
    if (idx + 1 >= prompts.length) {
      update((s) => addActivity(s, lang, "fluency:sentido", 25));
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  if (done) {
    return (
      <div className="card fade-in p-6 text-center" data-testid="fluency-sentido-done">
        <div className="trophy-pop text-4xl">🎯</div>
        <CelebrationBurst xp={25} />
        <h2 className="mt-2 text-xl font-extrabold">Traduzir o sentido concluído!</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {score} de {prompts.length} equivalentes naturais certos · +25 XP
        </p>
        <button className="btn btn-primary mt-5 w-full" onClick={onDone}>
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="card p-5" data-testid="fluency-sentido">
      <div className="flex items-center justify-between text-xs font-bold text-[var(--color-muted)]">
        <span>🎯 Traduzir o sentido (não palavra a palavra)</span>
        <span>{idx + 1}/{prompts.length}</span>
      </div>
      <div className="mt-3 rounded-2xl bg-[var(--color-bg)] p-4">
        <div className="text-xs font-semibold text-[var(--color-muted)]">{item.situationPt}</div>
        <div className="mt-1 text-lg font-extrabold">«{item.meaningPt}»</div>
        <div className="mt-1 text-xs text-[var(--color-muted)]">Escolhe a forma mais natural neste contexto:</div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {item.options.map((opt) => {
          const isCorrect = opt === item.step.model;
          const isSelected = picked === opt;
          const cls = !picked
            ? "bg-white hover:bg-[var(--color-yellow-soft)]"
            : isCorrect
              ? "bg-[var(--color-good-soft)] ring-2 ring-[var(--color-good)]"
              : isSelected
                ? "bg-[var(--color-bad-soft)] ring-2 ring-[var(--color-bad)]"
                : "bg-white opacity-60";
          return (
            <button
              key={opt}
              type="button"
              data-testid={isCorrect ? "sentido-correct-option" : "sentido-option"}
              className={`target rounded-2xl p-3.5 text-left font-semibold shadow-[var(--shadow-card)] transition ${cls}`}
              onClick={() => choose(opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="fade-in mt-4">
          <button type="button" data-testid="sentido-next" className="btn btn-primary w-full" onClick={next}>
            {idx + 1 >= prompts.length ? "Concluir" : "Seguinte"}
          </button>
        </div>
      )}
    </div>
  );
}

function QuickConversationInner() {
  const { state } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = state.activeLang;
  const unlocked = CONTENT[lang].units.filter((u) => isUnitUnlocked(state, u.id));
  const initialMode = (searchParams.get("mode") as TabMode) || "guiado";
  const initialUnit = searchParams.get("unit") || nextUnitId(state, lang) || unlocked[0].id;

  const [tab, setTab] = useState<TabMode>(initialMode);
  const [unitId, setUnitId] = useState<string>(initialUnit);
  const [round, setRound] = useState(0);
  const unit = getUnit(unitId) ?? unlocked[0];

  const tabs: { id: TabMode; label: string }[] = [
    { id: "guiado", label: "🎯 Guiado" },
    { id: "livre", label: "💬 Livre" },
    { id: "desafio", label: "⚡ Desafio" },
    { id: "rapido", label: "⏱ Rápido" },
    { id: "sentido", label: "🧠 Sentido" },
  ];

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else if (searchParams.get("mode")) {
      router.push("/cursos/conversas");
    } else {
      router.push("/inicio");
    }
  };

  return (
    <>
      <TopBar back={handleBack} title={`Conversa & Fluência · ${LANGS[lang].flag}`} right={<Timer key={`${tab}-${round}`} />} />
      <div className="no-scrollbar -mx-5 mb-3 flex gap-1.5 overflow-x-auto px-5 pb-1" role="tablist" aria-label="Modos de conversa e fluência">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            data-testid={`mode-tab-${t.id}`}
            className={`chip shrink-0 text-xs ${tab === t.id ? "!bg-[var(--color-coral)] !text-white" : ""}`}
            onClick={() => {
              setTab(t.id);
              setRound((r) => r + 1);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "rapido" ? (
        <QuickResponseDrill key={round} onDone={() => setTab("guiado")} />
      ) : tab === "sentido" ? (
        <TranslateSenseDrill key={round} onDone={() => setTab("guiado")} />
      ) : (
        <>
          <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1">
            {unlocked.map((u) => (
              <button
                key={u.id}
                className={`chip shrink-0 ${u.id === unit.id ? "!bg-[var(--color-ink)] text-white" : ""}`}
                onClick={() => {
                  setUnitId(u.id);
                  setRound((r) => r + 1);
                }}
              >
                {u.emoji} {u.title}
              </button>
            ))}
          </div>
          <TutorChat key={`${unit.id}-${tab}-${round}`} unit={unit} asStep={false} mode={tab} />
        </>
      )}
    </>
  );
}

export default function ConversaPage() {
  return (
    <AppFrame nav={false}>
      <Suspense fallback={<div className="card p-6 text-center">A carregar conversa…</div>}>
        <QuickConversationInner />
      </Suspense>
    </AppFrame>
  );
}

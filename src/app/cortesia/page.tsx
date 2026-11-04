"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { AppFrame } from "@/components/Shell";
import { CelebrationBurst, TopBar, useSpeaker } from "@/components/ui";
import { COUNTERS, POLITENESS_ROWS, buildCortesiaQuiz } from "@/lib/cortesia";
import { addActivity } from "@/lib/state";
import { useApp } from "@/lib/store";

type Tab = "contadores" | "cortesia" | "praticar";

function CortesiaContent() {
  const { state, update } = useApp();
  const { say } = useSpeaker();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("contadores");
  const [selectedCounter, setSelectedCounter] = useState(COUNTERS[0].id);

  // Quiz state
  const questions = buildCortesiaQuiz();
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const counter = COUNTERS.find((c) => c.id === selectedCounter) ?? COUNTERS[0];
  const currentQ = questions[qIdx];

  const chooseAnswer = (label: string) => {
    if (picked) return;
    setPicked(label);
    if (label === currentQ.correct) setScore((s) => s + 1);
  };

  const nextQ = () => {
    setPicked(null);
    if (qIdx + 1 >= questions.length) {
      update((s) => addActivity(s, "ja", "cortesia-quiz", 25));
      setQuizDone(true);
    } else {
      setQIdx((i) => i + 1);
    }
  };

  const resetQuiz = () => {
    setQIdx(0);
    setPicked(null);
    setScore(0);
    setQuizDone(false);
  };

  return (
    <div data-testid="cortesia-page" className="pb-24">
      <TopBar back={() => router.push("/cursos")} title="Contadores e Cortesia (敬語)" />
      <p className="mb-3 text-sm text-[var(--color-muted)]">
        Em japonês, contamos objectos segundo a sua forma e adaptamos o registo (informal, です/ます ou keigo) a quem nos ouve.
      </p>

      <div className="mb-4 flex gap-2" role="tablist">
        {(
          [
            { id: "contadores", label: "🔢 Contadores" },
            { id: "cortesia", label: "🙇 Cortesia (Keigo)" },
            { id: "praticar", label: "🎯 Praticar" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            data-testid={`cortesia-tab-${t.id}`}
            className={`chip flex-1 justify-center text-xs ${tab === t.id ? "!bg-[var(--color-ink)] !text-white" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "contadores" && (
        <div className="fade-in flex flex-col gap-4">
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {COUNTERS.map((c) => (
              <button
                key={c.id}
                type="button"
                data-testid={`counter-pill-${c.id}`}
                className={`chip shrink-0 ${c.id === counter.id ? "!bg-[var(--color-coral)] !text-white" : ""}`}
                onClick={() => setSelectedCounter(c.id)}
              >
                <span className="jp text-base font-extrabold">{c.symbol}</span> · {c.titlePt.split(" ")[0]}
              </button>
            ))}
          </div>

          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="jp text-3xl font-extrabold text-[var(--color-coral)]">{counter.symbol}</span>
                  <span className="rounded-full bg-[var(--color-yellow-soft)] px-2.5 py-0.5 text-xs font-bold">
                    {counter.reading} ({counter.romaji})
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-extrabold">{counter.titlePt}</h2>
              </div>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-bg)]"
                onClick={() => say(counter.example.reading, "ja")}
                aria-label="Ouvir exemplo"
              >
                <Icon name="volume" size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{counter.usagePt}</p>
            <div className="mt-3 rounded-2xl bg-[var(--color-teal-soft)]/50 p-3 text-xs">
              <b>💡 Dica:</b> {counter.tipPt}
            </div>
            <div className="mt-3 rounded-2xl bg-[var(--color-bg)] p-3 text-sm">
              <div className="jp font-bold">{counter.example.ja}</div>
              {state.settings.romaji && <div className="text-xs text-[var(--color-muted)]">{counter.example.romaji}</div>}
              <div className="mt-0.5 text-xs text-[var(--color-muted)]">{counter.example.pt}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {counter.items.map((it) => (
                <button
                  key={it.n}
                  type="button"
                  onClick={() => say(it.reading, "ja")}
                  className={`flex items-center justify-between rounded-2xl p-3 text-left transition ${
                    it.irregular
                      ? "bg-[var(--color-yellow-soft)] ring-1 ring-[var(--color-yellow)]"
                      : "bg-[var(--color-bg)] hover:bg-[var(--color-line)]/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[var(--color-muted)]">{it.n}.</span>
                      <span className="jp font-extrabold">{it.kanji}</span>
                      {it.irregular && (
                        <span className="rounded-full bg-[var(--color-coral)] px-1.5 py-0.2 text-[9px] font-bold text-white">
                          som!
                        </span>
                      )}
                    </div>
                    <div className="jp text-xs font-semibold">{it.reading}</div>
                    {state.settings.romaji && <div className="text-[11px] text-[var(--color-muted)]">{it.romaji}</div>}
                  </div>
                  <Icon name="volume" size={15} className="text-[var(--color-muted)]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "cortesia" && (
        <div className="fade-in flex flex-col gap-3" data-testid="cortesia-table">
          <div className="card p-4 text-xs text-[var(--color-muted)]">
            <b>Como escolher o registo:</b> usa <b>丁寧語 (です・ます)</b> como padrão seguro no dia-a-dia; usa <b>普通形 (informal)</b> com amigos próximos; e reconhece <b>敬語 (Keigo)</b> em lojas, restaurantes, hotéis e reuniões de trabalho.
          </div>
          {POLITENESS_ROWS.map((row) => (
            <div key={row.id} className="card p-4">
              <div className="font-extrabold text-[var(--color-ink)]">{row.meaningPt}</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => say(row.casual.ja.replace(/ \(.*\)/, ""), "ja")}
                  className="rounded-2xl bg-[var(--color-bg)] p-3 text-left"
                >
                  <div className="text-[10px] font-extrabold uppercase text-[var(--color-muted)]">1. Informal (amigos)</div>
                  <div className="jp mt-0.5 font-extrabold">{row.casual.ja}</div>
                  {state.settings.romaji && <div className="text-xs text-[var(--color-muted)]">{row.casual.romaji}</div>}
                  <div className="mt-1 text-[11px] text-[var(--color-muted)]">{row.casual.note}</div>
                </button>

                <button
                  type="button"
                  onClick={() => say(row.polite.ja, "ja")}
                  className="rounded-2xl bg-[var(--color-teal-soft)]/50 p-3 text-left"
                >
                  <div className="text-[10px] font-extrabold uppercase text-[#2a6b64]">2. Cortês (です・ます)</div>
                  <div className="jp mt-0.5 font-extrabold">{row.polite.ja}</div>
                  {state.settings.romaji && <div className="text-xs text-[var(--color-muted)]">{row.polite.romaji}</div>}
                  <div className="mt-1 text-[11px] text-[var(--color-muted)]">{row.polite.note}</div>
                </button>

                <button
                  type="button"
                  onClick={() => say(row.keigo.ja.split("/")[0].trim(), "ja")}
                  className="rounded-2xl bg-[var(--color-lilac-soft)]/60 p-3 text-left"
                >
                  <div className="text-[10px] font-extrabold uppercase text-[var(--color-lilac)]">3. {row.keigo.type}</div>
                  <div className="jp mt-0.5 font-extrabold">{row.keigo.ja}</div>
                  {state.settings.romaji && <div className="text-xs text-[var(--color-muted)]">{row.keigo.romaji}</div>}
                  <div className="mt-1 text-[11px] text-[var(--color-muted)]">{row.keigo.note}</div>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "praticar" && (
        <div className="fade-in">
          {quizDone ? (
            <div className="card p-6 text-center" data-testid="cortesia-quiz-done">
              <div className="trophy-pop text-4xl">🎌</div>
              <CelebrationBurst xp={25} />
              <h2 className="mt-2 text-xl font-extrabold">Prática de Contadores e Keigo concluída!</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Acertaste {score} de {questions.length} questões · +25 XP
              </p>
              <button type="button" className="btn btn-primary mt-5 w-full" onClick={resetQuiz}>
                Praticar novamente
              </button>
            </div>
          ) : (
            <div className="card p-5" data-testid="cortesia-quiz">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--color-muted)]">
                <span>{currentQ.kind === "counter" ? "🔢 Contador em uso" : "🙇 Registo e Cortesia"}</span>
                <span>
                  {qIdx + 1}/{questions.length}
                </span>
              </div>
              <div className="mt-3 rounded-2xl bg-[var(--color-bg)] p-4">
                <div className="text-sm font-bold">{currentQ.promptPt}</div>
                {currentQ.contextJa && (
                  <div className="jp mt-1 text-xl font-extrabold text-[var(--color-coral)]">{currentQ.contextJa}</div>
                )}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {currentQ.options.map((opt) => {
                  const isCorrect = opt.label === currentQ.correct;
                  const isSelected = picked === opt.label;
                  const cls = !picked
                    ? "bg-white hover:bg-[var(--color-yellow-soft)]"
                    : isCorrect
                      ? "bg-[var(--color-good-soft)] ring-2 ring-[var(--color-good)]"
                      : isSelected
                        ? "bg-[var(--color-bad-soft)] ring-2 ring-[var(--color-bad)]"
                        : "bg-white opacity-60";
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      data-testid={isCorrect ? "cortesia-correct-option" : "cortesia-option"}
                      className={`rounded-2xl p-3.5 text-left shadow-[var(--shadow-card)] transition ${cls}`}
                      onClick={() => chooseAnswer(opt.label)}
                    >
                      <div className="jp font-extrabold">{opt.label}</div>
                      {opt.sub && <div className="text-xs text-[var(--color-muted)]">{opt.sub}</div>}
                    </button>
                  );
                })}
              </div>
              {picked && (
                <div className="fade-in mt-4 rounded-2xl bg-[var(--color-bg)] p-3 text-xs">
                  <div className="font-bold">
                    {picked === currentQ.correct ? "✓ Correcto!" : `Resposta certa: ${currentQ.correct}`}
                  </div>
                  <div className="mt-1 text-[var(--color-muted)]">{currentQ.explanationPt}</div>
                  <button
                    type="button"
                    data-testid="cortesia-next"
                    className="btn btn-primary mt-3 w-full"
                    onClick={nextQ}
                  >
                    {qIdx + 1 >= questions.length ? "Concluir" : "Seguinte"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CortesiaPage() {
  return (
    <AppFrame>
      <CortesiaContent />
    </AppFrame>
  );
}

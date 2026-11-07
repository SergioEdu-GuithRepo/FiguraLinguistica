"use client";

/**
 * Módulo de kanji (Fase 2): kanji por ordem de frequência/introdução no curso,
 * com leituras, exemplos, reconhecimento e traçado. A força de memória fica em `state.kana`
 * (mesmo baralho FSRS da escrita), o que permite esconder a furigana dos kanji dominados.
 */
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AppFrame } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { Sheet } from "@/components/Sheet";
import { Trace } from "@/components/Trace";
import { CelebrationBurst, ProgressBar, SpeakButton, TopBar, useSpeaker } from "@/components/ui";
import { KANJI, type Kanji } from "@/content/ja/kanji";
import { isStrong, review, type Rating } from "@/lib/fsrs";
import { addActivity } from "@/lib/state";
import { useApp } from "@/lib/store";

type Mode = "lista" | "reconhecer" | "tracar";

/** Os primeiros kanji são os dos níveis 1–9; os restantes chegam com a etapa Rotina. */
const FIRST_STAGE = 51;

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/* ---------------- Detalhe ---------------- */

function KanjiSheet({ k, onClose, onTrace }: { k: Kanji | null; onClose: () => void; onTrace: (k: Kanji) => void }) {
  const { state } = useApp();
  return (
    <Sheet open={!!k} onClose={onClose} title={<span className="text-sm font-semibold text-[var(--color-muted)]">Kanji</span>}>
      {k && (
        <div className="lang-ja" data-testid="kanji-sheet">
          <div className="flex items-center gap-4">
            <div className="jp grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-[var(--color-teal-soft)] text-6xl font-bold">{k.char}</div>
            <div className="min-w-0">
              <div className="text-xl font-extrabold">{k.meaning}</div>
              <div className="mt-1 text-sm text-[var(--color-muted)]">
                {k.strokes} traços {isStrong(state.kana[k.char]) && <span className="ml-1 font-bold text-[var(--color-good)]">· dominado ✓</span>}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-[var(--color-bg)] p-3">
              <div className="text-xs font-bold text-[var(--color-muted)]">ON (leitura chinesa)</div>
              <div className="jp mt-1 text-lg">{k.on.length ? k.on.join("、") : "—"}</div>
            </div>
            <div className="rounded-2xl bg-[var(--color-bg)] p-3">
              <div className="text-xs font-bold text-[var(--color-muted)]">KUN (leitura japonesa)</div>
              <div className="jp mt-1 text-lg">{k.kun.length ? k.kun.join("、") : "—"}</div>
            </div>
          </div>
          {k.tip && <div className="mt-3 rounded-2xl bg-[var(--color-yellow-soft)] p-3 text-sm">💡 {k.tip}</div>}
          <div className="mt-4 text-xs font-bold text-[var(--color-muted)]">PALAVRAS</div>
          <div className="mt-2 flex flex-col gap-2">
            {k.examples.map((e) => (
              <div key={e.word} className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] p-3">
                <div className="flex-1">
                  <ruby className="jp text-xl font-bold">
                    {e.word}
                    <rt>{e.reading}</rt>
                  </ruby>
                  <div className="text-sm text-[var(--color-muted)]">
                    {e.romaji} · {e.pt}
                  </div>
                </div>
                <SpeakButton text={e.reading} lang="ja" size={36} />
              </div>
            ))}
          </div>
          <button className="btn btn-primary mt-5 w-full" onClick={() => onTrace(k)}>
            <Icon name="pen" size={18} /> Traçar este kanji
          </button>
        </div>
      )}
    </Sheet>
  );
}

/* ---------------- Lista ---------------- */

function Grid({ items, onPick }: { items: Kanji[]; onPick: (k: Kanji) => void }) {
  const { state } = useApp();
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((k) => (
        <button
          key={k.char}
          onClick={() => onPick(k)}
          className={`card flex aspect-square flex-col items-center justify-center !rounded-2xl p-1 ${isStrong(state.kana[k.char]) ? "ring-2 ring-[var(--color-good)]" : ""}`}
          aria-label={`${k.char} — ${k.meaning}`}
        >
          <span className="jp text-3xl font-bold">{k.char}</span>
          <span className="line-clamp-1 text-[10px] text-[var(--color-muted)]">{k.meaning.split(";")[0]}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- Reconhecer ---------------- */

interface Q {
  char: string;
  prompt: string;
  promptReading?: string;
  kind: "significado" | "leitura";
  answer: string;
  options: string[];
}

function makeQuestions(pool: Kanji[], cards: ReturnType<typeof useApp>["state"]["kana"]): Q[] {
  const now = Date.now();
  // primeiro os novos e os em atraso, depois os restantes
  const ordered = shuffle(pool)
    .map((k) => ({ k, w: cards[k.char] ? (cards[k.char].due <= now ? 0 : 2) : 1 }))
    .sort((a, b) => a.w - b.w)
    .slice(0, 10)
    .map(({ k }) => k);
  return ordered.map((k, i) => {
    if (i % 2 === 0) {
      const others = shuffle(pool.filter((o) => o.char !== k.char).map((o) => o.meaning));
      return { char: k.char, prompt: k.char, kind: "significado", answer: k.meaning, options: shuffle([k.meaning, ...others.slice(0, 3)]) };
    }
    const ex = k.examples[0];
    const others = shuffle(pool.flatMap((o) => o.examples.map((e) => e.reading)).filter((r) => r !== ex.reading));
    return {
      char: k.char,
      prompt: ex.word,
      promptReading: ex.pt,
      kind: "leitura",
      answer: ex.reading,
      options: shuffle([ex.reading, ...Array.from(new Set(others)).slice(0, 3)]),
    };
  });
}

function Quiz({ pool }: { pool: Kanji[] }) {
  const { state, update } = useApp();
  const { say } = useSpeaker();
  // as perguntas são fixas durante a ronda
  const [questions, setQuestions] = useState(() => makeQuestions(pool, state.kana));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const t0 = useRef(0);
  useEffect(() => {
    t0.current = Date.now();
  }, [i]);

  if (!questions.length) return <p className="text-sm text-[var(--color-muted)]">Sem kanji para praticar.</p>;
  if (done)
    return (
      <div className="fade-in py-8 text-center" data-testid="kanji-quiz-done">
        <div className="trophy-pop text-5xl">🈴</div>
        <CelebrationBurst xp={8} />
        <div className="mt-2 text-xl font-extrabold">
          {correct}/{questions.length} certas
        </div>
        <button
          className="btn btn-primary mt-5"
          onClick={() => {
            setQuestions(makeQuestions(pool, state.kana));
            setI(0);
            setCorrect(0);
            setPicked(null);
            setDone(false);
          }}
        >
          Outra ronda
        </button>
      </div>
    );

  const q = questions[i];
  const choose = (o: string) => {
    if (picked) return;
    setPicked(o);
    const ok = o === q.answer;
    if (q.kind === "leitura") say(q.answer, "ja");
    const secs = (Date.now() - t0.current) / 1000;
    const rating: Rating = !ok ? 1 : secs < 3 ? 4 : 3;
    if (ok) setCorrect((c) => c + 1);
    update((s) => ({ ...s, kana: { ...s.kana, [q.char]: review(s.kana[q.char], rating) } }));
    setTimeout(
      () => {
        if (i + 1 >= questions.length) {
          setDone(true);
          update((s) => addActivity(s, "ja", "kanji", 8));
        } else {
          setI(i + 1);
          setPicked(null);
        }
      },
      ok ? 600 : 1300,
    );
  };
  return (
    <div key={i} className="fade-in">
      <ProgressBar pct={(i / questions.length) * 100} color="var(--color-teal)" />
      <div className="mt-3 text-center text-sm font-semibold text-[var(--color-muted)]">{q.kind === "significado" ? "O que significa?" : "Como se lê?"}</div>
      <div className="card mt-2 grid place-items-center p-8">
        <span className="jp text-6xl font-bold" data-testid="kanji-prompt">
          {q.prompt}
        </span>
        {q.promptReading && <span className="mt-2 text-sm text-[var(--color-muted)]">({q.promptReading})</span>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {q.options.map((o) => {
          const st = picked ? (o === q.answer ? "ok" : o === picked ? "bad" : "") : "";
          return (
            <button
              key={o}
              onClick={() => choose(o)}
              className={`btn min-h-[52px] ${q.kind === "leitura" ? "jp text-lg" : "text-sm"} ${st === "ok" ? "!bg-[var(--color-good-soft)] text-[var(--color-good)]" : st === "bad" ? "!bg-[var(--color-bad-soft)] text-[var(--color-bad)]" : "btn-ghost"}`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Página ---------------- */

function KanjiModule() {
  const { state, update } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("lista");
  const [sel, setSel] = useState<Kanji | null>(null);
  const [traceStart, setTraceStart] = useState<string | null>(null);
  const strong = KANJI.filter((k) => isStrong(state.kana[k.char])).length;
  const stage1 = KANJI.slice(0, FIRST_STAGE);
  const stage2 = KANJI.slice(FIRST_STAGE);

  useEffect(() => {
    const k = params.get("k");
    if (k) setSel(KANJI.find((x) => x.char === k) ?? null);
  }, [params]);

  const traceItems = useMemo((): [string, string][] => {
    const all = KANJI.map((k) => [k.char, k.meaning] as [string, string]);
    if (!traceStart) return all;
    const i = all.findIndex(([c]) => c === traceStart);
    return i > 0 ? [...all.slice(i), ...all.slice(0, i)] : all;
  }, [traceStart]);

  const handleBack = () => {
    if (mode !== "lista") {
      setMode("lista");
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 2) router.back();
    else router.push("/cursos");
  };

  return (
    <>
      <TopBar back={handleBack} title="Escrita japonesa: kanji" />
      <div className="card mb-4 p-4">
        <div className="flex justify-between text-sm font-semibold">
          <span>Kanji dominados</span>
          <span data-testid="kanji-count">
            {strong}/{KANJI.length}
          </span>
        </div>
        <ProgressBar pct={(strong / KANJI.length) * 100} className="mt-2" color="var(--color-teal)" />
        <label className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span>
            <b>Furigana automática</b>
            <span className="block text-xs text-[var(--color-muted)]">Esconde a leitura nos kanji que já dominas</span>
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--color-coral)]"
            checked={state.settings.furiganaAuto}
            onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, furiganaAuto: e.target.checked, furigana: true } }))}
          />
        </label>
      </div>
      <div className="mb-4 flex gap-2">
        {(
          [
            ["lista", "Lista"],
            ["reconhecer", "Reconhecer"],
            ["tracar", "Traçar"],
          ] as const
        ).map(([m, l]) => (
          <button key={m} className={`chip ${mode === m ? "!bg-[var(--color-ink)] text-white" : ""}`} onClick={() => setMode(m)}>
            {l}
          </button>
        ))}
      </div>

      {mode === "lista" && (
        <>
          <h3 className="mb-2 font-extrabold">
            Sobrevivência <span className="text-sm font-semibold text-[var(--color-muted)]">· níveis 1–9 · {stage1.length} kanji</span>
          </h3>
          <Grid items={stage1} onPick={setSel} />
          <h3 className="mb-2 mt-6 font-extrabold">
            Rotina <span className="text-sm font-semibold text-[var(--color-muted)]">· níveis 10–18 · {stage2.length} kanji</span>
          </h3>
          <Grid items={stage2} onPick={setSel} />
          <p className="mt-4 text-center text-xs text-[var(--color-muted)]">Ordenados por frequência e pela ordem em que aparecem nas unidades.</p>
        </>
      )}
      {mode === "reconhecer" && <Quiz pool={KANJI} />}
      {mode === "tracar" && <Trace key={traceStart ?? "all"} all={traceItems} activity="kanji-trace" />}

      <KanjiSheet
        k={sel}
        onClose={() => {
          setSel(null);
          if (params.get("k")) router.replace("/kanji");
        }}
        onTrace={(k) => {
          setSel(null);
          setTraceStart(k.char);
          setMode("tracar");
        }}
      />
    </>
  );
}

export default function KanjiPage() {
  return (
    <AppFrame nav={false}>
      <Suspense>
        <KanjiModule />
      </Suspense>
    </AppFrame>
  );
}

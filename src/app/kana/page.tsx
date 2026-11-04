"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppFrame } from "@/components/Shell";
import { Trace } from "@/components/Trace";
import { CelebrationBurst, ProgressBar, TopBar, useSpeaker } from "@/components/ui";
import { HIRAGANA_DAKUTEN, HIRAGANA_ROWS, KANA_TIPS, KATAKANA_DAKUTEN, KATAKANA_ROWS, type KanaPair } from "@/content/kana";
import { isStrong, review, type Rating } from "@/lib/fsrs";
import { addActivity } from "@/lib/state";
import { useApp } from "@/lib/store";

type Script = "hiragana" | "katakana";
type Mode = "tabela" | "reconhecer" | "tracar";

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/* ---------------- Tabela ---------------- */

function Table({ rows, dakuten }: { rows: KanaPair[][]; dakuten: KanaPair[][] }) {
  const { state } = useApp();
  const { say } = useSpeaker();
  const [tip, setTip] = useState<string | null>(null);
  const cell = ([k, r]: KanaPair) => {
    const strong = isStrong(state.kana[k]);
    return (
      <button
        key={k}
        onClick={() => {
          say(k, "ja");
          setTip(KANA_TIPS[k] ? `${k} — ${KANA_TIPS[k]}` : null);
        }}
        className={`card flex aspect-square flex-col items-center justify-center !rounded-2xl ${strong ? "ring-2 ring-[var(--color-good)]" : ""}`}
      >
        <span className="jp text-2xl font-bold">{k}</span>
        <span className="text-[11px] text-[var(--color-muted)]">{r}</span>
      </button>
    );
  };
  return (
    <div>
      {tip && <div className="fade-in mb-3 rounded-2xl bg-[var(--color-yellow-soft)] p-3 text-sm">💡 {tip}</div>}
      <div className="grid grid-cols-5 gap-2">{rows.flatMap((r) => [...r.map(cell), ...Array.from({ length: 5 - r.length }).map((_, i) => <span key={`${r[0][0]}-${i}`} />)])}</div>
      <h3 className="mb-2 mt-5 font-extrabold">Com dakuten ( ゛ ) e handakuten ( ゜ )</h3>
      <div className="grid grid-cols-5 gap-2">{dakuten.flatMap((r) => r.map(cell))}</div>
    </div>
  );
}

/* ---------------- Reconhecer ---------------- */

function Quiz({ all, script }: { all: KanaPair[]; script: Script }) {
  const { state, update } = useApp();
  const { say } = useSpeaker();
  const questions = useMemo(() => {
    // prioriza caracteres fracos / em atraso
    const now = Date.now();
    const scored = all.map((p) => ({ p, w: state.kana[p[0]] ? (state.kana[p[0]].due <= now ? 1 : 3) : 2 }));
    return shuffle(scored)
      .sort((a, b) => a.w - b.w)
      .slice(0, 10)
      .map(({ p }) => {
        const opts = shuffle([p[1], ...shuffle(all.filter((o) => o[1] !== p[1]).map((o) => o[1])).slice(0, 3)]);
        return { kana: p[0], answer: p[1], options: Array.from(new Set(opts)) };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const t0 = useRef(0);
  useEffect(() => {
    t0.current = Date.now();
  }, [i]);

  if (done)
    return (
      <div className="fade-in py-8 text-center">
        <div className="trophy-pop text-5xl">🎌</div>
        <CelebrationBurst xp={8} />
        <div className="mt-2 text-xl font-extrabold">
          {correct}/{questions.length} certas
        </div>
        <button className="btn btn-primary mt-5" onClick={() => (setI(0), setCorrect(0), setPicked(null), setDone(false))}>
          Outra ronda
        </button>
      </div>
    );

  const q = questions[i];
  const choose = (o: string) => {
    if (picked) return;
    setPicked(o);
    say(q.kana, "ja");
    const ok = o === q.answer;
    const secs = (Date.now() - t0.current) / 1000;
    const rating: Rating = !ok ? 1 : secs < 2.5 ? 4 : 3;
    if (ok) setCorrect((c) => c + 1);
    update((s) => ({ ...s, kana: { ...s.kana, [q.kana]: review(s.kana[q.kana], rating) } }));
    setTimeout(() => {
      if (i + 1 >= questions.length) {
        setDone(true);
        update((s) => addActivity(s, "ja", `kana:${script}`, 8));
      } else {
        setI(i + 1);
        setPicked(null);
      }
    }, ok ? 500 : 1100);
  };
  return (
    <div key={i} className="fade-in">
      <ProgressBar pct={(i / questions.length) * 100} color="var(--color-teal)" />
      <div className="card mt-4 grid place-items-center p-10">
        <span className="jp text-7xl font-bold">{q.kana}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {q.options.map((o) => {
          const st = picked ? (o === q.answer ? "ok" : o === picked ? "bad" : "") : "";
          return (
            <button
              key={o}
              onClick={() => choose(o)}
              className={`btn text-lg ${st === "ok" ? "!bg-[var(--color-good-soft)] text-[var(--color-good)]" : st === "bad" ? "!bg-[var(--color-bad-soft)] text-[var(--color-bad)]" : "btn-ghost"}`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Kana() {
  const { state } = useApp();
  const router = useRouter();
  const [script, setScript] = useState<Script>("hiragana");
  const [mode, setMode] = useState<Mode>("tabela");
  const rows = script === "hiragana" ? HIRAGANA_ROWS : KATAKANA_ROWS;
  const dak = script === "hiragana" ? HIRAGANA_DAKUTEN : KATAKANA_DAKUTEN;
  const basic = useMemo(() => rows.flat(), [rows]);
  const allChars = useMemo(() => [...rows.flat(), ...dak.flat()], [rows, dak]);
  const strong = allChars.filter(([k]) => isStrong(state.kana[k])).length;

  return (
    <>
      <TopBar back={() => router.back()} title="Escrita japonesa: kana" />
      <div className="mb-4 flex rounded-2xl bg-white p-1 shadow-[var(--shadow-card)]" role="tablist">
        {(["hiragana", "katakana"] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={script === s}
            onClick={() => setScript(s)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold ${script === s ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-muted)]"}`}
          >
            {s === "hiragana" ? "Hiragana あ" : "Katakana ア"}
          </button>
        ))}
      </div>
      <div className="card mb-4 p-4">
        <div className="flex justify-between text-sm font-semibold">
          <span>Dominados</span>
          <span>
            {strong}/{allChars.length}
          </span>
        </div>
        <ProgressBar pct={(strong / allChars.length) * 100} className="mt-2" color="var(--color-teal)" />
      </div>
      <div className="mb-4 flex gap-2">
        {(
          [
            ["tabela", "Tabela"],
            ["reconhecer", "Reconhecer"],
            ["tracar", "Traçar"],
          ] as const
        ).map(([m, l]) => (
          <button key={m} className={`chip ${mode === m ? "!bg-[var(--color-ink)] text-white" : ""}`} onClick={() => setMode(m)}>
            {l}
          </button>
        ))}
      </div>
      {mode === "tabela" && <Table rows={rows} dakuten={dak} />}
      {mode === "reconhecer" && <Quiz key={script} all={basic} script={script} />}
      {mode === "tracar" && <Trace key={script} all={basic} activity={`kana-trace:${script}`} />}
    </>
  );
}

export default function KanaPage() {
  return (
    <AppFrame nav={false}>
      <Kana />
    </AppFrame>
  );
}

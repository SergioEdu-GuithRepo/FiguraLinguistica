"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DialogueReader } from "@/components/Reader";
import { AppFrame } from "@/components/Shell";
import { TopBar } from "@/components/ui";
import { CONTENT, getUnit } from "@/content";
import { addActivity, recordError } from "@/lib/state";
import { useApp } from "@/lib/store";
import { plainText } from "@/lib/tokenize";
import type { Unit } from "@/lib/types";

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function Reading({ unit }: { unit: Unit }) {
  const { update } = useApp();
  const router = useRouter();
  const lang = unit.lang;
  const questions = useMemo(() => {
    const pool = CONTENT[lang].units.flatMap((u) => u.dialogue.map((d) => d.pt));
    return shuffle(unit.dialogue)
      .slice(0, 3)
      .map((l) => ({ text: l.text, answer: l.pt, options: shuffle([l.pt, ...shuffle(pool.filter((p) => p !== l.pt)).slice(0, 3)]) }));
  }, [unit, lang]);
  const [phase, setPhase] = useState<"ler" | "perguntas" | "fim">("ler");
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const q = questions[qi];

  const next = () => {
    if (qi + 1 >= questions.length) {
      setPhase("fim");
      const id = `${unit.id}:leitura`;
      update((s) => {
        const was = (s.progress[lang].lessons[id] ?? 0) >= 1;
        const n = { ...s, progress: { ...s.progress, [lang]: { ...s.progress[lang], lessons: { ...s.progress[lang].lessons, [id]: 1 } } } };
        return was ? n : addActivity(n, lang, "lesson-reading", 10);
      });
    } else {
      setQi(qi + 1);
      setPicked(null);
    }
  };

  return (
    <>
      <TopBar back={() => router.push("/licoes")} title={`Leitura guiada · ${unit.title}`} />
      {phase === "ler" && (
        <>
          <div className="card mb-4 p-4 text-sm text-[var(--color-muted)]">
            📩 Lê esta conversa como se fosse uma troca de mensagens real. Toca nas palavras que não conheces; depois respondes a 3 perguntas.
          </div>
          <DialogueReader lines={unit.dialogue} lang={lang} patterns={unit.patterns} />
          <button className="btn btn-primary mt-6 w-full" onClick={() => setPhase("perguntas")}>
            Responder às perguntas
          </button>
        </>
      )}
      {phase === "perguntas" && q && (
        <div key={qi} className={`fade-in lang-${lang}`}>
          <div className="mb-2 text-sm font-semibold text-[var(--color-muted)]">
            Pergunta {qi + 1} de {questions.length}: o que quer dizer?
          </div>
          <div className="card target p-5 text-xl font-bold">{plainText(q.text, lang)}</div>
          <div className="mt-4 flex flex-col gap-2">
            {q.options.map((o) => {
              const state = picked ? (o === q.answer ? "ok" : o === picked ? "bad" : "") : "";
              return (
                <button
                  key={o}
                  disabled={!!picked}
                  className={`btn justify-start text-left font-semibold ${state === "ok" ? "!bg-[var(--color-good-soft)] text-[var(--color-good)]" : state === "bad" ? "!bg-[var(--color-bad-soft)] text-[var(--color-bad)]" : "btn-ghost"}`}
                  style={{ opacity: 1 }}
                  onClick={() => {
                    setPicked(o);
                    if (o === q.answer) setScore((s) => s + 1);
                    else update((s) => recordError(s, lang, "vocabulario", plainText(q.text, lang)));
                  }}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {picked && (
            <button className="btn btn-primary mt-5 w-full" onClick={next}>
              Continuar
            </button>
          )}
        </div>
      )}
      {phase === "fim" && (
        <div className="fade-in py-10 text-center">
          <div className="text-5xl">📖</div>
          <h2 className="mt-3 text-2xl font-extrabold">Leitura concluída</h2>
          <p className="mt-1 text-[var(--color-muted)]">
            {score} de {questions.length} respostas certas
          </p>
          <button className="btn btn-primary mt-6 w-full" onClick={() => router.push("/licoes")}>
            Voltar às lições
          </button>
        </div>
      )}
    </>
  );
}

export default function LeituraPage() {
  const { id } = useParams<{ id: string }>();
  const unit = getUnit(id);
  if (!unit) notFound();
  return (
    <AppFrame nav={false}>
      <Reading unit={unit} />
    </AppFrame>
  );
}

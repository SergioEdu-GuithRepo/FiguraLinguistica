"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthGate } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { SpeakButton } from "@/components/ui";
import { CONTENT } from "@/content";
import { LANGS, LANG_LIST } from "@/lib/langs";
import { useApp } from "@/lib/store";
import { plainText } from "@/lib/tokenize";
import type { LangCode } from "@/lib/types";

const INTERESTS = [
  { id: "viagens", label: "✈️ Viagens" },
  { id: "comida", label: "🍜 Comida" },
  { id: "negócios", label: "💼 Negócios" },
  { id: "música", label: "🎵 Música" },
  { id: "futebol", label: "⚽ Futebol" },
  { id: "estudos", label: "🎓 Estudos" },
];

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function Placement({ lang, onDone }: { lang: LangCode; onDone: (level: number) => void }) {
  // uma pergunta a cada 2 níveis (1, 3, 5, …), dificuldade crescente; pára no primeiro erro
  const questions = useMemo(() => {
    const units = CONTENT[lang].units.filter((u) => u.level % 2 === 1);
    return units.map((u) => {
      const line = u.dialogue[Math.min(2, u.dialogue.length - 1)];
      const others = CONTENT[lang].units
        .filter((x) => x.id !== u.id)
        .map((x) => x.dialogue[Math.min(2, x.dialogue.length - 1)].pt);
      const options = shuffle([line.pt, ...shuffle(others).slice(0, 3)]);
      return { level: u.level, text: line.text, romaji: line.romaji, answer: line.pt, options };
    });
  }, [lang]);
  const maxLevel = CONTENT[lang].units.length;
  /** nível de colocação: o nível a seguir ao último acertado */
  const levelAfter = (correct: number) => (correct <= 0 ? 1 : Math.min(maxLevel, questions[correct - 1].level + 1));
  const [i, setI] = useState(0);
  const [streak, setStreak] = useState(0);
  const [broken, setBroken] = useState(false);
  const q = questions[i];
  const pick = (opt: string) => {
    const ok = opt === q.answer;
    const nextStreak = !broken && ok ? streak + 1 : streak;
    const nextBroken = broken || !ok;
    if (i + 1 >= questions.length || nextBroken) {
      onDone(levelAfter(nextStreak));
      return;
    }
    setStreak(nextStreak);
    setBroken(nextBroken);
    setI(i + 1);
  };
  return (
    <div className={`fade-in lang-${lang}`} key={i}>
      <div className="mb-2 text-sm font-semibold text-[var(--color-muted)]">
        Pergunta {i + 1} de {questions.length}
      </div>
      <div className="card flex items-center gap-3 p-5">
        <div className="flex-1">
          <div className="target text-xl font-bold">{plainText(q.text, lang)}</div>
          {q.romaji && <div className="text-sm italic text-[var(--color-muted)]">{q.romaji}</div>}
        </div>
        <SpeakButton text={q.text} lang={lang} />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {q.options.map((o) => (
          <button key={o} className="btn btn-ghost justify-start text-left font-semibold" onClick={() => pick(o)}>
            {o}
          </button>
        ))}
        <button className="btn btn-soft mt-2" onClick={() => onDone(levelAfter(streak))}>
          Não sei — parar aqui
        </button>
      </div>
    </div>
  );
}

function Onboarding() {
  const { state, update, user } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<LangCode>(state.activeLang);
  const [goal, setGoal] = useState<5 | 10 | 15>(10);
  const [interests, setInterests] = useState<string[]>([]);
  const [placing, setPlacing] = useState(false);

  const finish = (placedLevel: number) => {
    update((s) => ({
      ...s,
      onboarded: true,
      activeLang: lang,
      settings: { ...s.settings, dailyGoalMin: goal, interests },
      progress: { ...s.progress, [lang]: { ...s.progress[lang], placedLevel } },
    }));
    router.replace("/inicio");
  };

  const steps = 4;
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-6 pb-10 pt-10">
      <div className="mb-6 flex items-center gap-2">
        {Array.from({ length: steps }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[var(--color-coral)]" : "bg-[var(--color-line)]"}`} />
        ))}
      </div>

      {step === 0 && (
        <section className="fade-in">
          <h1 className="text-3xl font-extrabold">Olá, {user.name.split(" ")[0]}! 👋</h1>
          <p className="mt-2 text-[var(--color-muted)]">Que idioma queres aprender primeiro?</p>
          <div className="mt-6 flex flex-col gap-3">
            {LANG_LIST.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`card flex items-center gap-4 p-5 text-left transition ${lang === l ? "ring-2 ring-[var(--color-coral)]" : ""}`}
              >
                <span className="text-4xl">{LANGS[l].flag}</span>
                <span className="flex-1">
                  <span className="block text-lg font-bold">{LANGS[l].name}</span>
                  <span className="text-sm text-[var(--color-muted)]">
                    Tutor: {LANGS[l].tutor.name}, {LANGS[l].tutor.city}
                  </span>
                </span>
                {lang === l && <Icon name="check" className="text-[var(--color-coral)]" />}
              </button>
            ))}
          </div>
          <button className="btn btn-primary mt-8 w-full" onClick={() => setStep(1)}>
            Continuar
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="fade-in">
          <h1 className="text-3xl font-extrabold">Objectivo diário</h1>
          <p className="mt-2 text-[var(--color-muted)]">Quanto tempo por dia? Podes mudar depois.</p>
          <div className="mt-6 flex flex-col gap-3">
            {([5, 10, 15] as const).map((m) => (
              <button
                key={m}
                onClick={() => setGoal(m)}
                aria-pressed={goal === m}
                className={`card flex items-center justify-between p-5 text-left ${goal === m ? "ring-2 ring-[var(--color-coral)]" : ""}`}
              >
                <span>
                  <span className="block text-lg font-bold">{m} minutos</span>
                  <span className="text-sm text-[var(--color-muted)]">{m === 5 ? "Leve" : m === 10 ? "Regular" : "Intenso"}</span>
                </span>
                {goal === m && <Icon name="check" className="text-[var(--color-coral)]" />}
              </button>
            ))}
          </div>
          <div className="mt-8 flex gap-2">
            <button className="btn btn-soft" onClick={() => setStep(0)}>
              Voltar
            </button>
            <button className="btn btn-primary flex-1" onClick={() => setStep(2)}>
              Continuar
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="fade-in">
          <h1 className="text-3xl font-extrabold">O que te interessa?</h1>
          <p className="mt-2 text-[var(--color-muted)]">Usamos isto para escolher cenas e exemplos para ti.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {INTERESTS.map((it) => {
              const on = interests.includes(it.id);
              return (
                <button
                  key={it.id}
                  aria-pressed={on}
                  onClick={() => setInterests((xs) => (on ? xs.filter((x) => x !== it.id) : [...xs, it.id]))}
                  className={`chip !px-4 !py-3 !text-base ${on ? "!bg-[var(--color-ink)] text-white" : ""}`}
                >
                  {it.label}
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex gap-2">
            <button className="btn btn-soft" onClick={() => setStep(1)}>
              Voltar
            </button>
            <button className="btn btn-primary flex-1" onClick={() => setStep(3)}>
              Continuar
            </button>
          </div>
        </section>
      )}

      {step === 3 && !placing && (
        <section className="fade-in">
          <h1 className="text-3xl font-extrabold">Já sabes alguma coisa?</h1>
          <p className="mt-2 text-[var(--color-muted)]">Escolhe como começar em {LANGS[lang].name}.</p>
          <div className="mt-6 flex flex-col gap-3">
            <button className="card p-5 text-left" onClick={() => finish(1)}>
              <span className="block text-lg font-bold">🌱 Sou iniciante absoluto</span>
              <span className="text-sm text-[var(--color-muted)]">Começar no nível 1</span>
            </button>
            <button className="card p-5 text-left" onClick={() => setPlacing(true)}>
              <span className="block text-lg font-bold">🧭 Fazer teste de colocação</span>
              <span className="text-sm text-[var(--color-muted)]">6 perguntas rápidas · 1 minuto</span>
            </button>
          </div>
          <button className="btn btn-soft mt-8" onClick={() => setStep(2)}>
            Voltar
          </button>
        </section>
      )}

      {step === 3 && placing && (
        <section>
          <h1 className="mb-4 text-2xl font-extrabold">Teste de colocação</h1>
          <p className="mb-4 text-sm text-[var(--color-muted)]">O que significa esta frase?</p>
          <Placement lang={lang} onDone={finish} />
        </section>
      )}
    </main>
  );
}

export default function BoasVindasPage() {
  return (
    <AuthGate requireOnboarded={false}>
      <Onboarding />
    </AuthGate>
  );
}

"use client";

/**
 * Prática de partículas (Fase 2 — japonês): escolher a partícula que falta em frases das unidades
 * já desbloqueadas. Erros contam para o modelo do aluno (categoria "particula").
 */
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppFrame } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { CelebrationBurst, ProgressBar, SpeakButton, TopBar } from "@/components/ui";
import { CONTENT } from "@/content";
import { buildParticleItems, maskRomaji, PARTICLE_GROUPS, PARTICLE_INFO, PARTICLES, type ParticleItem } from "@/lib/particles";
import { addActivity, isUnitUnlocked, recordError } from "@/lib/state";
import { useApp } from "@/lib/store";

const ROUND = 10;

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Escolhe a ronda: mistura partículas diferentes e privilegia as unidades mais recentes. */
function pickRound(pool: ParticleItem[]): ParticleItem[] {
  const byParticle = new Map<string, ParticleItem[]>();
  for (const it of shuffle(pool)) byParticle.set(it.answer, [...(byParticle.get(it.answer) ?? []), it]);
  const out: ParticleItem[] = [];
  while (out.length < ROUND && [...byParticle.values()].some((l) => l.length)) {
    for (const list of byParticle.values()) {
      const it = list.shift();
      if (it) out.push(it);
      if (out.length >= ROUND) break;
    }
  }
  return shuffle(out).map((it) => ({ ...it, options: shuffle(it.options) }));
}

function Particles() {
  const { state, update } = useApp();
  const router = useRouter();
  const all = useMemo(() => buildParticleItems(CONTENT.ja.units, CONTENT.ja.dictionary), []);
  const unlocked = useMemo(() => all.filter((it) => isUnitUnlocked(state, it.unitId)), [all, state]);
  const [group, setGroup] = useState<string>("todas");
  const pool = useMemo(() => {
    const g = PARTICLE_GROUPS.find((x) => x.id === group);
    return g ? unlocked.filter((it) => g.particles.includes(it.answer)) : unlocked;
  }, [unlocked, group]);
  const [round, setRound] = useState<ParticleItem[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const start = (g = group) => {
    const gg = PARTICLE_GROUPS.find((x) => x.id === g);
    const p = gg ? unlocked.filter((it) => gg.particles.includes(it.answer)) : unlocked;
    setRound(pickRound(p));
    setI(0);
    setPicked(null);
    setCorrect(0);
    setDone(false);
  };

  const q = round?.[i];

  const choose = (o: string) => {
    if (!q || picked) return;
    setPicked(o);
    if (o === q.answer) setCorrect((c) => c + 1);
    else update((s) => recordError(s, "ja", "particula", q.tokens.join("")));
  };

  const next = () => {
    if (!round) return;
    if (i + 1 >= round.length) {
      setDone(true);
      update((s) => addActivity(s, "ja", "particulas", 10));
    } else {
      setI(i + 1);
      setPicked(null);
    }
  };

  const handleBack = () => {
    if (round) {
      setRound(null);
      setDone(false);
      setPicked(null);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 2) router.back();
    else router.push("/cursos");
  };

  return (
    <>
      <TopBar back={handleBack} title="Prática de partículas" />
      {!round && (
        <>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="jp grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-coral-soft)] text-2xl font-bold text-[var(--color-coral)]">は</div>
              <div className="flex-1">
                <div className="font-extrabold">Escolhe a partícula que falta</div>
                <div className="text-sm text-[var(--color-muted)]">
                  {unlocked.length} frases das tuas unidades desbloqueadas · rondas de {ROUND}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[{ id: "todas", label: "Todas" }, ...PARTICLE_GROUPS].map((g) => {
                const n = g.id === "todas" ? unlocked.length : unlocked.filter((it) => PARTICLE_GROUPS.find((x) => x.id === g.id)?.particles.includes(it.answer)).length;
                return (
                  <button key={g.id} disabled={!n} className={`chip jp ${group === g.id ? "!bg-[var(--color-ink)] text-white" : ""} disabled:opacity-40`} onClick={() => setGroup(g.id)}>
                    {g.label} <span className="ml-1 text-[10px] opacity-70">{n}</span>
                  </button>
                );
              })}
            </div>
            <button className="btn btn-primary mt-5 w-full" disabled={!pool.length} onClick={() => start()}>
              Começar ronda
            </button>
          </div>
          <button className="mt-4 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-bold shadow-[var(--shadow-card)]" onClick={() => setShowRules((v) => !v)}>
            Resumo das partículas <Icon name="chevron-down" size={18} className={showRules ? "rotate-180 transition" : "transition"} />
          </button>
          {showRules && (
            <div className="card mt-2 divide-y divide-[var(--color-line)] p-2">
              {PARTICLES.map((p) => (
                <div key={p.particle} className="flex gap-3 p-2 text-sm">
                  <span className="jp w-10 shrink-0 text-xl font-bold text-[var(--color-coral)]">{p.particle}</span>
                  <span>
                    <b>{p.romaji}</b> — {p.rule}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {round && done && (
        <div className="fade-in py-8 text-center" data-testid="particles-done">
          <div className="trophy-pop text-5xl">🎯</div>
          <CelebrationBurst xp={10} />
          <div className="mt-2 text-xl font-extrabold">
            {correct}/{round.length} certas
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{correct === round.length ? "Perfeito! As partículas já são tuas." : "Os erros entram na tua revisão de partículas."}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button className="btn btn-soft" onClick={() => setRound(null)}>
              Escolher grupo
            </button>
            <button className="btn btn-primary" onClick={() => start()}>
              Outra ronda
            </button>
          </div>
        </div>
      )}

      {round && !done && q && (
        <div key={q.id} className="fade-in lang-ja">
          <ProgressBar pct={(i / round.length) * 100} color="var(--color-coral)" />
          <div className="card mt-4 p-6 text-center">
            <div className="target jp text-2xl font-bold leading-relaxed" data-testid="particle-sentence">
              {q.tokens.map((t, k) =>
                k === q.blank ? (
                  <span
                    key={k}
                    className={`mx-1 inline-block min-w-[2.2em] rounded-lg border-b-4 px-1 ${picked ? (picked === q.answer ? "border-[var(--color-good)] text-[var(--color-good)]" : "border-[var(--color-bad)] text-[var(--color-bad)]") : "border-[var(--color-coral)] text-transparent"}`}
                  >
                    {picked ? q.answer : "＿"}
                  </span>
                ) : (
                  <span key={k}>{t}</span>
                ),
              )}
            </div>
            {state.settings.romaji && q.romaji && <div className="mt-1 text-sm italic text-[var(--color-muted)]">{picked ? q.romaji : maskRomaji(q.romaji, q)}</div>}
            <div className="mt-1 text-sm text-[var(--color-muted)]">{q.pt}</div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {q.options.map((o) => {
              const st = picked ? (o === q.answer ? "ok" : o === picked ? "bad" : "") : "";
              return (
                <button
                  key={o}
                  onClick={() => choose(o)}
                  className={`btn jp min-h-[56px] text-xl ${st === "ok" ? "!bg-[var(--color-good-soft)] text-[var(--color-good)]" : st === "bad" ? "!bg-[var(--color-bad-soft)] text-[var(--color-bad)]" : "btn-ghost"}`}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {picked && (
            <div className={`fade-in mt-4 rounded-3xl p-4 ${picked === q.answer ? "bg-[var(--color-good-soft)]" : "bg-[var(--color-bad-soft)]"}`} data-testid="particle-feedback">
              <div className="flex items-center justify-between gap-2">
                <div className="font-extrabold">{picked === q.answer ? "Certo! 🎉" : `É «${q.answer}», não «${picked}».`}</div>
                <SpeakButton text={q.text} lang="ja" size={36} />
              </div>
              <p className="mt-1 text-sm">
                <b className="jp">{q.answer}</b> {PARTICLE_INFO[q.answer]?.rule}
              </p>
              <button className="btn btn-primary mt-3 w-full" onClick={next}>
                {i + 1 >= round.length ? "Ver resultado" : "Seguinte"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function ParticlesPage() {
  return (
    <AppFrame nav={false}>
      <Particles />
    </AppFrame>
  );
}

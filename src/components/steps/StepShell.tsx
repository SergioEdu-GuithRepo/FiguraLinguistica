"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { CelebrationBurst } from "@/components/ui";
import { LANGS } from "@/lib/langs";
import { shareAchievementCard } from "@/lib/share-card";
import { STEPS, currentStreak, type StepId } from "@/lib/state";
import type { Unit } from "@/lib/types";
import { useApp } from "@/lib/store";

export function StepHeader({ unit, step }: { unit: Unit; step: StepId }) {
  const router = useRouter();
  const { state } = useApp();
  const up = state.progress[unit.lang].units[unit.id];
  const idx = STEPS.findIndex((s) => s.id === step);
  return (
    <>
      <div className="top-sticky-bar sticky top-0 z-40 -mx-5 -mt-[max(env(safe-area-inset-top),44px)] mb-3 flex items-center gap-3 border-b border-[var(--color-line)]/70 bg-[var(--color-bg)]/95 px-5 pb-3 pt-[max(env(safe-area-inset-top),44px)] backdrop-blur-md">
        <button
          type="button"
          onClick={() => router.push(`/unidade/${unit.id}`)}
          className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-white pl-2.5 pr-3.5 text-xs font-extrabold text-[var(--color-ink)] shadow-[var(--shadow-card)] transition hover:-translate-x-0.5 active:scale-90"
          aria-label="Voltar à unidade"
        >
          <Icon name="chevron-left" size={20} />
          <span>Voltar</span>
        </button>
        <div className="flex flex-1 gap-1.5" aria-label={`Passo ${idx + 1} de ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${up?.steps[s.id] ? "bg-[var(--color-good)]" : i === idx ? "scale-y-125 bg-[var(--color-coral)]" : "bg-[var(--color-line)]"}`}
            />
          ))}
        </div>
      </div>
      <div className="mb-5">
        <div className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
          {unit.emoji} {unit.title} · passo {idx + 1}/{STEPS.length}
        </div>
        <h1 className="text-2xl font-extrabold">{STEPS[idx].title}</h1>
      </div>
    </>
  );
}

export function StepDone({ unit, step, xp, extra }: { unit: Unit; step: StepId; xp: number; extra?: React.ReactNode }) {
  const { state } = useApp();
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const idx = STEPS.findIndex((s) => s.id === step);
  const next = STEPS[idx + 1];
  const unitCompleted = !!state.progress[unit.lang].units[unit.id]?.completedAt;
  const allDone = STEPS.every((s) => state.progress[unit.lang].units[unit.id]?.steps[s.id]);
  const meta = LANGS[unit.lang];

  const handleShare = async () => {
    const res = await shareAchievementCard({
      studentName: state.name,
      langName: meta.name,
      langFlag: meta.flag,
      badge: allDone ? `Nível ${unit.level} Concluído` : `Passo ${idx + 1}/${STEPS.length}`,
      title: `${unit.emoji} ${unit.title}`,
      subtitle: unit.objective,
      xp: state.progress[unit.lang].xp,
      streak: Math.max(1, currentStreak(state)),
      code: `FL-${unit.id.toUpperCase()}`,
    });
    setShareMsg(
      res === "downloaded"
        ? "Imagem guardada! Podes publicar no WhatsApp ✓"
        : "Pronto para partilhar ✓",
    );
    setTimeout(() => setShareMsg(null), 3500);
  };

  return (
    <div className="fade-in flex flex-col items-center py-8 text-center">
      <div className="trophy-pop grid h-24 w-24 place-items-center rounded-full bg-[var(--color-good-soft)] text-5xl shadow-[var(--shadow-card)]">
        {allDone ? "🏅" : "🎉"}
      </div>
      <CelebrationBurst xp={xp} label={allDone && unitCompleted ? "Unidade concluída" : undefined} />
      <h2 className="mt-3 text-2xl font-extrabold">{allDone && unitCompleted ? "Unidade concluída!" : "Muito bem!"}</h2>
      <p className="mt-1 text-[var(--color-muted)]">
        +{xp} XP{allDone && unitCompleted ? ` · Já consegues: ${unit.objective.replace(/^Vais /, "").replace(/\.$/, "")}` : ""}
      </p>
      {extra}
      <div className="mt-8 flex w-full flex-col gap-2">
        {next && !allDone ? (
          <Link href={`/unidade/${unit.id}/${next.id}`} className="btn btn-primary">
            Seguinte: {next.title} <Icon name="chevron-right" size={18} />
          </Link>
        ) : (
          <Link href="/cursos" className="btn btn-primary">
            Ver próximas unidades
          </Link>
        )}
        {allDone && (
          <button type="button" onClick={handleShare} className="btn btn-dark">
            📲 {shareMsg ?? "Partilhar imagem no WhatsApp"}
          </button>
        )}
        <Link href={`/unidade/${unit.id}`} className="btn btn-soft">
          Voltar à unidade
        </Link>
      </div>
    </div>
  );
}

export function StepIcon({ name, done }: { name: string; done: boolean }) {
  return (
    <div
      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-transform duration-200 ${done ? "correct-pop bg-[var(--color-good-soft)] text-[var(--color-good)]" : "bg-[var(--color-bg)]"}`}
    >
      <Icon name={(done ? "check" : name) as IconName} size={22} />
    </div>
  );
}

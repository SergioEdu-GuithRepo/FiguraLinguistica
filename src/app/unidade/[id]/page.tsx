"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { AppFrame } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { StepIcon } from "@/components/steps/StepShell";
import { ProgressBar, TopBar } from "@/components/ui";
import { getUnit } from "@/content";
import { LANGS } from "@/lib/langs";
import { STEPS, isUnitUnlocked, unitProgressPct } from "@/lib/state";
import { useApp } from "@/lib/store";

function UnitHub({ id }: { id: string }) {
  const { state } = useApp();
  const router = useRouter();
  const unit = getUnit(id)!;
  const up = state.progress[unit.lang].units[unit.id];
  const unlocked = isUnitUnlocked(state, unit.id);
  const pct = unitProgressPct(state, unit.id);
  const firstTodo = STEPS.find((s) => !up?.steps[s.id]) ?? STEPS[0];
  const meta = LANGS[unit.lang];

  return (
    <>
      <TopBar
        back={() => router.push("/cursos")}
        title={
          <span className="text-sm font-semibold text-[var(--color-muted)]">
            {meta.flag} {meta.name} · Nível {unit.level}
          </span>
        }
      />

      <section className="relative overflow-hidden rounded-[28px] bg-[var(--color-coral)] p-6 text-white shadow-[var(--shadow-float)]">
        <div className="absolute -right-2 -top-2 text-[90px] leading-none opacity-90">{unit.emoji}</div>
        <div className="text-xs font-bold uppercase tracking-wider opacity-90">{unit.category}</div>
        <h1 className="mt-1 max-w-[70%] text-3xl font-extrabold leading-tight">{unit.title}</h1>
        <div className={`mt-1 text-lg opacity-95 ${unit.lang === "ja" ? "jp" : ""}`}>{unit.titleTarget}</div>
        <div className="mt-4 rounded-2xl bg-white/20 p-3 text-sm font-semibold">🎯 {unit.objective}</div>
        <div className="mt-4">
          <ProgressBar pct={pct} color="#fff" className="!bg-white/30" />
          <div className="mt-1 text-xs opacity-90">{pct}% concluído</div>
        </div>
      </section>

      {!unlocked ? (
        <div className="card mt-5 flex items-center gap-3 p-5">
          <Icon name="lock" />
          <div className="text-sm">Conclui a unidade anterior para desbloquear esta.</div>
        </div>
      ) : (
        <>
          <Link href={`/unidade/${unit.id}/${firstTodo.id}`} className="btn btn-primary mt-5 w-full">
            {pct === 0 ? "Começar" : pct === 100 ? "Praticar outra vez" : "Continuar"} <Icon name="chevron-right" size={18} />
          </Link>
          <ol className="mt-5 flex flex-col gap-3">
            {STEPS.map((s, i) => {
              const done = !!up?.steps[s.id];
              return (
                <li key={s.id}>
                  <Link href={`/unidade/${unit.id}/${s.id}`} className="card flex items-center gap-4 p-4">
                    <StepIcon name={s.icon === "cards" ? "cards" : s.icon === "chat" ? "chat" : s.icon} done={done} />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-[var(--color-muted)]">Passo {i + 1}</div>
                      <div className="font-extrabold">{s.title}</div>
                      <div className="text-sm text-[var(--color-muted)]">{s.desc}</div>
                    </div>
                    <Icon name="chevron-right" className="text-[var(--color-muted)]" />
                  </Link>
                </li>
              );
            })}
          </ol>
          <div className="card mt-5 p-5">
            <div className="font-extrabold">Nesta unidade</div>
            <div className="mt-2 text-sm text-[var(--color-muted)]">Moldes de frase:</div>
            <ul className="mt-1 flex flex-col gap-1">
              {unit.patterns.map((p) => (
                <li key={p.id} className="text-sm">
                  <span className={`font-bold ${unit.lang === "ja" ? "jp" : ""}`}>{p.template.split("|").join("").replaceAll("{x}", "[ … ]")}</span>{" "}
                  <span className="text-[var(--color-muted)]">— {p.pt.replaceAll("{x}", "…")}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}

export default function UnitPage() {
  const { id } = useParams<{ id: string }>();
  if (!getUnit(id)) notFound();
  return (
    <AppFrame nav={false}>
      <UnitHub id={id} />
    </AppFrame>
  );
}

"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { AppFrame } from "@/components/Shell";
import { BuildStep, ListenStep, PatternsStep, SpeakStep, VocabStep } from "@/components/steps/Activities";
import { StepDone, StepHeader } from "@/components/steps/StepShell";
import { TutorChat } from "@/components/steps/TutorChat";
import { getUnit } from "@/content";
import { STEPS, isUnitUnlocked, type StepId } from "@/lib/state";
import { useApp } from "@/lib/store";
import type { Unit } from "@/lib/types";

function ConversationStepView({ unit }: { unit: Unit }) {
  const [xp, setXp] = useState<number | null>(null);
  const [key, setKey] = useState(0);
  return (
    <>
      <TutorChat key={key} unit={unit} asStep onFinished={setXp} />
      {xp !== null && (
        <>
          <StepDone unit={unit} step="conversa" xp={xp} />
          <button className="btn btn-soft -mt-6 w-full" onClick={() => (setXp(null), setKey((k) => k + 1))}>
            Repetir a conversa
          </button>
        </>
      )}
    </>
  );
}

function StepView({ unit, step }: { unit: Unit; step: StepId }) {
  const { state } = useApp();
  if (!isUnitUnlocked(state, unit.id)) {
    return (
      <div className="card p-6 text-center">
        <p>Esta unidade ainda está bloqueada.</p>
        <Link href="/cursos" className="btn btn-primary mt-4">
          Ver cursos
        </Link>
      </div>
    );
  }
  return (
    <>
      <StepHeader unit={unit} step={step} />
      {step === "ouvir" && <ListenStep unit={unit} />}
      {step === "moldes" && <PatternsStep unit={unit} />}
      {step === "vocabulario" && <VocabStep unit={unit} />}
      {step === "montar" && <BuildStep unit={unit} />}
      {step === "falar" && <SpeakStep unit={unit} />}
      {step === "conversa" && <ConversationStepView unit={unit} />}
    </>
  );
}

export default function StepPage() {
  const { id, passo } = useParams<{ id: string; passo: string }>();
  const unit = getUnit(id);
  if (!unit || !STEPS.some((s) => s.id === passo)) notFound();
  return (
    <AppFrame nav={false}>
      <StepView key={`${id}-${passo}`} unit={unit} step={passo as StepId} />
    </AppFrame>
  );
}

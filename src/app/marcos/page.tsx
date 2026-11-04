"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { AppFrame } from "@/components/Shell";
import { CelebrationBurst, TopBar, useSpeaker } from "@/components/ui";
import { CONTENT } from "@/content";
import { STAGE_MILESTONES, buildStageExam, type StageMilestoneInfo } from "@/lib/fluencia";
import { LANGS } from "@/lib/langs";
import { passStageExam, unitDone } from "@/lib/state";
import { useApp } from "@/lib/store";

function StageExamModal({
  stage,
  onClose,
}: {
  stage: StageMilestoneInfo;
  onClose: () => void;
}) {
  const { state, update } = useApp();
  const { say } = useSpeaker();
  const lang = state.activeLang;
  const questions = buildStageExam(lang, stage.stageIdx);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[idx];
  if (!q) return null;

  const choose = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const isCorrect = opt === q.correct;
    if (isCorrect) setScore((s) => s + 1);
    if (state.settings.tutorVoice) say(q.correct, lang);
  };

  const next = () => {
    setPicked(null);
    if (idx + 1 >= questions.length) {
      if (score >= Math.ceil(questions.length * 0.8) - 1) {
        update((s) => passStageExam(s, lang, stage.stageIdx));
      }
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  const passed = score >= Math.max(1, questions.length - 1);

  if (done) {
    return (
      <div className="card fade-in mb-5 p-6 text-center" data-testid="stage-exam-done">
        <div className="trophy-pop text-4xl">{passed ? "🎓" : "💪"}</div>
        {passed && <CelebrationBurst xp={50} label={`Etapa ${stage.stageIdx}`} />}
        <h3 className="mt-2 text-xl font-extrabold">
          {passed ? `Etapa «${stage.name}» Certificada!` : "Quase lá!"}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Acertaste {score} de {questions.length} questões ({stage.cefr}).
          {passed ? " Recebeste +50 XP e desbloqueaste o certificado oficial!" : " Precisas de pelo menos 5 respostas certas para certificar a etapa."}
        </p>
        <button className="btn btn-primary mt-5 w-full" onClick={onClose}>
          Voltar aos Marcos
        </button>
      </div>
    );
  }

  return (
    <div className="card fade-in mb-5 p-5" data-testid="stage-exam">
      <div className="flex items-center justify-between text-xs font-bold text-[var(--color-muted)]">
        <span>
          🎓 Exame da Etapa {stage.stageIdx}: {stage.name} ({stage.cefr})
        </span>
        <span>
          {idx + 1}/{questions.length}
        </span>
      </div>
      <div className="mt-3 rounded-2xl bg-[var(--color-bg)] p-4">
        <div className="text-sm font-bold">{q.promptPt}</div>
        {q.contextTarget && (
          <div className="target mt-1 text-lg font-extrabold text-[var(--color-coral)]">{q.contextTarget}</div>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {q.options.map((opt) => {
          const isCorrect = opt === q.correct;
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
              data-testid={isCorrect ? "exam-correct-option" : "exam-option"}
              className={`target rounded-2xl p-3.5 text-left font-semibold shadow-[var(--shadow-card)] transition ${cls}`}
              onClick={() => choose(opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="fade-in mt-3 rounded-2xl bg-[var(--color-bg)] p-3 text-xs">
          <div className="font-bold">{picked === q.correct ? "✓ Correcto!" : `Resposta certa: ${q.correct}`}</div>
          <div className="mt-0.5 text-[var(--color-muted)]">{q.explanationPt}</div>
          <button
            type="button"
            data-testid="exam-next"
            className="btn btn-primary mt-3 w-full"
            onClick={next}
          >
            {idx + 1 >= questions.length ? "Ver resultado" : "Seguinte"}
          </button>
        </div>
      )}
    </div>
  );
}

function MarcosContent() {
  const { state } = useApp();
  const router = useRouter();
  const lang = state.activeLang;
  const meta = LANGS[lang];
  const lp = state.progress[lang];
  const passedExams = lp.stageExams ?? [];
  const [activeExam, setActiveExam] = useState<StageMilestoneInfo | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const shareCertificate = async (st: StageMilestoneInfo) => {
    const code = `FL-${lang.toUpperCase()}-E${st.stageIdx}-${st.cefr.replace(".", "")}`;
    const text = `🎓 Certificado FiguraLinguística — ${state.name} concluiu a Etapa ${st.stageIdx} «${st.name}» (${st.cefr}) de ${meta.name} (${meta.flag})! Código: ${code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Certificado FiguraLinguística", text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // ignore
    }
    setCopiedId(st.stageIdx);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div data-testid="marcos-page">
      <TopBar back={() => router.push("/cursos")} title={`Marcos e Certificados · ${meta.flag}`} />
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        Avaliamos o que já consegues fazer em situações reais. Conclui as 9 unidades de uma etapa ou passa no exame rápido para emitir o teu certificado partilhável.
      </p>

      {activeExam && <StageExamModal stage={activeExam} onClose={() => setActiveExam(null)} />}

      <div className="flex flex-col gap-4">
        {STAGE_MILESTONES.map((st) => {
          const stageUnits = CONTENT[lang].units.filter((u) => u.level >= st.from && u.level <= st.to);
          const doneCount = stageUnits.filter((u) => unitDone(state, u.id)).length;
          const examPassed = passedExams.includes(st.stageIdx);
          const certified = examPassed || (stageUnits.length > 0 && doneCount === stageUnits.length);
          const code = `FL-${lang.toUpperCase()}-E${st.stageIdx}-${st.cefr.replace(".", "")}`;

          return (
            <div key={st.stageIdx} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-yellow-soft)] text-2xl">
                    {st.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold">
                        Etapa {st.stageIdx} · {st.name}
                      </span>
                      <span className="rounded-full bg-[var(--color-lilac-soft)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--color-lilac)]">
                        {st.cefr}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">
                      Níveis {st.from}–{st.to} · {doneCount}/{stageUnits.length || 9} unidades concluídas
                    </div>
                  </div>
                </div>
                {certified ? (
                  <span className="rounded-full bg-[var(--color-good-soft)] px-2.5 py-1 text-xs font-extrabold text-[var(--color-good)]">
                    ✓ Certificada
                  </span>
                ) : (
                  <button
                    type="button"
                    data-testid={`start-stage-exam-${st.stageIdx}`}
                    className="chip text-xs !bg-[var(--color-ink)] !text-white"
                    onClick={() => setActiveExam(st)}
                  >
                    Fazer exame
                  </button>
                )}
              </div>

              <ul className="mt-4 flex flex-col gap-2 text-sm">
                {st.canDo.map((skill, idx) => {
                  const achieved = certified || doneCount >= (idx + 1) * 2;
                  return (
                    <li key={idx} className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          achieved
                            ? "bg-[var(--color-good-soft)] text-[var(--color-good)]"
                            : "bg-[var(--color-bg)] text-[var(--color-muted)]"
                        }`}
                      >
                        {achieved ? "✓" : "·"}
                      </span>
                      <span className={achieved ? "font-semibold" : "text-[var(--color-muted)]"}>{skill}</span>
                    </li>
                  );
                })}
              </ul>

              {certified && (
                <div
                  data-testid="certificate-card"
                  className="mt-4 rounded-3xl border-2 border-[var(--color-yellow)] bg-gradient-to-br from-[#FFFDF7] to-[var(--color-yellow-soft)]/50 p-4"
                >
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#8a6a12]">
                    <span>🎓 Certificado FiguraLinguística</span>
                    <span>{code}</span>
                  </div>
                  <div className="mt-2 text-lg font-extrabold text-[var(--color-ink)]">
                    {state.name} · {meta.flag} {meta.name} ({st.cefr})
                  </div>
                  <div className="text-xs text-[var(--color-muted)]">
                    Concluiu com sucesso a Etapa {st.stageIdx} «{st.name}» (Níveis {st.from}–{st.to}), demonstrando competência comunicativa em situações reais.
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-testid={`share-cert-${st.stageIdx}`}
                      className="chip text-xs !bg-[var(--color-ink)] !text-white"
                      onClick={() => shareCertificate(st)}
                    >
                      <Icon name="sparkles" size={14} />{" "}
                      {copiedId === st.stageIdx ? "Copiado para partilhar ✓" : "Partilhar certificado"}
                    </button>
                    <button
                      type="button"
                      className="chip text-xs"
                      onClick={() => window.print()}
                    >
                      🖨️ Imprimir / PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MarcosPage() {
  return (
    <AppFrame>
      <MarcosContent />
    </AppFrame>
  );
}

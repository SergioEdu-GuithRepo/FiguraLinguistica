/**
 * Módulo de Fluência, Marcos de Comunicação e Exames de Etapa (Secções 6 e 7).
 */
import { CONTENT } from "@/content";
import { STAGES } from "./langs";
import { fillTemplate, plainText } from "./tokenize";
import type { ConversationStep, LangCode } from "./types";

export interface QuickResponsePrompt {
  id: string;
  unitId: string;
  unitTitle: string;
  tutor: string;
  tutorPt: string;
  step: ConversationStep;
  timeLimitSec: number;
}

export interface TranslateSensePrompt {
  id: string;
  unitId: string;
  sceneTitle: string;
  situationPt: string;
  meaningPt: string;
  step: ConversationStep;
  options: string[];
}

export interface StageMilestoneInfo {
  stageIdx: number; // 1..6
  name: string;
  from: number;
  to: number;
  cefr: string;
  icon: string;
  canDo: string[];
}

export const STAGE_MILESTONES: StageMilestoneInfo[] = [
  {
    stageIdx: 1,
    name: "Sobrevivência",
    from: 1,
    to: 9,
    cefr: "A1.1",
    icon: "🧭",
    canDo: [
      "Cumprimentar, despedir-se e agradecer com naturalidade",
      "Apresentar-se, dizer de onde é e trocar contactos",
      "Pedir num café ou restaurante e perguntar quanto custa",
      "Perguntar as horas, pedir direcções simples e falar da rotina",
    ],
  },
  {
    stageIdx: 2,
    name: "Rotina",
    from: 10,
    to: 18,
    cefr: "A1.2",
    icon: "🏡",
    canDo: [
      "Apresentar a família, a casa e a vizinhança",
      "Comprar bilhetes e orientar-se nos transportes públicos",
      "Contar o que fez no fim-de-semana passado e falar de planos",
      "Explicar sintomas simples no médico e combinar um encontro",
    ],
  },
  {
    stageIdx: 3,
    name: "Interacção",
    from: 19,
    to: 27,
    cefr: "A2.1",
    icon: "🤝",
    canDo: [
      "Pedir favores educadamente e comparar opções numa loja",
      "Negociar preços, trocas e resolver imprevistos num restaurante",
      "Dar e justificar a sua opinião de forma clara",
      "Aceitar ou recusar convites com tacto e manter conversa social",
    ],
  },
  {
    stageIdx: 4,
    name: "Autonomia",
    from: 28,
    to: 36,
    cefr: "A2.2",
    icon: "🚀",
    canDo: [
      "Relatar viagens e experiências passadas com pormenor",
      "Resolver problemas num hotel, aeroporto ou farmácia",
      "Apresentar a sua experiência numa entrevista de trabalho",
      "Dar conselhos e esclarecer mal-entendidos com educação",
    ],
  },
  {
    stageIdx: 5,
    name: "Fluência quotidiana",
    from: 37,
    to: 45,
    cefr: "B1",
    icon: "🌟",
    canDo: [
      "Comentar notícias, cinema, música e actualidade",
      "Contar histórias engraçadas e usar expressões idiomáticas naturais",
      "Debater vantagens e desvantagens e negociar no trabalho",
      "Conversar com ritmo natural, humor e adequação de registo",
    ],
  },
  {
    stageIdx: 6,
    name: "Domínio",
    from: 46,
    to: 54,
    cefr: "B2",
    icon: "🌍",
    canDo: [
      "Lidar com controlo de fronteira, bancos, contratos e serviços públicos",
      "Participar em reuniões remotas, apresentações académicas e suporte técnico",
      "Resolver reclamações, trocas e reembolsos com cortesia e firmeza",
      "Fazer networking profissional e explicar referências culturais lusófonas",
    ],
  },
];

export interface StageExamQuestion {
  id: string;
  unitId: string;
  promptPt: string;
  contextTarget?: string;
  options: string[];
  correct: string;
  explanationPt: string;
}

/**
 * Gera exercícios de «Responder rápido» (Secção 6):
 * pergunta em áudio/texto com limite de 8 segundos para destravar a fala.
 */
export function buildQuickResponsePrompts(lang: LangCode, maxLevel: number, count = 5): QuickResponsePrompt[] {
  const units = CONTENT[lang].units.filter((u) => u.level <= Math.max(3, maxLevel));
  const pool: QuickResponsePrompt[] = [];
  for (const u of units) {
    u.conversation.steps.forEach((step, idx) => {
      pool.push({
        id: `${u.id}-qr-${idx}`,
        unitId: u.id,
        unitTitle: u.title,
        tutor: plainText(step.tutor, lang),
        tutorPt: step.tutor_pt,
        step,
        timeLimitSec: 8,
      });
    });
  }
  return pool.slice(-count * 2).filter((_, i) => i % 2 === 0).slice(0, count);
}

/**
 * Gera exercícios de «Traduzir o sentido» (Secção 6):
 * dar o equivalente natural e idiomático em contexto, não palavra a palavra.
 */
export function buildTranslateSensePrompts(lang: LangCode, maxLevel: number, count = 5): TranslateSensePrompt[] {
  const units = CONTENT[lang].units.filter((u) => u.level <= Math.max(3, maxLevel));
  const allModels = units.flatMap((u) => u.conversation.steps.map((s) => s.model));
  const out: TranslateSensePrompt[] = [];

  for (const u of units.slice(-count * 2)) {
    const step = u.conversation.steps[0];
    if (!step) continue;
    const distractors = allModels.filter((m) => m !== step.model).slice(0, 3);
    const options = [step.model, ...distractors].sort((a, b) => a.localeCompare(b));
    out.push({
      id: `${u.id}-ts`,
      unitId: u.id,
      sceneTitle: u.title,
      situationPt: `${u.emoji} Cena «${u.title}» — ${u.conversation.goal}`,
      meaningPt: step.model_pt,
      step,
      options,
    });
    if (out.length >= count) break;
  }
  return out;
}

/**
 * Gera o Exame de Etapa (6 perguntas cobrindo as unidades da etapa).
 */
export function buildStageExam(lang: LangCode, stageIdx: number): StageExamQuestion[] {
  const stage = STAGES[stageIdx - 1] ?? STAGES[0];
  const stageUnits = CONTENT[lang].units.filter((u) => u.level >= stage.from && u.level <= stage.to);
  const units = stageUnits.length > 0 ? stageUnits : CONTENT[lang].units.slice(0, 6);

  const allModels = units.flatMap((u) => u.conversation.steps.map((s) => s.model));
  const questions: StageExamQuestion[] = [];

  units.slice(0, 6).forEach((u, idx) => {
    if (idx % 2 === 0 && u.conversation.steps[0]) {
      const step = u.conversation.steps[0];
      const wrong = allModels.filter((m) => m !== step.model);
      const picks = [step.model, wrong[idx % Math.max(1, wrong.length)] ?? "—", wrong[(idx + 2) % Math.max(1, wrong.length)] ?? "—", wrong[(idx + 4) % Math.max(1, wrong.length)] ?? "—"];
      const uniqueOptions = Array.from(new Set(picks)).sort((a, b) => a.localeCompare(b));
      questions.push({
        id: `exam-${lang}-${stageIdx}-${idx}`,
        unitId: u.id,
        promptPt: `Na cena «${u.title}», o interlocutor diz:`,
        contextTarget: plainText(step.tutor, lang),
        options: uniqueOptions,
        correct: step.model,
        explanationPt: `«${step.model}» significa «${step.model_pt}» e responde naturalmente a «${step.tutor_pt}».`,
      });
    } else if (u.patterns[0]) {
      const p = u.patterns[0];
      const slot = p.slots[0];
      const correct = plainText(fillTemplate(p.template, slot.text), lang);
      const pt = fillTemplate(p.pt, slot.pt);
      const wrong = allModels.filter((m) => m !== correct);
      const picks = [correct, wrong[idx % Math.max(1, wrong.length)] ?? "—", wrong[(idx + 1) % Math.max(1, wrong.length)] ?? "—", wrong[(idx + 3) % Math.max(1, wrong.length)] ?? "—"];
      const uniqueOptions = Array.from(new Set(picks)).sort((a, b) => a.localeCompare(b));
      questions.push({
        id: `exam-${lang}-${stageIdx}-${idx}`,
        unitId: u.id,
        promptPt: `Como dizes naturalmente: «${pt}»?`,
        options: uniqueOptions,
        correct,
        explanationPt: `${p.note}`,
      });
    }
  });

  return questions;
}

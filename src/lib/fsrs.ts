/**
 * Implementação compacta do FSRS (Free Spaced Repetition Scheduler), pesos por defeito do FSRS-5.
 * Ratings: 1 = Errei, 2 = Difícil, 3 = Bom, 4 = Fácil.
 */
export type Rating = 1 | 2 | 3 | 4;

export interface Card {
  /** estabilidade em dias */
  s: number;
  /** dificuldade 1..10 */
  d: number;
  /** próxima revisão (ms epoch) */
  due: number;
  /** última revisão (ms epoch) */
  last: number;
  reps: number;
  lapses: number;
}

const W = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.0824, 1.9813, 0.0953,
  0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567,
];
const DECAY = -0.5;
const FACTOR = 19 / 81;
const RETENTION = 0.9;
const DAY = 86_400_000;

const clampD = (d: number) => Math.min(10, Math.max(1, d));

function initD(g: Rating): number {
  return clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1);
}

export function retrievability(card: Card, now = Date.now()): number {
  const t = Math.max(0, (now - card.last) / DAY);
  return Math.pow(1 + (FACTOR * t) / card.s, DECAY);
}

function intervalDays(s: number): number {
  const i = (s / FACTOR) * (Math.pow(RETENTION, 1 / DECAY) - 1);
  return Math.min(365, Math.max(1, Math.round(i)));
}

export function newCard(rating: Rating, now = Date.now()): Card {
  const s = W[rating - 1];
  const d = initD(rating);
  // "Errei" num item novo: rever daqui a 10 minutos
  const due = rating === 1 ? now + 10 * 60_000 : now + intervalDays(s) * DAY;
  return { s, d, due, last: now, reps: 1, lapses: rating === 1 ? 1 : 0 };
}

export function review(card: Card | undefined, rating: Rating, now = Date.now()): Card {
  if (!card) return newCard(rating, now);
  const r = retrievability(card, now);
  let d = card.d - W[6] * (rating - 3);
  d = clampD(W[7] * initD(4) + (1 - W[7]) * d);
  let s: number;
  if (rating === 1) {
    s = W[11] * Math.pow(d, -W[12]) * (Math.pow(card.s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r));
    s = Math.max(0.1, Math.min(s, card.s));
  } else {
    const hard = rating === 2 ? W[15] : 1;
    const easy = rating === 4 ? W[16] : 1;
    s = card.s * (Math.exp(W[8]) * (11 - d) * Math.pow(card.s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy + 1);
  }
  const due = rating === 1 ? now + 10 * 60_000 : now + intervalDays(s) * DAY;
  return { s, d, due, last: now, reps: card.reps + 1, lapses: card.lapses + (rating === 1 ? 1 : 0) };
}

/** "Memória forte": estabilidade de pelo menos 3 dias e não esquecido recentemente. */
export function isStrong(card: Card | undefined, now = Date.now()): boolean {
  if (!card) return false;
  return card.s >= 3 && retrievability(card, now) >= 0.8;
}

export function isDue(card: Card, now = Date.now()): boolean {
  return card.due <= now;
}

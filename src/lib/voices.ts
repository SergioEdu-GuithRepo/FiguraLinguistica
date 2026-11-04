import type { LangCode } from "./types";

/** Vozes neurais Microsoft Azure (via msedge-tts) disponíveis na app. */
export interface NeuralVoice {
  id: string; // ShortName Azure
  label: string;
  gender: "f" | "m";
  accent: string;
}

export const NEURAL_VOICES: Record<LangCode, NeuralVoice[]> = {
  en: [
    { id: "en-GB-SoniaNeural", label: "Sonia", gender: "f", accent: "Reino Unido" },
    { id: "en-GB-RyanNeural", label: "Ryan", gender: "m", accent: "Reino Unido" },
    { id: "en-GB-LibbyNeural", label: "Libby", gender: "f", accent: "Reino Unido" },
    { id: "en-US-AriaNeural", label: "Aria", gender: "f", accent: "EUA" },
    { id: "en-US-GuyNeural", label: "Guy", gender: "m", accent: "EUA" },
    { id: "en-US-JennyNeural", label: "Jenny", gender: "f", accent: "EUA" },
  ],
  fr: [
    { id: "fr-FR-DeniseNeural", label: "Denise", gender: "f", accent: "França" },
    { id: "fr-FR-HenriNeural", label: "Henri", gender: "m", accent: "França" },
    { id: "fr-FR-EloiseNeural", label: "Eloise", gender: "f", accent: "França" },
    { id: "fr-CA-SylvieNeural", label: "Sylvie", gender: "f", accent: "Canadá" },
    { id: "fr-CA-JeanNeural", label: "Jean", gender: "m", accent: "Canadá" },
  ],
  ja: [
    { id: "ja-JP-KeitaNeural", label: "Keita", gender: "m", accent: "Japão" },
    { id: "ja-JP-NanamiNeural", label: "Nanami", gender: "f", accent: "Japão" },
  ],
};

/** Voz por defeito do tutor (Emma → Sonia, Claire → Denise, Haruto → Keita). */
export const DEFAULT_NEURAL: Record<LangCode, string> = {
  en: "en-GB-SoniaNeural",
  fr: "fr-FR-DeniseNeural",
  ja: "ja-JP-KeitaNeural",
};

export function isNeuralVoice(lang: LangCode, id: string | undefined | null): id is string {
  return !!id && NEURAL_VOICES[lang].some((v) => v.id === id);
}

export function neuralVoiceFor(lang: LangCode, chosen?: string | null): string {
  return isNeuralVoice(lang, chosen) ? chosen : DEFAULT_NEURAL[lang];
}

/**
 * Voz para cada personagem de um diálogo: o tutor usa a voz escolhida; "Tu" e outras personagens
 * usam vozes diferentes (de preferência do outro género) para o diálogo soar como uma conversa real.
 */
export function voiceForSpeaker(lang: LangCode, speaker: string | undefined, tutorName: string, tutorVoice: string): string {
  if (!speaker || speaker === tutorName) return tutorVoice;
  const all = NEURAL_VOICES[lang];
  const tutor = all.find((v) => v.id === tutorVoice) ?? all[0];
  const sameAccent = all.filter((v) => v.id !== tutorVoice && v.accent === tutor.accent);
  const pool = sameAccent.length ? sameAccent : all.filter((v) => v.id !== tutorVoice);
  if (!pool.length) return tutorVoice;
  const other = pool.find((v) => v.gender !== tutor.gender) ?? pool[0];
  if (/^(tu|você|eu)$/i.test(speaker)) return other.id;
  // terceiras personagens: voz do mesmo género do tutor mas diferente, se existir
  const third = pool.find((v) => v.gender === tutor.gender) ?? other;
  return third.id;
}

/** Converte a velocidade (0.5–1.5) para o formato SSML de prosódia ("-20%"). */
export function rateToProsody(rate: number): string {
  const r = Math.min(1.5, Math.max(0.5, rate));
  const pct = Math.round((r - 1) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

/** Normaliza a velocidade para passos de 0.05 (melhora a taxa de acertos em cache). */
export function roundRate(rate: number): number {
  return Math.round(Math.min(1.5, Math.max(0.5, rate)) * 20) / 20;
}

/** Texto tal como é sintetizado/cacheado: sem marcadores internos ("|" japonês, "‿" liaison) e espaços normalizados. */
export function normalizeTtsText(s: string): string {
  return s.replace(/\|/g, "").replace(/‿/g, " ").replace(/\s+/g, " ").trim();
}

export function ttsUrl(text: string, lang: LangCode, voice: string, rate = 1): string {
  const p = new URLSearchParams({ lang, voice, rate: String(roundRate(rate)), text: normalizeTtsText(text) });
  return `/api/tts?${p.toString()}`;
}

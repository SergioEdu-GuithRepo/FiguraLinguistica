"use client";

/**
 * Efeitos sonoros subtis via Web Audio API + vibração háptica leve (0 KB de rede, 100% offline).
 * Respeita a definição `settings.soundEffects` do utilizador.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => undefined);
  }
  return audioCtx;
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignorado se bloqueado pelo sistema */
    }
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = "sine",
  peakGain = 0.12,
) {
  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

/** Som suave de resposta certa (acorde ascendente luminoso). */
export function sfxSuccess(enabled = true) {
  if (!enabled) return;
  vibrate(12);
  const ctx = getCtx();
  if (!ctx) return;
  playTone(ctx, 587.33, 0, 0.13, "triangle", 0.11); // D5
  playTone(ctx, 880.0, 0.075, 0.2, "triangle", 0.13); // A5
}

/** Som discreto de resposta a corrigir (duplo toque grave suave). */
export function sfxError(enabled = true) {
  if (!enabled) return;
  vibrate([16, 35, 16]);
  const ctx = getCtx();
  if (!ctx) return;
  playTone(ctx, 246.94, 0, 0.12, "sine", 0.1); // B3
  playTone(ctx, 196.0, 0.09, 0.18, "sine", 0.1); // G3
}

/** Fanfarra curta de conquista (conclusão de passo, unidade ou certificado). */
export function sfxCelebrate(enabled = true) {
  if (!enabled) return;
  vibrate([14, 40, 24]);
  const ctx = getCtx();
  if (!ctx) return;
  playTone(ctx, 523.25, 0, 0.14, "triangle", 0.11); // C5
  playTone(ctx, 659.25, 0.08, 0.14, "triangle", 0.11); // E5
  playTone(ctx, 783.99, 0.16, 0.16, "triangle", 0.12); // G5
  playTone(ctx, 1046.5, 0.25, 0.34, "triangle", 0.14); // C6
}

/** Toque subtil para selecção de blocos. */
export function sfxTap(enabled = true) {
  if (!enabled) return;
  vibrate(6);
  const ctx = getCtx();
  if (!ctx) return;
  playTone(ctx, 660, 0, 0.05, "sine", 0.05);
}

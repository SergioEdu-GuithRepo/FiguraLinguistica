"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { speak, speakSequence, stopSpeaking } from "@/lib/speech";
import { LANGS } from "@/lib/langs";
import type { LangCode } from "@/lib/types";
import { plainText } from "@/lib/tokenize";
import { neuralVoiceFor, voiceForSpeaker } from "@/lib/voices";
import { Icon } from "./Icon";

/* ---------- hooks ---------- */

export function useSpeaker() {
  const { state } = useApp();
  const settingsRef = useRef(state.settings);
  settingsRef.current = state.settings;

  const say = useCallback(
    (text: string, lang: LangCode, onEnd?: () => void, rateOverride?: number) => {
      const s = settingsRef.current;
      const engine = s.voiceEngine ?? "neural";
      const nv = engine === "neural" ? neuralVoiceFor(lang, s.neuralVoices?.[lang]) : null;
      return speak(plainText(text, lang), lang, {
        rate: rateOverride ?? s.audioRate,
        voiceURI: s.voices[lang],
        neuralVoice: nv,
        onEnd,
      });
    },
    [],
  );
  const sayMany = useCallback(
    (texts: string[], lang: LangCode, onIndex?: (i: number) => void, onDone?: () => void, speakers?: (string | undefined)[]) => {
      const s = settingsRef.current;
      const engine = s.voiceEngine ?? "neural";
      const nv = engine === "neural" ? neuralVoiceFor(lang, s.neuralVoices?.[lang]) : null;
      return speakSequence(
        texts.map((t) => plainText(t, lang)),
        lang,
        {
          rate: s.audioRate,
          voiceURI: s.voices[lang],
          neuralVoice: nv,
          neuralVoices: nv && speakers ? speakers.map((sp) => voiceForSpeaker(lang, sp, LANGS[lang].tutor.name, nv)) : undefined,
          onIndex,
          onDone,
        },
      );
    },
    [],
  );
  useEffect(() => () => stopSpeaking(), []);
  return { say, sayMany, stop: stopSpeaking };
}

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

/* ---------- componentes ---------- */

export function ProgressRing({
  pct,
  size = 84,
  stroke = 8,
  color = "var(--color-coral)",
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-coral-soft)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.min(100, Math.max(0, pct)) / 100) * c}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-bold">{children}</div>
    </div>
  );
}

export function ProgressBar({ pct, color = "var(--color-coral)", className = "" }: { pct: number; color?: string; className?: string }) {
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-line)] ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color, transition: "width .4s ease" }} />
    </div>
  );
}

export function SpeakButton({
  text,
  lang,
  size = 40,
  className = "",
  slow = false,
  label = "Ouvir",
}: {
  text: string;
  lang: LangCode;
  size?: number;
  className?: string;
  slow?: boolean;
  label?: string;
}) {
  const { say } = useSpeaker();
  const [playing, setPlaying] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid shrink-0 place-items-center rounded-full transition hover:-translate-y-0.5 active:scale-90 ${playing ? "pulse-ring bg-[var(--color-coral)] text-white" : "bg-[var(--color-bg)] text-[var(--color-ink)]"} ${className}`}
      style={{ width: size, height: size }}
      onClick={(e) => {
        e.stopPropagation();
        setPlaying(true);
        say(text, lang, () => setPlaying(false), slow ? 0.6 : undefined);
      }}
    >
      {playing ? (
        <span className="flex h-4 items-end gap-[2.5px]" aria-hidden="true">
          <span className="eq-bar" />
          <span className="eq-bar" />
          <span className="eq-bar" />
        </span>
      ) : (
        <Icon name="volume" size={Math.round(size * 0.5)} />
      )}
    </button>
  );
}

const CONFETTI_COLORS = [
  "var(--color-coral)",
  "var(--color-yellow)",
  "var(--color-teal)",
  "var(--color-lilac)",
  "var(--color-good)",
];

const CONFETTI_PARTICLES = Array.from({ length: 24 }, (_, idx) => {
  const angle = (idx / 24) * Math.PI * 2 + (idx % 2 === 0 ? 0.12 : -0.08);
  const dist = 54 + (idx % 4) * 26;
  const tx = Math.round(Math.cos(angle) * dist);
  const ty = Math.round(Math.sin(angle) * dist - 22);
  const rot = (idx % 2 === 0 ? 1 : -1) * (160 + idx * 18);
  const color = CONFETTI_COLORS[idx % CONFETTI_COLORS.length];
  const delay = (idx % 5) * 25;
  const round = idx % 3 === 0;
  return { tx, ty, rot, color, delay, round };
});

export function CelebrationBurst({ xp, label }: { xp?: number; label?: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center" data-testid="celebration-burst">
      <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
        {CONFETTI_PARTICLES.map((p, idx) => (
          <span
            key={idx}
            className="confetti-piece"
            style={{
              backgroundColor: p.color,
              borderRadius: p.round ? "999px" : "2px",
              animationDelay: `${p.delay}ms`,
              ["--tx" as string]: `${p.tx}px`,
              ["--ty" as string]: `${p.ty}px`,
              ["--rot" as string]: `${p.rot}deg`,
            }}
          />
        ))}
      </div>
      {xp !== undefined && (
        <div className="xp-badge-pop mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-yellow-soft)] px-3.5 py-1 text-xs font-extrabold text-[#8a6a12] shadow-sm">
          <span>✨ +{xp} XP</span>
          {label && <span>· {label}</span>}
        </div>
      )}
    </div>
  );
}

export function SkeletonScreen() {
  return (
    <div className="mx-auto min-h-dvh max-w-[480px] px-5 pt-6" aria-busy="true" aria-label="A carregar…">
      <div className="mb-5 flex items-center justify-between">
        <div className="skeleton-shimmer h-9 w-36 rounded-2xl" />
        <div className="flex gap-2">
          <div className="skeleton-shimmer h-9 w-16 rounded-full" />
          <div className="skeleton-shimmer h-9 w-9 rounded-full" />
        </div>
      </div>
      <div className="skeleton-shimmer mb-4 h-36 w-full rounded-3xl" />
      <div className="skeleton-shimmer mb-4 h-28 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton-shimmer h-28 rounded-3xl" />
        <div className="skeleton-shimmer h-28 rounded-3xl" />
      </div>
    </div>
  );
}

export function TopBar({ title, back, right }: { title?: React.ReactNode; back?: () => void; right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-30 -mx-5 mb-4 flex items-center gap-3 bg-[var(--color-bg)]/90 px-5 py-2.5 backdrop-blur-md">
      {back && (
        <button
          type="button"
          onClick={back}
          className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-white pl-2.5 pr-3.5 text-xs font-extrabold text-[var(--color-ink)] shadow-[var(--shadow-card)] transition hover:-translate-x-0.5 active:scale-90"
          aria-label="Voltar"
        >
          <Icon name="chevron-left" size={20} />
          <span>Voltar</span>
        </button>
      )}
      <div className="min-w-0 flex-1 truncate text-lg font-extrabold">{title}</div>
      {right}
    </div>
  );
}

export function Empty({ icon = "sparkles", title, text, action }: { icon?: Parameters<typeof Icon>[0]["name"]; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="card fade-in flex flex-col items-center gap-2 p-8 text-center">
      <div className="trophy-pop grid h-14 w-14 place-items-center rounded-full bg-[var(--color-lilac-soft)] text-[var(--color-lilac)]">
        <Icon name={icon} size={28} />
      </div>
      <div className="mt-1 text-lg font-bold">{title}</div>
      {text && <p className="text-sm text-[var(--color-muted)]">{text}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Toast({ text, onDone }: { text: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [text, onDone]);
  if (!text) return null;
  return (
    <div role="status" className="xp-badge-pop fixed inset-x-0 bottom-28 z-50 mx-auto w-fit max-w-[90vw] rounded-2xl bg-[var(--color-ink)] px-4 py-3 text-sm font-semibold text-white shadow-lg">
      {text}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 active:scale-95 ${checked ? "bg-[var(--color-coral)]" : "bg-[var(--color-line)]"}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${checked ? "left-6 scale-105" : "left-1"}`} />
    </button>
  );
}

/** Pilha de livros decorativa, como na referência visual. */
export function Books({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 60" className={className} aria-hidden="true">
      <rect x="4" y="40" width="64" height="12" rx="6" fill="#2F4A6D" />
      <rect x="10" y="42.5" width="52" height="3" rx="1.5" fill="#fff" opacity=".85" />
      <rect x="12" y="27" width="62" height="12" rx="6" fill="#F0CF5E" />
      <rect x="18" y="29.5" width="50" height="3" rx="1.5" fill="#fff" opacity=".85" />
      <rect x="2" y="14" width="60" height="12" rx="6" fill="#E8735A" />
      <rect x="8" y="16.5" width="48" height="3" rx="1.5" fill="#fff" opacity=".85" />
      <rect x="14" y="2" width="56" height="11" rx="5.5" fill="#E8E8FC" />
      <rect x="20" y="4.5" width="44" height="3" rx="1.5" fill="#9A9AF0" opacity=".7" />
    </svg>
  );
}

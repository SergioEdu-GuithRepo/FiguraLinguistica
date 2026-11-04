"use client";

/** Traçado de caracteres japoneses (kana e kanji) com comparação por píxeis contra a forma de referência. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { useSpeaker } from "@/components/ui";
import { review } from "@/lib/fsrs";
import { addActivity } from "@/lib/state";
import { useApp } from "@/lib/store";

/* ---------------- Traçar ---------------- */

const SIZE = 280;

export function Trace({ all, activity, showLabel = true }: { all: [string, string][]; activity: string; showLabel?: boolean }) {
  const { update } = useApp();
  const { say } = useSpeaker();
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [guide, setGuide] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasInk = useRef(false);
  const [k, label] = all[idx % all.length];

  const clear = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    hasInk.current = false;
    setScore(null);
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = SIZE * dpr;
    c.height = SIZE * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    clear();
  }, [idx, clear]);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE };
  };
  const stroke = (p: { x: number; y: number }) => {
    const ctx = canvas.current!.getContext("2d")!;
    ctx.strokeStyle = "#0F2038";
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const a = last.current ?? p;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    hasInk.current = true;
  };

  const check = () => {
    const c = canvas.current!;
    const n = 70; // grelha de comparação
    const user = document.createElement("canvas");
    user.width = user.height = n;
    const uctx = user.getContext("2d")!;
    uctx.drawImage(c, 0, 0, n, n);
    const ref = document.createElement("canvas");
    ref.width = ref.height = n;
    const rctx = ref.getContext("2d")!;
    rctx.fillStyle = "#000";
    rctx.textAlign = "center";
    rctx.textBaseline = "middle";
    rctx.font = `700 ${n * 0.78}px "Noto Sans JP", "Hiragino Sans", sans-serif`;
    rctx.fillText(k, n / 2, n / 2 + n * 0.03);
    const u = uctx.getImageData(0, 0, n, n).data;
    const g = rctx.getImageData(0, 0, n, n).data;
    // dilatar a referência (tolerância)
    const gMask = new Uint8Array(n * n);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        if (g[(y * n + x) * 4 + 3] > 60) {
          for (let dy = -2; dy <= 2; dy++)
            for (let dx = -2; dx <= 2; dx++) {
              const yy = y + dy,
                xx = x + dx;
              if (yy >= 0 && yy < n && xx >= 0 && xx < n) gMask[yy * n + xx] = 1;
            }
        }
      }
    let ink = 0,
      inside = 0,
      refPx = 0,
      covered = 0;
    for (let i = 0; i < n * n; i++) {
      const isInk = u[i * 4 + 3] > 60;
      const isRef = g[i * 4 + 3] > 60;
      if (isInk) {
        ink++;
        if (gMask[i]) inside++;
      }
      if (isRef) {
        refPx++;
        if (isInk) covered++;
      }
    }
    if (!ink) return setScore(0);
    const precision = inside / ink;
    const recall = refPx ? covered / refPx : 0;
    const f = (2 * precision * recall) / (precision + recall || 1);
    const sc = Math.round(Math.min(1, f * 1.35) * 100);
    setScore(sc);
    say(k, "ja");
    if (sc >= 60) {
      update((s) => ({ ...s, kana: { ...s.kana, [k]: review(s.kana[k], sc >= 80 ? 3 : 2) } }));
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="jp text-3xl font-bold">{k}</span> {showLabel && <span className="text-[var(--color-muted)]">· {label}</span>}
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} /> Guia
        </label>
      </div>
      <div className="card relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden !rounded-3xl" style={{ containerType: "inline-size" }}>
        {/* grelha */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="border-b border-r border-dashed border-[var(--color-line)]" />
          <div className="border-b border-dashed border-[var(--color-line)]" />
          <div className="border-r border-dashed border-[var(--color-line)]" />
          <div />
        </div>
        {guide && (
          <div className="jp pointer-events-none absolute inset-0 grid select-none place-items-center font-bold leading-none text-[var(--color-line)]" style={{ fontSize: "78cqw" }}>
            {k}
          </div>
        )}
        <canvas
          ref={canvas}
          className="absolute inset-0 h-full w-full touch-none"
          aria-label={`Área para traçar ${k}`}
          onPointerDown={(e) => {
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            drawing.current = true;
            last.current = null;
            stroke(pos(e));
          }}
          onPointerMove={(e) => drawing.current && stroke(pos(e))}
          onPointerUp={() => {
            drawing.current = false;
            last.current = null;
          }}
          onPointerCancel={() => (drawing.current = false)}
        />
      </div>
      {score !== null && (
        <div className={`fade-in mt-4 rounded-2xl p-3 text-center font-bold ${score >= 80 ? "bg-[var(--color-good-soft)] text-[var(--color-good)]" : score >= 60 ? "bg-[var(--color-yellow-soft)]" : "bg-[var(--color-bad-soft)] text-[var(--color-bad)]"}`}>
          {score >= 80 ? "Excelente traçado! " : score >= 60 ? "Bom traçado. " : "Tenta outra vez, segue a guia. "}
          {score}/100
        </div>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button className="btn btn-soft" onClick={clear}>
          <Icon name="refresh" size={18} /> Limpar
        </button>
        <button className="btn btn-primary" onClick={check}>
          Verificar
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (score !== null && score >= 60) update((s) => addActivity(s, "ja", activity, 2));
            setIdx((i) => i + 1);
          }}
        >
          Seguinte <Icon name="chevron-right" size={18} />
        </button>
      </div>
    </div>
  );
}


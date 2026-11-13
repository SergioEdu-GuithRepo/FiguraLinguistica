"use client";

import { LANGS } from "./langs";
import type { LangCode } from "./types";
import { ttsUrl } from "./voices";

/* ---------------- Texto para voz ----------------
 * 1) Voz neural HD (Microsoft Azure via /api/tts, MP3 24 kHz) — entonação e cadência naturais.
 * 2) Recurso automático: Web Speech API do aparelho (offline, sem custos).
 */

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && ("speechSynthesis" in window || typeof Audio !== "undefined");
}

function deviceTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let voicesCache: SpeechSynthesisVoice[] = [];

export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!deviceTtsSupported()) return Promise.resolve([]);
  const v = window.speechSynthesis.getVoices();
  if (v.length) {
    voicesCache = v;
    return Promise.resolve(v);
  }
  return new Promise((resolve) => {
    const done = () => {
      voicesCache = window.speechSynthesis.getVoices();
      resolve(voicesCache);
    };
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1200);
  });
}

export function voicesFor(lang: LangCode, all: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const prefix = lang;
  return all.filter((v) => v.lang.toLowerCase().startsWith(prefix));
}

export interface SpeakOpts {
  rate?: number;
  /** voz do aparelho (Web Speech API) */
  voiceURI?: string;
  /** voz neural Azure (ShortName); se ausente/null usa-se a voz do aparelho */
  neuralVoice?: string | null;
  onEnd?: () => void;
  onBoundary?: (charIndex: number) => void;
}

/* ----- estado do motor neural ----- */
let currentAudio: HTMLAudioElement | null = null;
let currentFinish: (() => void) | null = null;
let neuralFailures = 0;
let neuralPausedUntil = 0;
const NEURAL_LOAD_TIMEOUT_MS = 14000;

export type NeuralStatus = "ok" | "fallback";
const statusListeners = new Set<(s: NeuralStatus) => void>();
let lastStatus: NeuralStatus = "ok";
function setStatus(s: NeuralStatus) {
  if (s === lastStatus) return;
  lastStatus = s;
  statusListeners.forEach((fn) => fn(s));
}
/** Subscreve mudanças de estado (ex.: aviso "a usar a voz do aparelho"). */
export function onNeuralStatus(fn: (s: NeuralStatus) => void): () => void {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
}
export function neuralStatus(): NeuralStatus {
  return lastStatus;
}

export function resetNeuralFallback() {
  neuralFailures = 0;
  neuralPausedUntil = 0;
  setStatus("ok");
}

if (typeof window !== "undefined") {
  window.addEventListener("online", resetNeuralFallback);
}

function neuralAvailable(): boolean {
  return typeof Audio !== "undefined" && Date.now() >= neuralPausedUntil;
}

function noteNeuralFailure() {
  neuralFailures++;
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (neuralFailures >= 2 || offline) {
    // falhas seguidas (sem rede, serviço em baixo): pausa curta de 10s
    neuralPausedUntil = Date.now() + 10_000;
    neuralFailures = 0;
    setStatus("fallback");
  }
}

function noteNeuralSuccess() {
  neuralFailures = 0;
  neuralPausedUntil = 0;
  setStatus("ok");
}

function speakDevice(text: string, lang: LangCode, opts: SpeakOpts): boolean {
  if (!deviceTtsSupported()) {
    opts.onEnd?.();
    return false;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANGS[lang].speechLang;
  u.rate = opts.rate ?? 1;
  const all = voicesCache.length ? voicesCache : synth.getVoices();
  const chosen =
    (opts.voiceURI && all.find((v) => v.voiceURI === opts.voiceURI)) ||
    all.find((v) => v.lang === LANGS[lang].speechLang) ||
    voicesFor(lang, all)[0];
  if (chosen) u.voice = chosen;
  let ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    opts.onEnd?.();
  };
  u.onend = finish;
  u.onerror = finish;
  if (opts.onBoundary) u.onboundary = (e) => opts.onBoundary?.(e.charIndex);
  synth.speak(u);
  // salvaguarda: alguns navegadores sem vozes nunca disparam onend
  const est = Math.max(1500, (text.length * 90) / (opts.rate ?? 1));
  setTimeout(() => {
    if (!synth.speaking) finish();
  }, est + 1500);
  return true;
}

function detachAudio(a: HTMLAudioElement) {
  a.onplaying = null;
  a.onended = null;
  a.onerror = null;
}

function speakNeural(text: string, lang: LangCode, voice: string, opts: SpeakOpts) {
  const audio = new Audio();
  audio.preload = "auto";
  currentAudio = audio;
  let done = false;
  let fellBack = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(loadTimer);
    detachAudio(audio);
    if (currentAudio === audio) currentAudio = null;
    if (currentFinish === finish) currentFinish = null;
    opts.onEnd?.();
  };
  currentFinish = finish;
  const fallback = (countAsFailure: boolean) => {
    if (done || fellBack) return;
    fellBack = true;
    clearTimeout(loadTimer);
    detachAudio(audio);
    audio.removeAttribute("src");
    if (currentAudio === audio) currentAudio = null;
    if (countAsFailure) noteNeuralFailure();
    speakDevice(text, lang, { ...opts, onEnd: finish });
  };
  const loadTimer = setTimeout(() => {
    if (audio.readyState < 2) fallback(true);
  }, NEURAL_LOAD_TIMEOUT_MS);
  audio.onplaying = () => {
    clearTimeout(loadTimer);
    noteNeuralSuccess();
  };
  audio.onended = finish;
  audio.onerror = () => fallback(true);
  audio.src = ttsUrl(text, lang, voice, opts.rate ?? 1);
  audio.play().catch((e: DOMException) => {
    if (done || fellBack || currentAudio !== audio) return;
    if (e?.name === "AbortError") return; // parado pelo utilizador
    // NotAllowedError (autoplay bloqueado) não é falha do serviço
    fallback(e?.name !== "NotAllowedError");
  });
}

export function speak(text: string, lang: LangCode, opts: SpeakOpts = {}): boolean {
  if (typeof window === "undefined" || !text.trim()) {
    opts.onEnd?.();
    return false;
  }
  stopSpeaking();
  if (opts.neuralVoice && neuralAvailable()) {
    speakNeural(text, lang, opts.neuralVoice, opts);
    return true;
  }
  return speakDevice(text, lang, opts);
}

export function stopSpeaking() {
  if (currentFinish) {
    const f = currentFinish;
    currentFinish = null;
    f();
  }
  if (currentAudio) {
    const a = currentAudio;
    currentAudio = null;
    detachAudio(a);
    a.pause();
    a.removeAttribute("src");
  }
  if (deviceTtsSupported()) window.speechSynthesis.cancel();
}

/** Pré-carrega o áudio neural de uma frase (fica na cache HTTP / service worker). */
export function prefetchSpeech(text: string, lang: LangCode, voice: string | null | undefined, rate = 1) {
  if (!voice || typeof fetch === "undefined" || !neuralAvailable() || !text.trim()) return;
  fetch(ttsUrl(text, lang, voice, rate), { priority: "low" } as RequestInit).catch(() => undefined);
}

/** Lê várias frases em sequência. Devolve função para cancelar. */
export function speakSequence(
  texts: string[],
  lang: LangCode,
  opts: {
    rate?: number;
    voiceURI?: string;
    neuralVoice?: string | null;
    /** voz neural por frase (ex.: uma voz por personagem do diálogo) */
    neuralVoices?: (string | undefined)[];
    onIndex?: (i: number) => void;
    onDone?: () => void;
    gapMs?: number;
  },
): () => void {
  let cancelled = false;
  let i = 0;
  const voiceAt = (k: number) => (opts.neuralVoice ? (opts.neuralVoices?.[k] ?? opts.neuralVoice) : null);
  const next = () => {
    if (cancelled) return;
    if (i >= texts.length) {
      opts.onDone?.();
      return;
    }
    opts.onIndex?.(i);
    let started = false;
    const ok = speak(texts[i], lang, {
      rate: opts.rate,
      voiceURI: opts.voiceURI,
      neuralVoice: voiceAt(i),
      onEnd: () => {
        if (cancelled) return;
        i++;
        // sem TTS nenhum, speak() termina logo: dá tempo para acompanhar o destaque da frase
        setTimeout(next, started ? (opts.gapMs ?? 350) : 900);
      },
    });
    started = ok;
    if (ok && i + 1 < texts.length) prefetchSpeech(texts[i + 1], lang, voiceAt(i + 1), opts.rate);
  };
  next();
  return () => {
    cancelled = true;
    stopSpeaking();
  };
}

/* ---------------- Voz para texto (Web Speech API) ---------------- */

interface SRResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }>;
}
interface SpeechRec {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SRResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getSRCtor(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

let cloudSttAvailable = false;
let cloudSttChecked = false;

function ensureCloudSttCheck() {
  if (cloudSttChecked || typeof window === "undefined" || typeof fetch === "undefined") return;
  cloudSttChecked = true;
  fetch("/api/stt")
    .then((r) => r.json())
    .then((j) => {
      cloudSttAvailable = Boolean(j?.enabled);
    })
    .catch(() => {
      cloudSttAvailable = false;
    });
}

if (typeof window !== "undefined") {
  ensureCloudSttCheck();
}

export function sttSupported(): boolean {
  ensureCloudSttCheck();
  return !!getSRCtor() || (cloudSttAvailable && recorderSupported());
}

export interface ListenHandle {
  stop: () => void;
}

function listenViaCloudStt(
  lang: LangCode,
  handlers: {
    onInterim?: (t: string) => void;
    onFinal: (t: string, confidence: number, alternatives: { transcript: string; confidence: number }[]) => void;
    onError?: (msg: string) => void;
    onEnd?: () => void;
  },
): ListenHandle | null {
  if (!recorderSupported()) {
    handlers.onError?.("O teu aparelho não suporta gravação de microfone.");
    return null;
  }
  let stopped = false;
  let rec: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((s) => {
      if (stopped) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = s;
      const chunks: Blob[] = [];
      rec = new MediaRecorder(s);
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        s.getTracks().forEach((t) => t.stop());
        if (!chunks.length) {
          handlers.onError?.("Não ouvimos nada. Tenta outra vez.");
          handlers.onEnd?.();
          return;
        }
        handlers.onInterim?.("A avaliar pronúncia…");
        try {
          const blob = new Blob(chunks, { type: rec?.mimeType || "audio/webm" });
          const fd = new FormData();
          fd.append("audio", blob, "speech.webm");
          fd.append("lang", lang);
          const r = await fetch("/api/stt", { method: "POST", body: fd });
          const j = await r.json();
          if (r.ok && j.transcript) {
            handlers.onFinal(j.transcript, j.confidence ?? 0.9, [{ transcript: j.transcript, confidence: j.confidence ?? 0.9 }]);
          } else {
            handlers.onError?.(j.error || "Não ouvimos nada. Tenta outra vez.");
          }
        } catch {
          handlers.onError?.("Sem ligação para avaliar a voz.");
        } finally {
          handlers.onEnd?.();
        }
      };
      rec.start();
      handlers.onInterim?.("A ouvir… (toca novamente quando terminares)");
      timer = setTimeout(() => {
        if (rec && rec.state !== "inactive") rec.stop();
      }, 5500);
    })
    .catch(() => {
      handlers.onError?.("Permissão do microfone negada.");
      handlers.onEnd?.();
    });

  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      if (rec && rec.state !== "inactive") rec.stop();
      else stream?.getTracks().forEach((t) => t.stop());
    },
  };
}

export function listen(
  lang: LangCode,
  handlers: {
    onInterim?: (t: string) => void;
    onFinal: (t: string, confidence: number, alternatives: { transcript: string; confidence: number }[]) => void;
    onError?: (msg: string) => void;
    onEnd?: () => void;
  },
): ListenHandle | null {
  const Ctor = getSRCtor();
  if (!Ctor) {
    if (cloudSttAvailable && recorderSupported()) {
      return listenViaCloudStt(lang, handlers);
    }
    handlers.onError?.("O teu navegador não suporta reconhecimento de voz.");
    return null;
  }
  const rec = new Ctor();
  rec.lang = LANGS[lang].speechLang;
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 3;
  let gotFinal = false;
  let fellBack = false;
  rec.onresult = (e) => {
    let interim = "";
    for (let i = 0; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) {
        gotFinal = true;
        const alts: { transcript: string; confidence: number }[] = [];
        for (let k = 0; k < r.length; k++) alts.push({ transcript: r[k].transcript, confidence: r[k].confidence });
        handlers.onFinal(r[0].transcript, r[0].confidence, alts);
      } else interim += r[0].transcript;
    }
    if (interim) handlers.onInterim?.(interim);
  };
  rec.onerror = (e) => {
    // Em WebViews Android onde SpeechRecognition existe mas é bloqueado ("service-not-allowed"), usa STT na nuvem se disponível
    if ((e.error === "service-not-allowed" || e.error === "language-not-supported") && cloudSttAvailable && recorderSupported()) {
      fellBack = true;
      listenViaCloudStt(lang, handlers);
      return;
    }
    const map: Record<string, string> = {
      "not-allowed": "Permissão do microfone negada.",
      "no-speech": "Não ouvimos nada. Tenta outra vez.",
      network: "Sem ligação para o reconhecimento de voz.",
      "audio-capture": "Microfone não encontrado.",
    };
    handlers.onError?.(map[e.error] ?? `Erro no reconhecimento de voz (${e.error}).`);
  };
  rec.onend = () => {
    if (!fellBack) {
      if (!gotFinal) handlers.onEnd?.();
      else handlers.onEnd?.();
    }
  };
  try {
    rec.start();
  } catch {
    if (cloudSttAvailable && recorderSupported()) {
      return listenViaCloudStt(lang, handlers);
    }
    handlers.onError?.("Não foi possível iniciar o microfone.");
    return null;
  }
  return { stop: () => rec.stop() };
}

/* ---------------- Gravar e comparar (sem reconhecimento de voz) ----------------
 * Grava a voz do aluno só em memória (URL de objecto), para ouvir e comparar com a voz nativa.
 * Nada é enviado nem guardado: a gravação desaparece ao sair do passo.
 */

export function recorderSupported(): boolean {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

export interface RecorderHandle {
  /** Pára e devolve o URL do áudio gravado (ou null se falhou). */
  stop: () => Promise<string | null>;
}

export async function startRecording(maxMs = 8000): Promise<RecorderHandle | null> {
  if (!recorderSupported()) return null;
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    return null;
  }
  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  let resolveStop: ((u: string | null) => void) | null = null;
  const done = new Promise<string | null>((r) => (resolveStop = r));
  rec.onstop = () => {
    stream.getTracks().forEach((t) => t.stop());
    resolveStop?.(chunks.length ? URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/webm" })) : null);
  };
  rec.start();
  const timer = setTimeout(() => rec.state !== "inactive" && rec.stop(), maxMs);
  return {
    stop: () => {
      clearTimeout(timer);
      if (rec.state !== "inactive") rec.stop();
      return done;
    },
  };
}

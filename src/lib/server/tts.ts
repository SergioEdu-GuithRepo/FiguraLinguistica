import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

/**
 * Motor de voz neural HD: vozes neurais Microsoft Azure via msedge-tts,
 * MP3 mono 24 kHz / 96 kbps.
 *
 * - Uma ligação WebSocket persistente por voz (abrir ligações em rajada provoca HTTP 429).
 * - Pedidos em fila por voz, com novas tentativas e recuo exponencial.
 * - Cache em memória (LRU) + cache em disco (data/tts-cache) — cada frase só é sintetizada uma vez.
 */

export const TTS_ENGINE = "edge-neural-hd";
export const TTS_FORMAT = OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3;

/* ---------------- protocolo Sec-MS-GEC v2 (2-143.0.3650.75) ---------------- */

const SHA256_INITIAL = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
const SHA256_STATE = [0xfd9fbea2, 0x91243ce7, 0xbe499094, 0xcd2e1e0a, 0x6c006f49, 0x04bd35ab, 0xfeb0a7e4, 0x03effbd2];
const SHA256_SCHEDULE = [0xeb24bf9e, 0x1558691f, 0xa0c09ee2, 0x0cfa32ba, 0xa622ee8c, 0xd1dd9491, 0xc0dd25a0, 0xf9e70ab6, 0xf0c31573, 0x7058ce4e, 0x7188e606, 0x00e5ab33, 0xd258b060, 0x72766564];
const SHA256_ROUND_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];
const SHA256_ADJUSTMENT = 0xc9dc06a7;
const SHA256_BLOCK_CONSTANTS = [...SHA256_ROUND_CONSTANTS.slice(0, 14), SHA256_ADJUSTMENT, ...SHA256_ROUND_CONSTANTS.slice(15)];
const SHA256_SIGMA0_ADJUSTMENT = 0x059c0b80;
const SHA256_SIGMA1_ADJUSTMENT = 0x000b92c0;
const CS64_COEFFICIENTS: [number, number][] = [
  [0xe82e91b1, 0xb32700d0], [0x44de24c6, 0x88dff51d], [0x3beb65bc, 0x29514038], [0xc89c5933, 0xb328cbdf],
  [0x8d1ec211, 0xd405b4d5], [0x314ef5d5, 0x26e55f3c], [0xe92491b1, 0x607801c6], [0xf0a5b9d5, 0x82b2c1fb],
  [0x06064cf3, 0xfa51a3da], [0xda79fa60, 0x207cc464], [0xbed20560, 0x3c3c74f3], [0x89f9c9f8, 0xd2d14b61],
  [0x35fa38c6, 0xbb04a2c1], [0xcb49e3c6, 0xc5626167],
];
const CS64_FACTOR = 0x82893933;
const CS64_ADJUSTMENT0 = 0xf2f90b1a;
const CS64_ADJUSTMENT1 = 0x0b1a0000;

const mul32 = (a: number, b: number) => Math.imul(a, b) >>> 0;
const rol16 = (v: number) => (((v >>> 0) << 16) | ((v >>> 0) >>> 16)) >>> 0;
const rotr = (v: number, n: number) => ((v >>> n) | (v << (32 - n))) >>> 0;
const sigma0 = (v: number) => (rotr(v, 7) ^ rotr(v, 18) ^ (v >>> 3)) >>> 0;
const sigma1 = (v: number) => (rotr(v, 17) ^ rotr(v, 19) ^ (v >>> 10)) >>> 0;

function sha256Rounds(state: number[], words: number[], firstRound = 0): number[] {
  let [a, b, c, d, e, f, g, h] = state;
  const K = firstRound === 14 ? SHA256_BLOCK_CONSTANTS : SHA256_ROUND_CONSTANTS;
  for (let i = firstRound; i < 64; i++) {
    const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
    const ch = (g ^ (e & (f ^ g))) >>> 0;
    const t1 = (h + S1 + ch + K[i] + words[i]) >>> 0;
    const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
    const maj = ((a & b) | (c & (a | b))) >>> 0;
    const t2 = (S0 + maj) >>> 0;
    h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
  }
  return [a, b, c, d, e, f, g, h];
}
function expandSchedule(words: number[], firstWord = 16) {
  for (let i = firstWord; i < 64; i++) {
    words[i] = (sigma1(words[i - 2]) + words[i - 7] + sigma0(words[i - 15]) + words[i - 16]) >>> 0;
  }
}
function sha256Init(d7: Buffer): number[] {
  const words = new Array<number>(14).fill(0);
  words.push(((d7[0] << 16) | (d7[1] << 8) | d7[2]) >>> 0);
  words.push(d7.readUInt32BE(3));
  for (let i = 16; i < 30; i++) {
    let v = SHA256_SCHEDULE[i - 16];
    if (i - 2 >= 14) v = (v + (i === 16 ? (sigma1(words[i - 2]) ^ SHA256_SIGMA1_ADJUSTMENT) >>> 0 : sigma1(words[i - 2]))) >>> 0;
    if (i - 7 >= 14) v = (v + words[i - 7]) >>> 0;
    if (i - 15 >= 14) v = (v + (i === 29 ? (sigma0(words[i - 15]) ^ SHA256_SIGMA0_ADJUSTMENT) >>> 0 : sigma0(words[i - 15]))) >>> 0;
    words.push(v);
  }
  words.push((sigma1(words[28]) + words[23] + sigma0(words[15]) + words[14] + SHA256_ADJUSTMENT - SHA256_ROUND_CONSTANTS[14]) >>> 0);
  expandSchedule(words, 31);
  const w = sha256Rounds(SHA256_STATE, words, 14);
  return SHA256_INITIAL.map((x, i) => (x + w[i]) >>> 0);
}
function sha256Digest(data: Buffer): Buffer {
  const length = 57 + data.length;
  const padZero = (((55 - length) % 64) + 64) % 64;
  const tail = data.subarray(7);
  const padded = Buffer.alloc(tail.length + 1 + padZero + 8);
  tail.copy(padded, 0);
  padded[tail.length] = 0x80;
  padded.writeBigUInt64BE(BigInt(length * 8), padded.length - 8);
  let state = sha256Init(data.subarray(0, 7));
  for (let off = 0; off < padded.length; off += 64) {
    const words: number[] = [];
    for (let k = 0; k < 16; k++) words.push(padded.readUInt32BE(off + k * 4));
    expandSchedule(words);
    const w = sha256Rounds(state, words);
    state = state.map((x, i) => (x + w[i]) >>> 0);
  }
  const out = Buffer.alloc(32);
  state.forEach((x, i) => out.writeUInt32BE(x, i * 4));
  return out;
}
function wordsLe4Even(buf: Buffer): number[] {
  const pad = (4 - (buf.length % 4)) % 4;
  const b = pad ? Buffer.concat([buf, Buffer.alloc(pad)]) : buf;
  const w: number[] = [];
  for (let i = 0; i < b.length; i += 4) w.push(b.readUInt32LE(i));
  if (w.length % 2) w.push(0);
  return w;
}
function cs64Digest(data: Buffer, digest: Buffer): Buffer {
  const keyA = (digest.readUInt32LE(0) | 1) >>> 0;
  const keyB = (digest.readUInt32LE(4) | 1) >>> 0;
  const factors = [mul32(keyA, CS64_FACTOR), mul32(keyB, CS64_FACTOR)];
  const terms = CS64_COEFFICIENTS.map(([c], i) => mul32(c, factors[i % 2]));
  const offsets = CS64_COEFFICIENTS.map(([, o]) => o >>> 0);
  const words = wordsLe4Even(Buffer.concat([Buffer.from([0]), data]));
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let term = mul32(word, i % 2 === 0 ? keyA : keyB);
    let offset = mul32(rol16(word), i % 2 === 0 ? 0xef0569fb : 0xc31713db);
    if (i === 0) {
      term = (term + mul32(CS64_ADJUSTMENT0, factors[0])) >>> 0;
      offset = (offset + CS64_ADJUSTMENT1) >>> 0;
    }
    terms.push(term);
    offsets.push(offset);
  }
  let swapAcc = 0, swapLast = 0, state = 0, acc = 0;
  for (let i = 0; i < terms.length; i += 2) {
    const x = terms[i], y = terms[i + 1];
    let t = rol16((offsets[i] + x) >>> 0);
    let q = mul32(t, 0x76f50f34);
    swapAcc = (swapAcc + ((mul32(rol16(q), 0xc3efea97) + q) >>> 0)) >>> 0;
    t = rol16((offsets[i + 1] + y) >>> 0);
    q = mul32(t, 0x1881ce3c);
    swapLast = (mul32(rol16(q), 0x35bd1ec9) + q) >>> 0;
    swapAcc = (swapAcc + swapLast) >>> 0;
    state = (mul32(state, keyA) + x) >>> 0;
    state = mul32(rol16(state), 0xcf98b111);
    state = mul32(rol16(state), 0x87085b9f);
    state = mul32(rol16(state), 0x12ceb96d);
    state = mul32(rol16(state), 0x257e1d83);
    acc = (acc + state) >>> 0;
    t = (mul32(state, keyB) + y) >>> 0;
    t = mul32(rol16(t), 0xa27416f5);
    t = mul32(rol16(t), 0xd38396ff);
    state = mul32(rol16(mul32(rol16(t), 0x7c932b89)), 0xbfa49f69);
    acc = (acc + state) >>> 0;
  }
  const out = Buffer.alloc(8);
  out.writeUInt32LE((swapLast ^ state) >>> 0, 0);
  out.writeUInt32LE((swapAcc ^ acc) >>> 0, 4);
  return out;
}
function generateSecMsGecV2(trustedClientToken: string, clockOffsetMs = 0): string {
  let ticks = Math.floor((Date.now() + clockOffsetMs) / 1000) + 11644473600;
  ticks -= ticks % 300;
  const data = Buffer.from(`${BigInt(ticks) * BigInt(10000000)}${trustedClientToken}`, "ascii");
  const digest = sha256Digest(data);
  const cs64 = cs64Digest(data, digest).toString("hex").toUpperCase();
  return `${cs64}-${digest.toString("hex").toUpperCase()}`;
}

interface EdgeStatic {
  TRUSTED_CLIENT_TOKEN: string;
  _clockOffsetMs?: number;
  generateUUID: () => string;
  getSynthUrl: () => Promise<string>;
}
const EdgeCls = MsEdgeTTS as unknown as EdgeStatic;
EdgeCls.getSynthUrl = async function () {
  const reqId = EdgeCls.generateUUID().replace(/-/g, "");
  const gec = generateSecMsGecV2(EdgeCls.TRUSTED_CLIENT_TOKEN, EdgeCls._clockOffsetMs ?? 0);
  return `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${EdgeCls.TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=2-143.0.3650.75&ConnectionId=${reqId}`;
};

export function neuralEnabled(): boolean {
  return (process.env.TTS_NEURAL ?? "on").toLowerCase() !== "off";
}

/* ---------------- cache ---------------- */

const MEM_MAX_BYTES = 24 * 1024 * 1024;
const mem = new Map<string, Buffer>();
let memBytes = 0;

function memGet(key: string): Buffer | undefined {
  const b = mem.get(key);
  if (b) {
    mem.delete(key);
    mem.set(key, b); // LRU: passa para o fim
  }
  return b;
}
function memSet(key: string, b: Buffer) {
  if (mem.has(key)) return;
  mem.set(key, b);
  memBytes += b.length;
  while (memBytes > MEM_MAX_BYTES && mem.size) {
    const [k, v] = mem.entries().next().value as [string, Buffer];
    mem.delete(k);
    memBytes -= v.length;
  }
}

const CACHE_DIR =
  process.env.TTS_CACHE_DIR ||
  (process.env.VERCEL ? "/tmp/tts-cache" : path.join(process.cwd(), "data", "tts-cache"));
let diskOk = true;

function diskPath(voice: string, hash: string) {
  return path.join(CACHE_DIR, voice, hash.slice(0, 2), `${hash}.mp3`);
}
async function diskGet(voice: string, hash: string): Promise<Buffer | null> {
  if (!diskOk) return null;
  try {
    return await fs.readFile(diskPath(voice, hash));
  } catch {
    return null;
  }
}
async function diskSet(voice: string, hash: string, b: Buffer) {
  if (!diskOk) return;
  try {
    const p = diskPath(voice, hash);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, b);
  } catch (e) {
    diskOk = false; // ex.: sistema de ficheiros só de leitura (serverless) — fica só a cache em memória
    console.warn("[tts] cache em disco desactivada:", (e as Error).message);
  }
}

/* ---------------- ligações por voz ---------------- */

interface Conn {
  tts: MsEdgeTTS;
  ready: Promise<void>;
  queue: Promise<unknown>;
  idle?: NodeJS.Timeout;
}
const conns = new Map<string, Conn>();
const IDLE_MS = 90_000;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// o serviço devolve 429 a aberturas de ligação em rajada: espaça os handshakes
const CONNECT_GAP_MS = 1100;
let connectGate: Promise<void> = Promise.resolve();
function gatedConnect(tts: MsEdgeTTS, voice: string): Promise<void> {
  const run = connectGate.then(() => tts.setMetadata(voice, TTS_FORMAT));
  connectGate = run.then(
    () => sleep(CONNECT_GAP_MS),
    () => sleep(CONNECT_GAP_MS * 2),
  );
  return run;
}

const POOL_PER_VOICE = 2;
const rrIndex = new Map<string, number>();

function getConn(voice: string): { key: string; conn: Conn } {
  const idx = (rrIndex.get(voice) ?? 0) % POOL_PER_VOICE;
  rrIndex.set(voice, idx + 1);
  const key = `${voice}#${idx}`;
  let c = conns.get(key);
  if (!c) {
    const tts = new MsEdgeTTS({ connectionTimeoutMs: 8000, synthesisTimeoutMs: 15000 });
    c = { tts, ready: gatedConnect(tts, voice), queue: Promise.resolve() };
    conns.set(key, c);
  }
  if (c.idle) clearTimeout(c.idle);
  c.idle = setTimeout(() => dropConn(key), IDLE_MS);
  return { key, conn: c };
}
function dropConn(key: string) {
  const c = conns.get(key);
  if (!c) return;
  conns.delete(key);
  if (c.idle) clearTimeout(c.idle);
  try {
    c.tts.close();
  } catch {
    /* já fechada */
  }
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[ch]!);
}

async function synthOnce(connKey: string, conn: Conn, text: string, rate: string): Promise<Buffer> {
  await conn.ready;
  const { audioStream } = conn.tts.toStream(escapeXml(text), { rate });
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    audioStream.on("data", (d: Buffer) => chunks.push(d));
    audioStream.on("end", () => resolve());
    audioStream.on("error", (e: Error) => reject(e));
  });
  const buf = Buffer.concat(chunks);
  if (buf.length < 512) throw new Error("áudio vazio");
  return buf;
}

/** Sintetiza (em fila por ligação da voz) com até 3 tentativas. */
function synthQueued(voice: string, text: string, rate: string): Promise<Buffer> {
  const initial = getConn(voice);
  const job = initial.conn.queue.then(async () => {
    let lastErr: unknown;
    let cur = initial;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await synthOnce(cur.key, cur.conn, text, rate);
      } catch (e) {
        lastErr = e;
        dropConn(cur.key); // ligação possivelmente estragada → nova na próxima tentativa
        const is429 = /429/.test(String((e as Error)?.message));
        console.warn(`[tts] tentativa ${attempt + 1} falhou (${voice}):`, (e as Error)?.message);
        await sleep(is429 ? 1200 * (attempt + 1) : 300 * (attempt + 1));
        cur = getConn(voice);
      }
    }
    throw lastErr;
  });
  // a fila continua mesmo que este pedido falhe
  const conn = conns.get(initial.key) ?? initial.conn;
  conn.queue = job.catch(() => undefined);
  return job;
}

const inflight = new Map<string, Promise<Buffer>>();

export interface TtsResult {
  audio: Buffer;
  cache: "mem" | "disk" | "miss";
}

export async function synthesize(voice: string, text: string, rate: string): Promise<TtsResult> {
  const hit = await peekCache(voice, text, rate);
  if (hit) return hit;
  const hash = keyHash(voice, text, rate);
  // pedidos iguais em simultâneo partilham a mesma síntese
  let p = inflight.get(hash);
  if (!p) {
    p = synthQueued(voice, text, rate).finally(() => inflight.delete(hash));
    inflight.set(hash, p);
  }
  const audio = await p;
  memSet(hash, audio);
  await diskSet(voice, hash, audio);
  return { audio, cache: "miss" };
}

function keyHash(voice: string, text: string, rate: string) {
  return createHash("sha1").update(`${voice}|${rate}|${text}`).digest("hex");
}

/** Só consulta a cache (memória → disco); devolve null se a frase ainda não foi sintetizada. */
export async function peekCache(voice: string, text: string, rate: string): Promise<TtsResult | null> {
  const hash = keyHash(voice, text, rate);
  const m = memGet(hash);
  if (m) return { audio: m, cache: "mem" };
  const d = await diskGet(voice, hash);
  if (d) {
    memSet(hash, d);
    return { audio: d, cache: "disk" };
  }
  return null;
}

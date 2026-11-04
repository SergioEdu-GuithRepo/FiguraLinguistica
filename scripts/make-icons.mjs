/* Gera os ícones PNG da PWA, Android (mipmap-*) e iOS (1024x1024) sem dependências. Uso: node scripts/make-icons.mjs */
import { deflateSync } from "zlib";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";

function crc32(buf) {
  let c,
    crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel, samples = 3) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const total = samples * samples;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let rSum = 0,
        gSum = 0,
        bSum = 0,
        aSum = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const [r, g, b, a] = pixel((x + (sx + 0.5) / samples) / size, (y + (sy + 0.5) / samples) / size);
          const w = a / 255;
          rSum += r * w;
          gSum += g * w;
          bSum += b * w;
          aSum += a;
        }
      }
      const aOut = Math.round(aSum / total);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      if (aOut === 0) {
        raw[o] = 0;
        raw[o + 1] = 0;
        raw[o + 2] = 0;
        raw[o + 3] = 0;
      } else {
        const wSum = aSum / 255;
        raw[o] = Math.round(rSum / wSum);
        raw[o + 1] = Math.round(gSum / wSum);
        raw[o + 2] = Math.round(bSum / wSum);
        raw[o + 3] = aOut;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const inRoundRect = (x, y, x0, y0, x1, y1, r) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
const CORAL = [232, 115, 90, 255];
const WHITE = [255, 255, 255, 255];
const YELLOW = [240, 207, 94, 255];
const TEAL = [134, 197, 189, 255];
const LILAC = [154, 154, 240, 255];
const CLEAR = [0, 0, 0, 0];
const dot = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

function drawSpeechBubble(X, Y) {
  const bubble = inRoundRect(X, Y, 0.2, 0.24, 0.8, 0.66, 0.12);
  const tail = Y > 0.6 && Y < 0.8 && X > 0.3 && X < 0.46 && X - 0.3 < (0.8 - Y) * 0.9;
  if (bubble || tail) {
    if (dot(X, Y, 0.36, 0.45, 0.055)) return YELLOW;
    if (dot(X, Y, 0.5, 0.45, 0.055)) return TEAL;
    if (dot(X, Y, 0.64, 0.45, 0.055)) return LILAC;
    return WHITE;
  }
  return null;
}

function icon({ shape = "roundrect", scale = 1 }) {
  return (x, y) => {
    if (shape === "roundrect" && !inRoundRect(x, y, 0.04, 0.04, 0.96, 0.96, 0.22)) return CLEAR;
    if (shape === "circle" && !dot(x, y, 0.5, 0.5, 0.47)) return CLEAR;
    const X = (x - 0.5) / scale + 0.5;
    const Y = (y - 0.5) / scale + 0.5;
    const fg = drawSpeechBubble(X, Y);
    if (fg) return fg;
    return shape === "foreground" ? CLEAR : CORAL;
  };
}

function save(file, buf) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buf);
}

// 1. PWA
save("public/icon-192.png", png(192, icon({ shape: "roundrect", scale: 1 })));
save("public/icon-512.png", png(512, icon({ shape: "roundrect", scale: 1 })));
save("public/icon-maskable-512.png", png(512, icon({ shape: "full", scale: 0.8 })));

// 2. Android (Adaptive foreground + Legacy square & round)
const ANDROID_DENSITIES = [
  { dir: "mipmap-mdpi", launcher: 48, foreground: 108 },
  { dir: "mipmap-hdpi", launcher: 72, foreground: 162 },
  { dir: "mipmap-xhdpi", launcher: 96, foreground: 216 },
  { dir: "mipmap-xxhdpi", launcher: 144, foreground: 324 },
  { dir: "mipmap-xxxhdpi", launcher: 192, foreground: 432 },
];

if (existsSync("android/app/src/main/res")) {
  for (const { dir, launcher, foreground } of ANDROID_DENSITIES) {
    const base = `android/app/src/main/res/${dir}`;
    save(`${base}/ic_launcher.png`, png(launcher, icon({ shape: "roundrect", scale: 0.96 })));
    save(`${base}/ic_launcher_round.png`, png(launcher, icon({ shape: "circle", scale: 0.9 })));
    save(`${base}/ic_launcher_foreground.png`, png(foreground, icon({ shape: "foreground", scale: 0.64 })));
  }
}

// 3. iOS App Store / Xcode (1024x1024 sem transparência)
if (existsSync("ios/App/App/Assets.xcassets/AppIcon.appiconset")) {
  save(
    "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
    png(1024, icon({ shape: "full", scale: 0.92 }), 2),
  );
}

console.log("ícones PWA, Android e iOS gerados com sucesso");

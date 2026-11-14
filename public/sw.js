/* FiguraLinguística — service worker (PWA, modo leve e lições descarregadas) */
const VERSION = "fl-v4";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const TTS = "fl-tts"; // áudio neural: sobrevive a actualizações da app
const OFFLINE_URLS = ["/", "/inicio", "/cursos", "/contextos", "/licoes", "/perfil", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((c) => c.addAll(OFFLINE_URLS).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION) && k !== TTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isTts = (u) => u.startsWith("/api/tts?");

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "cache-urls" && Array.isArray(data.urls)) {
    event.waitUntil(
      (async () => {
        const pages = await caches.open(PAGES);
        const tts = await caches.open(TTS);
        for (const u of data.urls) {
          try {
            const c = isTts(u) ? tts : pages;
            if (isTts(u) && (await c.match(u))) continue;
            const res = await fetch(u, { credentials: "same-origin" });
            if (res.status === 200) await c.put(u, res.clone());
          } catch {
            /* sem rede */
          }
        }
        if (event.source) event.source.postMessage({ type: "cached", urls: data.urls });
      })(),
    );
  }
  if (data.type === "uncache-urls" && Array.isArray(data.urls)) {
    event.waitUntil(
      Promise.all([caches.open(PAGES), caches.open(TTS)]).then(([p, t]) => Promise.all(data.urls.flatMap((u) => [p.delete(u), t.delete(u)]))),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // voz neural HD: o URL determina o áudio → cache-first (repetições instantâneas e lições offline)
  if (url.pathname === "/api/tts" && url.searchParams.has("text")) {
    event.respondWith(
      caches.match(req, { ignoreVary: true }).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.status === 200) {
              const copy = res.clone();
              caches.open(TTS).then((c) => c.put(req, copy)).catch(() => undefined);
            }
            return res;
          }),
      ),
    );
    return;
  }
  if (url.pathname.startsWith("/api/")) return;

  // estáticos versionados: cache-first
  if (url.pathname.startsWith("/_next/static/") || /\.(woff2?|svg|png|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // páginas: network-first com fallback para cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match("/inicio")) || (await caches.match("/")) || Response.error()),
    );
  }
});

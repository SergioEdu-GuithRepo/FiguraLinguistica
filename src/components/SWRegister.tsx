"use client";

import { useEffect } from "react";

export function SWRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // evitar cache em desenvolvimento
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}

/** Pede ao service worker para guardar URLs para uso offline. */
export async function cacheForOffline(urls: string[], remove = false): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  const sw = reg?.active;
  if (!sw) return false;
  sw.postMessage({ type: remove ? "uncache-urls" : "cache-urls", urls });
  return true;
}

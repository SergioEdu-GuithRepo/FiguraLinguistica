"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WordSheet } from "@/components/Reader";
import { AppFrame } from "@/components/Shell";
import { Empty, ProgressRing, SpeakButton, TopBar } from "@/components/ui";
import { CONTENT } from "@/content";
import { isStrong, retrievability } from "@/lib/fsrs";
import { LANGS } from "@/lib/langs";
import { VOCAB_TARGET, vocabStats } from "@/lib/state";
import { useApp } from "@/lib/store";
import type { RToken } from "@/lib/tokenize";

function Palavras() {
  const { state } = useApp();
  const router = useRouter();
  const lang = state.activeLang;
  const dict = CONTENT[lang].dictionary;
  const stats = vocabStats(state, lang);
  const [filter, setFilter] = useState<"todas" | "fortes" | "fracas">("todas");
  const [tok, setTok] = useState<RToken | null>(null);
  const words = Object.entries(state.srs[lang])
    .filter(([k]) => k.startsWith("w:"))
    .map(([k, c]) => ({ key: k.slice(2), card: c, entry: dict[k.slice(2)] }))
    .filter((w) => w.entry)
    .filter((w) => (filter === "fortes" ? isStrong(w.card) : filter === "fracas" ? !isStrong(w.card) : true))
    .sort((a, b) => b.card.last - a.card.last);

  return (
    <>
      <TopBar back={() => router.push("/inicio")} title={`Palavras · ${LANGS[lang].name}`} />
      <div className="card flex items-center gap-5 p-5">
        <ProgressRing pct={stats.pct} color="var(--color-teal)">
          {stats.pct}%
        </ProgressRing>
        <div>
          <div className="text-lg font-extrabold">{stats.label}</div>
          <div className="text-sm text-[var(--color-muted)]">
            {stats.strong} com memória forte · {stats.learned} vistas · meta: {VOCAB_TARGET} palavras mais usadas
          </div>
        </div>
      </div>
      <div className="my-4 flex gap-2">
        {(
          [
            ["todas", "Todas"],
            ["fortes", "Memória forte"],
            ["fracas", "A reforçar"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} className={`chip ${filter === v ? "!bg-[var(--color-ink)] text-white" : ""}`} onClick={() => setFilter(v)}>
            {l}
          </button>
        ))}
      </div>
      {words.length === 0 ? (
        <Empty icon="cards" title="Ainda sem palavras aqui" text="Aprende palavras no passo «Vocabulário-chave» ou guarda-as no leitor." />
      ) : (
        <ul className={`flex flex-col gap-2 lang-${lang}`}>
          {words.map((w) => {
            const r = Math.round(retrievability(w.card) * 100);
            return (
              <li key={w.key}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setTok({ text: w.key, key: w.key, entry: w.entry, isPunct: false, spaceAfter: false })}
                  onKeyDown={(e) => e.key === "Enter" && setTok({ text: w.key, key: w.key, entry: w.entry, isPunct: false, spaceAfter: false })}
                  className="card flex cursor-pointer items-center gap-3 p-3"
                >
                  <SpeakButton text={w.key} lang={lang} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="target truncate font-bold">{w.key}</div>
                    <div className="truncate text-sm text-[var(--color-muted)]">
                      {w.entry.reading && lang === "ja" ? `${w.entry.reading} · ` : ""}
                      {w.entry.pt}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className={`font-bold ${isStrong(w.card) ? "text-[var(--color-good)]" : "text-[var(--color-coral)]"}`}>{r}%</div>
                    <div className="text-[var(--color-muted)]">revisão {new Date(w.card.due).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <WordSheet tok={tok} lang={lang} onClose={() => setTok(null)} />
    </>
  );
}

export default function PalavrasPage() {
  return (
    <AppFrame nav={false}>
      <Palavras />
    </AppFrame>
  );
}

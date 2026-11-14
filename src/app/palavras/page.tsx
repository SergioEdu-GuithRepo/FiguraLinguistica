"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ContextualVocabDrill } from "@/components/ContextualVocabDrill";
import { Icon } from "@/components/Icon";
import { WordSheet } from "@/components/Reader";
import { AppFrame } from "@/components/Shell";
import { Empty, ProgressRing, SpeakButton, TopBar } from "@/components/ui";
import { CONTENT } from "@/content";
import { isStrong, retrievability } from "@/lib/fsrs";
import { useImeSafeEnter } from "@/lib/ime";
import { LANGS, POS_PT } from "@/lib/langs";
import { VOCAB_TARGET, vocabStats } from "@/lib/state";
import { useApp } from "@/lib/store";
import type { RToken } from "@/lib/tokenize";

type WordFilter = "todas" | "fortes" | "fracas" | "expressoes";

function Palavras() {
  const { state } = useApp();
  const router = useRouter();
  const lang = state.activeLang;
  const speechLang = LANGS[lang].speechLang;
  const dict = CONTENT[lang].dictionary;
  const stats = vocabStats(state, lang);
  const [filter, setFilter] = useState<WordFilter>("todas");
  const [query, setQuery] = useState("");
  const [drillOpen, setDrillOpen] = useState(false);
  const [tok, setTok] = useState<RToken | null>(null);

  const imeSearch = useImeSafeEnter(() => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  const allSaved = useMemo(
    () =>
      Object.entries(state.srs[lang])
        .filter(([k]) => k.startsWith("w:"))
        .map(([k, c]) => ({ key: k.slice(2), card: c, entry: dict[k.slice(2)] }))
        .filter((w) => w.entry)
        .sort((a, b) => b.card.last - a.card.last),
    [state.srs, lang, dict],
  );

  const weakCount = useMemo(() => allSaved.filter((w) => !isStrong(w.card)).length, [allSaved]);

  const words = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return allSaved.filter((w) => {
      if (filter === "fortes" && !isStrong(w.card)) return false;
      if (filter === "fracas" && isStrong(w.card)) return false;
      if (filter === "expressoes" && w.entry.pos !== "expr" && !w.key.includes(" ")) return false;
      if (!q) return true;
      const hay = [w.key, w.entry.pt, w.entry.reading ?? "", w.entry.romaji ?? ""]
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return hay.includes(q);
    });
  }, [allSaved, filter, query]);

  return (
    <>
      <TopBar back={() => router.push("/inicio")} title={`Palavras · ${LANGS[lang].name}`} />

      <div className="card p-5">
        <div className="flex items-center gap-5">
          <ProgressRing pct={stats.pct} color="var(--color-teal)">
            {stats.pct}%
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-extrabold">{stats.label}</div>
            <div className="text-sm text-[var(--color-muted)]">
              {stats.strong} com memória forte · {stats.learned} vistas · meta: {VOCAB_TARGET} palavras mais usadas
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDrillOpen((v) => !v)}
            className="btn btn-primary flex-1 !py-2.5 text-xs"
          >
            <Icon name="bolt" size={16} />
            {drillOpen ? "Fechar treino em frase" : `Treinar ${weakCount > 0 ? `a reforçar (${weakCount})` : "em contexto"}`}
          </button>
          <Link href="/cursos/vocabulario" className="btn btn-ghost !px-3.5 !py-2.5 text-xs">
            📖 Dicionário
          </Link>
          <Link href="/contextos" className="btn btn-ghost !px-3.5 !py-2.5 text-xs">
            🧰 Contextos
          </Link>
        </div>
      </div>

      {drillOpen && (
        <div className="my-4">
          <ContextualVocabDrill
            lang={lang}
            onlyWeak={weakCount > 0}
            count={6}
            title="Reforçar as tuas palavras em frases reais"
            onDone={() => setDrillOpen(false)}
          />
        </div>
      )}

      {allSaved.length > 0 && (
        <div className="mt-4">
          <label htmlFor="palavras-search" className="mb-1.5 block text-xs font-extrabold text-[var(--color-muted)]">
            Filtrar o teu caderno de vocabulário
          </label>
          <div className="relative flex items-center">
            <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 text-[var(--color-muted)]" />
            <input
              id="palavras-search"
              name="q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onCompositionStart={imeSearch.onCompositionStart}
              onCompositionEnd={imeSearch.onCompositionEnd}
              onKeyDown={imeSearch.onKeyDown}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="search"
              placeholder="Procurar palavra ou tradução…"
              className="input min-h-[46px] pl-10 pr-10 text-base"
            />
            {query && (
              <button
                type="button"
                aria-label="Limpar pesquisa"
                onClick={() => setQuery("")}
                className="absolute right-2 grid h-9 w-9 place-items-center rounded-full text-[var(--color-muted)] hover:bg-white"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="my-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar estado da memória">
        {(
          [
            ["todas", "Todas"],
            ["fortes", "Memória forte"],
            ["fracas", "A reforçar"],
            ["expressoes", "Expressões"],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            type="button"
            aria-pressed={filter === v}
            className={`chip min-h-[38px] ${filter === v ? "!bg-[var(--color-ink)] text-white" : ""}`}
            onClick={() => setFilter(v)}
          >
            {l}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        {words.length} palavras visíveis
      </p>

      {words.length === 0 ? (
        <Empty
          icon="cards"
          title={allSaved.length === 0 ? "Ainda sem palavras guardadas" : "Nenhuma palavra corresponde ao filtro"}
          text={
            allSaved.length === 0
              ? "Aprende palavras no passo «Vocabulário-chave», guarda pacotes em «Contextos» ou toca em palavras no leitor."
              : "Experimenta limpar a pesquisa ou mudar o filtro acima."
          }
          action={
            allSaved.length === 0 ? (
              <Link href="/contextos" className="btn btn-primary text-xs">
                Explorar Contextos & Kit de Bolso
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul role="list" className={`flex flex-col gap-2 lang-${lang}`}>
          {words.map((w) => {
            const r = Math.round(retrievability(w.card) * 100);
            return (
              <li key={w.key} className="card flex items-center gap-2 p-2.5">
                <SpeakButton text={w.key} lang={lang} size={38} label={`Ouvir ${w.key}`} />
                <button
                  type="button"
                  onClick={() => setTok({ text: w.key, key: w.key, entry: w.entry, isPunct: false, spaceAfter: false })}
                  className="flex min-h-[46px] min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-2 py-1 text-left transition hover:bg-[var(--color-bg)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span lang={speechLang} className={`target truncate font-bold ${lang === "ja" ? "jp" : ""}`}>
                        {w.key}
                      </span>
                      <span className="rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-muted)]">
                        {POS_PT[w.entry.pos] ?? w.entry.pos}
                      </span>
                    </span>
                    <span className="block truncate text-sm text-[var(--color-muted)]">
                      {w.entry.reading && lang === "ja" ? `${w.entry.reading} · ` : ""}
                      {w.entry.pt}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs">
                    <span className={`block font-bold ${isStrong(w.card) ? "text-[var(--color-good)]" : "text-[var(--color-coral)]"}`}>
                      {r}%
                    </span>
                    <span className="block text-[var(--color-muted)]">
                      revisão {new Date(w.card.due).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                </button>
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

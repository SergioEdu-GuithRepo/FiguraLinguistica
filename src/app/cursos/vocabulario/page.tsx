"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { ContextualVocabDrill } from "@/components/ContextualVocabDrill";
import { Icon } from "@/components/Icon";
import { WordSheet } from "@/components/Reader";
import { AppFrame, LanguageSelector } from "@/components/Shell";
import { Empty, SpeakButton, Toast, TopBar } from "@/components/ui";
import { CONTENT } from "@/content";
import { CONTEXT_PACKS, searchDictionary } from "@/lib/contexts";
import { useImeSafeEnter } from "@/lib/ime";
import { LANGS, POS_PT } from "@/lib/langs";
import { isUnitUnlocked, saveWordsBatch } from "@/lib/state";
import { useApp } from "@/lib/store";
import type { RToken } from "@/lib/tokenize";
import type { PartOfSpeech } from "@/lib/types";

type ModeTab = "cenas" | "dicionario" | "treino";

const POS_FILTERS: { id: PartOfSpeech | "all"; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "expr", label: "Expressões" },
  { id: "noun", label: "Substantivos" },
  { id: "verb", label: "Verbos" },
  { id: "adj", label: "Adjectivos" },
  { id: "adv", label: "Advérbios" },
];

function Vocabulario() {
  const { state, update } = useApp();
  const router = useRouter();
  const lang = state.activeLang;
  const speechLang = LANGS[lang].speechLang;
  const { units, dictionary } = CONTENT[lang];
  const totalDictCount = useMemo(() => Object.keys(dictionary).length, [dictionary]);

  const [mode, setMode] = useState<ModeTab>("cenas");
  const [open, setOpen] = useState<string | null>(units[0]?.id ?? null);
  const [openPack, setOpenPack] = useState<string | null>(null);
  const [tok, setTok] = useState<RToken | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const tabRefs = useRef<Partial<Record<ModeTab, HTMLButtonElement | null>>>({});

  // Estado do Dicionário vivo
  const [query, setQuery] = useState("");
  const [posFilter, setPosFilter] = useState<PartOfSpeech | "all">("all");
  const [packFilter, setPackFilter] = useState<string>("all");
  const [onlyNotes, setOnlyNotes] = useState(false);
  const [srsFilter, setSrsFilter] = useState<"all" | "unsaved" | "saved" | "weak">("all");
  const [limit, setLimit] = useState(60);

  const imeSearch = useImeSafeEnter(() => {
    // Em pesquisa ao vivo, Enter fora de composição fecha o teclado móvel suavemente
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  const searchResult = useMemo(
    () =>
      searchDictionary(
        lang,
        query,
        { pos: posFilter, packId: packFilter, onlyNotes, srsFilter, limit },
        state.srs[lang],
      ),
    [lang, query, posFilter, packFilter, onlyNotes, srsFilter, limit, state.srs],
  );

  const handleSaveScene = (vocab: string[], title: string) => {
    const already = vocab.filter((k) => !!state.srs[lang][`w:${k.toLowerCase()}`]).length;
    const added = vocab.length - already;
    update((s) => saveWordsBatch(s, lang, vocab, 2));
    setToast(
      added > 0
        ? `✓ ${added} ${added === 1 ? "palavra guardada" : "palavras guardadas"} de «${title}»!`
        : `Todas as palavras de «${title}» já estão na revisão.`,
    );
  };

  const modeTabs: readonly [ModeTab, string][] = [
    ["cenas", "🎬 Por cenas"],
    ["dicionario", `📖 Dicionário (${totalDictCount})`],
    ["treino", "🧩 Em frase"],
  ];

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const order = modeTabs.map(([id]) => id);
    const cur = order.indexOf(mode);
    let nextIdx = -1;
    if (event.key === "ArrowRight") nextIdx = (cur + 1) % order.length;
    else if (event.key === "ArrowLeft") nextIdx = (cur - 1 + order.length) % order.length;
    else if (event.key === "Home") nextIdx = 0;
    else if (event.key === "End") nextIdx = order.length - 1;
    if (nextIdx >= 0) {
      event.preventDefault();
      const nextId = order[nextIdx];
      setMode(nextId);
      tabRefs.current[nextId]?.focus();
    }
  };

  return (
    <>
      <TopBar back={() => router.push("/cursos")} title="Explorador de Vocabulário" />
      <LanguageSelector />

      {/* Selector dos 3 modos */}
      <div
        role="tablist"
        aria-label="Modos de vocabulário"
        onKeyDown={handleTabKeyDown}
        className="mb-4 grid grid-cols-3 gap-2"
      >
        {modeTabs.map(([id, label]) => {
          const active = mode === id;
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el;
              }}
              id={`vocab-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => setMode(id)}
              className="fl-tab min-h-[44px] rounded-2xl px-2.5 py-2 text-xs font-extrabold transition"
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Atalho para Contextos & Kit de Bolso */}
      <Link
        href="/contextos"
        className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-lilac-soft)]/75 px-4 py-3 text-xs font-bold text-[var(--color-ink)] transition hover:bg-[var(--color-lilac-soft)]"
      >
        <span>🧰 Queres frases prontas por registo, mini-diálogos e falsos amigos? Explora os 14 Contextos Reais</span>
        <Icon name="chevron-right" size={16} className="shrink-0" />
      </Link>

      <div role="tabpanel" aria-labelledby="vocab-tab-cenas" hidden={mode !== "cenas"}>
        {mode === "cenas" && (
          <div className="space-y-6">
            {/* Colecções temáticas de Contextos Reais (todas abertas desde o nível 1) */}
            <section aria-labelledby="context-collections-heading">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h2 id="context-collections-heading" className="font-extrabold">
                  Colecções de Contextos Reais ({CONTEXT_PACKS.length})
                </h2>
                <span className="text-xs font-semibold text-[var(--color-good)]">Desbloqueadas desde o nível 1</span>
              </div>
              <p className="mb-3 text-xs text-[var(--color-muted)]">
                Vocabulário de sobrevivência imediata para casa, restaurante, transportes, carreira, saúde, emergências e vida social.
              </p>
              <div className={`flex flex-col gap-2.5 lang-${lang}`}>
                {CONTEXT_PACKS.map((pack) => {
                  const pData = pack.byLang[lang];
                  const isPackOpen = openPack === pack.id;
                  const savedCount = pData.vocabKeys.filter((k) => !!state.srs[lang][`w:${k.toLowerCase()}`]).length;
                  const allSaved = savedCount >= pData.vocabKeys.length;
                  return (
                    <div key={pack.id} className="card overflow-hidden">
                      <button
                        type="button"
                        className="flex min-h-[58px] w-full items-center gap-3 p-3.5 text-left"
                        onClick={() => setOpenPack(isPackOpen ? null : pack.id)}
                        aria-expanded={isPackOpen}
                      >
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-xl"
                          style={{ background: pack.softColor }}
                        >
                          {pack.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold">{pack.title}</span>
                          <span className="text-xs text-[var(--color-muted)]">
                            {pack.tag} · {savedCount}/{pData.vocabKeys.length} guardadas
                          </span>
                        </span>
                        <Icon
                          name={isPackOpen ? "chevron-down" : "chevron-right"}
                          size={18}
                          className="shrink-0 text-[var(--color-muted)]"
                        />
                      </button>
                      {isPackOpen && (
                        <div className="px-3.5 pb-3.5">
                          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                            <Link
                              href={`/contextos?pack=${pack.id}`}
                              className="text-xs font-extrabold text-[var(--color-coral)] hover:underline"
                            >
                              Ver frases prontas & mini-diálogo →
                            </Link>
                            <button
                              type="button"
                              disabled={allSaved}
                              onClick={() => handleSaveScene(pData.vocabKeys, pack.title)}
                              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                                allSaved
                                  ? "bg-[var(--color-good-soft)] text-[var(--color-good)]"
                                  : "bg-[var(--color-coral-soft)] text-[var(--color-coral)] hover:bg-[var(--color-coral)] hover:text-white"
                              }`}
                            >
                              {allSaved ? "✓ Guardado" : "+ Guardar tema"}
                            </button>
                          </div>
                          <ul role="list" className="grid grid-cols-1 gap-2">
                            {pData.vocabKeys.map((rawKey) => {
                              const k = rawKey.toLowerCase();
                              const e = dictionary[k];
                              if (!e) return null;
                              const saved = !!state.srs[lang][`w:${k}`];
                              return (
                                <li key={k} className="flex items-center gap-2 rounded-2xl bg-[var(--color-bg)] p-2">
                                  <SpeakButton text={k} lang={lang} size={36} className="!bg-white" label={`Ouvir ${k}`} />
                                  <button
                                    type="button"
                                    className="flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-2 rounded-xl px-2 py-1 text-left transition hover:bg-white/70"
                                    onClick={() => setTok({ text: k, key: k, entry: e, isPunct: false, spaceAfter: false })}
                                  >
                                    <span className="min-w-0 flex-1">
                                      <span lang={speechLang} className={`target block truncate font-bold ${lang === "ja" ? "jp" : ""}`}>
                                        {k}
                                        {lang === "fr" && e.gender && (
                                          <span className="ml-1.5 text-xs font-normal text-[var(--color-muted)]">({e.gender}.)</span>
                                        )}
                                      </span>
                                      <span className="block truncate text-sm text-[var(--color-muted)]">
                                        {lang === "ja" && e.reading ? `${e.reading} · ` : ""}
                                        {e.pt}
                                      </span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-1.5">
                                      {e.note && (
                                        <span className="rounded-full bg-[var(--color-yellow-soft)] px-2 py-0.5 text-[10px] font-bold text-[#7a5c0d]">
                                          💡
                                        </span>
                                      )}
                                      {saved && <Icon name="bookmark" size={16} filled className="text-[var(--color-coral)]" />}
                                    </span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Cenas sequenciais do currículo */}
            <section aria-labelledby="curriculum-scenes-heading">
              <h2 id="curriculum-scenes-heading" className="mb-1 font-extrabold">
                Cenas do Currículo ({units.length} unidades)
              </h2>
              <p className="mb-3 text-xs text-[var(--color-muted)]">
                As palavras mais usadas agrupadas pelas {units.length} cenas progressivas. Toca numa palavra para ver exemplos, notas e guardar.
              </p>
              <div className={`flex flex-col gap-3 lang-${lang}`}>
                {units.map((u) => {
                  const unlocked = isUnitUnlocked(state, u.id);
                  const isOpen = open === u.id && unlocked;
                  const savedCount = u.vocab.filter((k) => !!state.srs[lang][`w:${k}`]).length;
                  const allSaved = savedCount >= u.vocab.length;
                  return (
                    <section key={u.id} className="card overflow-hidden">
                      <button
                        type="button"
                        className="flex min-h-[64px] w-full items-center gap-3 p-4 text-left"
                        onClick={() => unlocked && setOpen(isOpen ? null : u.id)}
                        aria-expanded={isOpen}
                        disabled={!unlocked}
                      >
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-yellow-soft)] text-2xl">
                          {u.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-extrabold">{u.title}</span>
                          <span className="text-xs text-[var(--color-muted)]">
                            Nível {u.level} · {u.category} · {savedCount}/{u.vocab.length} guardadas
                          </span>
                        </span>
                        <Icon
                          name={unlocked ? (isOpen ? "chevron-down" : "chevron-right") : "lock"}
                          size={20}
                          className="shrink-0 text-[var(--color-muted)]"
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4">
                          <div className="mb-2.5 flex items-center justify-between gap-2">
                            <span className="text-xs text-[var(--color-muted)]">{u.objective}</span>
                            <button
                              type="button"
                              disabled={allSaved}
                              onClick={() => handleSaveScene(u.vocab, u.title)}
                              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                                allSaved
                                  ? "bg-[var(--color-good-soft)] text-[var(--color-good)]"
                                  : "bg-[var(--color-coral-soft)] text-[var(--color-coral)] hover:bg-[var(--color-coral)] hover:text-white"
                              }`}
                            >
                              {allSaved ? "✓ Guardada" : "+ Guardar cena"}
                            </button>
                          </div>
                          <ul role="list" className="grid grid-cols-1 gap-2">
                            {u.vocab.map((k) => {
                              const e = dictionary[k];
                              if (!e) return null;
                              const saved = !!state.srs[lang][`w:${k}`];
                              return (
                                <li key={k} className="flex items-center gap-2 rounded-2xl bg-[var(--color-bg)] p-2">
                                  <SpeakButton text={k} lang={lang} size={36} className="!bg-white" label={`Ouvir ${k}`} />
                                  <button
                                    type="button"
                                    className="flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-2 rounded-xl px-2 py-1 text-left transition hover:bg-white/70"
                                    onClick={() => setTok({ text: k, key: k, entry: e, isPunct: false, spaceAfter: false })}
                                  >
                                    <span className="min-w-0 flex-1">
                                      <span lang={speechLang} className={`target block truncate font-bold ${lang === "ja" ? "jp" : ""}`}>
                                        {k}
                                        {lang === "fr" && e.gender && (
                                          <span className="ml-1.5 text-xs font-normal text-[var(--color-muted)]">({e.gender}.)</span>
                                        )}
                                      </span>
                                      <span className="block truncate text-sm text-[var(--color-muted)]">
                                        {lang === "ja" && e.reading ? `${e.reading} · ` : ""}
                                        {e.pt}
                                      </span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-1.5">
                                      {e.note && (
                                        <span className="rounded-full bg-[var(--color-yellow-soft)] px-2 py-0.5 text-[10px] font-bold text-[#7a5c0d]">
                                          💡
                                        </span>
                                      )}
                                      {saved && <Icon name="bookmark" size={16} filled className="text-[var(--color-coral)]" />}
                                    </span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>

      <div role="tabpanel" aria-labelledby="vocab-tab-dicionario" hidden={mode !== "dicionario"}>
        {mode === "dicionario" && (
          <div className="space-y-4">
            <search className="card p-4">
              <label htmlFor="vocab-dict-search" className="mb-1.5 block text-xs font-extrabold text-[var(--color-muted)]">
                Pesquisar em {LANGS[lang].name.toLowerCase()}, português{lang === "ja" ? " ou romaji" : ""}
              </label>
              <div className="relative flex items-center">
                <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 text-[var(--color-muted)]" />
                <input
                  id="vocab-dict-search"
                  name="q"
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setLimit(60);
                  }}
                  onCompositionStart={imeSearch.onCompositionStart}
                  onCompositionEnd={imeSearch.onCompositionEnd}
                  onKeyDown={imeSearch.onKeyDown}
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="search"
                  placeholder={
                    lang === "ja"
                      ? "Ex.: reembolso, 予約, yoyaku, sumimasen…"
                      : lang === "fr"
                        ? "Ex.: reembolso, virement, gare, en fait…"
                        : "Ex.: reembolso, boarding pass, actually…"
                  }
                  className="input min-h-[48px] pl-10 pr-10 text-base"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Limpar pesquisa"
                    onClick={() => setQuery("")}
                    className="absolute right-2 grid h-9 w-9 place-items-center rounded-full text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>

              {/* Filtro por contexto real */}
              <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtrar por pacote de contexto">
                <button
                  type="button"
                  aria-pressed={packFilter === "all"}
                  onClick={() => {
                    setPackFilter("all");
                    setLimit(60);
                  }}
                  className={`chip shrink-0 min-h-[34px] !px-3 !py-1 text-xs ${
                    packFilter === "all" ? "!bg-[var(--color-ink)] text-white" : ""
                  }`}
                >
                  Todos os temas
                </button>
                {CONTEXT_PACKS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={packFilter === p.id}
                    onClick={() => {
                      setPackFilter(packFilter === p.id ? "all" : p.id);
                      setLimit(60);
                    }}
                    className={`chip shrink-0 min-h-[34px] !px-3 !py-1 text-xs ${
                      packFilter === p.id ? "!bg-[var(--color-ink)] text-white" : ""
                    }`}
                  >
                    {p.emoji} {p.tag}
                  </button>
                ))}
              </div>

              {/* Classe gramatical */}
              <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por classe gramatical">
                {POS_FILTERS.map((pf) => (
                  <button
                    key={pf.id}
                    type="button"
                    aria-pressed={posFilter === pf.id}
                    onClick={() => {
                      setPosFilter(pf.id);
                      setLimit(60);
                    }}
                    className={`chip min-h-[36px] !px-3 !py-1 text-xs ${posFilter === pf.id ? "!bg-[var(--color-ink)] text-white" : ""}`}
                  >
                    {pf.label}
                  </button>
                ))}
              </div>

              {/* Notas culturais / falsos amigos + estado SRS */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  aria-pressed={onlyNotes}
                  onClick={() => {
                    setOnlyNotes((v) => !v);
                    setLimit(60);
                  }}
                  className={`chip min-h-[36px] !px-3 !py-1 text-xs ${
                    onlyNotes ? "!bg-[var(--color-yellow)] !text-[var(--color-ink)] font-extrabold" : ""
                  }`}
                >
                  💡 Falsos amigos & notas
                </button>
                {(
                  [
                    ["all", "Qualquer estado"],
                    ["unsaved", "Por guardar"],
                    ["saved", "Guardadas"],
                    ["weak", "A reforçar"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={srsFilter === id}
                    onClick={() => {
                      setSrsFilter(id);
                      setLimit(60);
                    }}
                    className={`chip min-h-[36px] !px-3 !py-1 text-xs ${srsFilter === id ? "!bg-[var(--color-teal)] text-white" : ""}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </search>

            <p aria-live="polite" className="px-1 text-xs font-bold text-[var(--color-muted)]">
              {searchResult.total} {searchResult.total === 1 ? "entrada encontrada" : "entradas encontradas"}
            </p>

            {searchResult.items.length === 0 ? (
              <Empty
                icon="search"
                title="Nenhuma palavra encontrada"
                text="Experimenta outro termo em português ou limpa os filtros activos."
              />
            ) : (
              <>
                <ul role="list" className={`flex flex-col gap-2 lang-${lang}`}>
                  {searchResult.items.map(({ key, entry, saved }) => (
                    <li key={key} className="card flex items-center gap-2 p-2.5">
                      <SpeakButton text={key} lang={lang} size={38} label={`Ouvir ${key}`} />
                      <button
                        type="button"
                        onClick={() => setTok({ text: key, key, entry, isPunct: false, spaceAfter: false })}
                        className="flex min-h-[46px] min-w-0 flex-1 items-center justify-between gap-2 rounded-xl px-2 py-1 text-left transition hover:bg-[var(--color-bg)]"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span lang={speechLang} className={`target truncate font-extrabold ${lang === "ja" ? "jp" : ""}`}>
                              {key}
                            </span>
                            {lang === "fr" && entry.gender && (
                              <span className="text-xs text-[var(--color-muted)]">({entry.gender}.)</span>
                            )}
                            <span className="rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-muted)]">
                              {POS_PT[entry.pos] ?? entry.pos}
                            </span>
                          </span>
                          <span className="block truncate text-sm text-[var(--color-muted)]">
                            {lang === "ja" && entry.reading ? `${entry.reading}${entry.romaji ? ` (${entry.romaji})` : ""} · ` : ""}
                            {entry.pt}
                          </span>
                          {entry.note && (
                            <span className="mt-0.5 block truncate text-xs text-[#7a5c0d]">💡 {entry.note}</span>
                          )}
                        </span>
                        {saved && <Icon name="bookmark" size={16} filled className="shrink-0 text-[var(--color-coral)]" />}
                      </button>
                    </li>
                  ))}
                </ul>

                {searchResult.total > searchResult.items.length && (
                  <button
                    type="button"
                    onClick={() => setLimit((l) => l + 60)}
                    className="btn btn-ghost w-full"
                  >
                    Mostrar mais ({searchResult.total - searchResult.items.length} restantes)
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div role="tabpanel" aria-labelledby="vocab-tab-treino" hidden={mode !== "treino"}>
        {mode === "treino" && (
          <ContextualVocabDrill
            lang={lang}
            count={8}
            title="Completa a frase no contexto certo"
            onDone={() => setMode("cenas")}
          />
        )}
      </div>

      <WordSheet tok={tok} lang={lang} onClose={() => setTok(null)} />
      <Toast text={toast} onDone={() => setToast(null)} />
    </>
  );
}

export default function VocabularioPage() {
  return (
    <AppFrame nav={false}>
      <Vocabulario />
    </AppFrame>
  );
}

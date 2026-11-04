"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppFrame, HeaderIconButton, LanguageSelector, ScreenHeader } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { Sheet } from "@/components/Sheet";
import { Books, ProgressBar } from "@/components/ui";
import { CONTENT, getUnit } from "@/content";
import { LANGS, STAGES } from "@/lib/langs";
import { isUnitUnlocked, recommendedPack, unitDone, unitProgressPct } from "@/lib/state";
import { useApp } from "@/lib/store";

type Status = "todas" | "por-fazer" | "concluidas";

function Cursos() {
  const { state } = useApp();
  const lang = state.activeLang;
  const units = CONTENT[lang].units;
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("todas");

  const patternsCount = units.reduce((a, u) => a + u.patterns.length, 0);
  const vocabCount = units.reduce((a, u) => a + u.vocab.length, 0);
  const pack = recommendedPack(state, lang);
  const rec = pack ? getUnit(pack.unitId) : undefined;
  const categories = Array.from(new Set(units.map((u) => u.category)));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return units.filter((u) => {
      if (category && u.category !== category) return false;
      if (status === "concluidas" && !unitDone(state, u.id)) return false;
      if (status === "por-fazer" && unitDone(state, u.id)) return false;
      if (!q) return true;
      const hay = [u.title, u.titleTarget, u.category, u.objective, ...u.vocab, ...u.vocab.map((v) => CONTENT[lang].dictionary[v]?.pt ?? "")]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [units, query, category, status, state, lang]);
  const filtering = !!query || !!category || status !== "todas";

  return (
    <>
      <ScreenHeader
        title="Cursos"
        actions={
          <>
            <HeaderIconButton icon="search" label="Pesquisar" onClick={() => setSearchOpen(true)} />
            <HeaderIconButton icon="filter" label="Filtros" onClick={() => setFilterOpen(true)} badge={!!category || status !== "todas"} />
          </>
        }
      />
      <LanguageSelector />

      {!filtering && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/cursos/estruturas"
              className="relative row-span-2 flex min-h-[260px] flex-col items-center justify-center overflow-hidden rounded-[24px] bg-[var(--color-coral)] p-4 text-center text-white shadow-[var(--shadow-card)]"
            >
              <Icon name="puzzle" size={30} />
              <div className="mt-2 text-lg font-extrabold">Estruturas</div>
              <div className="text-xs opacity-90">{patternsCount} moldes de frase</div>
              <Books className="absolute -bottom-1 -left-4 w-24" />
            </Link>
            <Link
              href="/cursos/vocabulario"
              className="relative flex min-h-[120px] flex-col items-center justify-center overflow-hidden rounded-[24px] bg-[var(--color-yellow)] p-3 text-center text-white shadow-[var(--shadow-card)]"
            >
              <Icon name="cards" size={26} className="relative z-10" />
              <div className="relative z-10 mt-1 font-extrabold">Vocabulário</div>
              <div className="relative z-10 text-[11px] opacity-90">{vocabCount} palavras por cenas</div>
              <Books className="absolute -bottom-5 -left-6 w-14 opacity-80" />
            </Link>
            <Link
              href="/cursos/conversas"
              className="relative flex min-h-[120px] flex-col items-center justify-center overflow-hidden rounded-[24px] bg-[var(--color-teal)] p-3 text-center text-white shadow-[var(--shadow-card)]"
            >
              <Icon name="chat" size={26} className="relative z-10" />
              <div className="relative z-10 mt-1 font-extrabold">Conversas</div>
              <div className="relative z-10 text-[11px] opacity-90">com {LANGS[lang].tutor.name}</div>
              <Books className="absolute -bottom-5 -right-6 w-14 opacity-80" />
            </Link>
          </div>

          {rec && pack && (
            <>
              <h2 className="mb-3 mt-6 font-extrabold">Pacote recomendado para ti</h2>
              <Link
                href={`/unidade/${rec.id}`}
                data-testid="recommended-pack"
                className="relative block overflow-hidden rounded-[24px] bg-[var(--color-lilac)] p-5 text-white shadow-[var(--shadow-card)]"
              >
                <div className="max-w-[72%]">
                  <span className="inline-block rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider">
                    ✨ {pack.badge}
                  </span>
                  <div className="mt-1.5 text-lg font-extrabold">
                    {rec.title} em {LANGS[lang].name.toLowerCase()}
                  </div>
                  <div className="mt-1 text-xs opacity-95">{pack.reason}</div>
                  <div className="mt-2 flex items-center gap-1 text-xs opacity-90">
                    <Icon name="book" size={14} /> {rec.dialogue.length + rec.patterns.length * 4} frases · {rec.vocab.length} palavras
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {pack.focusWords.map((w) => (
                      <span key={w} className="target rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
                <Books className="absolute -right-2 bottom-4 w-28" />
                <span className="absolute right-4 top-4 text-3xl">{rec.emoji}</span>
              </Link>
            </>
          )}

          <Link href="/marcos" className="card mt-4 flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-lilac-soft)] text-2xl">🎓</div>
            <div className="flex-1">
              <div className="font-extrabold">Marcos e Certificados</div>
              <div className="text-sm text-[var(--color-muted)]">Competências reais (A1–B1), exames de etapa e certificados</div>
            </div>
            <Icon name="chevron-right" className="text-[var(--color-muted)]" />
          </Link>

          {lang === "ja" && (
            <>
              <Link href="/kana" className="card mt-3 flex items-center gap-4 p-5">
                <div className="jp grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-teal-soft)] text-2xl font-bold">ア</div>
                <div className="flex-1">
                  <div className="font-extrabold">Módulo de escrita: kana</div>
                  <div className="text-sm text-[var(--color-muted)]">Hiragana e katakana — reconhecer e traçar</div>
                </div>
                <Icon name="chevron-right" className="text-[var(--color-muted)]" />
              </Link>
              <Link href="/kanji" className="card mt-3 flex items-center gap-4 p-5">
                <div className="jp grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-yellow-soft)] text-2xl font-bold">字</div>
                <div className="flex-1">
                  <div className="font-extrabold">Kanji por frequência</div>
                  <div className="text-sm text-[var(--color-muted)]">Leituras, palavras, reconhecer e traçar</div>
                </div>
                <Icon name="chevron-right" className="text-[var(--color-muted)]" />
              </Link>
              <Link href="/particulas" className="card mt-3 flex items-center gap-4 p-5">
                <div className="jp grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-coral-soft)] text-2xl font-bold text-[var(--color-coral)]">は</div>
                <div className="flex-1">
                  <div className="font-extrabold">Prática de partículas</div>
                  <div className="text-sm text-[var(--color-muted)]">は が を に で と — com frases das tuas unidades</div>
                </div>
                <Icon name="chevron-right" className="text-[var(--color-muted)]" />
              </Link>
              <Link href="/cortesia" className="card mt-3 flex items-center gap-4 p-5">
                <div className="jp grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-lilac-soft)] text-2xl font-bold text-[var(--color-lilac)]">敬</div>
                <div className="flex-1">
                  <div className="font-extrabold">Contadores e Cortesia (敬語)</div>
                  <div className="text-sm text-[var(--color-muted)]">つ・人・本・枚・杯 e níveis informal, です/ます e Keigo</div>
                </div>
                <Icon name="chevron-right" className="text-[var(--color-muted)]" />
              </Link>
            </>
          )}
        </>
      )}

      {filtering && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {query && <span className="chip">“{query}”</span>}
          {category && <span className="chip">{category}</span>}
          {status !== "todas" && <span className="chip">{status === "concluidas" ? "Concluídas" : "Por fazer"}</span>}
          <button
            className="text-sm font-bold text-[var(--color-coral)]"
            onClick={() => {
              setQuery("");
              setCategory(null);
              setStatus("todas");
            }}
          >
            Limpar
          </button>
        </div>
      )}

      {STAGES.map((st, si) => {
        const stageUnits = filtered.filter((u) => u.level >= st.from && u.level <= st.to);
        const hasContent = units.some((u) => u.level >= st.from && u.level <= st.to);
        if (filtering && !stageUnits.length) return null;
        return (
          <section key={st.name} className="mt-6">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-extrabold">
                {st.name} <span className="text-sm font-semibold text-[var(--color-muted)]">· níveis {st.from}–{st.to}</span>
              </h2>
            </div>
            {!hasContent ? (
              <div className="card flex items-center gap-3 p-4 text-[var(--color-muted)]">
                <Icon name="lock" size={20} />
                <span className="text-sm">
                  {st.goal}. <b>Em preparação</b> — chega {si === 1 ? "na próxima fase" : "em fases seguintes"}.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {stageUnits.map((u) => {
                  const unlocked = isUnitUnlocked(state, u.id);
                  const pct = unitProgressPct(state, u.id);
                  const done = unitDone(state, u.id);
                  const inner = (
                    <>
                      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl ${unlocked ? "bg-[var(--color-bg)]" : "bg-[var(--color-line)] grayscale"}`}>
                        {u.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[var(--color-muted)]">
                          Nível {u.level} · {u.category}
                        </div>
                        <div className="truncate font-extrabold">{u.title}</div>
                        <div className={`target truncate text-sm text-[var(--color-muted)] ${lang === "ja" ? "jp" : ""}`}>{u.titleTarget}</div>
                        {unlocked && <ProgressBar pct={pct} className="mt-2" color={done ? "var(--color-good)" : undefined} />}
                      </div>
                      {done ? (
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-good-soft)] text-[var(--color-good)]">
                          <Icon name="check" size={18} />
                        </span>
                      ) : !unlocked ? (
                        <Icon name="lock" size={20} className="text-[var(--color-muted)]" />
                      ) : (
                        <Icon name="chevron-right" className="text-[var(--color-muted)]" />
                      )}
                    </>
                  );
                  return unlocked ? (
                    <Link key={u.id} href={`/unidade/${u.id}`} className="card flex items-center gap-4 p-4">
                      {inner}
                    </Link>
                  ) : (
                    <div key={u.id} className="card flex items-center gap-4 p-4 opacity-70" title="Conclui a unidade anterior para desbloquear">
                      {inner}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
      {filtering && filtered.length === 0 && <p className="mt-6 text-center text-[var(--color-muted)]">Nenhuma unidade encontrada.</p>}

      <Sheet open={searchOpen} onClose={() => setSearchOpen(false)} title="Pesquisar">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearchOpen(false);
          }}
        >
          <input
            className="input"
            placeholder="Ex.: café, horas, comida, números…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            type="search"
          />
          <button className="btn btn-primary mt-3 w-full">Ver resultados ({filtered.length})</button>
        </form>
      </Sheet>

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filtros">
        <div className="text-sm font-bold text-[var(--color-muted)]">TEMA</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className={`chip ${!category ? "!bg-[var(--color-ink)] text-white" : ""}`} onClick={() => setCategory(null)}>
            Todos
          </button>
          {categories.map((c) => (
            <button key={c} className={`chip ${category === c ? "!bg-[var(--color-ink)] text-white" : ""}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="mt-5 text-sm font-bold text-[var(--color-muted)]">ESTADO</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ["todas", "Todas"],
              ["por-fazer", "Por fazer"],
              ["concluidas", "Concluídas"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} className={`chip ${status === v ? "!bg-[var(--color-ink)] text-white" : ""}`} onClick={() => setStatus(v)}>
              {l}
            </button>
          ))}
        </div>
        <div className="mt-5 text-sm text-[var(--color-muted)]">
          Idioma: {LANGS[lang].name} (muda no selector de idioma) · Duração: cada unidade tem 6 actividades de 2–3 min.
        </div>
        <button className="btn btn-primary mt-5 w-full" onClick={() => setFilterOpen(false)}>
          Aplicar ({filtered.length})
        </button>
      </Sheet>
    </>
  );
}

export default function CursosPage() {
  return (
    <AppFrame>
      <Cursos />
    </AppFrame>
  );
}

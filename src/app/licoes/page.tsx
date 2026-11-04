"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AppFrame, HeaderIconButton, LanguageSelector, ScreenHeader } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { Sheet } from "@/components/Sheet";
import { cacheForOffline } from "@/components/SWRegister";
import { ProgressBar, Toast, useSpeaker } from "@/components/ui";
import { CONTENT } from "@/content";
import { CATEGORY_COLORS, LANGS } from "@/lib/langs";
import { addActivity, isUnitUnlocked } from "@/lib/state";
import { useApp } from "@/lib/store";
import { plainText } from "@/lib/tokenize";
import type { Unit } from "@/lib/types";
import { neuralVoiceFor, ttsUrl, voiceForSpeaker } from "@/lib/voices";

type Kind = "audio" | "leitura" | "conversa";
interface Lesson {
  id: string;
  unit: Unit;
  kind: Kind;
  title: string;
  category: string;
  seconds: number;
  href: string;
}

const KIND_LABEL: Record<Kind, string> = { audio: "Áudio", leitura: "Leitura guiada", conversa: "Conversa" };

function fmt(sec: number) {
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
}

function buildLessons(units: Unit[]): Lesson[] {
  const out: Lesson[] = [];
  units.forEach((u) => {
    const chars = u.dialogue.reduce((a, l) => a + plainText(l.text, u.lang).length, 0);
    const audioSec = Math.round(chars / (u.lang === "ja" ? 6 : 13) + u.dialogue.length * 1.2);
    out.push({ id: `${u.id}:audio`, unit: u, kind: "audio", title: `Diálogo: ${u.title}`, category: u.category, seconds: audioSec, href: `/unidade/${u.id}/ouvir` });
    out.push({ id: `${u.id}:leitura`, unit: u, kind: "leitura", title: `Ler: ${u.titleTarget}`, category: u.category, seconds: 150, href: `/leitura/${u.id}` });
    out.push({ id: `${u.id}:conversa`, unit: u, kind: "conversa", title: `Conversa: ${u.title}`, category: u.category, seconds: 180, href: `/unidade/${u.id}/conversa` });
  });
  return out;
}

function Licoes() {
  const { state, update } = useApp();
  const { sayMany, stop } = useSpeaker();
  const router = useRouter();
  const lang = state.activeLang;
  const [tab, setTab] = useState<"todas" | "descarregadas">("todas");
  const [kindFilter, setKindFilter] = useState<Kind | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const cancel = useRef<() => void>(() => {});

  const units = CONTENT[lang].units.filter((u) => isUnitUnlocked(state, u.id));
  const all = buildLessons(units);
  const lp = state.progress[lang];
  const downloads = new Set(lp.downloads);
  const progressOf = (l: Lesson) => {
    if (l.kind === "conversa") return lp.units[l.unit.id]?.steps.conversa ? 1 : lp.lessons[l.id] ?? 0;
    if (l.kind === "audio") return Math.max(lp.lessons[l.id] ?? 0, lp.units[l.unit.id]?.steps.ouvir ? 1 : 0);
    return lp.lessons[l.id] ?? 0;
  };
  const q = query.trim().toLowerCase();
  const list = all
    .filter((l) => tab === "todas" || downloads.has(l.id))
    .filter((l) => !kindFilter || l.kind === kindFilter)
    .filter((l) => !q || `${l.title} ${l.category}`.toLowerCase().includes(q));

  const play = (l: Lesson) => {
    if (playing === l.id) {
      cancel.current();
      stop();
      setPlaying(null);
      return;
    }
    cancel.current();
    setPlaying(l.id);
    const lines = l.unit.dialogue.map((d) => d.text);
    cancel.current = sayMany(
      lines,
      lang,
      (i) => update((s) => ({ ...s, progress: { ...s.progress, [lang]: { ...s.progress[lang], lessons: { ...s.progress[lang].lessons, [l.id]: Math.max(s.progress[lang].lessons[l.id] ?? 0, i / lines.length) } } } })),
      () => {
        setPlaying(null);
        update((s) => {
          const was = (s.progress[lang].lessons[l.id] ?? 0) >= 1;
          const n = { ...s, progress: { ...s.progress, [lang]: { ...s.progress[lang], lessons: { ...s.progress[lang].lessons, [l.id]: 1 } } } };
          return was ? n : addActivity(n, lang, "lesson-audio", 5);
        });
      },
      l.unit.dialogue.map((d) => d.speaker),
    );
  };

  /** URLs do áudio neural do diálogo (para guardar offline com a lição). */
  const lessonAudioUrls = (u: Unit): string[] => {
    if ((state.settings.voiceEngine ?? "neural") !== "neural") return [];
    const nv = neuralVoiceFor(u.lang, state.settings.neuralVoices?.[u.lang]);
    return u.dialogue.map((d) =>
      ttsUrl(plainText(d.text, u.lang), u.lang, voiceForSpeaker(u.lang, d.speaker, LANGS[u.lang].tutor.name, nv), state.settings.audioRate),
    );
  };

  const toggleDownload = async (l: Lesson) => {
    const has = downloads.has(l.id);
    update((s) => ({
      ...s,
      progress: {
        ...s.progress,
        [lang]: { ...s.progress[lang], downloads: has ? s.progress[lang].downloads.filter((d) => d !== l.id) : [...s.progress[lang].downloads, l.id] },
      },
    }));
    const ok = await cacheForOffline([l.href, ...(l.kind === "conversa" ? [] : lessonAudioUrls(l.unit))], has);
    setToast(has ? "Removida das descarregadas" : ok ? "Descarregada para usar offline ✓" : "Marcada como descarregada (offline disponível na app instalada)");
  };

  const downloadStageBatch = async () => {
    const batch = all.slice(0, 9);
    const ids = batch.map((l) => l.id);
    update((s) => ({
      ...s,
      progress: {
        ...s.progress,
        [lang]: { ...s.progress[lang], downloads: Array.from(new Set([...s.progress[lang].downloads, ...ids])) },
      },
    }));
    const urls = batch.flatMap((l) => [l.href, ...(l.kind === "conversa" || state.settings.dataSaver ? [] : lessonAudioUrls(l.unit))]);
    await cacheForOffline(urls, false);
    setToast(`${batch.length} lições guardadas para uso offline ✓`);
  };

  return (
    <>
      <ScreenHeader
        title="Lições"
        actions={
          <>
            <HeaderIconButton icon="search" label="Pesquisar" onClick={() => setSearchOpen(true)} />
            <HeaderIconButton icon="filter" label="Filtros" onClick={() => setFilterOpen(true)} badge={!!kindFilter} />
          </>
        }
      />
      <LanguageSelector />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-6 text-[15px]" role="tablist">
          {(["todas", "descarregadas"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 ${tab === t ? "font-extrabold" : "text-[var(--color-muted)]"}`}
            >
              {tab === t && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink)]" />}
              {t === "todas" ? "Todas" : `Descarregadas${downloads.size ? ` (${downloads.size})` : ""}`}
            </button>
          ))}
        </div>
        <button
          type="button"
          data-testid="download-stage-btn"
          className="chip text-xs"
          onClick={downloadStageBatch}
        >
          <Icon name="download" size={14} /> Guardar etapa
        </button>
      </div>
      {(q || kindFilter) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {q && <span className="chip">“{query}”</span>}
          {kindFilter && <span className="chip">{KIND_LABEL[kindFilter]}</span>}
          <button
            className="text-sm font-bold text-[var(--color-coral)]"
            onClick={() => {
              setQuery("");
              setKindFilter(null);
            }}
          >
            Limpar
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="card p-8 text-center text-[var(--color-muted)]">
          {tab === "descarregadas" ? "Ainda não descarregaste lições. Toca em ⬇ numa lição para a guardar." : "Nenhuma lição encontrada."}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((l, i) => {
            const color = CATEGORY_COLORS[(l.unit.level + (l.kind === "leitura" ? 1 : l.kind === "conversa" ? 2 : 0)) % 4];
            const pct = progressOf(l) * 100;
            const isPlaying = playing === l.id;
            return (
              <li key={l.id} className="card flex items-center gap-4 p-3 pr-4" style={{ animationDelay: `${i * 20}ms` }}>
                <button
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl"
                  style={{ background: color }}
                  aria-label={l.kind === "audio" ? (isPlaying ? "Parar" : "Reproduzir") : "Abrir"}
                  onClick={() => (l.kind === "audio" ? play(l) : router.push(l.href))}
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-full bg-white ${isPlaying ? "pulse-ring" : ""}`}>
                    <Icon name={l.kind === "audio" ? (isPlaying ? "pause" : "play") : l.kind === "conversa" ? "chat" : "book"} size={16} filled={l.kind === "audio" && !isPlaying} />
                  </span>
                </button>
                <Link href={l.href} className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                    <span>
                      {KIND_LABEL[l.kind]} · {l.category}
                    </span>
                    <span>{fmt(l.seconds)}</span>
                  </div>
                  <div className={`truncate font-extrabold ${lang === "ja" && l.kind === "leitura" ? "jp" : ""}`}>{l.title}</div>
                  <ProgressBar pct={pct} className="mt-2" color={color} />
                </Link>
                <button
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${downloads.has(l.id) ? "bg-[var(--color-good-soft)] text-[var(--color-good)]" : "bg-[var(--color-bg)] text-[var(--color-muted)]"}`}
                  aria-label={downloads.has(l.id) ? "Remover das descarregadas" : "Descarregar"}
                  onClick={() => toggleDownload(l)}
                >
                  <Icon name={downloads.has(l.id) ? "check" : "download"} size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-center text-xs text-[var(--color-muted)]">Conclui unidades para desbloquear mais lições.</p>

      <Sheet open={searchOpen} onClose={() => setSearchOpen(false)} title="Pesquisar lições">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearchOpen(false);
          }}
        >
          <input className="input" type="search" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex.: café, horas…" />
          <button className="btn btn-primary mt-3 w-full">Ver resultados</button>
        </form>
      </Sheet>
      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Tipo de lição">
        <div className="flex flex-wrap gap-2">
          <button className={`chip ${!kindFilter ? "!bg-[var(--color-ink)] text-white" : ""}`} onClick={() => setKindFilter(null)}>
            Todas
          </button>
          {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
            <button key={k} className={`chip ${kindFilter === k ? "!bg-[var(--color-ink)] text-white" : ""}`} onClick={() => setKindFilter(k)}>
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <button className="btn btn-primary mt-5 w-full" onClick={() => setFilterOpen(false)}>
          Aplicar
        </button>
      </Sheet>
      <Toast text={toast} onDone={() => setToast(null)} />
    </>
  );
}

export default function LicoesPage() {
  return (
    <AppFrame>
      <Licoes />
    </AppFrame>
  );
}

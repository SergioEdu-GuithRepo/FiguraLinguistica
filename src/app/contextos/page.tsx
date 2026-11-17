"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { Suspense, useMemo, useRef, useState } from "react";
import { ContextualVocabDrill } from "@/components/ContextualVocabDrill";
import { Icon } from "@/components/Icon";
import { DialogueReader, TokenLine, WordSheet } from "@/components/Reader";
import { AppFrame, LanguageSelector } from "@/components/Shell";
import { CelebrationBurst, CopyTextButton, Empty, SpeakButton, Toast, TopBar, useSpeaker } from "@/components/ui";
import { CONTENT, getUnit } from "@/content";
import {
  CONTEXT_PACKS,
  contextPackProgress,
  getPackDialogue,
  globalContextStats,
  REGISTER_LABEL,
  recommendedContextPack,
  searchContexts,
  type ContextPack,
  type RegisterLevel,
} from "@/lib/contexts";
import { useImeSafeEnter } from "@/lib/ime";
import { LANGS } from "@/lib/langs";
import { sfxError, sfxSuccess } from "@/lib/sfx";
import { addActivity, isUnitUnlocked, saveWordsBatch } from "@/lib/state";
import { useApp } from "@/lib/store";
import type { RToken } from "@/lib/tokenize";

type PackTab = "kit" | "situacoes" | "treino";
const PACK_TABS: readonly [PackTab, string][] = [
  ["kit", "🧰 Kit de Bolso"],
  ["situacoes", "🎭 Situações"],
  ["treino", "🧩 Vocabulário"],
];

function SituationQuiz({ pack, onBackToKit }: { pack: ContextPack; onBackToKit: () => void }) {
  const { state, update } = useApp();
  const { say } = useSpeaker();
  const lang = state.activeLang;
  const speechLang = LANGS[lang].speechLang;
  const sfxOn = state.settings.soundEffects !== false;
  const situations = pack.byLang[lang].situations;

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const reset = () => {
    setIdx(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    return (
      <div className="card fade-in p-6 text-center" data-testid="context-situations-done">
        <div className="trophy-pop text-4xl">{pack.emoji}</div>
        <CelebrationBurst xp={20} label="Contexto dominado" />
        <h3 className="mt-2 text-xl font-extrabold">Situações concluídas!</h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Escolheste a resposta e o registo certos em {score} de {situations.length} cenários reais · +20 XP
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn btn-primary flex-1" onClick={reset}>
            <Icon name="refresh" size={18} /> Repetir cenários
          </button>
          <button type="button" className="btn btn-ghost flex-1" onClick={onBackToKit}>
            Voltar ao Kit de Bolso
          </button>
        </div>
      </div>
    );
  }

  const sit = situations[idx];
  const reg = REGISTER_LABEL[sit.register];
  const answered = picked !== null;

  const choose = (opt: string) => {
    if (answered) return;
    setPicked(opt);
    const ok = opt === sit.correct;
    if (ok) {
      setScore((s) => s + 1);
      sfxSuccess(sfxOn);
    } else {
      sfxError(sfxOn);
    }
    if (state.settings.tutorVoice) {
      say(sit.correct, lang);
    }
  };

  const next = () => {
    setPicked(null);
    if (idx + 1 >= situations.length) {
      update((s) => addActivity(s, lang, `context-sit:${pack.id}`, 20));
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  return (
    <div className="card p-5" data-testid="context-situations-quiz">
      <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--color-muted)]">
        <span>🎭 Como reagirias nesta situação?</span>
        <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1">
          {idx + 1}/{situations.length}
        </span>
      </div>

      <div className="mt-3 rounded-2xl bg-[var(--color-bg)] p-4">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${reg.badgeCls}`}>
          Registo esperado: {reg.label}
        </span>
        <p className="mt-2 text-[15px] font-bold leading-snug">{sit.situationPt}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {sit.options.map((opt) => {
          const isCorrect = opt === sit.correct;
          const isPicked = opt === picked;
          let cls = "border-[var(--color-line)] bg-white hover:border-[var(--color-ink)]/40";
          if (answered) {
            if (isCorrect) cls = "border-[var(--color-good)] bg-[var(--color-good-soft)]";
            else if (isPicked) cls = "border-[var(--color-coral)] bg-[var(--color-coral-soft)] text-[var(--color-coral)]";
            else cls = "border-[var(--color-line)] bg-white opacity-60";
          }
          return (
            <button
              key={opt}
              type="button"
              disabled={answered}
              onClick={() => choose(opt)}
              className={`flex min-h-[50px] items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left font-bold transition active:scale-[0.99] ${cls}`}
            >
              <span lang={speechLang} className={`target ${lang === "ja" ? "jp" : ""}`}>
                {opt}
              </span>
              {answered && isCorrect && <Icon name="check" size={18} className="shrink-0 text-[var(--color-good)]" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="fade-in mt-4 space-y-3">
          <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-teal-soft)]/60 p-3.5 text-sm">
            <SpeakButton text={sit.correct} lang={lang} size={38} className="!bg-white" label="Ouvir resposta natural" />
            <p className="flex-1 text-xs leading-relaxed text-[var(--color-ink)]">
              <strong className="font-extrabold">Nota de contexto:</strong> {sit.explanationPt}
            </p>
          </div>
          <button type="button" className="btn btn-primary w-full" onClick={next}>
            {idx + 1 >= situations.length ? "Concluir cenários" : "Seguinte"}
          </button>
        </div>
      )}
    </div>
  );
}

function ContextosInner() {
  const { state, update } = useApp();
  const { sayMany, stop } = useSpeaker();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = state.activeLang;
  const meta = LANGS[lang];
  const speechLang = meta.speechLang;
  const dict = CONTENT[lang].dictionary;

  const initialPackId = searchParams.get("pack");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialPackId && CONTEXT_PACKS.some((p) => p.id === initialPackId) ? initialPackId : null,
  );
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [regFilter, setRegFilter] = useState<RegisterLevel | "all">("all");
  const [tab, setTab] = useState<PackTab>("kit");
  const [selfTest, setSelfTest] = useState(false);
  const [revealedPhrases, setRevealedPhrases] = useState<Record<number, boolean>>({});
  const [dlgPlaying, setDlgPlaying] = useState(false);
  const [activeDlgIdx, setActiveDlgIdx] = useState<number | undefined>(undefined);
  const dlgCancelRef = useRef<() => void>(() => {});
  const [globalDrillOpen, setGlobalDrillOpen] = useState(false);
  const [tok, setTok] = useState<RToken | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const tabRefs = useRef<Partial<Record<PackTab, HTMLButtonElement | null>>>({});

  const stopDialogueAudio = () => {
    dlgCancelRef.current();
    stop();
    setDlgPlaying(false);
    setActiveDlgIdx(undefined);
  };

  const imeSearch = useImeSafeEnter(() => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  const tags = useMemo(() => Array.from(new Set(CONTEXT_PACKS.map((p) => p.tag))), []);
  const { packs: visiblePacks, matchingPhrases } = useMemo(
    () => searchContexts(lang, query, tagFilter),
    [lang, query, tagFilter],
  );
  const recContext = useMemo(
    () => recommendedContextPack(lang, state.settings.interests, state.srs[lang], state.xpEvents),
    [lang, state.settings.interests, state.srs, state.xpEvents],
  );
  const ctxStats = useMemo(
    () => globalContextStats(lang, state.srs[lang], state.xpEvents),
    [lang, state.srs, state.xpEvents],
  );

  const activePack = useMemo(() => CONTEXT_PACKS.find((p) => p.id === selectedId) ?? null, [selectedId]);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const order = PACK_TABS.map(([id]) => id);
    const cur = order.indexOf(tab);
    let nextIdx = -1;
    if (event.key === "ArrowRight") nextIdx = (cur + 1) % order.length;
    else if (event.key === "ArrowLeft") nextIdx = (cur - 1 + order.length) % order.length;
    else if (event.key === "Home") nextIdx = 0;
    else if (event.key === "End") nextIdx = order.length - 1;
    if (nextIdx >= 0) {
      event.preventDefault();
      const nextId = order[nextIdx];
      stopDialogueAudio();
      setTab(nextId);
      tabRefs.current[nextId]?.focus();
    }
  };

  if (activePack) {
    const data = activePack.byLang[lang];
    const prog = contextPackProgress(activePack, lang, state.srs[lang], state.xpEvents);
    const allSaved = prog.savedCount >= prog.totalCount;
    const dialogue = getPackDialogue(activePack, lang);
    const filteredPhrases =
      regFilter === "all" ? data.phrases : data.phrases.filter((p) => p.register === regFilter);

    const handleSavePack = () => {
      const missing = prog.totalCount - prog.savedCount;
      update((s) => saveWordsBatch(s, lang, data.vocabKeys, 2));
      setToast(
        missing > 0
          ? `✓ ${missing} ${missing === 1 ? "nova palavra guardada" : "novas palavras guardadas"} na revisão!`
          : "Todas as palavras deste pacote já estão na tua revisão.",
      );
    };

    return (
      <>
        <TopBar
          back={() => {
            stopDialogueAudio();
            setSelectedId(null);
            setTab("kit");
            setRegFilter("all");
            setSelfTest(false);
            setRevealedPhrases({});
          }}
          title={`${activePack.emoji} ${activePack.title}`}
        />
        <LanguageSelector />

        <div className="card mb-4 p-4" style={{ borderLeft: `5px solid ${activePack.color}` }}>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold"
              style={{ background: activePack.softColor }}
            >
              {activePack.tag} · Desbloqueado desde o nível 1
            </span>
            {prog.mastered && (
              <span className="rounded-full bg-[var(--color-good-soft)] px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--color-good)]">
                ✓ Contexto dominado
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">{activePack.subtitle}</p>
        </div>

        {/* Sub-modos do contexto */}
        <div
          role="tablist"
          aria-label="Modos do pacote de contexto"
          onKeyDown={handleTabKeyDown}
          className="mb-4 grid grid-cols-3 gap-2"
        >
          {PACK_TABS.map(([id, label]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                ref={(el) => {
                  tabRefs.current[id] = el;
                }}
                id={`ctx-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => {
                  stopDialogueAudio();
                  setTab(id);
                }}
                className="fl-tab min-h-[44px] rounded-2xl px-2.5 py-2 text-xs font-extrabold transition"
              >
                {label}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" aria-labelledby="ctx-tab-kit" hidden={tab !== "kit"}>
          {tab === "kit" && (
            <div className="space-y-5">
              {/* Dica cultural / falsos amigos */}
              <section className="rounded-3xl bg-[var(--color-yellow-soft)]/80 p-4" aria-label="Nota cultural e armadilhas">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#7a5c0d]">
                  💡 Dica prática & atenção aos falsos amigos
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink)]">{data.culturalTip}</p>
              </section>

              {/* Frases prontas a usar */}
              <section aria-labelledby="pocket-phrases-heading">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 id="pocket-phrases-heading" className="font-extrabold">
                      Frases prontas a usar
                    </h2>
                    <span className="text-xs text-[var(--color-muted)]">Toca numa palavra · Ouvir, 0.6× e copiar</span>
                  </div>
                  <button
                    type="button"
                    aria-pressed={selfTest}
                    onClick={() => {
                      setSelfTest((v) => !v);
                      setRevealedPhrases({});
                    }}
                    className={`chip min-h-[36px] !px-3 !py-1 text-xs ${
                      selfTest ? "!bg-[var(--color-coral)] text-white" : ""
                    }`}
                  >
                    <Icon name={selfTest ? "eye" : "eye-off"} size={14} />
                    {selfTest ? "Mostrar todas" : "Auto-teste"}
                  </button>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar frases por registo social">
                  {(
                    [
                      ["all", `Todos (${data.phrases.length})`],
                      ["formal", "Formal / Cortês"],
                      ["neutro", "Neutro"],
                      ["informal", "Informal"],
                    ] as const
                  ).map(([r, label]) => (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={regFilter === r}
                      onClick={() => setRegFilter(r)}
                      className={`chip min-h-[34px] !px-3 !py-1 text-xs ${
                        regFilter === r ? "!bg-[var(--color-ink)] text-white" : ""
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {filteredPhrases.length === 0 ? (
                  <p className="rounded-2xl bg-[var(--color-bg)] p-4 text-xs text-[var(--color-muted)]">
                    Este cenário não tem frases neste registo específico — experimenta «Todos».
                  </p>
                ) : (
                  <ul role="list" className={`flex flex-col gap-3 lang-${lang}`}>
                    {filteredPhrases.map((p, idx) => {
                      const reg = REGISTER_LABEL[p.register];
                      const hiddenByTest = selfTest && !revealedPhrases[idx];
                      return (
                        <li key={idx} className="card p-4">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${reg.badgeCls}`}>
                              {reg.label}
                            </span>
                            <span className="text-xs text-[var(--color-muted)]">{p.whenToUse}</span>
                          </div>
                          {hiddenByTest ? (
                            <div className="space-y-2.5">
                              <p className="text-base font-extrabold text-[var(--color-ink)]">«{p.pt}»</p>
                              <button
                                type="button"
                                onClick={() => setRevealedPhrases((prev) => ({ ...prev, [idx]: true }))}
                                className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-lilac)]/60 bg-[var(--color-lilac-soft)]/35 px-3.5 py-2 text-xs font-extrabold text-[var(--color-ink)] transition hover:bg-[var(--color-lilac-soft)]/70"
                              >
                                <Icon name="eye" size={16} /> Tenta dizer primeiro — toca para revelar em {meta.name.toLowerCase()}
                              </button>
                            </div>
                          ) : (
                            <>
                              <div lang={speechLang} className={`text-base font-extrabold leading-snug ${lang === "ja" ? "jp" : ""}`}>
                                <TokenLine text={p.text} lang={lang} onWord={setTok} />
                              </div>
                              {lang === "ja" && state.settings.romaji && p.romaji && (
                                <p className="mt-0.5 text-xs font-medium text-[var(--color-muted)]">{p.romaji}</p>
                              )}
                              <p className="mt-1 text-sm text-[var(--color-muted)]">{p.pt}</p>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <SpeakButton text={p.text} lang={lang} size={38} label={`Ouvir: ${p.pt}`} />
                                <SpeakButton
                                  text={p.text}
                                  lang={lang}
                                  size={38}
                                  slow
                                  label={`Ouvir devagar: ${p.pt}`}
                                  className="!bg-[var(--color-teal-soft)]/70"
                                />
                                <CopyTextButton
                                  text={p.text}
                                  lang={lang}
                                  size={38}
                                  label={`Copiar frase: ${p.pt}`}
                                />
                                <span className="text-xs text-[var(--color-muted)]">Ouvir · Devagar 🐢 · Copiar</span>
                              </div>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Mini-diálogo interactivo na vida real */}
              {dialogue.length > 0 && (
                <section aria-labelledby="pack-dialogue-heading">
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 id="pack-dialogue-heading" className="font-extrabold">
                        💬 Mini-diálogo na vida real
                      </h2>
                      <span className="text-xs text-[var(--color-muted)]">Duas vozes neurais, tradução e palavras clicáveis</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (dlgPlaying) {
                          stopDialogueAudio();
                          return;
                        }
                        setDlgPlaying(true);
                        dlgCancelRef.current = sayMany(
                          dialogue.map((l) => l.text),
                          lang,
                          (i) => setActiveDlgIdx(i),
                          () => {
                            setDlgPlaying(false);
                            setActiveDlgIdx(undefined);
                          },
                          dialogue.map((l) => l.speaker),
                        );
                      }}
                      className={`chip min-h-[38px] !px-3.5 !py-1.5 text-xs font-extrabold ${
                        dlgPlaying ? "!bg-[var(--color-ink)] text-white" : "!bg-[var(--color-teal-soft)] text-[#24665f]"
                      }`}
                    >
                      <Icon name={dlgPlaying ? "stop" : "play"} size={15} />
                      {dlgPlaying ? "Parar diálogo" : "Ouvir diálogo todo"}
                    </button>
                  </div>
                  <DialogueReader lines={dialogue} lang={lang} activeIndex={activeDlgIdx} />
                </section>
              )}

              {/* Vocabulário essencial do cenário */}
              <section aria-labelledby="pack-vocab-heading">
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 id="pack-vocab-heading" className="font-extrabold">
                      Vocabulário essencial ({data.vocabKeys.length})
                    </h2>
                    <p className="text-xs text-[var(--color-muted)]">
                      {prog.savedCount} de {prog.totalCount} na tua revisão espaçada
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSavePack}
                    disabled={allSaved}
                    className={`min-h-[42px] rounded-full px-4 py-2 text-xs font-extrabold transition active:scale-95 ${
                      allSaved
                        ? "bg-[var(--color-good-soft)] text-[var(--color-good)]"
                        : "bg-[var(--color-coral)] text-white shadow-[var(--shadow-card)]"
                    }`}
                  >
                    {allSaved ? "✓ Pacote guardado" : "+ Guardar pacote na revisão"}
                  </button>
                </div>

                <ul role="list" className="grid grid-cols-1 gap-2">
                  {data.vocabKeys.map((rawKey) => {
                    const k = rawKey.toLowerCase();
                    const entry = dict[k];
                    if (!entry) return null;
                    const saved = !!state.srs[lang][`w:${k}`];
                    return (
                      <li key={k} className="card flex items-center gap-2 p-2.5">
                        <SpeakButton text={k} lang={lang} size={38} label={`Ouvir ${k}`} />
                        <button
                          type="button"
                          onClick={() => setTok({ text: k, key: k, entry, isPunct: false, spaceAfter: false })}
                          className="flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-2 rounded-xl px-2 py-1 text-left transition hover:bg-[var(--color-bg)]"
                        >
                          <span className="min-w-0 flex-1">
                            <span lang={speechLang} className={`target block truncate font-extrabold ${lang === "ja" ? "jp" : ""}`}>
                              {k}
                              {lang === "fr" && entry.gender && (
                                <span className="ml-1.5 text-xs font-normal text-[var(--color-muted)]">({entry.gender}.)</span>
                              )}
                            </span>
                            <span className="block truncate text-xs text-[var(--color-muted)]">
                              {lang === "ja" && entry.reading ? `${entry.reading} · ` : ""}
                              {entry.pt}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            {entry.note && (
                              <span className="rounded-full bg-[var(--color-yellow-soft)] px-2 py-0.5 text-[10px] font-bold text-[#7a5c0d]">
                                💡 nota
                              </span>
                            )}
                            {saved && <Icon name="bookmark" size={16} filled className="text-[var(--color-coral)]" />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* Ligação directa à conversa com o tutor neste cenário exacto + unidades relacionadas */}
              <section className="space-y-2.5 pt-1" aria-label="Continuar a praticar este contexto">
                <div className="rounded-[24px] bg-[var(--color-teal)] p-4 text-white shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/25 text-2xl">
                      {meta.tutor.avatar}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold">Simular «{activePack.title}» com {meta.tutor.name}</div>
                      <div className="text-xs opacity-95">Roleplay interactivo com as frases e vocabulário deste contexto</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/conversa?context=${activePack.id}&mode=guiado`}
                      className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white px-3.5 py-2 text-xs font-extrabold text-[var(--color-ink)] transition active:scale-95"
                    >
                      🎯 Guiado (com ajuda)
                    </Link>
                    <Link
                      href={`/conversa?context=${activePack.id}&mode=livre`}
                      className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white/20 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-white/30 active:scale-95"
                    >
                      💬 Conversa Livre
                    </Link>
                  </div>
                </div>

                <div className="card p-4">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
                    Unidades do currículo ligadas a este tema
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {activePack.relatedLevels.map((lvl) => {
                      const uid = `${lang}-${lvl}`;
                      const u = getUnit(uid);
                      if (!u) return null;
                      const unlocked = isUnitUnlocked(state, uid);
                      return unlocked ? (
                        <Link
                          key={uid}
                          href={`/unidade/${uid}`}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs font-bold hover:bg-[var(--color-lilac-soft)]"
                        >
                          <span>{u.emoji}</span>
                          <span>Nível {u.level} · {u.title}</span>
                        </Link>
                      ) : (
                        <span
                          key={uid}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-muted)] opacity-75"
                        >
                          <Icon name="lock" size={13} />
                          <span>Nível {u.level} · {u.title}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        <div role="tabpanel" aria-labelledby="ctx-tab-situacoes" hidden={tab !== "situacoes"}>
          {tab === "situacoes" && (
            <SituationQuiz key={`${lang}-${activePack.id}`} pack={activePack} onBackToKit={() => setTab("kit")} />
          )}
        </div>

        <div role="tabpanel" aria-labelledby="ctx-tab-treino" hidden={tab !== "treino"}>
          {tab === "treino" && (
            <ContextualVocabDrill
              lang={lang}
              packId={activePack.id}
              title={`Frases do contexto: ${activePack.title}`}
              onDone={() => setTab("kit")}
            />
          )}
        </div>

        <WordSheet tok={tok} lang={lang} onClose={() => setTok(null)} />
        <Toast text={toast} onDone={() => setToast(null)} />
      </>
    );
  }

  return (
    <>
      <TopBar back={() => router.push("/cursos")} title="Contextos & Kit de Bolso" />
      <LanguageSelector />

      <p className="mb-4 text-sm text-[var(--color-muted)]">
        {CONTEXT_PACKS.length} cenários reais prontos a usar desde o 1.º dia — frases clicáveis por registo social, mini-diálogos, roleplay com tutor e vocabulário prático em {meta.name.toLowerCase()}.
      </p>

      {/* Resumo global dos contextos + treino transversal */}
      {!query.trim() && !tagFilter && (
        <div className="card mb-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
                O teu domínio de contextos
              </div>
              <div className="mt-0.5 text-sm font-extrabold">
                {ctxStats.masteredPacks}/{ctxStats.totalPacks} cenários dominados · {ctxStats.savedContextWords}/{ctxStats.totalContextWords} palavras na revisão
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGlobalDrillOpen((v) => !v)}
              className="btn btn-primary !px-3.5 !py-2 text-xs"
            >
              <Icon name="bolt" size={15} />
              {globalDrillOpen ? "Fechar treino" : "Treinar vocabulário"}
            </button>
          </div>
          {globalDrillOpen && (
            <div className="mt-4">
              <ContextualVocabDrill
                lang={lang}
                count={8}
                title={`Vocabulário dos ${CONTEXT_PACKS.length} Contextos Reais`}
                onDone={() => setGlobalDrillOpen(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* Sugestão inteligente de contexto */}
      {!query.trim() && !tagFilter && (
        <button
          type="button"
          onClick={() => {
            setSelectedId(recContext.pack.id);
            setTab("kit");
          }}
          className="mb-4 flex w-full items-center gap-3.5 rounded-[24px] bg-[var(--color-lilac)] p-4 text-left text-white shadow-[var(--shadow-card)] transition active:scale-[0.99]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/25 text-2xl">
            {recContext.pack.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
              ✨ Recomendado para ti
            </span>
            <span className="mt-0.5 block truncate font-extrabold">{recContext.pack.title}</span>
            <span className="block truncate text-xs opacity-95">{recContext.reason}</span>
          </span>
          <Icon name="chevron-right" size={20} className="shrink-0" />
        </button>
      )}

      {/* Pesquisa instantânea de situações e frases prontas + filtro por etiqueta */}
      <search className="mb-4 space-y-3">
        <div>
          <label htmlFor="contextos-search" className="mb-1.5 block text-xs font-extrabold text-[var(--color-muted)]">
            Pesquisar situação, frase pronta ou palavra
          </label>
          <div className="relative flex items-center">
            <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 text-[var(--color-muted)]" />
            <input
              id="contextos-search"
              name="q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onCompositionStart={imeSearch.onCompositionStart}
              onCompositionEnd={imeSearch.onCompositionEnd}
              onKeyDown={imeSearch.onKeyDown}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="search"
              placeholder={
                lang === "ja"
                  ? "Ex.: alergia, restaurante, 駅, bilhete, entrevista…"
                  : lang === "fr"
                    ? "Ex.: caução, médico, gare, entrevista, conta…"
                    : "Ex.: alergia, caução, entrevista, reembolso, comboio…"
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
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar contextos por tema">
          <button
            type="button"
            aria-pressed={tagFilter === null}
            className={`chip min-h-[38px] ${tagFilter === null ? "!bg-[var(--color-ink)] text-white" : ""}`}
            onClick={() => setTagFilter(null)}
          >
            Todos ({CONTEXT_PACKS.length})
          </button>
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tagFilter === t}
              className={`chip min-h-[38px] ${tagFilter === t ? "!bg-[var(--color-ink)] text-white" : ""}`}
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </search>

      <p aria-live="polite" className="sr-only">
        {visiblePacks.length} pacotes de contexto e {matchingPhrases.length} frases prontas encontrados
      </p>

      {/* Resultados directos de frases de bolso quando há pesquisa */}
      {query.trim() && matchingPhrases.length > 0 && (
        <section className="mb-5 space-y-2.5" aria-labelledby="matched-phrases-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="matched-phrases-heading" className="text-sm font-extrabold">
              Frases prontas encontradas ({matchingPhrases.length})
            </h2>
            <span className="text-xs text-[var(--color-muted)]">Toca numa palavra para ver detalhes</span>
          </div>
          <ul role="list" className={`flex flex-col gap-2.5 lang-${lang}`}>
            {matchingPhrases.slice(0, 8).map((m, i) => {
              const reg = REGISTER_LABEL[m.phrase.register];
              return (
                <li key={`${m.pack.id}-${i}`} className="card p-3.5">
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${reg.badgeCls}`}>
                      {reg.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(m.pack.id);
                        setTab("kit");
                      }}
                      className="rounded-full bg-[var(--color-bg)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-ink)] hover:bg-[var(--color-lilac-soft)]"
                    >
                      {m.pack.emoji} {m.pack.title} →
                    </button>
                  </div>
                  <div lang={speechLang} className={`text-[15px] font-extrabold leading-snug ${lang === "ja" ? "jp" : ""}`}>
                    <TokenLine text={m.phrase.text} lang={lang} onWord={setTok} />
                  </div>
                  {lang === "ja" && state.settings.romaji && m.phrase.romaji && (
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">{m.phrase.romaji}</p>
                  )}
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{m.phrase.pt}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <SpeakButton text={m.phrase.text} lang={lang} size={34} label={`Ouvir: ${m.phrase.pt}`} />
                    <SpeakButton
                      text={m.phrase.text}
                      lang={lang}
                      size={34}
                      slow
                      label={`Ouvir devagar: ${m.phrase.pt}`}
                      className="!bg-[var(--color-teal-soft)]/70"
                    />
                    <CopyTextButton
                      text={m.phrase.text}
                      lang={lang}
                      size={34}
                      label={`Copiar frase: ${m.phrase.pt}`}
                    />
                    <span className="text-[11px] text-[var(--color-muted)]">{m.phrase.whenToUse}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {visiblePacks.length === 0 ? (
        <Empty
          icon="search"
          title="Nenhum cenário corresponde à pesquisa"
          text="Experimenta outra situação (ex.: restaurante, caução, entrevista, médico, comboio) ou limpa os filtros."
        />
      ) : (
        <ul role="list" className="flex flex-col gap-3">
          {visiblePacks.map((pack) => {
            const data = pack.byLang[lang];
            const prog = contextPackProgress(pack, lang, state.srs[lang], state.xpEvents);
            return (
              <li key={pack.id}>
                <button
                  type="button"
                  data-testid={`context-pack-${pack.id}`}
                  onClick={() => {
                    setSelectedId(pack.id);
                    setTab("kit");
                    setRegFilter("all");
                  }}
                  className="card flex w-full items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 active:scale-[0.99]"
                >
                  <span
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl"
                    style={{ background: pack.softColor }}
                  >
                    {pack.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[var(--color-muted)]">
                      <span>{pack.tag}</span>
                      <span>·</span>
                      <span>{data.phrases.length} frases</span>
                      <span>·</span>
                      <span>
                        {prog.savedCount}/{prog.totalCount} guardadas
                      </span>
                      {prog.mastered ? (
                        <span className="rounded-full bg-[var(--color-good-soft)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--color-good)]">
                          ✓ Dominado
                        </span>
                      ) : (
                        <>
                          {prog.situationsDone && (
                            <span className="rounded-full bg-[var(--color-teal-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-ink)]">
                              🎭 ✓
                            </span>
                          )}
                          {prog.vocabDone && (
                            <span className="rounded-full bg-[var(--color-lilac-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-ink)]">
                              🧩 ✓
                            </span>
                          )}
                          {prog.convDone && (
                            <span className="rounded-full bg-[var(--color-coral-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-coral)]">
                              💬 ✓
                            </span>
                          )}
                        </>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate font-extrabold">{pack.title}</span>
                    <span className="block truncate text-xs text-[var(--color-muted)]">{pack.subtitle}</span>
                  </span>
                  <Icon name="chevron-right" size={20} className="shrink-0 text-[var(--color-muted)]" />
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

export default function ContextosPage() {
  return (
    <AppFrame nav={false}>
      <Suspense fallback={null}>
        <ContextosInner />
      </Suspense>
    </AppFrame>
  );
}

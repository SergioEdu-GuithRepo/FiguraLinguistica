"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ContextualVocabDrill } from "@/components/ContextualVocabDrill";
import { Icon } from "@/components/Icon";
import { WordSheet } from "@/components/Reader";
import { AppFrame, LanguageSelector } from "@/components/Shell";
import { CelebrationBurst, SpeakButton, Toast, TopBar, useSpeaker } from "@/components/ui";
import { CONTENT, getUnit } from "@/content";
import { CONTEXT_PACKS, REGISTER_LABEL, type ContextPack } from "@/lib/contexts";
import { LANGS } from "@/lib/langs";
import { sfxError, sfxSuccess } from "@/lib/sfx";
import { addActivity, isUnitUnlocked, saveWordsBatch } from "@/lib/state";
import { useApp } from "@/lib/store";
import type { RToken } from "@/lib/tokenize";

type PackTab = "kit" | "situacoes" | "treino";

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
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [tab, setTab] = useState<PackTab>("kit");
  const [tok, setTok] = useState<RToken | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const tags = useMemo(() => Array.from(new Set(CONTEXT_PACKS.map((p) => p.tag))), []);
  const visiblePacks = useMemo(
    () => (tagFilter ? CONTEXT_PACKS.filter((p) => p.tag === tagFilter) : CONTEXT_PACKS),
    [tagFilter],
  );

  const activePack = useMemo(() => CONTEXT_PACKS.find((p) => p.id === selectedId) ?? null, [selectedId]);

  if (activePack) {
    const data = activePack.byLang[lang];
    const savedCount = data.vocabKeys.filter((k) => !!state.srs[lang][`w:${k.toLowerCase()}`]).length;
    const allSaved = savedCount >= data.vocabKeys.length;
    const primaryUnitId = `${lang}-${String(activePack.relatedLevels[0]).padStart(2, "0")}`;

    const handleSavePack = () => {
      const missing = data.vocabKeys.length - savedCount;
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
            setSelectedId(null);
            setTab("kit");
          }}
          title={`${activePack.emoji} ${activePack.title}`}
        />
        <LanguageSelector />

        <div className="card mb-4 p-4" style={{ borderLeft: `5px solid ${activePack.color}` }}>
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold"
            style={{ background: activePack.softColor }}
          >
            {activePack.tag} · Desbloqueado desde o nível 1
          </span>
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">{activePack.subtitle}</p>
        </div>

        {/* Sub-modos do contexto */}
        <div role="tablist" aria-label="Modos do pacote de contexto" className="mb-4 grid grid-cols-3 gap-2">
          {(
            [
              ["kit", "🧰 Kit de Bolso"],
              ["situacoes", "🎭 Situações"],
              ["treino", "🧩 Vocabulário"],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`min-h-[44px] rounded-2xl px-2.5 py-2 text-xs font-extrabold transition ${
                  active
                    ? "bg-[var(--color-ink)] text-white shadow-[var(--shadow-card)]"
                    : "bg-white text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

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
              <div className="mb-2.5 flex items-baseline justify-between">
                <h2 id="pocket-phrases-heading" className="font-extrabold">
                  Frases prontas a usar
                </h2>
                <span className="text-xs text-[var(--color-muted)]">Normal e lento (0.6×)</span>
              </div>
              <ul role="list" className="flex flex-col gap-3">
                {data.phrases.map((p, idx) => {
                  const reg = REGISTER_LABEL[p.register];
                  return (
                    <li key={idx} className="card p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${reg.badgeCls}`}>
                          {reg.label}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">{p.whenToUse}</span>
                      </div>
                      <p lang={speechLang} className={`target text-base font-extrabold leading-snug ${lang === "ja" ? "jp" : ""}`}>
                        {p.text}
                      </p>
                      {lang === "ja" && state.settings.romaji && p.romaji && (
                        <p className="mt-0.5 text-xs font-medium text-[var(--color-muted)]">{p.romaji}</p>
                      )}
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{p.pt}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <SpeakButton text={p.text} lang={lang} size={38} label="Ouvir velocidade normal" />
                        <SpeakButton
                          text={p.text}
                          lang={lang}
                          size={38}
                          slow
                          label="Ouvir devagar"
                          className="!bg-[var(--color-teal-soft)]/70"
                        />
                        <span className="text-xs text-[var(--color-muted)]">Ouvir · Devagar 🐢</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Vocabulário essencial do cenário */}
            <section aria-labelledby="pack-vocab-heading">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 id="pack-vocab-heading" className="font-extrabold">
                    Vocabulário essencial ({data.vocabKeys.length})
                  </h2>
                  <p className="text-xs text-[var(--color-muted)]">
                    {savedCount} de {data.vocabKeys.length} na tua revisão espaçada
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

            {/* Ligação directa à conversa com o tutor e unidades relacionadas */}
            <section className="space-y-2.5 pt-1" aria-label="Continuar a praticar este contexto">
              <Link
                href={`/conversa?mode=livre&unit=${primaryUnitId}`}
                className="flex items-center gap-3 rounded-[24px] bg-[var(--color-teal)] p-4 text-white shadow-[var(--shadow-card)] transition active:scale-[0.99]"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/25 text-2xl">
                  {meta.tutor.avatar}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold">Simular cenário com {meta.tutor.name}</span>
                  <span className="block text-xs opacity-95">Conversa livre guiada neste contexto real</span>
                </span>
                <Icon name="chevron-right" size={20} />
              </Link>

              <div className="card p-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
                  Unidades do currículo ligadas a este tema
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {activePack.relatedLevels.map((lvl) => {
                    const uid = `${lang}-${String(lvl).padStart(2, "0")}`;
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

        {tab === "situacoes" && (
          <SituationQuiz key={`${lang}-${activePack.id}`} pack={activePack} onBackToKit={() => setTab("kit")} />
        )}

        {tab === "treino" && (
          <ContextualVocabDrill
            lang={lang}
            packId={activePack.id}
            title={`Frases do contexto: ${activePack.title}`}
            onDone={() => setTab("kit")}
          />
        )}

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
        8 cenários reais prontos a usar desde o 1.º dia — frases por registo social, alertas de falsos amigos e vocabulário prático em {meta.name.toLowerCase()}.
      </p>

      {/* Filtro rápido por etiqueta */}
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar contextos por tema">
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

      <p aria-live="polite" className="sr-only">
        {visiblePacks.length} pacotes de contexto apresentados
      </p>

      <ul role="list" className="flex flex-col gap-3">
        {visiblePacks.map((pack) => {
          const data = pack.byLang[lang];
          const savedCount = data.vocabKeys.filter((k) => !!state.srs[lang][`w:${k.toLowerCase()}`]).length;
          return (
            <li key={pack.id}>
              <button
                type="button"
                data-testid={`context-pack-${pack.id}`}
                onClick={() => {
                  setSelectedId(pack.id);
                  setTab("kit");
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
                  <span className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)]">
                    <span>{pack.tag}</span>
                    <span>·</span>
                    <span>{data.phrases.length} frases</span>
                    <span>·</span>
                    <span>
                      {savedCount}/{data.vocabKeys.length} guardadas
                    </span>
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

"use client";

import Link from "next/link";
import { useState } from "react";
import { AppFrame, LanguageSelector, NotificationsButton, ScreenHeader, StreakBadge } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { WordSheet } from "@/components/Reader";
import { CopyTextButton, ProgressBar, ProgressRing, SaveWordButton, SpeakButton, Toast } from "@/components/ui";
import { getUnit } from "@/content";
import { CONTEXT_PACKS, wordOfTheDay } from "@/lib/contexts";
import { LANGS } from "@/lib/langs";
import { sfxTap } from "@/lib/sfx";
import {
  conversationsLeft,
  currentStreak,
  dailyGoalActivities,
  dayKey,
  dueItems,
  nextUnitId,
  todayProgress,
  unitProgressPct,
  vocabStats,
  xpLastDays,
} from "@/lib/state";
import { useApp } from "@/lib/store";
import { plainText, type RToken } from "@/lib/tokenize";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function Home() {
  const { state } = useApp();
  const [tok, setTok] = useState<RToken | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [wotdOffset, setWotdOffset] = useState(0);
  const lang = state.activeLang;
  const meta = LANGS[lang];
  const today = todayProgress(state);
  const xp = xpLastDays(state, lang);
  const weekXp = xp.reduce((a, b) => a + b.xp, 0);
  const maxXp = Math.max(20, ...xp.map((d) => d.xp));
  const nextId = nextUnitId(state, lang);
  const next = nextId ? getUnit(nextId) : undefined;
  const nextPct = nextId ? unitProgressPct(state, nextId) : 0;
  const vocab = vocabStats(state, lang);
  const due = dueItems(state, lang).length;
  const streak = currentStreak(state);
  const left = conversationsLeft(state);
  const goalN = dailyGoalActivities(state.settings.dailyGoalMin);
  const wotd = wordOfTheDay(lang, state.srs[lang], dayKey(), wotdOffset);

  return (
    <>
      <ScreenHeader
        title="Início"
        actions={
          <>
            <StreakBadge />
            <NotificationsButton />
          </>
        }
      />
      <LanguageSelector />

      <div className="flex flex-col gap-4">
        {/* Tarefa diária */}
        <section className="card flex items-center gap-5 p-5" aria-label="Tarefa diária">
          <ProgressRing pct={today.pct}>{today.pct}%</ProgressRing>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold">Tarefa diária:</div>
            <div className="text-[15px]">
              Completa {goalN} {goalN === 1 ? "actividade" : "actividades"} hoje
            </div>
            <div className="mt-1 text-xs text-[var(--color-muted)]">
              Fizeste {Math.min(today.done, today.goal)} de {today.goal} · objectivo {state.settings.dailyGoalMin} min
              {streak > 0 && ` · 🔥 ${streak} ${streak === 1 ? "dia" : "dias"}`}
            </div>
          </div>
        </section>

        {/* Conversa rápida */}
        <Link
          href="/conversa"
          className="relative flex items-center gap-4 overflow-hidden rounded-[24px] bg-[var(--color-teal)] p-5 text-white shadow-[var(--shadow-card)] transition active:scale-[0.99]"
        >
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/25 text-3xl">{meta.tutor.avatar}</div>
          <div className="flex-1">
            <div className="text-lg font-extrabold">Conversa rápida</div>
            <div className="text-sm opacity-95">
              3 minutos com {meta.tutor.name}
              {Number.isFinite(left) && ` · ${left} restantes hoje`}
            </div>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-[var(--color-teal)]">
            <Icon name="chat" size={22} />
          </div>
        </Link>

        {/* Barra de acção rápida de 1 toque */}
        <nav aria-label="Atalhos de prática rápida" className="chip-scroller -my-1">
          <Link href="/revisao" className="action-pill !bg-[var(--color-surface)] !px-3.5 shadow-[var(--shadow-card)]">
            <span>⚡ Revisão{due > 0 ? ` (${due})` : ""}</span>
          </Link>
          <Link href="/contextos" className="action-pill !bg-[var(--color-surface)] !px-3.5 shadow-[var(--shadow-card)]">
            <span>🧰 {CONTEXT_PACKS.length} Contextos</span>
          </Link>
          <Link href="/cursos/vocabulario?tab=treino" className="action-pill !bg-[var(--color-surface)] !px-3.5 shadow-[var(--shadow-card)]">
            <span>🧩 Treinar frases</span>
          </Link>
          <Link href="/cursos/vocabulario?tab=dicionario" className="action-pill !bg-[var(--color-surface)] !px-3.5 shadow-[var(--shadow-card)]">
            <span>📖 Dicionário</span>
          </Link>
        </nav>

        {/* XP */}
        <section className="card p-5" aria-label="XP ganho">
          <div className="flex items-center justify-between">
            <div className="font-extrabold">XP ganho</div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-[var(--color-yellow-soft)] px-3 py-1 text-xs font-extrabold text-[#8a6a12]">
                ✨ {state.progress[lang].xp} XP total
              </span>
              <span className="rounded-full bg-[var(--color-coral-soft)] px-3 py-1 text-xs font-bold text-[var(--color-coral)]">7 dias</span>
            </div>
          </div>
          <div className="mt-4 flex items-end gap-5">
            <div className="flex h-28 flex-1 items-stretch justify-between gap-2">
              {xp.map((d) => {
                const h = d.xp > 0 ? Math.max(10, (d.xp / maxXp) * 100) : 6;
                const wd = WEEKDAYS[new Date(d.day + "T12:00:00").getDay()];
                return (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.xp} XP`}>
                    <div className="relative w-3 flex-1">
                      <div
                        className="absolute inset-x-0 bottom-0 rounded-full"
                        style={{
                          height: `${h}%`,
                          background: d.xp > 0 ? "linear-gradient(180deg, #E8735A, #F6B8A8)" : "var(--color-line)",
                          transition: "height .5s ease",
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--color-muted)]">{wd}</span>
                  </div>
                );
              })}
            </div>
            <div className="pb-5 text-right">
              <div className="text-2xl font-extrabold">{weekXp} XP</div>
              <div className="text-xs text-[var(--color-muted)]">Últimos 7 dias</div>
            </div>
          </div>
        </section>

        {/* Idioma activo */}
        {next && (
          <Link href={`/unidade/${next.id}`} className="card flex items-center gap-4 p-5 transition active:scale-[0.99]">
            <div className="grid h-20 w-24 shrink-0 place-items-center rounded-2xl text-5xl" style={{ background: "var(--color-bg)" }}>
              {next.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold">{meta.name}</div>
              <div className="truncate text-sm text-[var(--color-muted)]">
                Nível {next.level} · {next.title}
              </div>
              <ProgressBar pct={nextPct} className="mt-2" />
              <div className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[var(--color-coral)]">
                {nextPct > 0 ? "Continuar" : "Começar"} <Icon name="chevron-right" size={16} />
              </div>
            </div>
          </Link>
        )}

        {/* Revisão */}
        <Link href="/revisao" className="card flex items-center gap-4 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-yellow-soft)] text-[#b8901a]">
            <Icon name="bolt" size={24} />
          </div>
          <div className="flex-1">
            <div className="font-extrabold">Revisão relâmpago</div>
            <div className="text-sm text-[var(--color-muted)]">{due > 0 ? `${due} itens para rever agora` : "Tudo em dia ✓ — 2 minutos de treino extra"}</div>
          </div>
          <Icon name="chevron-right" className="text-[var(--color-muted)]" />
        </Link>

        {lang === "ja" && (
          <Link href="/kana" className="card flex items-center gap-4 p-5">
            <div className="jp grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-teal-soft)] text-2xl font-bold">あ</div>
            <div className="flex-1">
              <div className="font-extrabold">Hiragana e katakana</div>
              <div className="text-sm text-[var(--color-muted)]">Reconhecer e traçar os caracteres</div>
            </div>
            <Icon name="chevron-right" className="text-[var(--color-muted)]" />
          </Link>
        )}

        {/* Nível de vocabulário */}
        <Link href="/palavras" className="card p-5">
          <div className="font-extrabold">Nível de vocabulário</div>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-coral-soft)] text-sm font-bold text-[var(--color-coral)]">
              {vocab.strong}
            </span>
            <span className="flex-1 text-[var(--color-muted)]">
              {vocab.pct}% {vocab.label} · {vocab.learned} palavras vistas
            </span>
            <Icon name="chevron-right" className="text-[var(--color-muted)]" />
          </div>
        </Link>

        {/* Expressão / Palavra do Dia em Contexto */}
        <section className="card p-5" aria-label="Expressão do dia em contexto">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-yellow-soft)] px-2.5 py-0.5 text-[11px] font-extrabold text-[#7a5c0d]">
                🌟 Expressão em destaque
              </span>
              <button
                type="button"
                onClick={() => {
                  sfxTap(state.settings.soundEffects !== false);
                  setWotdOffset((o) => o + 1);
                }}
                aria-label="Mostrar outra expressão de contexto"
                className="action-pill !min-h-[28px] !px-2.5 !py-0.5 text-[11px]"
              >
                <Icon name="shuffle" size={12} />
                <span>Outra</span>
              </button>
            </div>
            <Link
              href={`/contextos?pack=${wotd.pack.id}`}
              className="rounded-full bg-[var(--color-bg)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-ink)] hover:bg-[var(--color-teal-soft)]"
            >
              {wotd.pack.emoji} {wotd.pack.title} →
            </Link>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <SpeakButton text={wotd.key} lang={lang} size={42} label={`Ouvir ${wotd.key}`} />
            <button
              type="button"
              onClick={() =>
                setTok({
                  text: wotd.key,
                  key: wotd.key,
                  entry: wotd.entry,
                  isPunct: false,
                  spaceAfter: false,
                  chunk: wotd.key.includes(" "),
                })
              }
              className="min-w-0 flex-1 rounded-xl px-1.5 py-1 text-left transition hover:bg-[var(--color-bg)]"
            >
              <div lang={meta.speechLang} className={`target truncate text-lg font-extrabold ${lang === "ja" ? "jp" : ""}`}>
                {wotd.key}
              </div>
              <div className="truncate text-sm text-[var(--color-muted)]">
                {lang === "ja" && wotd.entry.reading ? `${wotd.entry.reading} · ` : ""}
                {wotd.entry.pt}
              </div>
            </button>
            <SaveWordButton
              wordKey={wotd.key}
              lang={lang}
              pillLabel={wotd.saved ? "Guardada" : "Guardar"}
              onToggle={(nowSaved) =>
                setToast(nowSaved ? `✓ «${wotd.key}» guardada na revisão!` : `«${wotd.key}» removida da revisão.`)
              }
            />
          </div>
          {wotd.entry.example && (
            <div className="mt-2.5 rounded-2xl bg-[var(--color-bg)] px-3.5 py-2.5 text-xs">
              <div lang={meta.speechLang} className={`target font-bold text-[var(--color-ink)] ${lang === "ja" ? "jp" : ""}`}>
                {plainText(wotd.entry.example.text, lang)}
              </div>
              <div className="mt-0.5 text-[var(--color-muted)]">{wotd.entry.example.pt}</div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <SpeakButton
                  text={wotd.entry.example.text}
                  lang={lang}
                  pillLabel="Ouvir"
                  label={`Ouvir exemplo: ${wotd.entry.example.pt}`}
                />
                <SpeakButton
                  text={wotd.entry.example.text}
                  lang={lang}
                  slow
                  pillLabel="0.6×"
                  label={`Ouvir exemplo devagar: ${wotd.entry.example.pt}`}
                />
                <CopyTextButton
                  text={wotd.entry.example.text}
                  lang={lang}
                  pillLabel="Copiar"
                  label={`Copiar exemplo: ${wotd.entry.example.pt}`}
                />
              </div>
            </div>
          )}
        </section>

        {/* Contextos Reais & Kit de Bolso */}
        <Link href="/contextos" className="card flex items-center gap-4 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-teal-soft)] text-2xl">🧰</div>
          <div className="flex-1">
            <div className="font-extrabold">Contextos & Kit de Bolso</div>
            <div className="text-sm text-[var(--color-muted)]">
              {CONTEXT_PACKS.length} cenários reais: dentista, correios, cozinha, casa, reciclagem, podcasts e mais
            </div>
          </div>
          <Icon name="chevron-right" className="text-[var(--color-muted)]" />
        </Link>

        {/* Marcos de comunicação e Certificados */}
        <Link href="/marcos" className="card flex items-center gap-4 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-lilac-soft)] text-2xl">🎓</div>
          <div className="flex-1">
            <div className="font-extrabold">Marcos e Certificados</div>
            <div className="text-sm text-[var(--color-muted)]">Exames de etapa (A1–B2) e certificados partilháveis</div>
          </div>
          <Icon name="chevron-right" className="text-[var(--color-muted)]" />
        </Link>
      </div>
      <WordSheet tok={tok} lang={lang} onClose={() => setTok(null)} />
      <Toast text={toast} onDone={() => setToast(null)} />
    </>
  );
}

export default function InicioPage() {
  return (
    <AppFrame>
      <Home />
    </AppFrame>
  );
}

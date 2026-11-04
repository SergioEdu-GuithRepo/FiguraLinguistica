"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WordSheet } from "@/components/Reader";
import { AppFrame } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { SpeakButton, TopBar } from "@/components/ui";
import { CONTENT } from "@/content";
import { isUnitUnlocked } from "@/lib/state";
import { useApp } from "@/lib/store";
import type { RToken } from "@/lib/tokenize";

function Vocabulario() {
  const { state } = useApp();
  const router = useRouter();
  const lang = state.activeLang;
  const { units, dictionary } = CONTENT[lang];
  const [open, setOpen] = useState<string | null>(units[0]?.id ?? null);
  const [tok, setTok] = useState<RToken | null>(null);
  return (
    <>
      <TopBar back={() => router.push("/cursos")} title="Vocabulário por cenas" />
      <p className="mb-4 text-sm text-[var(--color-muted)]">As palavras mais usadas, agrupadas por situação. Toca para ver detalhes e guardar.</p>
      <div className={`flex flex-col gap-3 lang-${lang}`}>
        {units.map((u) => {
          const unlocked = isUnitUnlocked(state, u.id);
          const isOpen = open === u.id && unlocked;
          return (
            <section key={u.id} className="card overflow-hidden">
              <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => unlocked && setOpen(isOpen ? null : u.id)} aria-expanded={isOpen} disabled={!unlocked}>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-yellow-soft)] text-2xl">{u.emoji}</span>
                <span className="flex-1">
                  <span className="block font-extrabold">{u.title}</span>
                  <span className="text-xs text-[var(--color-muted)]">{u.vocab.length} palavras · nível {u.level}</span>
                </span>
                <Icon name={unlocked ? (isOpen ? "chevron-down" : "chevron-right") : "lock"} size={20} className="text-[var(--color-muted)]" />
              </button>
              {isOpen && (
                <ul className="grid grid-cols-1 gap-2 px-4 pb-4">
                  {u.vocab.map((k) => {
                    const e = dictionary[k];
                    if (!e) return null;
                    const saved = !!state.srs[lang][`w:${k}`];
                    return (
                      <li key={k}>
                        <div
                          role="button"
                          tabIndex={0}
                          className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[var(--color-bg)] p-3"
                          onClick={() => setTok({ text: k, key: k, entry: e, isPunct: false, spaceAfter: false })}
                          onKeyDown={(ev) => ev.key === "Enter" && setTok({ text: k, key: k, entry: e, isPunct: false, spaceAfter: false })}
                        >
                          <SpeakButton text={k} lang={lang} size={34} className="!bg-white" />
                          <span className="min-w-0 flex-1">
                            <span className="target block truncate font-bold">{k}</span>
                            <span className="block truncate text-sm text-[var(--color-muted)]">
                              {lang === "ja" && e.reading ? `${e.reading} · ` : ""}
                              {e.pt}
                            </span>
                          </span>
                          {saved && <Icon name="bookmark" size={16} filled className="text-[var(--color-coral)]" />}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      <WordSheet tok={tok} lang={lang} onClose={() => setTok(null)} />
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

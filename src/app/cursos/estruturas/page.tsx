"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TokenLine, WordSheet } from "@/components/Reader";
import { AppFrame } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { SpeakButton, TopBar } from "@/components/ui";
import { CONTENT } from "@/content";
import { isUnitUnlocked } from "@/lib/state";
import { useApp } from "@/lib/store";
import { fillTemplate, plainText, type RToken } from "@/lib/tokenize";

function Estruturas() {
  const { state } = useApp();
  const router = useRouter();
  const lang = state.activeLang;
  const [word, setWord] = useState<RToken | null>(null);
  const units = CONTENT[lang].units;
  return (
    <>
      <TopBar back={() => router.push("/cursos")} title="Estruturas" />
      <p className="mb-4 text-sm text-[var(--color-muted)]">Os moldes de frase de cada nível. Troca a palavra e já produzes dezenas de frases.</p>
      <div className={`flex flex-col gap-4 lang-${lang}`}>
        {units.map((u) => {
          const unlocked = isUnitUnlocked(state, u.id);
          return (
            <section key={u.id} className={`card p-5 ${unlocked ? "" : "opacity-60"}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-[var(--color-muted)]">
                  {u.emoji} Nível {u.level} · {u.title}
                </div>
                {unlocked ? (
                  <Link href={`/unidade/${u.id}/moldes`} className="text-sm font-bold text-[var(--color-coral)]">
                    Praticar
                  </Link>
                ) : (
                  <Icon name="lock" size={16} className="text-[var(--color-muted)]" />
                )}
              </div>
              <ul className="mt-2 flex flex-col gap-3">
                {u.patterns.map((p) => {
                  const ex = fillTemplate(p.template, p.slots[0].text);
                  return (
                    <li key={p.id} className="rounded-2xl bg-[var(--color-bg)] p-3">
                      <div className="target font-bold">{plainText(p.template, lang).replaceAll("{x}", "[ … ]")}</div>
                      <div className="text-sm text-[var(--color-muted)]">{p.pt.replaceAll("{x}", "…")}</div>
                      {unlocked && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <span className="flex-1">
                            Ex.: <TokenLine text={ex} lang={lang} onWord={setWord} />
                          </span>
                          <SpeakButton text={ex} lang={lang} size={30} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <WordSheet tok={word} lang={lang} onClose={() => setWord(null)} />
    </>
  );
}

export default function EstruturasPage() {
  return (
    <AppFrame nav={false}>
      <Estruturas />
    </AppFrame>
  );
}

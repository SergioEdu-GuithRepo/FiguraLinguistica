"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppFrame } from "@/components/Shell";
import { CelebrationBurst, Empty, SpeakButton, TopBar, useSpeaker } from "@/components/ui";
import { CONTENT } from "@/content";
import type { Rating } from "@/lib/fsrs";
import { addActivity, dueItems, rateItem } from "@/lib/state";
import { useApp } from "@/lib/store";
import { fillTemplate, plainText } from "@/lib/tokenize";
import type { LangCode, Pattern } from "@/lib/types";

interface Item {
  key: string;
  prompt: string;
  reading?: string;
  answer: string;
  options: string[];
}

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function buildItems(keys: string[], lang: LangCode): Item[] {
  const { dictionary, units } = CONTENT[lang];
  const patterns = new Map<string, Pattern>(units.flatMap((u) => u.patterns.map((p) => [p.id, p] as [string, Pattern])));
  const allPt = Array.from(new Set(Object.values(dictionary).map((e) => e.pt)));
  const items: Item[] = [];
  for (const key of keys) {
    if (key.startsWith("w:")) {
      const w = key.slice(2);
      const e = dictionary[w];
      if (!e) continue;
      const distract = shuffle(allPt.filter((p) => p !== e.pt)).slice(0, 3);
      items.push({ key, prompt: w, reading: e.reading ?? e.romaji, answer: e.pt, options: shuffle([e.pt, ...distract]) });
    } else if (key.startsWith("p:")) {
      const p = patterns.get(key.slice(2));
      if (!p) continue;
      const slot = p.slots[Math.floor(Math.random() * p.slots.length)];
      const answer = p.pt.replaceAll("{x}", slot.pt);
      const others = shuffle(Array.from(patterns.values()).filter((o) => o.id !== p.id))
        .slice(0, 3)
        .map((o) => o.pt.replaceAll("{x}", o.slots[0].pt));
      items.push({
        key,
        prompt: plainText(fillTemplate(p.template, slot.text), lang),
        reading: p.romaji ? p.romaji.replaceAll("{x}", slot.romaji ?? "") : undefined,
        answer,
        options: shuffle([answer, ...others]),
      });
    }
  }
  return items;
}

const DURATION = 120;

function Review() {
  const { state, update } = useApp();
  const router = useRouter();
  const { say } = useSpeaker();
  const lang = state.activeLang;
  const items = useMemo(() => {
    const due = dueItems(state, lang);
    const rest = Object.entries(state.srs[lang])
      .filter(([k]) => !due.includes(k))
      .sort((a, b) => a[1].due - b[1].due)
      .map(([k]) => k);
    return buildItems([...due, ...rest].slice(0, 20), lang);
    // sessão fixa ao entrar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [left, setLeft] = useState(DURATION);
  const [correct, setCorrect] = useState(0);
  const [over, setOver] = useState(false);
  const shownAt = useRef(0);
  const finished = useRef(false);

  useEffect(() => {
    shownAt.current = Date.now();
  }, [i]);

  useEffect(() => {
    if (over || !items.length) return;
    const t = setInterval(() => setLeft((l) => (l <= 1 ? 0 : l - 1)), 1000);
    return () => clearInterval(t);
  }, [over, items.length]);

  useEffect(() => {
    if (left === 0 && !over) setOver(true);
  }, [left, over]);

  useEffect(() => {
    if (over && !finished.current) {
      finished.current = true;
      update((s) => addActivity(s, lang, "review", Math.max(3, correct)));
    }
  }, [over, correct, lang, update]);

  if (!items.length) {
    return (
      <>
        <TopBar back={() => router.push("/inicio")} title="Revisão relâmpago" />
        <Empty icon="bolt" title="Ainda não há nada para rever" text="Faz o passo «Vocabulário-chave» de uma unidade ou guarda palavras no leitor." action={<Link href="/cursos" className="btn btn-primary">Ir para os cursos</Link>} />
      </>
    );
  }

  const item = items[i];
  const choose = (o: string) => {
    if (picked) return;
    setPicked(o);
    const ok = o === item.answer;
    const secs = (Date.now() - shownAt.current) / 1000;
    const rating: Rating = !ok ? 1 : secs < 3 ? 4 : secs < 7 ? 3 : 2;
    if (ok) setCorrect((c) => c + 1);
    update((s) => rateItem(s, lang, item.key, rating));
    setTimeout(() => {
      if (i + 1 >= items.length) setOver(true);
      else {
        setI(i + 1);
        setPicked(null);
      }
    }, ok ? 450 : 1200);
  };

  return (
    <>
      <TopBar
        back={() => router.push("/inicio")}
        title="Revisão relâmpago"
        right={<span className={`rounded-full px-3 py-1 text-sm font-bold ${left < 20 ? "bg-[var(--color-bad-soft)] text-[var(--color-bad)]" : "bg-white shadow-[var(--shadow-card)]"}`}>⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</span>}
      />
      {over ? (
        <div className="fade-in py-10 text-center">
          <div className="trophy-pop text-5xl">⚡</div>
          <CelebrationBurst xp={Math.max(3, correct)} />
          <h2 className="mt-3 text-2xl font-extrabold">Revisão feita!</h2>
          <p className="mt-1 text-[var(--color-muted)]">
            {correct} certas em {Math.min(items.length, i + (picked ? 1 : 0))} · +{Math.max(3, correct)} XP
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">O sistema já agendou a próxima revisão de cada item.</p>
          <button className="btn btn-primary mt-6 w-full" onClick={() => router.push("/inicio")}>
            Voltar ao início
          </button>
        </div>
      ) : (
        <div key={i} className={`fade-in lang-${lang}`}>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-line)]">
            <div className="h-full bg-[var(--color-yellow)]" style={{ width: `${(i / items.length) * 100}%` }} />
          </div>
          <div className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
            {i + 1} / {items.length}
          </div>
          <div className="card flex flex-col items-center p-8 text-center">
            <div className="target text-3xl font-extrabold">{item.prompt}</div>
            {item.reading && lang === "ja" && <div className="mt-1 text-sm text-[var(--color-muted)]">{item.reading}</div>}
            <SpeakButton text={item.prompt} lang={lang} className="mt-3" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2">
            {item.options.map((o) => {
              const st = picked ? (o === item.answer ? "ok" : o === picked ? "bad" : "") : "";
              return (
                <button
                  key={o}
                  onClick={() => {
                    choose(o);
                    if (o !== item.answer) say(item.prompt, lang);
                  }}
                  className={`btn justify-start text-left font-semibold ${st === "ok" ? "!bg-[var(--color-good-soft)] text-[var(--color-good)]" : st === "bad" ? "!bg-[var(--color-bad-soft)] text-[var(--color-bad)]" : "btn-ghost"}`}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export default function RevisaoPage() {
  return (
    <AppFrame nav={false}>
      <Review />
    </AppFrame>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppFrame } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { TopBar } from "@/components/ui";
import { CONTENT } from "@/content";
import { LANGS } from "@/lib/langs";
import { conversationsLeft, isUnitUnlocked } from "@/lib/state";
import { useApp } from "@/lib/store";

function Conversas() {
  const { state } = useApp();
  const router = useRouter();
  const lang = state.activeLang;
  const meta = LANGS[lang];
  const left = conversationsLeft(state);
  const history = state.conversations.filter((c) => c.lang === lang).slice(-6).reverse();
  return (
    <>
      <TopBar back={() => router.push("/cursos")} title="Conversas e Fluência" />
      <div className="card mb-4 flex items-center gap-3 p-4">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-teal-soft)] text-2xl">{meta.tutor.avatar}</span>
        <div className="flex-1 text-sm">
          <b>{meta.tutor.name}</b>, {meta.tutor.city}. Simulações de cenas reais com correcção gentil.
          <div className="text-xs text-[var(--color-muted)]">{Number.isFinite(left) ? `${left} conversas restantes hoje (plano gratuito)` : "Conversas ilimitadas"}</div>
        </div>
      </div>

      <h2 className="mb-2 font-extrabold">Modos de fluência</h2>
      <div className="mb-5 grid grid-cols-2 gap-3">
        <Link href="/conversa?mode=livre" className="card flex flex-col gap-1 p-3.5">
          <div className="flex items-center gap-2 font-extrabold">
            <span className="text-xl">💬</span> Modo Livre
          </div>
          <p className="text-xs text-[var(--color-muted)]">Conversa aberta sobre o tema com vocabulário livre.</p>
        </Link>
        <Link href="/conversa?mode=desafio" className="card flex flex-col gap-1 p-3.5">
          <div className="flex items-center gap-2 font-extrabold">
            <span className="text-xl">⚡</span> Modo Desafio
          </div>
          <p className="text-xs text-[var(--color-muted)]">Sem ajudas e com relógio de 25s por turno (+15 XP).</p>
        </Link>
        <Link href="/conversa?mode=rapido" className="card flex flex-col gap-1 p-3.5">
          <div className="flex items-center gap-2 font-extrabold">
            <span className="text-xl">⏱</span> Responder rápido
          </div>
          <p className="text-xs text-[var(--color-muted)]">Pergunta em áudio/texto com 8s para destravar a fala.</p>
        </Link>
        <Link href="/conversa?mode=sentido" className="card flex flex-col gap-1 p-3.5">
          <div className="flex items-center gap-2 font-extrabold">
            <span className="text-xl">🧠</span> Traduzir o sentido
          </div>
          <p className="text-xs text-[var(--color-muted)]">Equivalente natural em contexto, não palavra a palavra.</p>
        </Link>
      </div>

      <h2 className="mb-2 font-extrabold">Cenas por unidade (Modo guiado)</h2>
      <div className="flex flex-col gap-3">
        {CONTENT[lang].units.map((u) => {
          const unlocked = isUnitUnlocked(state, u.id);
          const done = !!state.progress[lang].units[u.id]?.steps.conversa;
          const body = (
            <>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-teal-soft)] text-2xl">{u.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold">
                  {u.level}. {u.title}
                </span>
                <span className="block truncate text-sm text-[var(--color-muted)]">{u.conversation.goal}</span>
              </span>
              <Icon name={!unlocked ? "lock" : done ? "check" : "chevron-right"} size={20} className={done ? "text-[var(--color-good)]" : "text-[var(--color-muted)]"} />
            </>
          );
          return unlocked ? (
            <Link key={u.id} href={`/unidade/${u.id}/conversa`} className="card flex items-center gap-3 p-4">
              {body}
            </Link>
          ) : (
            <div key={u.id} className="card flex items-center gap-3 p-4 opacity-60">
              {body}
            </div>
          );
        })}
      </div>
      {history.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 font-extrabold">Últimas conversas</h2>
          <ul className="flex flex-col gap-2">
            {history.map((c) => (
              <li key={c.id} className="card p-4 text-sm">
                <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                  <span className="font-semibold">
                    {CONTENT[lang].units.find((u) => u.id === c.unitId)?.title} ·{" "}
                    <span className="uppercase">{c.mode}</span>
                  </span>
                  <span>{new Date(c.at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
                <div className="mt-1">✅ {c.summary.good}</div>
                <div className="mt-1 text-[var(--color-muted)]">🎯 {c.summary.improve}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default function ConversasPage() {
  return (
    <AppFrame nav={false}>
      <Conversas />
    </AppFrame>
  );
}

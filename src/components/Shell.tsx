"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { CONTENT } from "@/content";
import { LANGS, LANG_LIST, TOTAL_LEVELS } from "@/lib/langs";
import { currentLevel, currentStreak, dueItems, isPremium, pushNotif, unitDone } from "@/lib/state";
import { useApp, useStore } from "@/lib/store";
import type { LangCode } from "@/lib/types";
import { Icon, type IconName } from "./Icon";
import { Sheet } from "./Sheet";
import { ProgressBar, SkeletonScreen } from "./ui";

/* ---------------- Guard ---------------- */

export function AuthGate({ children, requireOnboarded = true }: { children: React.ReactNode; requireOnboarded?: boolean }) {
  const { ready, user, state } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/entrar");
    else if (requireOnboarded && state && !state.onboarded) router.replace("/boas-vindas");
  }, [ready, user, state, router, requireOnboarded]);
  if (!ready || !user || !state || (requireOnboarded && !state.onboarded)) {
    return <SkeletonScreen />;
  }
  return <>{children}</>;
}

/* ---------------- Navegação inferior ---------------- */

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/inicio", label: "Início", icon: "home" },
  { href: "/cursos", label: "Cursos", icon: "book" },
  { href: "/licoes", label: "Lições", icon: "headphones" },
  { href: "/perfil", label: "Perfil", icon: "user" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] px-4 pb-[max(env(safe-area-inset-bottom),12px)]"
    >
      <div className="card flex items-center justify-around px-2 py-2.5 backdrop-blur-md">
        {TABS.map((t) => {
          const active = path === t.href || path.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex w-20 flex-col items-center gap-1 rounded-2xl py-1 text-[11px] transition-all duration-200 active:scale-90 ${active ? " -translate-y-0.5 font-extrabold text-[var(--color-ink)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"}`}
            >
              <span
                className={`transition-transform duration-200 ${active ? "scale-110" : ""}`}
                style={{ ["--icon-fill" as string]: "var(--color-coral-soft)" }}
              >
                <Icon name={t.icon} size={26} filled={active} strokeWidth={active ? 2 : 1.7} />
              </span>
              {t.label}
              {active && <span className="h-1 w-4 rounded-full bg-[var(--color-coral)] transition-all duration-200" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------------- Cabeçalho de ecrã ---------------- */

export function ScreenHeader({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-5 flex items-center justify-between pt-2">
      <h1 className="text-[32px] font-extrabold leading-tight tracking-tight">{title}</h1>
      <div className="flex items-center gap-1">{actions}</div>
    </header>
  );
}

export function HeaderIconButton({ icon, label, onClick, badge }: { icon: IconName; label: string; onClick: () => void; badge?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative grid h-11 w-11 place-items-center rounded-full transition hover:-translate-y-0.5 hover:bg-white active:scale-90"
    >
      <Icon name={icon} size={24} />
      {badge && <span className="pulse-ring absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-coral)]" />}
    </button>
  );
}

/* ---------------- Notificações ---------------- */

export function NotificationsButton() {
  const { state, update } = useApp();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const lang = state.activeLang;
  const due = dueItems(state, lang).length;

  // lembretes inteligentes gerados uma vez por dia + hora programada de estudo
  useEffect(() => {
    const today = new Date().toDateString();
    const key = `fl:reminded:${today}:${lang}`;
    if (typeof localStorage !== "undefined" && !localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      if (due > 0) {
        update((s) => ({ ...s, notifications: pushNotif(s.notifications, `🔁 Tens ${due} itens para rever em ${LANGS[lang].name}.`, "/revisao") }));
        if (state.settings.notifications && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("FiguraLinguística", { body: `Tens ${due} itens para rever hoje.`, icon: "/icon-192.png" });
          } catch {
            /* alguns navegadores só permitem via service worker */
          }
        }
      }
    }

    const checkHourlyReminder = () => {
      if (!state.settings.notifications || typeof localStorage === "undefined") return;
      const now = new Date();
      const isoDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const hourKey = `fl:daily-hour:${isoDay}`;
      if (localStorage.getItem(hourKey)) return;
      // Só lembra se o aluno ainda não estudou hoje
      if ((state.days?.[isoDay]?.activities ?? 0) > 0) return;

      const target = state.settings.reminderHour || "19:30";
      const [th, tm] = target.split(":").map((x) => Number(x) || 0);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const targetMin = th * 60 + tm;
      if (nowMin >= targetMin) {
        localStorage.setItem(hourKey, "1");
        const msg = `⏰ Hora da tua prática (${target})! Bastam ${state.settings.dailyGoalMin} minutos em ${LANGS[lang].name} para manter a sequência.`;
        update((s) => ({ ...s, notifications: pushNotif(s.notifications, msg, "/inicio") }));
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("FiguraLinguística · Hora de praticar", { body: msg, icon: "/icon-192.png" });
          } catch {
            /* alguns navegadores só permitem via service worker */
          }
        }
      }
    };

    checkHourlyReminder();
    const timer = setInterval(checkHourlyReminder, 60_000);
    return () => clearInterval(timer);
  }, [due, lang, update, state.days, state.settings.dailyGoalMin, state.settings.notifications, state.settings.reminderHour]);

  const unread = state.notifications.some((n) => !n.read);
  return (
    <>
      <HeaderIconButton
        icon="bell"
        label="Notificações"
        badge={unread}
        onClick={() => {
          setOpen(true);
        }}
      />
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
          update((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
        }}
        title="Notificações"
      >
        {state.notifications.length === 0 ? (
          <p className="py-6 text-center text-[var(--color-muted)]">Sem notificações por agora.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {state.notifications.map((n) => (
              <li key={n.id}>
                <button
                  className={`w-full rounded-2xl p-3 text-left ${n.read ? "bg-[var(--color-bg)]" : "bg-[var(--color-coral-soft)]"}`}
                  onClick={() => {
                    setOpen(false);
                    if (n.href) router.push(n.href);
                  }}
                >
                  <div className="text-sm font-semibold">{n.text}</div>
                  <div className="text-xs text-[var(--color-muted)]">{new Date(n.at).toLocaleString("pt-PT")}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  );
}

/* ---------------- Selector de idioma ---------------- */

export function LanguageSelector() {
  const { state, update } = useApp();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<LangCode | null>(null);
  const lang = state.activeLang;
  const meta = LANGS[lang];
  const level = currentLevel(state, lang);
  const premium = isPremium(state);

  const choose = (l: LangCode) => {
    if (l === lang) return setOpen(false);
    if (!premium) return setConfirm(l);
    update((s) => ({ ...s, activeLang: l }));
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="mb-5 flex items-center gap-3 text-left" aria-haspopup="dialog">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-2xl shadow-[var(--shadow-card)]">{meta.flag}</span>
        <span>
          <span className="flex items-center gap-1 font-bold">
            {meta.name} <Icon name="chevron-down" size={18} />
          </span>
          <span className="block text-xs text-[var(--color-muted)]">
            O teu nível: {level}/{TOTAL_LEVELS}
          </span>
        </span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Os teus idiomas">
        <div className="flex flex-col gap-3">
          {LANG_LIST.map((l) => {
            const m = LANGS[l];
            const lv = currentLevel(state, l);
            const units = CONTENT[l].units;
            const done = units.filter((u) => unitDone(state, u.id)).length;
            return (
              <button
                key={l}
                onClick={() => choose(l)}
                className={`flex items-center gap-3 rounded-3xl p-4 text-left transition ${l === lang ? "bg-[var(--color-coral-soft)]" : "bg-[var(--color-bg)]"}`}
              >
                <span className="text-3xl">{m.flag}</span>
                <span className="flex-1">
                  <span className="flex items-center justify-between font-bold">
                    {m.name}
                    <span className="text-xs font-semibold text-[var(--color-muted)]">{state.progress[l].xp} XP</span>
                  </span>
                  <span className="block text-xs text-[var(--color-muted)]">
                    Nível {lv}/{TOTAL_LEVELS} · {done}/{units.length} unidades · tutor: {m.tutor.name}
                  </span>
                  <ProgressBar pct={(done / units.length) * 100} className="mt-2" color={m.color} />
                </span>
                {l === lang && <Icon name="check" size={22} className="text-[var(--color-coral)]" />}
              </button>
            );
          })}
          {!premium && (
            <p className="text-center text-xs text-[var(--color-muted)]">
              Plano gratuito: 1 idioma activo de cada vez (o progresso de cada idioma fica guardado).{" "}
              <Link href="/planos" className="font-bold text-[var(--color-coral)]">
                Premium: os 3 idiomas
              </Link>
            </p>
          )}
        </div>
      </Sheet>
      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title="Mudar de idioma activo?">
        {confirm && (
          <div>
            <p className="text-[var(--color-muted)]">
              No plano gratuito tens 1 idioma activo. Vais mudar de <b>{LANGS[lang].name}</b> para <b>{LANGS[confirm].name}</b>. O teu progresso fica
              guardado e podes voltar quando quiseres.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                className="btn btn-primary"
                onClick={() => {
                  update((s) => ({ ...s, activeLang: confirm }));
                  setConfirm(null);
                  setOpen(false);
                }}
              >
                Mudar para {LANGS[confirm].name}
              </button>
              <Link href="/planos" className="btn btn-soft">
                Ver Premium (3 idiomas em simultâneo)
              </Link>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

export function StreakBadge() {
  const { state } = useApp();
  const n = currentStreak(state);
  return (
    <div
      className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-bold shadow-[var(--shadow-card)] transition hover:-translate-y-0.5"
      title="Sequência de dias"
    >
      <span className={n > 0 ? "flame-alive inline-flex" : "inline-flex"}>
        <Icon name="flame" size={18} filled className="text-[var(--color-coral)]" />
      </span>
      <span key={n} className="correct-pop">
        {n}
      </span>
    </div>
  );
}

function ThemeAndNetworkBar() {
  const { state } = useApp();
  const theme = state.settings.theme ?? "light";
  const dataSaver = !!state.settings.dataSaver;
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const applyTheme = () => {
      const sysDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      const isDark = theme === "dark" || (theme === "system" && sysDark);
      document.documentElement.classList.toggle("dark", isDark);
    };
    applyTheme();
    const mq = typeof window !== "undefined" ? window.matchMedia?.("(prefers-color-scheme: dark)") : null;
    mq?.addEventListener?.("change", applyTheme);
    return () => mq?.removeEventListener?.("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOffline(!navigator.onLine);
    const onOff = () => setOffline(true);
    const onOn = () => setOffline(false);
    window.addEventListener("offline", onOff);
    window.addEventListener("online", onOn);
    return () => {
      window.removeEventListener("offline", onOff);
      window.removeEventListener("online", onOn);
    };
  }, []);

  if (!offline && !dataSaver) return null;
  return (
    <div className="fade-in mb-3 flex items-center justify-between rounded-2xl bg-[var(--color-yellow-soft)] px-3.5 py-2 text-xs font-bold text-[#8a6a12]">
      <span>{offline ? "📴 Modo offline — unidades descarregadas disponíveis" : "🪶 Modo leve activo (poupança de dados)"}</span>
      <Link href="/licoes" className="underline">
        Downloads
      </Link>
    </div>
  );
}

export function AppFrame({ children, nav = true, wide = false }: { children: React.ReactNode; nav?: boolean; wide?: boolean }) {
  const path = usePathname();
  void nav;
  return (
    <AuthGate>
      <div className={`mx-auto min-h-dvh ${wide ? "max-w-[960px]" : "max-w-[480px]"} px-5 pb-32 pt-[max(env(safe-area-inset-top),44px)]`}>
        <ThemeAndNetworkBar />
        <div key={path} className="page-enter stagger-in">
          {children}
        </div>
      </div>
      <BottomNav />
    </AuthGate>
  );
}

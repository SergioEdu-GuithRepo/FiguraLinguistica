"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Books } from "@/components/ui";

export default function EntrarPage() {
  const { ready, user, state, login, register } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "registo">("registo");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const passwordFieldId = mode === "login" ? "current-password" : "new-password";

  useEffect(() => {
    if (ready && user && state) router.replace(state.onboarded ? "/inicio" : "/boas-vindas");
  }, [ready, user, state, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPassword(false);
    setBusy(true);
    setError(null);
    const err = mode === "login" ? await login(email, password) : await register(name, email, password);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-6 pb-10 pt-12">
      <div className="relative overflow-hidden rounded-[28px] bg-[var(--color-coral)] p-6 text-white shadow-[var(--shadow-float)]">
        <div className="text-sm font-semibold opacity-90">🇬🇧 🇫🇷 🇯🇵</div>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight">FiguraLinguística</h1>
        <p className="mt-2 max-w-[70%] text-sm opacity-95">Conversa no dia-a-dia em inglês, francês e japonês. 10 a 15 minutos por dia.</p>
        <Books className="absolute -bottom-2 -right-3 w-36" />
      </div>

      <div className="mt-8 flex rounded-2xl bg-white p-1 shadow-[var(--shadow-card)]" role="tablist">
        {(["registo", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${mode === m ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-muted)]"}`}
          >
            {m === "registo" ? "Criar conta" : "Entrar"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
        {mode === "registo" && (
          <div className="flex flex-col gap-1 text-sm font-semibold">
            <label htmlFor="name">Nome</label>
            <input
              id="name"
              name="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              enterKeyHint="next"
              placeholder="Como te chamas?"
              required
            />
          </div>
        )}
        <div className="flex flex-col gap-1 text-sm font-semibold">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            spellCheck={false}
            enterKeyHint="next"
            placeholder="tu@exemplo.com"
            required
          />
        </div>
        <div className="flex flex-col gap-1 text-sm font-semibold">
          <label htmlFor={passwordFieldId}>Palavra-passe</label>
          <div className="relative flex items-center">
            <input
              id={passwordFieldId}
              name={passwordFieldId}
              className="input !pr-12"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={passwordFieldId}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              enterKeyHint="done"
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              required
            />
            <button
              type="button"
              aria-pressed={showPassword}
              aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
              title={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--color-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)] active:scale-95"
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-[var(--color-bad-soft)] px-3 py-2 text-sm font-semibold text-[var(--color-bad)]">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary mt-2" disabled={busy}>
          {busy ? "Um momento…" : mode === "login" ? "Entrar" : "Começar a aprender"}
        </button>
        <p className="mt-2 text-center text-xs text-[var(--color-muted)]">
          Os teus dados ficam guardados neste dispositivo e sincronizados na nuvem. Podes eliminar a conta e os dados a qualquer momento no Perfil.
        </p>
      </form>
    </main>
  );
}

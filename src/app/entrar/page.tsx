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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user && state) router.replace(state.onboarded ? "/inicio" : "/boas-vindas");
  }, [ready, user, state, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Nome
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Como te chamas?" required />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Email
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="tu@exemplo.com"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Palavra-passe
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            required
          />
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-[var(--color-bad-soft)] px-3 py-2 text-sm font-semibold text-[var(--color-bad)]">
            {error}
          </p>
        )}
        <button className="btn btn-primary mt-2" disabled={busy}>
          {busy ? "Um momento…" : mode === "login" ? "Entrar" : "Começar a aprender"}
        </button>
        <p className="mt-2 text-center text-xs text-[var(--color-muted)]">
          Os teus dados ficam guardados neste dispositivo. Podes eliminar a conta e os dados a qualquer momento no Perfil.
        </p>
      </form>
    </main>
  );
}

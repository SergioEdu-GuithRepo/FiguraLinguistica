"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Books } from "@/components/ui";

export default function EntrarPage() {
  const { ready, user, state, login, register, requestPasswordReset, confirmPasswordReset } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "registo" | "recuperar">("registo");
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetDelivery, setResetDelivery] = useState<"email" | "support" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const otpFormRef = useRef<HTMLFormElement | null>(null);
  const otpAbortRef = useRef<AbortController | null>(null);

  const stopWebOtpListener = useCallback(() => {
    if (otpAbortRef.current) {
      otpAbortRef.current.abort();
      otpAbortRef.current = null;
    }
  }, []);

  const startWebOtpListener = useCallback(() => {
    if (typeof window === "undefined" || !("OTPCredential" in window)) return;
    stopWebOtpListener();
    const ac = new AbortController();
    otpAbortRef.current = ac;

    void (async () => {
      try {
        const otp = (await navigator.credentials.get({
          otp: { transport: ["sms"] },
          signal: ac.signal,
        } as CredentialRequestOptions)) as { code?: string } | null;
        if (!otp?.code) return;
        setOtpCode(otp.code.replace(/\D/g, "").slice(0, 6));
        otpFormRef.current?.requestSubmit();
      } catch (err) {
        if (err && (err as Error).name === "AbortError") return;
      }
    })();
  }, [stopWebOtpListener]);

  useEffect(() => {
    if (mode === "recuperar" && resetStep === "verify") {
      startWebOtpListener();
    } else {
      stopWebOtpListener();
    }
    return () => stopWebOtpListener();
  }, [mode, resetStep, startWebOtpListener, stopWebOtpListener]);

  const passwordFieldId = mode === "login" ? "current-password" : "new-password";
  const isAccountNotFound = error?.includes("Não encontrámos uma conta");
  const isAccountExists = error?.includes("Já existe uma conta");
  const isWrongPassword = error?.includes("Palavra-passe");

  const errorTitle = isAccountNotFound
    ? "Conta ainda não registada"
    : isAccountExists
      ? "Este email já está registado"
      : isWrongPassword
        ? "Palavra-passe incorreta"
        : "Atenção";

  useEffect(() => {
    if (ready && user && state) router.replace(state.onboarded ? "/inicio" : "/boas-vindas");
  }, [ready, user, state, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPassword(false);
    setBusy(true);
    setError(null);
    setInfo(null);
    const err = mode === "login" ? await login(email, password) : await register(name, email, password);
    setBusy(false);
    if (err) setError(err);
  };

  const handleRequestReset = async (e?: React.FormEvent) => {
    e?.preventDefault();
    stopWebOtpListener();
    setBusy(true);
    setError(null);
    setInfo(null);
    const res = await requestPasswordReset(email);
    setBusy(false);
    if (res.err) {
      setError(res.err);
      return;
    }
    setResetDelivery(res.delivery ?? "support");
    setResetStep("verify");
    setInfo(
      res.delivery === "email"
        ? `Enviámos um código de 6 dígitos para ${email.trim().toLowerCase()}.`
        : "Código de 6 dígitos gerado com segurança! Se não chegar por email, pede-o ao suporte abaixo.",
    );
    startWebOtpListener();
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    stopWebOtpListener();
    setShowPassword(false);
    setBusy(true);
    setError(null);
    const err = await confirmPasswordReset(email, otpCode, newPassword);
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

      {mode !== "recuperar" ? (
        <>
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
                  setInfo(null);
                }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${mode === m ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-muted)]"}`}
              >
                {m === "registo" ? "Criar conta" : "Entrar"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} method="POST" className="mt-5 flex flex-col gap-3">
            {mode === "registo" && (
              <div className="flex flex-col gap-1 text-sm font-semibold">
                <label htmlFor="name">Nome</label>
                <input
                  id="name"
                  name="name"
                  className="input"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
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
                className={`input ${isAccountNotFound || isAccountExists ? "!border-[var(--color-bad)]" : ""}`}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                aria-invalid={Boolean(isAccountNotFound || isAccountExists) || undefined}
                aria-errormessage={isAccountNotFound || isAccountExists ? "auth-error" : undefined}
                autoComplete="username"
                spellCheck={false}
                enterKeyHint="next"
                placeholder="tu@exemplo.com"
                required
              />
            </div>
            <div className="flex flex-col gap-1 text-sm font-semibold">
              <div className="flex items-center justify-between">
                <label htmlFor={passwordFieldId}>Palavra-passe</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("recuperar");
                      setResetStep("request");
                      setError(null);
                      setInfo(null);
                    }}
                    className="text-xs font-bold text-[var(--color-coral)] hover:underline"
                  >
                    Esqueceste-te da palavra-passe?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  id={passwordFieldId}
                  name={passwordFieldId}
                  className={`input !pr-12 ${isWrongPassword ? "!border-[var(--color-bad)]" : ""}`}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  aria-invalid={Boolean(isWrongPassword) || undefined}
                  aria-errormessage={isWrongPassword ? "auth-error" : undefined}
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
              <div
                id="auth-error"
                role="alert"
                className="fade-in shake relative overflow-hidden rounded-2xl border border-[var(--color-bad)]/25 bg-[var(--color-bad-soft)] p-3.5 text-[var(--color-bad)] shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bad)]/15 text-[var(--color-bad)]" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <p className="text-sm font-extrabold leading-snug">{errorTitle}</p>
                    <p className="mt-0.5 text-xs font-medium leading-relaxed opacity-90">{error}</p>
                    {isAccountNotFound && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("registo");
                          setError(null);
                        }}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-bad)] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95 active:scale-95"
                      >
                        Criar conta com este email →
                      </button>
                    )}
                    {isAccountExists && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("login");
                          setError(null);
                        }}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-bad)] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95 active:scale-95"
                      >
                        Entrar nesta conta →
                      </button>
                    )}
                    {isWrongPassword && (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {!showPassword && (
                          <button
                            type="button"
                            onClick={() => setShowPassword(true)}
                            className="inline-flex items-center gap-1 text-xs font-extrabold underline underline-offset-2"
                          >
                            Ver palavra-passe escrita
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setMode("recuperar");
                            setResetStep("request");
                            setError(null);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-extrabold underline underline-offset-2"
                        >
                          Recuperar palavra-passe →
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Fechar aviso"
                    onClick={() => setError(null)}
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-bad)]/70 transition hover:bg-[var(--color-bad)]/10 hover:text-[var(--color-bad)]"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            <button type="submit" className="btn btn-primary mt-2" disabled={busy}>
              {busy ? "Um momento…" : mode === "login" ? "Entrar" : "Começar a aprender"}
            </button>
            <p className="mt-2 text-center text-xs text-[var(--color-muted)]">
              Os teus dados ficam guardados neste dispositivo e sincronizados na nuvem. Podes eliminar a conta e os dados a qualquer momento no Perfil.
            </p>
          </form>
        </>
      ) : (
        <div className="card mt-7 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold">Recuperar palavra-passe</h2>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setInfo(null);
              }}
              className="text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              ← Voltar
            </button>
          </div>

          {resetStep === "request" ? (
            <form onSubmit={handleRequestReset} method="POST" className="mt-4 flex flex-col gap-3">
              <p className="text-xs text-[var(--color-muted)]">
                Indica o email da tua conta para receberes um código único de 6 dígitos (válido durante 15 minutos).
              </p>
              <div className="flex flex-col gap-1 text-sm font-semibold">
                <label htmlFor="reset-email">Email da conta</label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="tu@exemplo.com"
                  required
                />
              </div>
              {error && (
                <div role="alert" className="rounded-2xl bg-[var(--color-bad-soft)] p-3 text-xs font-bold text-[var(--color-bad)]">
                  {error}
                </div>
              )}
              <button type="submit" className="btn btn-primary mt-1" disabled={busy}>
                {busy ? "A gerar código…" : "Enviar código de 6 dígitos"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetStep("verify");
                  setError(null);
                }}
                className="text-center text-xs font-bold text-[var(--color-muted)] underline"
              >
                Já tenho um código de 6 dígitos
              </button>
            </form>
          ) : (
            <form id="otp-form" ref={otpFormRef} onSubmit={handleConfirmReset} method="POST" className="mt-4 flex flex-col gap-3">
              {info && (
                <div className="rounded-2xl bg-[var(--color-good-soft)] p-3 text-xs font-semibold text-[var(--color-good)]">
                  {info}
                </div>
              )}
              {resetDelivery === "support" && (
                <div className="rounded-2xl bg-[var(--color-yellow-soft)] p-3 text-xs text-[#7a5d0f]">
                  <b>Apoio directo:</b> se não recebeste o email automático, pede o código gerado ao suporte indicando o teu email:{" "}
                  <a
                    className="font-extrabold underline"
                    href={`mailto:sergio.eduardo.kuroko@gmail.com?subject=${encodeURIComponent("Código de recuperação FiguraLinguística")}&body=${encodeURIComponent(`Olá! Pedi a recuperação da palavra-passe para a conta ${email.trim().toLowerCase()}. Podes enviar-me o código de 6 dígitos?`)}`}
                  >
                    pedir código por email →
                  </a>
                </div>
              )}

              <div className="flex flex-col gap-1 text-sm font-semibold">
                <label htmlFor="otp-input">Código de verificação</label>
                <p id="otp-format-hint" className="text-xs font-normal text-[var(--color-muted)]">
                  Introduz o código de 6 dígitos associado a <b>{email.trim().toLowerCase() || "a tua conta"}</b>.
                </p>
                <input
                  type="text"
                  id="otp-input"
                  name="otp"
                  className="input otp-input mt-0.5"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  aria-describedby="otp-format-hint"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    if (error) setError(null);
                  }}
                  placeholder="000000"
                  required
                />
              </div>

              <div className="flex flex-col gap-1 text-sm font-semibold">
                <label htmlFor="reset-new-password">Nova palavra-passe</label>
                <div className="relative flex items-center">
                  <input
                    id="reset-new-password"
                    name="new-password"
                    type={showPassword ? "text" : "password"}
                    className="input !pr-12"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    autoComplete="new-password"
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1 inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--color-muted)]"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="rounded-2xl bg-[var(--color-bad-soft)] p-3 text-xs font-bold text-[var(--color-bad)]">
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary mt-1" disabled={busy}>
                {busy ? "A validar…" : "Guardar nova palavra-passe e entrar"}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void handleRequestReset()}
                className="text-center text-xs font-bold text-[var(--color-coral)] hover:underline"
              >
                Pedir novo código
              </button>
            </form>
          )}
        </div>
      )}
    </main>
  );
}

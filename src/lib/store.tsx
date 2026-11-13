"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { defaultState, reconcileUserXp, type Plan, type UserState } from "./state";

interface Account {
  id: string;
  name: string;
  email: string;
  salt: string;
  hash: string;
  createdAt: number;
  cloudToken?: string;
  pendingPassword?: string;
  isAdmin?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export type SyncStatus = "synced" | "syncing" | "offline" | "local";
export type CloudProviderName = "supabase" | "local-cloud";

interface StoreValue {
  ready: boolean;
  user: AuthUser | null;
  state: UserState | null;
  isAdmin: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  cloudProvider: CloudProviderName;
  syncNow: () => Promise<boolean>;
  update: (fn: (s: UserState) => UserState) => void;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  requestPasswordReset: (email: string) => Promise<{ err: string | null; delivery?: "email" | "support" }>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<string | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
  redeemPassCode: (code: string) => Promise<{ err: string | null; plan?: Plan }>;
  getCloudAuthHeaders: () => Record<string, string>;
  logout: () => void;
  deleteAccount: () => void;
  resetProgress: () => void;
}

const ACCOUNTS = "fl:accounts";
const SESSION = "fl:session";
const FOUNDER_EMAIL = "sergio.eduardo.kuroko@gmail.com";
const stateKey = (id: string) => `fl:state:${id}`;
const updatedKey = (id: string) => `fl:updated:${id}`;
const syncedKey = (id: string) => `fl:synced:${id}`;

const StoreCtx = createContext<StoreValue | null>(null);

function readAccounts(): Record<string, Account> {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS) || "{}");
  } catch {
    return {};
  }
}

function writeAccounts(accounts: Record<string, Account>) {
  try {
    localStorage.setItem(ACCOUNTS, JSON.stringify(accounts));
  } catch {
    /* quota cheia */
  }
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let h1 = 0xdeadbeef,
    h2 = 0x41c6ce57;
  for (const ch of data) {
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  return ((h2 >>> 0).toString(16) + (h1 >>> 0).toString(16)).padStart(16, "0");
}

function hydrateState(parsed: Partial<UserState>, name: string): UserState {
  const base = defaultState(name);
  return reconcileUserXp({
    ...base,
    ...parsed,
    settings: { ...base.settings, ...(parsed.settings ?? {}) },
    progress: { ...base.progress, ...(parsed.progress ?? {}) },
    srs: { ...base.srs, ...(parsed.srs ?? {}) },
    errors: { ...base.errors, ...(parsed.errors ?? {}) },
    streak: { ...base.streak, ...(parsed.streak ?? {}) },
  });
}

function loadState(id: string, name: string): UserState {
  try {
    const raw = localStorage.getItem(stateKey(id));
    if (raw) {
      return hydrateState(JSON.parse(raw) as UserState, name);
    }
  } catch {
    /* estado corrompido: recomeçar */
  }
  return defaultState(name);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [state, setState] = useState<UserState | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [cloudProvider, setCloudProvider] = useState<CloudProviderName>("local-cloud");

  const userRef = useRef<AuthUser | null>(null);
  const stateRef = useRef<UserState | null>(null);
  const forceReplaceRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  userRef.current = user;
  stateRef.current = state;

  const performSync = useCallback(async (forceReplace = false): Promise<boolean> => {
    const u = userRef.current;
    const st = stateRef.current;
    if (!u || !st || typeof window === "undefined") return false;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setSyncStatus("offline");
      return false;
    }

    const accounts = readAccounts();
    const acc = accounts[u.email];
    if (!acc) return false;

    setSyncStatus("syncing");
    try {
      // Se a conta foi criada offline e ainda não tem token da nuvem, regista/sincroniza primeiro
      if (!acc.cloudToken && acc.pendingPassword) {
        const regRes = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "register",
            id: acc.id,
            name: acc.name,
            email: acc.email,
            password: acc.pendingPassword,
            state: st,
          }),
        });
        if (regRes.ok) {
          const data = await regRes.json();
          acc.id = data.user.id;
          acc.cloudToken = data.token;
          acc.isAdmin = Boolean(data.isAdmin ?? acc.email === FOUNDER_EMAIL);
          delete acc.pendingPassword;
          accounts[u.email] = acc;
          writeAccounts(accounts);
          localStorage.setItem(SESSION, acc.id);
          const merged = hydrateState(data.state, acc.name);
          const now = Number(data.updatedAt) || Date.now();
          localStorage.setItem(stateKey(acc.id), JSON.stringify(merged));
          localStorage.setItem(updatedKey(acc.id), String(now));
          localStorage.setItem(syncedKey(acc.id), String(now));
          if (data.provider) setCloudProvider(data.provider);
          setIsAdmin(acc.isAdmin);
          setLastSyncedAt(now);
          setSyncStatus("synced");
          setState(merged);
          return true;
        }
      }

      if (!acc.cloudToken) {
        acc.cloudToken = (randomId() + randomId()).replace(/[^a-z0-9]/gi, "").padEnd(64, "0").slice(0, 64);
        accounts[u.email] = acc;
        writeAccounts(accounts);
      }

      const localUpdated = Number(localStorage.getItem(updatedKey(u.id)) || Date.now());
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: u.id,
          email: u.email,
          token: acc.cloudToken,
          state: st,
          updatedAt: localUpdated,
          forceReplace,
        }),
      });

      if (!res.ok) {
        setSyncStatus("local");
        return false;
      }

      const data = await res.json();
      const now = Number(data.updatedAt) || Date.now();
      const merged = hydrateState(data.state, u.name);
      if (typeof data.isAdmin === "boolean") {
        acc.isAdmin = data.isAdmin;
        accounts[u.email] = acc;
        writeAccounts(accounts);
        setIsAdmin(data.isAdmin);
      }
      localStorage.setItem(stateKey(u.id), JSON.stringify(merged));
      localStorage.setItem(updatedKey(u.id), String(now));
      localStorage.setItem(syncedKey(u.id), String(now));
      if (data.provider) setCloudProvider(data.provider);
      setLastSyncedAt(now);
      setSyncStatus("synced");
      if (JSON.stringify(merged) !== JSON.stringify(st)) {
        setState(merged);
      }
      return true;
    } catch {
      setSyncStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "local");
      return false;
    }
  }, []);

  useEffect(() => {
    const id = localStorage.getItem(SESSION);
    if (id) {
      const acc = Object.values(readAccounts()).find((a) => a.id === id);
      if (acc) {
        const loaded = loadState(acc.id, acc.name);
        setUser({ id: acc.id, name: acc.name, email: acc.email });
        setState(loaded);
        setIsAdmin(Boolean(acc.isAdmin ?? acc.email === FOUNDER_EMAIL));
        const lastSync = Number(localStorage.getItem(syncedKey(acc.id)) || 0);
        if (lastSync > 0) setLastSyncedAt(lastSync);
        if (acc.cloudToken) setSyncStatus("synced");
      }
    }
    setReady(true);
  }, []);

  // Sincronização inicial ao abrir a app, ao focar o separador/ecrã ou ao recuperar ligação
  useEffect(() => {
    if (!ready || !user) return;
    const t = setTimeout(() => {
      void performSync(false);
    }, 300);
    const onOnline = () => void performSync(false);
    const onFocus = () => void performSync(false);
    const onVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void performSync(false);
      }
    };
    const interval = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        void performSync(false);
      }
    }, 20_000);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ready, user, performSync]);

  // Persistir localmente em 0ms + agendar sincronização na nuvem (debounce 900ms)
  useEffect(() => {
    if (!user || !state) return;
    const now = Date.now();
    try {
      localStorage.setItem(stateKey(user.id), JSON.stringify(state));
      localStorage.setItem(updatedKey(user.id), String(now));
    } catch {
      /* quota cheia */
    }
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    const replace = forceReplaceRef.current;
    forceReplaceRef.current = false;
    syncTimerRef.current = setTimeout(() => {
      void performSync(replace);
    }, 900);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [user, state, performSync]);

  const update = useCallback((fn: (s: UserState) => UserState) => {
    setState((s) => (s ? fn(s) : s));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const e = email.trim().toLowerCase();
    if (!name.trim()) return "Indica o teu nome.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return "Email inválido.";
    if (password.length < 6) return "A palavra-passe deve ter pelo menos 6 caracteres.";
    const accounts = readAccounts();
    const existingLocal = accounts[e];

    const localId = existingLocal?.id ?? randomId();
    const salt = existingLocal?.salt ?? randomId();
    const localHash = await hashPassword(password, salt);
    let st = existingLocal ? loadState(existingLocal.id, name.trim()) : defaultState(name.trim());
    let finalId = localId;
    let cloudToken: string | undefined;
    let pendingPassword: string | undefined = password;
    let adminFlag = e === FOUNDER_EMAIL;

    // Regista também na base de dados na nuvem (com fallback offline transparente)
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          id: localId,
          name: name.trim(),
          email: e,
          password,
          state: st,
        }),
      });
      if (res.status === 409) {
        return "Já existe uma conta com este email.";
      }
      if (res.ok) {
        const data = await res.json();
        finalId = data.user.id;
        cloudToken = data.token;
        pendingPassword = undefined;
        adminFlag = Boolean(data.isAdmin ?? adminFlag);
        st = hydrateState(data.state, name.trim());
        const now = Number(data.updatedAt) || Date.now();
        localStorage.setItem(syncedKey(finalId), String(now));
        setLastSyncedAt(now);
        setSyncStatus("synced");
        if (data.provider) setCloudProvider(data.provider);
      }
    } catch {
      if (existingLocal) return "Já existe uma conta com este email.";
      setSyncStatus("offline");
    }

    const acc: Account = {
      id: finalId,
      name: name.trim(),
      email: e,
      salt,
      hash: localHash,
      createdAt: existingLocal?.createdAt ?? Date.now(),
      cloudToken,
      pendingPassword,
      isAdmin: adminFlag,
    };
    accounts[e] = acc;
    writeAccounts(accounts);
    localStorage.setItem(SESSION, acc.id);
    localStorage.setItem(stateKey(acc.id), JSON.stringify(st));
    localStorage.setItem(updatedKey(acc.id), String(Date.now()));
    setIsAdmin(adminFlag);
    setUser({ id: acc.id, name: acc.name, email: acc.email });
    setState(st);
    return null;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const e = email.trim().toLowerCase();
    const accounts = readAccounts();
    const localAcc = accounts[e];
    const localState = localAcc ? loadState(localAcc.id, localAcc.name) : undefined;
    const localUpdated = localAcc ? Number(localStorage.getItem(updatedKey(localAcc.id)) || 0) : undefined;
    let cloudNotFound = false;

    // 1) Tenta autenticar na base de dados na nuvem (permite entrar em qualquer dispositivo)
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: e,
          password,
          state: localState,
          updatedAt: localUpdated,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const salt = localAcc?.salt ?? randomId();
        const hash = await hashPassword(password, salt);
        const merged = hydrateState(data.state, data.user.name);
        const now = Number(data.updatedAt) || Date.now();
        const adminFlag = Boolean(data.isAdmin ?? e === FOUNDER_EMAIL);
        const acc: Account = {
          id: data.user.id,
          name: data.user.name,
          email: e,
          salt,
          hash,
          createdAt: localAcc?.createdAt ?? now,
          cloudToken: data.token,
          isAdmin: adminFlag,
        };
        accounts[e] = acc;
        writeAccounts(accounts);
        localStorage.setItem(SESSION, acc.id);
        localStorage.setItem(stateKey(acc.id), JSON.stringify(merged));
        localStorage.setItem(updatedKey(acc.id), String(now));
        localStorage.setItem(syncedKey(acc.id), String(now));
        if (data.provider) setCloudProvider(data.provider);
        setIsAdmin(adminFlag);
        setLastSyncedAt(now);
        setSyncStatus("synced");
        setUser({ id: acc.id, name: acc.name, email: acc.email });
        setState(merged);
        return null;
      }
      if (res.status === 401) {
        return "Palavra-passe incorrecta.";
      }
      if (res.status === 404) {
        cloudNotFound = true;
      }
    } catch {
      /* sem rede: recorre à conta local */
    }

    // 2) Recurso local (e migração automática para a nuvem se a conta foi criada antes do Supabase)
    if (!localAcc) return "Não encontrámos uma conta com este email.";
    const h = await hashPassword(password, localAcc.salt);
    if (h !== localAcc.hash) return "Palavra-passe incorrecta.";

    if (cloudNotFound && localState) {
      try {
        const migRes = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "register",
            id: localAcc.id,
            name: localAcc.name,
            email: e,
            password,
            state: localState,
          }),
        });
        if (migRes.ok) {
          const data = await migRes.json();
          const merged = hydrateState(data.state, data.user.name);
          const now = Number(data.updatedAt) || Date.now();
          const adminFlag = Boolean(data.isAdmin ?? e === FOUNDER_EMAIL);
          const acc: Account = {
            ...localAcc,
            id: data.user.id,
            cloudToken: data.token,
            pendingPassword: undefined,
            isAdmin: adminFlag,
          };
          accounts[e] = acc;
          writeAccounts(accounts);
          localStorage.setItem(SESSION, acc.id);
          localStorage.setItem(stateKey(acc.id), JSON.stringify(merged));
          localStorage.setItem(updatedKey(acc.id), String(now));
          localStorage.setItem(syncedKey(acc.id), String(now));
          if (data.provider) setCloudProvider(data.provider);
          setIsAdmin(adminFlag);
          setLastSyncedAt(now);
          setSyncStatus("synced");
          setUser({ id: acc.id, name: acc.name, email: acc.email });
          setState(merged);
          return null;
        }
      } catch {
        /* mantém sessão local */
      }
    }

    localAcc.pendingPassword = password;
    accounts[e] = localAcc;
    writeAccounts(accounts);
    localStorage.setItem(SESSION, localAcc.id);
    setIsAdmin(Boolean(localAcc.isAdmin ?? e === FOUNDER_EMAIL));
    setUser({ id: localAcc.id, name: localAcc.name, email: localAcc.email });
    setState(localState ?? defaultState(localAcc.name));
    setSyncStatus("offline");
    return null;
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const e = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      return { err: "Indica um endereço de email válido." };
    }
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request-reset", email: e }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { err: (data.error as string) || "Não foi possível pedir o código." };
      }
      return { err: null, delivery: (data.delivery as "email" | "support") ?? "support" };
    } catch {
      return { err: "Sem ligação à internet. Verifica a rede e tenta novamente." };
    }
  }, []);

  const confirmPasswordReset = useCallback(async (email: string, code: string, newPassword: string) => {
    const e = email.trim().toLowerCase();
    const cleanCode = code.trim();
    if (!/^\d{6}$/.test(cleanCode)) return "Indica o código de 6 dígitos.";
    if (newPassword.length < 6) return "A nova palavra-passe deve ter pelo menos 6 caracteres.";
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm-reset",
          email: e,
          code: cleanCode,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return (data.error as string) || "Não foi possível redefinir a palavra-passe.";
      }

      const accounts = readAccounts();
      const localAcc = accounts[e];
      const salt = localAcc?.salt ?? randomId();
      const hash = await hashPassword(newPassword, salt);
      const merged = hydrateState(data.state, data.user.name);
      const now = Number(data.updatedAt) || Date.now();
      const adminFlag = Boolean(data.isAdmin ?? e === FOUNDER_EMAIL);
      const acc: Account = {
        id: data.user.id,
        name: data.user.name,
        email: e,
        salt,
        hash,
        createdAt: localAcc?.createdAt ?? now,
        cloudToken: data.token,
        isAdmin: adminFlag,
      };
      accounts[e] = acc;
      writeAccounts(accounts);
      localStorage.setItem(SESSION, acc.id);
      localStorage.setItem(stateKey(acc.id), JSON.stringify(merged));
      localStorage.setItem(updatedKey(acc.id), String(now));
      localStorage.setItem(syncedKey(acc.id), String(now));
      if (data.provider) setCloudProvider(data.provider);
      setIsAdmin(adminFlag);
      setLastSyncedAt(now);
      setSyncStatus("synced");
      setUser({ id: acc.id, name: acc.name, email: acc.email });
      setState(merged);
      return null;
    } catch {
      return "Sem ligação à internet. Verifica a rede e tenta novamente.";
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const u = userRef.current;
    if (!u) return "Sessão inválida.";
    if (newPassword.length < 6) return "A nova palavra-passe deve ter pelo menos 6 caracteres.";
    const accounts = readAccounts();
    const acc = accounts[u.email];
    if (!acc) return "Conta não encontrada neste dispositivo.";

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          userId: u.id,
          email: u.email,
          token: acc.cloudToken || "",
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return (data.error as string) || "Não foi possível alterar a palavra-passe.";
      }
      const salt = randomId();
      const hash = await hashPassword(newPassword, salt);
      acc.salt = salt;
      acc.hash = hash;
      if (data.token) acc.cloudToken = data.token;
      accounts[u.email] = acc;
      writeAccounts(accounts);
      return null;
    } catch {
      return "Precisas de ligação à internet para alterar a palavra-passe na nuvem.";
    }
  }, []);

  const redeemPassCode = useCallback(async (code: string) => {
    const u = userRef.current;
    if (!u) return { err: "Entra na tua conta primeiro." };
    const clean = code.trim().toUpperCase();
    if (clean.length < 4) return { err: "Indica um código de activação válido." };
    const accounts = readAccounts();
    const acc = accounts[u.email];
    if (!acc?.cloudToken) {
      await performSync(false);
    }
    const freshAcc = readAccounts()[u.email];
    if (!freshAcc?.cloudToken) {
      return { err: "Precisas de ligação à internet para validar o código." };
    }

    try {
      const res = await fetch("/api/passes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: u.id,
          email: u.email,
          token: freshAcc.cloudToken,
          code: clean,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { err: (data.error as string) || "Não foi possível activar o código." };
      }
      const now = Number(data.updatedAt) || Date.now();
      const merged = hydrateState(data.state, u.name);
      localStorage.setItem(stateKey(u.id), JSON.stringify(merged));
      localStorage.setItem(updatedKey(u.id), String(now));
      localStorage.setItem(syncedKey(u.id), String(now));
      setLastSyncedAt(now);
      setSyncStatus("synced");
      setState(merged);
      return { err: null, plan: data.plan as Plan };
    } catch {
      return { err: "Sem ligação à internet. Tenta novamente em instantes." };
    }
  }, [performSync]);

  const getCloudAuthHeaders = useCallback((): Record<string, string> => {
    const u = userRef.current;
    if (!u) return {};
    const acc = readAccounts()[u.email];
    return {
      Authorization: `Bearer ${acc?.cloudToken || ""}`,
      "x-user-id": u.id,
      "x-user-email": u.email,
    };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION);
    setUser(null);
    setState(null);
    setIsAdmin(false);
  }, []);

  const deleteAccount = useCallback(() => {
    const u = userRef.current;
    if (!u) return;
    const accounts = readAccounts();
    const acc = accounts[u.email];
    if (acc?.cloudToken) {
      fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", userId: u.id, token: acc.cloudToken }),
      }).catch(() => undefined);
    }
    delete accounts[u.email];
    writeAccounts(accounts);
    localStorage.removeItem(stateKey(u.id));
    localStorage.removeItem(updatedKey(u.id));
    localStorage.removeItem(syncedKey(u.id));
    localStorage.removeItem(SESSION);
    setUser(null);
    setState(null);
    setIsAdmin(false);
  }, []);

  const resetProgress = useCallback(() => {
    const u = userRef.current;
    if (!u) return;
    forceReplaceRef.current = true;
    setState((s) => {
      const fresh = defaultState(u.name);
      return s ? { ...fresh, onboarded: true, activeLang: s.activeLang, settings: s.settings, plan: s.plan, planExpires: s.planExpires } : fresh;
    });
  }, []);

  const syncNow = useCallback(() => performSync(false), [performSync]);

  const value = useMemo(
    () => ({
      ready,
      user,
      state,
      isAdmin,
      syncStatus,
      lastSyncedAt,
      cloudProvider,
      syncNow,
      update,
      register,
      login,
      requestPasswordReset,
      confirmPasswordReset,
      changePassword,
      redeemPassCode,
      getCloudAuthHeaders,
      logout,
      deleteAccount,
      resetProgress,
    }),
    [
      ready,
      user,
      state,
      isAdmin,
      syncStatus,
      lastSyncedAt,
      cloudProvider,
      syncNow,
      update,
      register,
      login,
      requestPasswordReset,
      confirmPasswordReset,
      changePassword,
      redeemPassCode,
      getCloudAuthHeaders,
      logout,
      deleteAccount,
      resetProgress,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreCtx);
  if (!v) throw new Error("useStore fora do StoreProvider");
  return v;
}

/** Para componentes dentro da área autenticada (estado garantido). */
export function useApp() {
  const { state, update, user, isAdmin } = useStore();
  if (!state || !user) throw new Error("useApp sem sessão");
  return { state, update, user, isAdmin };
}

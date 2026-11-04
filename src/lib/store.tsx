"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { defaultState, type UserState } from "./state";

interface Account {
  id: string;
  name: string;
  email: string;
  salt: string;
  hash: string;
  createdAt: number;
  cloudToken?: string;
  pendingPassword?: string;
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
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  cloudProvider: CloudProviderName;
  syncNow: () => Promise<boolean>;
  update: (fn: (s: UserState) => UserState) => void;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  deleteAccount: () => void;
  resetProgress: () => void;
}

const ACCOUNTS = "fl:accounts";
const SESSION = "fl:session";
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
  return {
    ...base,
    ...parsed,
    settings: { ...base.settings, ...(parsed.settings ?? {}) },
    progress: { ...base.progress, ...(parsed.progress ?? {}) },
    srs: { ...base.srs, ...(parsed.srs ?? {}) },
    errors: { ...base.errors, ...(parsed.errors ?? {}) },
    streak: { ...base.streak, ...(parsed.streak ?? {}) },
  };
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
          setLastSyncedAt(now);
          setSyncStatus("synced");
          setState(merged);
          return true;
        }
      }

      if (!acc.cloudToken) {
        setSyncStatus("local");
        return false;
      }

      const localUpdated = Number(localStorage.getItem(updatedKey(u.id)) || Date.now());
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: u.id,
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
      localStorage.setItem(stateKey(u.id), JSON.stringify(merged));
      localStorage.setItem(updatedKey(u.id), String(now));
      localStorage.setItem(syncedKey(u.id), String(now));
      if (data.provider) setCloudProvider(data.provider);
      setLastSyncedAt(now);
      setSyncStatus("synced");
      if (merged.plan !== st.plan) {
        setState((cur) => (cur ? { ...cur, plan: merged.plan, planExpires: merged.planExpires } : cur));
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
        const lastSync = Number(localStorage.getItem(syncedKey(acc.id)) || 0);
        if (lastSync > 0) setLastSyncedAt(lastSync);
        if (acc.cloudToken) setSyncStatus("synced");
      }
    }
    setReady(true);
  }, []);

  // Sincronização inicial ao abrir a app ou recuperar ligação
  useEffect(() => {
    if (!ready || !user) return;
    const t = setTimeout(() => {
      void performSync(false);
    }, 300);
    const onOnline = () => void performSync(false);
    window.addEventListener("online", onOnline);
    return () => {
      clearTimeout(t);
      window.removeEventListener("online", onOnline);
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
    if (accounts[e]) return "Já existe uma conta com este email.";

    const localId = randomId();
    const salt = randomId();
    const localHash = await hashPassword(password, salt);
    let st = defaultState(name.trim());
    let finalId = localId;
    let cloudToken: string | undefined;
    let pendingPassword: string | undefined = password;

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
        st = hydrateState(data.state, name.trim());
        const now = Number(data.updatedAt) || Date.now();
        localStorage.setItem(syncedKey(finalId), String(now));
        setLastSyncedAt(now);
        setSyncStatus("synced");
        if (data.provider) setCloudProvider(data.provider);
      }
    } catch {
      setSyncStatus("offline");
    }

    const acc: Account = {
      id: finalId,
      name: name.trim(),
      email: e,
      salt,
      hash: localHash,
      createdAt: Date.now(),
      cloudToken,
      pendingPassword,
    };
    accounts[e] = acc;
    writeAccounts(accounts);
    localStorage.setItem(SESSION, acc.id);
    localStorage.setItem(stateKey(acc.id), JSON.stringify(st));
    localStorage.setItem(updatedKey(acc.id), String(Date.now()));
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
        const acc: Account = {
          id: data.user.id,
          name: data.user.name,
          email: e,
          salt,
          hash,
          createdAt: localAcc?.createdAt ?? now,
          cloudToken: data.token,
        };
        accounts[e] = acc;
        writeAccounts(accounts);
        localStorage.setItem(SESSION, acc.id);
        localStorage.setItem(stateKey(acc.id), JSON.stringify(merged));
        localStorage.setItem(updatedKey(acc.id), String(now));
        localStorage.setItem(syncedKey(acc.id), String(now));
        if (data.provider) setCloudProvider(data.provider);
        setLastSyncedAt(now);
        setSyncStatus("synced");
        setUser({ id: acc.id, name: acc.name, email: acc.email });
        setState(merged);
        return null;
      }
      if (res.status === 401) {
        return "Palavra-passe incorrecta.";
      }
    } catch {
      /* sem rede: recorre à conta local */
    }

    // 2) Recurso offline local
    if (!localAcc) return "Não encontrámos uma conta com este email.";
    const h = await hashPassword(password, localAcc.salt);
    if (h !== localAcc.hash) return "Palavra-passe incorrecta.";
    localStorage.setItem(SESSION, localAcc.id);
    setUser({ id: localAcc.id, name: localAcc.name, email: localAcc.email });
    setState(loadState(localAcc.id, localAcc.name));
    setSyncStatus("offline");
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION);
    setUser(null);
    setState(null);
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
      syncStatus,
      lastSyncedAt,
      cloudProvider,
      syncNow,
      update,
      register,
      login,
      logout,
      deleteAccount,
      resetProgress,
    }),
    [ready, user, state, syncStatus, lastSyncedAt, cloudProvider, syncNow, update, register, login, logout, deleteAccount, resetProgress],
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
  const { state, update, user } = useStore();
  if (!state || !user) throw new Error("useApp sem sessão");
  return { state, update, user };
}

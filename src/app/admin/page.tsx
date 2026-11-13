"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Sheet } from "@/components/Sheet";
import { AppFrame } from "@/components/Shell";
import { Toast, TopBar } from "@/components/ui";
import { LANGS } from "@/lib/langs";
import { sfxSuccess } from "@/lib/sfx";
import type { Plan } from "@/lib/state";
import { useApp, useStore } from "@/lib/store";
import type { LangCode } from "@/lib/types";

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  planExpires?: number;
  premiumActive: boolean;
  activeLang: LangCode;
  level: number;
  xpEn: number;
  xpFr: number;
  xpJa: number;
  totalXp: number;
  conversations: number;
  streak: number;
  updatedAt: number;
  createdAt: string;
}

interface PassCodeRow {
  code: string;
  plan: Plan;
  days: number | null;
  maxUses: number;
  usedBy: { email: string; name: string; at: number }[];
  note?: string;
  createdAt: number;
}

interface ResetRow {
  email: string;
  adminCode: string;
  expiresAt: number;
  attempts: number;
  requestedAt: number;
}

interface ReportRow {
  userEmail: string;
  ref: string;
  text: string;
  reason: string;
  at: number;
}

interface AdminOverviewData {
  provider: string;
  stats: {
    totalUsers: number;
    active24h: number;
    active7d: number;
    premiumCount: number;
    totalXpAll: number;
    totalConvsAll: number;
  };
  users: AdminUserRow[];
  passCodes: PassCodeRow[];
  resetRequests: ResetRow[];
  reports: ReportRow[];
}

const PLAN_PRESETS: { label: string; plan: Plan; days: number | null; uses: number }[] = [
  { label: "Passe Semanal (7 dias)", plan: "pass-week", days: 7, uses: 1 },
  { label: "Passe Mensal (30 dias)", plan: "pass-month", days: 30, uses: 1 },
  { label: "Premium Trimestral (90 dias)", plan: "premium", days: 90, uses: 1 },
  { label: "Premium Anual (365 dias)", plan: "premium", days: 365, uses: 1 },
  { label: "Turma / Escola (365d · 30 vagas)", plan: "school", days: 365, uses: 30 },
  { label: "👑 Vitalício", plan: "lifetime", days: null, uses: 1 },
];

const PLAN_BADGE: Record<Plan, string> = {
  free: "Gratuito",
  "pass-week": "Passe 7d",
  "pass-month": "Passe 30d",
  premium: "Premium",
  school: "Escola",
  lifetime: "👑 Vitalício",
};

function AdminDashboard() {
  const { state, isAdmin } = useApp();
  const { getCloudAuthHeaders, syncNow } = useStore();
  const router = useRouter();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [presetIdx, setPresetIdx] = useState(1);
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const soundOn = state.settings.soundEffects !== false;

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      await syncNow();
      const res = await fetch("/api/admin", {
        headers: getCloudAuthHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((json.error as string) || "Não foi possível carregar o painel.");
        setLoading(false);
        return;
      }
      setData(json as AdminOverviewData);
    } catch {
      setErr("Erro de rede ao comunicar com o servidor.");
    } finally {
      setLoading(false);
    }
  }, [getCloudAuthHeaders, syncNow]);

  useEffect(() => {
    if (isAdmin) void loadOverview();
    else setLoading(false);
  }, [isAdmin, loadOverview]);

  const copyText = async (txt: string, msg = "Copiado para a área de transferência ✓") => {
    try {
      await navigator.clipboard.writeText(txt);
      sfxSuccess(soundOn);
      setToast(msg);
    } catch {
      setToast(txt);
    }
  };

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    const preset = PLAN_PRESETS[presetIdx];
    setCreating(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getCloudAuthHeaders(),
        },
        body: JSON.stringify({
          action: "create-pass",
          plan: preset.plan,
          days: preset.days,
          maxUses: preset.uses,
          note: note.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.pass) {
        setNote("");
        sfxSuccess(soundOn);
        setToast(`Código ${json.pass.code} criado!`);
        await loadOverview();
      } else {
        setToast((json.error as string) || "Erro ao criar código.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePass = async (code: string) => {
    await fetch("/api/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getCloudAuthHeaders(),
      },
      body: JSON.stringify({ action: "delete-pass", code }),
    });
    setToast(`Código ${code} removido.`);
    await loadOverview();
  };

  const handleSetUserPlan = async (email: string, plan: Plan, days: number | null) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getCloudAuthHeaders(),
      },
      body: JSON.stringify({ action: "set-plan", targetEmail: email, plan, days }),
    });
    if (res.ok) {
      sfxSuccess(soundOn);
      setSelectedUser(null);
      setToast(`Plano actualizado para ${email} ✓`);
      await loadOverview();
    }
  };

  const handleGenerateReset = async (email: string) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getCloudAuthHeaders(),
      },
      body: JSON.stringify({ action: "generate-reset", targetEmail: email }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.code) {
      await copyText(String(json.code), `Código ${json.code} gerado e copiado para ${email}!`);
      await loadOverview();
    }
  };

  if (!isAdmin) {
    return (
      <>
        <TopBar back={() => router.push("/perfil")} title="Painel do Fundador" />
        <div className="card p-6 text-center">
          <div className="text-3xl">🔒</div>
          <h2 className="mt-2 text-lg font-extrabold">Acesso reservado ao fundador</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Esta área é exclusiva da administração da FiguraLinguística.</p>
          <button className="btn btn-primary mt-4" onClick={() => router.push("/inicio")}>
            Voltar ao Início
          </button>
        </div>
      </>
    );
  }

  const q = search.trim().toLowerCase();
  const filteredUsers = (data?.users ?? []).filter(
    (u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  );

  return (
    <>
      <TopBar
        back={() => router.push("/perfil")}
        title="🛡️ Painel do Fundador"
        right={
          <button type="button" onClick={() => void loadOverview()} className="chip !px-3 text-xs font-bold" disabled={loading}>
            <Icon name="refresh" size={16} /> {loading ? "…" : "Actualizar"}
          </button>
        }
      />

      {err && (
        <div className="mb-4 rounded-2xl bg-[var(--color-bad-soft)] p-4 text-sm font-bold text-[var(--color-bad)]">
          {err}
        </div>
      )}

      {data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="card p-4">
              <div className="text-xs text-[var(--color-muted)]">Total de contas ({data.provider})</div>
              <div className="mt-1 text-2xl font-extrabold">{data.stats.totalUsers}</div>
              <div className="text-[11px] text-[var(--color-good)]">{data.stats.active24h} activos hoje · {data.stats.active7d} em 7d</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-[var(--color-muted)]">Subscrições activas</div>
              <div className="mt-1 text-2xl font-extrabold">{data.stats.premiumCount}</div>
              <div className="text-[11px] text-[var(--color-muted)]">Premium, Passes e Vitalício</div>
            </div>
            <div className="card col-span-2 p-4 sm:col-span-1">
              <div className="text-xs text-[var(--color-muted)]">Estudo acumulado</div>
              <div className="mt-1 text-2xl font-extrabold">{data.stats.totalXpAll} XP</div>
              <div className="text-[11px] text-[var(--color-muted)]">{data.stats.totalConvsAll} conversas concluídas</div>
            </div>
          </div>

          {/* Gerador de Códigos de Passe */}
          <section className="mt-6">
            <h2 className="mb-2 font-extrabold">Gerar código de passe (Multicaixa / Escola)</h2>
            <form onSubmit={handleCreatePass} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="pass-preset" className="block text-xs font-bold text-[var(--color-muted)]">
                  Plano a desbloquear
                </label>
                <select
                  id="pass-preset"
                  value={presetIdx}
                  onChange={(e) => setPresetIdx(Number(e.target.value))}
                  className="input mt-1 !py-2.5 text-sm font-semibold"
                >
                  {PLAN_PRESETS.map((p, i) => (
                    <option key={p.label} value={i}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="pass-note" className="block text-xs font-bold text-[var(--color-muted)]">
                  Nota opcional (aluno / referência)
                </label>
                <input
                  id="pass-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex.: Multicaixa Maria"
                  className="input mt-1 !py-2.5 text-sm"
                />
              </div>
              <button type="submit" disabled={creating} className="btn btn-primary shrink-0 !py-2.5 text-sm">
                {creating ? "A gerar…" : "+ Gerar código"}
              </button>
            </form>

            {data.passCodes.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {data.passCodes.map((p) => {
                  const exhausted = p.usedBy.length >= p.maxUses;
                  const waMsg = `Olá! Aqui está o teu código de activação da FiguraLinguística (${PLAN_BADGE[p.plan]}):\n\n*${p.code}*\n\nAbre https://figura-linguistica.vercel.app/planos e cola o código em «Activar código de passe». Bons estudos!`;
                  return (
                    <div key={p.code} className={`card flex flex-wrap items-center justify-between gap-3 p-3.5 text-sm ${exhausted ? "opacity-60" : ""}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-extrabold">{p.code}</span>
                          <span className="rounded-full bg-[var(--color-lilac-soft)] px-2 py-0.5 text-[11px] font-bold">
                            {PLAN_BADGE[p.plan]}
                          </span>
                          <span className="text-xs text-[var(--color-muted)]">
                            {p.usedBy.length}/{p.maxUses} usos
                          </span>
                        </div>
                        {p.note && <div className="text-xs text-[var(--color-muted)]">Nota: {p.note}</div>}
                        {p.usedBy.length > 0 && (
                          <div className="text-[11px] text-[var(--color-good)]">
                            Usado por: {p.usedBy.map((u) => u.email).join(", ")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => void copyText(p.code, `Código ${p.code} copiado!`)} className="chip !px-3 text-xs font-bold">
                          Copiar
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="chip !bg-[var(--color-good-soft)] !px-3 text-xs font-bold !text-[var(--color-good)]"
                        >
                          WhatsApp
                        </a>
                        <button
                          type="button"
                          aria-label={`Apagar código ${p.code}`}
                          onClick={() => void handleDeletePass(p.code)}
                          className="chip !px-2.5 text-xs text-[var(--color-bad)]"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Pedidos de Recuperação de Palavra-passe */}
          {data.resetRequests.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 font-extrabold">🔑 Códigos de recuperação activos (15–30 min)</h2>
              <div className="flex flex-col gap-2">
                {data.resetRequests.map((r) => (
                  <div key={r.email} className="card flex flex-wrap items-center justify-between gap-3 border border-[var(--color-yellow)] bg-[var(--color-yellow-soft)] p-3.5 text-sm">
                    <div>
                      <div className="font-bold">{r.email}</div>
                      <div className="text-xs text-[var(--color-muted)]">
                        Expira às {new Date(r.expiresAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-white px-3 py-1 font-mono text-base font-extrabold tracking-widest">
                        {r.adminCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyText(r.adminCode, `Código ${r.adminCode} copiado!`)}
                        className="chip !px-3 text-xs font-bold"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Directório de Utilizadores (responsive-table) */}
          <section className="mt-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold">Utilizadores registados ({filteredUsers.length})</h2>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar nome ou email…"
                aria-label="Pesquisar utilizadores"
                className="input max-w-[260px] !py-2 text-xs"
              />
            </div>

            <div tabIndex={0} role="region" aria-labelledby="admin-users-caption" className="admin-table-wrapper">
              <table className="admin-table">
                <caption id="admin-users-caption">
                  Contas sincronizadas na FiguraLinguística ({filteredUsers.length})
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Aluno</th>
                    <th scope="col">Plano</th>
                    <th scope="col">Idioma / Nível</th>
                    <th scope="col">XP Total</th>
                    <th scope="col">Última actividade</th>
                    <th scope="col">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <th scope="row">
                        <div className="font-extrabold">{u.name}</div>
                        <div className="text-xs font-normal text-[var(--color-muted)]">{u.email}</div>
                      </th>
                      <td>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${u.premiumActive ? "bg-[var(--color-lilac)] text-white" : "bg-[var(--color-bg)]"}`}>
                          {PLAN_BADGE[u.plan] ?? u.plan}
                        </span>
                      </td>
                      <td>
                        <span>
                          {LANGS[u.activeLang]?.flag} Nível {u.level} · 🔥 {u.streak}
                        </span>
                      </td>
                      <td>
                        <span className="font-bold">{u.totalXp} XP</span>{" "}
                        <span className="text-xs text-[var(--color-muted)]">({u.conversations} conv.)</span>
                      </td>
                      <td>
                        <span className="text-xs text-[var(--color-muted)]">
                          {u.updatedAt ? new Date(u.updatedAt).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          <button type="button" onClick={() => setSelectedUser(u)} className="chip !px-2.5 !py-1 text-xs font-bold">
                            Plano
                          </button>
                          <button type="button" onClick={() => void handleGenerateReset(u.email)} className="chip !px-2.5 !py-1 text-xs font-bold">
                            Código 6d
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Reportes dos alunos */}
          {data.reports.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 font-extrabold">🚩 Frases reportadas pelos alunos ({data.reports.length})</h2>
              <div className="flex flex-col gap-2">
                {data.reports.map((rep, idx) => (
                  <div key={`${rep.at}-${idx}`} className="card p-3.5 text-xs">
                    <div className="flex justify-between font-bold">
                      <span>{rep.ref} · {rep.reason}</span>
                      <span className="text-[var(--color-muted)]">{rep.userEmail}</span>
                    </div>
                    <p className="mt-1 text-[var(--color-muted)]">«{rep.text}»</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Sheet open={!!selectedUser} onClose={() => setSelectedUser(null)} title={selectedUser ? `Plano · ${selectedUser.name}` : ""}>
        {selectedUser && (
          <div className="flex flex-col gap-2">
            <p className="mb-2 text-xs text-[var(--color-muted)]">
              Conta: <b>{selectedUser.email}</b> · Plano actual: <b>{PLAN_BADGE[selectedUser.plan]}</b>
            </p>
            {PLAN_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => void handleSetUserPlan(selectedUser.email, p.plan, p.days)}
                className="btn btn-soft justify-between text-sm"
              >
                <span>Activar {p.label}</span>
                <Icon name="chevron-right" size={18} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => void handleSetUserPlan(selectedUser.email, "free", null)}
              className="btn btn-soft mt-2 text-xs text-[var(--color-bad)]"
            >
              Repor para Plano Gratuito
            </button>
          </div>
        )}
      </Sheet>

      <Toast text={toast} onDone={() => setToast(null)} />
    </>
  );
}

export default function AdminPage() {
  return (
    <AppFrame wide>
      <AdminDashboard />
    </AppFrame>
  );
}

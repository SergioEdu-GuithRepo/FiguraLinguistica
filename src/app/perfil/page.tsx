"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AppFrame, ScreenHeader } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { Sheet } from "@/components/Sheet";
import { Toast, Toggle, useSpeaker } from "@/components/ui";
import { LANGS, LANG_LIST } from "@/lib/langs";
import { sfxSuccess } from "@/lib/sfx";
import { getVoices, neuralStatus, onNeuralStatus, resetNeuralFallback, speak, sttSupported, voicesFor, type NeuralStatus } from "@/lib/speech";
import { DEFAULT_NEURAL, NEURAL_VOICES, neuralVoiceFor } from "@/lib/voices";
import { currentStreak, isPremium, pushNotif, studentModelSummary, type Settings } from "@/lib/state";
import { useApp, useStore } from "@/lib/store";
import { CATEGORY_PT, type ErrorCategory } from "@/lib/tutor";

const PLAN_LABEL: Record<string, string> = {
  free: "Gratuito",
  premium: "Premium",
  lifetime: "👑 Vitalício (Fundador)",
  "pass-week": "Passe semanal",
  "pass-month": "Passe mensal",
  school: "Licença escolar",
};

const INTERESTS = ["viagens", "comida", "negócios", "música", "futebol", "estudos"];
const REMINDER_HOURS = ["08:00", "13:00", "19:30", "21:30"] as const;

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="font-semibold">{label}</div>
        {hint && <div className="text-xs text-[var(--color-muted)]">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">{title}</h2>
      <div className="card divide-y divide-[var(--color-line)] px-5">{children}</div>
    </section>
  );
}

function Perfil() {
  const { state, update, user, isAdmin } = useApp();
  const { logout, deleteAccount, resetProgress, changePassword, syncStatus, lastSyncedAt, cloudProvider, syncNow } = useStore();
  const router = useRouter();
  const { say } = useSpeaker();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [confirm, setConfirm] = useState<null | "delete" | "reset">(null);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdErr, setPwdErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const lang = state.activeLang;
  const s = state.settings;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => update((st) => ({ ...st, settings: { ...st.settings, [k]: v } }));

  useEffect(() => {
    getVoices().then(setVoices);
  }, []);
  const [neuralState, setNeuralState] = useState<NeuralStatus>("ok");
  useEffect(() => {
    setNeuralState(neuralStatus());
    return onNeuralStatus(setNeuralState);
  }, []);

  const engine = s.voiceEngine ?? "neural";
  const theme = s.theme ?? "light";
  const soundEffects = s.soundEffects !== false;
  const reminderHour = s.reminderHour || "19:30";
  const currentNeural = neuralVoiceFor(lang, s.neuralVoices?.[lang]);
  const langVoices = voicesFor(lang, voices);
  const totalXp = LANG_LIST.reduce((a, l) => a + state.progress[l].xp, 0);
  const errs = Object.entries(state.errors[lang]).sort((a, b) => b[1].count - a[1].count);
  const premium = isPremium(state);
  const model = studentModelSummary(state, lang);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdBusy(true);
    setPwdErr(null);
    const err = await changePassword(curPwd, newPwd);
    setPwdBusy(false);
    if (err) {
      setPwdErr(err);
      return;
    }
    setCurPwd("");
    setNewPwd("");
    setPwdOpen(false);
    sfxSuccess(soundEffects);
    setToast("Palavra-passe alterada com sucesso ✓");
  };

  return (
    <>
      <ScreenHeader title="Perfil" />
      <div className="card flex items-center gap-4 p-5">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--color-coral)] text-2xl font-extrabold text-white">{user.name.slice(0, 1).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-extrabold">{user.name}</div>
          <div className="truncate text-sm text-[var(--color-muted)]">{user.email}</div>
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${premium ? "bg-[var(--color-lilac)] text-white" : "bg-[var(--color-bg)]"}`}>
            {PLAN_LABEL[state.plan] ?? state.plan}
            {state.planExpires && premium ? ` · até ${new Date(state.planExpires).toLocaleDateString("pt-PT")}` : ""}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div className="card p-3">
          <div className="text-xl font-extrabold">🔥 {currentStreak(state)}</div>
          <div className="text-xs text-[var(--color-muted)]">dias seguidos</div>
        </div>
        <div className="card p-3">
          <div className="text-xl font-extrabold">{totalXp}</div>
          <div className="text-xs text-[var(--color-muted)]">XP total</div>
        </div>
        <div className="card p-3">
          <div className="text-xl font-extrabold">{state.conversations.length}</div>
          <div className="text-xs text-[var(--color-muted)]">conversas</div>
        </div>
      </div>

      {isAdmin && (
        <Link
          href="/admin"
          className="card mt-4 flex items-center justify-between gap-3 border-2 border-[var(--color-coral)]/35 bg-[var(--color-coral-soft)] p-4"
        >
          <div className="min-w-0">
            <div className="font-extrabold">🛡️ Painel do Fundador (Admin)</div>
            <div className="text-xs text-[var(--color-muted)]">
              Utilizadores no Supabase, códigos de passe FL-... e suporte de contas
            </div>
          </div>
          <Icon name="chevron-right" />
        </Link>
      )}

      <section className="mt-5" data-testid="student-model-card">
        <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          Modelo do Aluno · {LANGS[lang].flag} {LANGS[lang].name}
        </h2>
        <div className="card p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-[var(--color-bg)] p-3">
              <div className="text-xs text-[var(--color-muted)]">Vocabulário activo</div>
              <div className="mt-0.5 text-lg font-extrabold">
                {model.strongWords} <span className="text-xs font-normal text-[var(--color-muted)]">/ {model.learnedWords} vistas</span>
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--color-bg)] p-3">
              <div className="text-xs text-[var(--color-muted)]">Moldes dominados</div>
              <div className="mt-0.5 text-lg font-extrabold">
                {model.strongPatterns} <span className="text-xs font-normal text-[var(--color-muted)]">/ {model.learnedPatterns}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--color-bg)] p-3">
              <div className="text-xs text-[var(--color-muted)]">Velocidade de resposta</div>
              <div className="mt-0.5 font-extrabold">
                {model.avgResponseSec !== null ? `${model.avgResponseSec}s` : "—"}
              </div>
              <div className="text-[11px] text-[var(--color-muted)]">{model.speedLabel}</div>
            </div>
            <div className="rounded-2xl bg-[var(--color-bg)] p-3">
              <div className="text-xs text-[var(--color-muted)]">Conversas sem ajuda</div>
              <div className="mt-0.5 text-lg font-extrabold">{model.helpFreeRate}%</div>
              <div className="text-[11px] text-[var(--color-muted)]">{model.totalConv} conversas no idioma</div>
            </div>
          </div>
        </div>
      </section>

      <Section title="Aprendizagem e Aparência">
        <Row label="Objectivo diário" hint="Tempo por dia">
          <div className="flex gap-1">
            {([5, 10, 15] as const).map((m) => (
              <button key={m} className={`chip !px-3 ${s.dailyGoalMin === m ? "!bg-[var(--color-ink)] text-white" : ""}`} onClick={() => set("dailyGoalMin", m)} aria-pressed={s.dailyGoalMin === m}>
                {m}′
              </button>
            ))}
          </div>
        </Row>
        <Row label="Tema visual" hint="Modo claro ou escuro">
          <div className="flex gap-1" data-testid="theme-selector">
            {(
              [
                ["light", "☀️ Claro"],
                ["dark", "🌙 Escuro"],
                ["system", "Auto"],
              ] as const
            ).map(([t, label]) => (
              <button
                key={t}
                type="button"
                data-testid={`theme-btn-${t}`}
                className={`chip !px-2.5 text-xs ${theme === t ? "!bg-[var(--color-ink)] !text-white" : ""}`}
                onClick={() => set("theme", t)}
                aria-pressed={theme === t}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Modo leve (poupar dados)" hint="Reduz transferências em redes móveis lentas">
          <Toggle checked={!!s.dataSaver} onChange={(v) => set("dataSaver", v)} label="Modo leve" />
        </Row>
        <Row label="Idioma de apoio" hint="Explicações e traduções">
          <span className="font-semibold">🇵🇹 Português</span>
        </Row>
        <div className="py-3">
          <div className="font-semibold">Interesses</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((i) => {
              const on = s.interests.includes(i);
              return (
                <button key={i} aria-pressed={on} className={`chip capitalize ${on ? "!bg-[var(--color-ink)] text-white" : ""}`} onClick={() => set("interests", on ? s.interests.filter((x) => x !== i) : [...s.interests, i])}>
                  {i}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      <Section title={`Voz e áudio · ${LANGS[lang].name}`}>
        <div className="py-3">
          <div className="font-semibold">Voz do tutor</div>
          <div className="mt-2 flex rounded-2xl bg-[var(--color-bg)] p-1" role="radiogroup" aria-label="Motor de voz">
            {(
              [
                ["neural", "✨ Neural HD"],
                ["device", "Voz do aparelho"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                role="radio"
                aria-checked={engine === k}
                onClick={() => set("voiceEngine", k)}
                className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${engine === k ? "bg-white shadow-[var(--shadow-card)]" : "text-[var(--color-muted)]"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {engine === "neural" ? (
            <>
              <div className="mt-2 text-xs text-[var(--color-muted)]">
                Vozes neurais Microsoft Azure com entonação, respiração e cadência naturais (MP3 24 kHz). Precisa de ligação à internet; as lições
                descarregadas ficam com o áudio guardado.
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Voz neural">
                {NEURAL_VOICES[lang].map((v) => {
                  const on = currentNeural === v.id;
                  return (
                    <button
                      key={v.id}
                      role="radio"
                      aria-checked={on}
                      onClick={() => {
                        set("neuralVoices", { ...s.neuralVoices, [lang]: v.id });
                        resetNeuralFallback();
                        speak(LANGS[lang].hello, lang, { neuralVoice: v.id, rate: s.audioRate });
                      }}
                      className={`rounded-2xl border-2 p-3 text-left transition ${on ? "border-[var(--color-coral)] bg-[var(--color-coral-soft)]" : "border-[var(--color-line)] bg-white"}`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        {v.label}
                        <Icon name="volume" size={16} className="text-[var(--color-muted)]" />
                      </div>
                      <div className="text-xs text-[var(--color-muted)]">
                        {v.gender === "f" ? "Feminina" : "Masculina"} · {v.accent}
                        {v.id === DEFAULT_NEURAL[lang] ? ` · voz de ${LANGS[lang].tutor.name}` : ""}
                      </div>
                    </button>
                  );
                })}
              </div>
              {neuralState === "fallback" && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-[var(--color-yellow-soft)] px-3 py-2 text-xs">
                  <span>Sem ligação ao serviço de voz neural — a usar temporariamente a voz do aparelho.</span>
                  <button
                    type="button"
                    className="shrink-0 font-bold underline"
                    onClick={() => {
                      resetNeuralFallback();
                      speak(LANGS[lang].hello, lang, { neuralVoice: currentNeural, rate: s.audioRate });
                    }}
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mt-2 text-xs text-[var(--color-muted)]">Voz instalada no teu aparelho (Web Speech API) — funciona offline.</div>
              <div className="mt-2 flex gap-2">
                <select
                  className="input !py-2.5"
                  value={s.voices[lang] ?? ""}
                  onChange={(e) => set("voices", { ...s.voices, [lang]: e.target.value || undefined })}
                  aria-label="Voz do aparelho"
                >
                  <option value="">Automática</option>
                  {langVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
                <button className="btn btn-soft !px-3" onClick={() => say(LANGS[lang].hello, lang)} aria-label="Testar voz">
                  <Icon name="volume" size={20} />
                </button>
              </div>
              {langVoices.length === 0 && <div className="mt-1 text-xs text-[var(--color-coral)]">Não encontrámos vozes de {LANGS[lang].name.toLowerCase()} neste aparelho; será usada a voz por defeito.</div>}
            </>
          )}
        </div>
        <div className="py-3">
          <div className="flex justify-between font-semibold">
            Velocidade do áudio <span>{s.audioRate.toFixed(1)}×</span>
          </div>
          <input type="range" min={0.5} max={1.3} step={0.1} value={s.audioRate} onChange={(e) => set("audioRate", Number(e.target.value))} className="mt-2 w-full accent-[var(--color-coral)]" aria-label="Velocidade do áudio" />
        </div>
        <Row label="Tutor fala em voz alta" hint="Ler as respostas do tutor automaticamente">
          <Toggle checked={s.tutorVoice} onChange={(v) => set("tutorVoice", v)} label="Tutor fala em voz alta" />
        </Row>
        <Row label="Sons de acerto e conquista" hint="Efeitos sonoros subtis e vibração nos exercícios">
          <Toggle
            checked={soundEffects}
            onChange={(v) => {
              set("soundEffects", v);
              if (v) sfxSuccess(true);
            }}
            label="Sons de acerto e conquista"
          />
        </Row>
        <Row label="Usar o microfone" hint={sttSupported() ? "Para «Dizer em voz alta» e conversas. Não guardamos áudio." : "Não suportado neste navegador"}>
          <Toggle checked={s.voiceConsent === true} onChange={(v) => set("voiceConsent", v)} label="Usar o microfone" />
        </Row>
      </Section>

      <Section title="Japonês">
        <Row label="Romaji" hint="Apoio temporário em letras latinas">
          <Toggle checked={s.romaji} onChange={(v) => set("romaji", v)} label="Romaji" />
        </Row>
        <Row label="Furigana" hint="Leitura em kana por cima dos kanji">
          <Toggle checked={s.furigana} onChange={(v) => set("furigana", v)} label="Furigana" />
        </Row>
        {s.furigana && (
          <Row label="Furigana automática" hint="Esconder nos kanji que já dominas (módulo de kanji)">
            <Toggle checked={s.furiganaAuto} onChange={(v) => set("furiganaAuto", v)} label="Furigana automática" />
          </Row>
        )}
      </Section>

      <Section title="Notificações">
        <Row label="Lembretes inteligentes" hint="Revisões em atraso e tarefa diária (máx. 1/dia)">
          <Toggle
            checked={s.notifications}
            label="Lembretes"
            onChange={async (v) => {
              if (v && "Notification" in window && Notification.permission === "default") {
                await Notification.requestPermission().catch(() => "denied");
              }
              set("notifications", v);
              if (v) {
                update((st) => ({
                  ...st,
                  notifications: pushNotif(
                    st.notifications,
                    `🔔 Lembretes activos (${reminderHour}): avisaremos quando tiveres itens FSRS para rever (${model.dueCount} prontos agora).`,
                    "/revisao",
                  ),
                }));
              }
            }}
          />
        </Row>
        {s.notifications && (
          <div className="py-3">
            <div className="font-semibold">Hora preferida do lembrete</div>
            <div className="mt-0.5 text-xs text-[var(--color-muted)]">Se ainda não tiveres praticado nesse dia, enviamos um aviso discreto.</div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {REMINDER_HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-pressed={reminderHour === h}
                  onClick={() => set("reminderHour", h)}
                  className={`chip !px-3 text-xs font-bold ${reminderHour === h ? "!bg-[var(--color-ink)] !text-white" : ""}`}
                >
                  ⏰ {h}
                </button>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="O teu progresso">
        <div className="py-3">
          <div className="font-semibold">Erros recorrentes · {LANGS[lang].name}</div>
          {errs.length === 0 ? (
            <div className="text-sm text-[var(--color-muted)]">Ainda nada registado. 👌</div>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5 text-sm">
              {errs.slice(0, 4).map(([cat, e]) => (
                <li key={cat} className="flex justify-between gap-3">
                  <span className="truncate">
                    <b>{CATEGORY_PT[cat as ErrorCategory] ?? cat}</b> <span className="text-[var(--color-muted)]">· ex.: {e.example}</span>
                  </span>
                  <span className="font-bold">{e.count}×</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link href="/marcos" className="flex items-center justify-between py-3 font-semibold">
          Marcos de comunicação e certificados <Icon name="chevron-right" className="text-[var(--color-muted)]" />
        </Link>
        <Link href="/palavras" className="flex items-center justify-between py-3 font-semibold">
          Palavras aprendidas <Icon name="chevron-right" className="text-[var(--color-muted)]" />
        </Link>
        <Link href="/leitor" className="flex items-center justify-between py-3 font-semibold">
          Importar texto para ler <Icon name="chevron-right" className="text-[var(--color-muted)]" />
        </Link>
        {lang === "ja" && (
          <>
            <Link href="/kana" className="flex items-center justify-between py-3 font-semibold">
              Módulo de kana <Icon name="chevron-right" className="text-[var(--color-muted)]" />
            </Link>
            <Link href="/kanji" className="flex items-center justify-between py-3 font-semibold">
              Kanji por frequência <Icon name="chevron-right" className="text-[var(--color-muted)]" />
            </Link>
            <Link href="/particulas" className="flex items-center justify-between py-3 font-semibold">
              Prática de partículas <Icon name="chevron-right" className="text-[var(--color-muted)]" />
            </Link>
            <Link href="/cortesia" className="flex items-center justify-between py-3 font-semibold">
              Contadores e Cortesia (敬語) <Icon name="chevron-right" className="text-[var(--color-muted)]" />
            </Link>
          </>
        )}
      </Section>

      <Section title="Conta e subscrição">
        <div className="flex items-center justify-between gap-3 py-3" data-testid="cloud-sync-row">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-semibold">
              <span>Base de dados na nuvem</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  syncStatus === "synced"
                    ? "bg-[#e3f5ec] text-[var(--color-good)]"
                    : syncStatus === "syncing"
                      ? "bg-[var(--color-yellow-soft)] text-[#8a6a12]"
                      : "bg-[var(--color-bg)] text-[var(--color-muted)]"
                }`}
              >
                {syncStatus === "synced"
                  ? "☁️ Sincronizado"
                  : syncStatus === "syncing"
                    ? "⏳ A sincronizar…"
                    : syncStatus === "offline"
                      ? "📴 Offline"
                      : "💾 Local"}
              </span>
            </div>
            <div className="text-xs text-[var(--color-muted)]">
              {cloudProvider === "supabase" ? "Supabase PostgreSQL" : "Servidor Cloud"} ·{" "}
              {lastSyncedAt
                ? `Última sincronização às ${new Date(lastSyncedAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`
                : "Offline-first activo"}
            </div>
          </div>
          <button
            type="button"
            data-testid="cloud-sync-btn"
            onClick={() => void syncNow()}
            disabled={syncStatus === "syncing"}
            className="chip !px-3 text-xs font-bold"
          >
            {syncStatus === "syncing" ? "…" : "Sincronizar"}
          </button>
        </div>
        <Link href="/planos" className="flex items-center justify-between py-3 font-semibold">
          <span>
            Subscrição e passes <span className="text-sm font-normal text-[var(--color-muted)]">· {PLAN_LABEL[state.plan] ?? state.plan}</span>
          </span>
          <Icon name="chevron-right" className="text-[var(--color-muted)]" />
        </Link>
        <button
          type="button"
          className="flex w-full items-center justify-between py-3 text-left font-semibold"
          onClick={() => {
            setPwdErr(null);
            setPwdOpen(true);
          }}
        >
          Alterar palavra-passe <Icon name="lock" size={20} className="text-[var(--color-muted)]" />
        </button>
        {isAdmin && (
          <Row label="Desbloquear todos os 45 níveis" hint="Modo fundador: explorar qualquer unidade sem bloquear">
            <Toggle checked={!!s.unlockAllLevels} onChange={(v) => set("unlockAllLevels", v)} label="Desbloquear todos os 45 níveis" />
          </Row>
        )}
        <button className="flex w-full items-center justify-between py-3 text-left font-semibold" onClick={() => setConfirm("reset")}>
          Repor progresso <Icon name="refresh" size={20} className="text-[var(--color-muted)]" />
        </button>
        <button
          className="flex w-full items-center justify-between py-3 text-left font-semibold"
          onClick={() => {
            logout();
            router.replace("/entrar");
          }}
        >
          Terminar sessão <Icon name="logout" size={20} className="text-[var(--color-muted)]" />
        </button>
        <button className="flex w-full items-center justify-between py-3 text-left font-semibold text-[var(--color-bad)]" onClick={() => setConfirm("delete")}>
          Eliminar conta e dados <Icon name="trash" size={20} />
        </button>
      </Section>
      <p className="mt-6 text-center text-xs text-[var(--color-muted)]">FiguraLinguística · v1.2</p>

      <Sheet open={pwdOpen} onClose={() => setPwdOpen(false)} title="Alterar palavra-passe">
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 text-sm font-semibold">
            <label htmlFor="profile-cur-pwd">Palavra-passe actual</label>
            <input
              id="profile-cur-pwd"
              type="password"
              className="input"
              value={curPwd}
              onChange={(e) => setCurPwd(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="flex flex-col gap-1 text-sm font-semibold">
            <label htmlFor="profile-new-pwd">Nova palavra-passe</label>
            <input
              id="profile-new-pwd"
              type="password"
              className="input"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>
          {pwdErr && <p className="text-xs font-bold text-[var(--color-bad)]">{pwdErr}</p>}
          <div className="mt-2 flex flex-col gap-2">
            <button type="submit" className="btn btn-primary" disabled={pwdBusy}>
              {pwdBusy ? "A guardar…" : "Guardar nova palavra-passe"}
            </button>
            <button type="button" className="btn btn-soft" onClick={() => setPwdOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      </Sheet>

      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title={confirm === "delete" ? "Eliminar conta?" : "Repor progresso?"}>
        <p className="text-[var(--color-muted)]">
          {confirm === "delete"
            ? "A tua conta, progresso, palavras e conversas serão apagados deste dispositivo e da nuvem. Esta acção não pode ser desfeita."
            : "O XP, unidades, palavras e conversas dos 3 idiomas voltam a zero. As definições mantêm-se."}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            className="btn !bg-[var(--color-bad)] text-white"
            onClick={() => {
              if (confirm === "delete") {
                deleteAccount();
                router.replace("/entrar");
              } else {
                resetProgress();
              }
              setConfirm(null);
            }}
          >
            {confirm === "delete" ? "Eliminar definitivamente" : "Repor"}
          </button>
          <button className="btn btn-soft" onClick={() => setConfirm(null)}>
            Cancelar
          </button>
        </div>
      </Sheet>
      <Toast text={toast} onDone={() => setToast(null)} />
    </>
  );
}

export default function PerfilPage() {
  return (
    <AppFrame>
      <Perfil />
    </AppFrame>
  );
}

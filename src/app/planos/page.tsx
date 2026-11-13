"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppFrame } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { Sheet } from "@/components/Sheet";
import { Toast, TopBar } from "@/components/ui";
import { sfxCelebrate, sfxError } from "@/lib/sfx";
import { FREE_CONVERSATIONS_PER_DAY, isPremium, type Plan } from "@/lib/state";
import { useApp, useStore } from "@/lib/store";

interface Offer {
  id: string;
  plan: Plan;
  title: string;
  period: string;
  priceLabel: string;
  days: number | null;
  highlight?: boolean;
}

const DAY = 86_400_000;
const PREMIUM: Offer[] = [
  { id: "premium-m", plan: "premium", title: "Premium mensal", period: "30 dias · 3 idiomas + tutor ilimitado", priceLabel: "3 500 Kz", days: 30 },
  { id: "premium-t", plan: "premium", title: "Premium trimestral", period: "90 dias · poupa 15%", priceLabel: "9 000 Kz", days: 90, highlight: true },
  { id: "premium-a", plan: "premium", title: "Premium anual", period: "365 dias · melhor valor", priceLabel: "29 000 Kz", days: 365 },
];
const PASSES: Offer[] = [
  { id: "pass-w", plan: "pass-week", title: "Passe semanal", period: "7 dias, pré-pago, sem renovação", priceLabel: "1 000 Kz", days: 7 },
  { id: "pass-m", plan: "pass-month", title: "Passe mensal", period: "30 dias, pré-pago, sem renovação", priceLabel: "3 500 Kz", days: 30 },
];
const METHODS = ["Multicaixa Express", "Transferência IBAN / Referência", "Carteira móvel (Unitel Money / Afrimoney)", "Cartão internacional"];

function Planos() {
  const { state, update, user, isAdmin } = useApp();
  const { redeemPassCode } = useStore();
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [method, setMethod] = useState(METHODS[0]);
  const [passCode, setPassCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const premium = isPremium(state);
  const soundOn = state.settings.soundEffects !== false;

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passCode.trim()) return;
    setRedeeming(true);
    setCodeError(null);
    const res = await redeemPassCode(passCode);
    setRedeeming(false);
    if (res.err) {
      sfxError(soundOn);
      setCodeError(res.err);
      return;
    }
    sfxCelebrate(soundOn);
    setPassCode("");
    setToast("🎉 Código activado com sucesso! Acesso Premium desbloqueado.");
  };

  const activateFounderDirect = () => {
    if (!offer || !isAdmin) return;
    update((s) => ({ ...s, plan: offer.plan, planExpires: offer.days ? Date.now() + offer.days * DAY : undefined }));
    sfxCelebrate(soundOn);
    setOffer(null);
    setToast(`${offer.title} activado ✓`);
  };

  const Card = ({ o }: { o: Offer }) => (
    <button onClick={() => setOffer(o)} className={`card flex w-full items-center gap-3 p-4 text-left ${o.highlight ? "ring-2 ring-[var(--color-lilac)]" : ""}`}>
      <div className="flex-1">
        <div className="font-extrabold">{o.title}</div>
        <div className="text-sm text-[var(--color-muted)]">{o.period}</div>
      </div>
      <div className="text-right text-sm">
        <div className="font-extrabold">{o.priceLabel}</div>
        <div className="text-[10px] text-[var(--color-muted)]">activar passe</div>
      </div>
      <Icon name="chevron-right" className="text-[var(--color-muted)]" />
    </button>
  );

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 2) router.back();
    else router.push("/perfil");
  };

  const requestMailHref = offer
    ? `mailto:sergio.eduardo.kuroko@gmail.com?subject=${encodeURIComponent(`Pedido de ${offer.title} — FiguraLinguística`)}&body=${encodeURIComponent(
        `Olá!\n\nQuero activar o plano "${offer.title}" (${offer.priceLabel}) na FiguraLinguística.\n• Conta: ${user.email}\n• Nome: ${user.name}\n• Método escolhido: ${method}\n\nPor favor envia-me as coordenadas de pagamento e o meu código FL-... de activação.`,
      )}`
    : "#";

  return (
    <>
      <TopBar back={handleBack} title="Planos e Passes" />
      <div className="relative overflow-hidden rounded-[28px] bg-[var(--color-lilac)] p-6 text-white shadow-[var(--shadow-float)]">
        <div className="text-2xl font-extrabold">FiguraLinguística Premium</div>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {["Os 3 idiomas em simultâneo", "Conversas ilimitadas em modo guiado", "Descarregar lições (com áudio neural) para offline", "Certificados partilháveis em imagem HD"].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Icon name="check" size={16} /> {f}
            </li>
          ))}
        </ul>
        {premium && (
          <div className="mt-4 rounded-2xl bg-white/25 p-2 text-center text-sm font-bold">
            ✓ O teu plano actual já inclui tudo isto
            {state.planExpires ? ` (até ${new Date(state.planExpires).toLocaleDateString("pt-PT")})` : ""}
          </div>
        )}
      </div>

      {isAdmin && (
        <Link
          href="/admin"
          className="card mt-4 flex items-center justify-between border-2 border-[var(--color-coral)]/35 bg-[var(--color-coral-soft)] p-4"
        >
          <div>
            <div className="text-sm font-extrabold">🛡️ Painel do Fundador</div>
            <div className="text-xs text-[var(--color-muted)]">Gerar códigos FL-... para alunos e gerir subscrições</div>
          </div>
          <Icon name="chevron-right" />
        </Link>
      )}

      <section className="mt-6">
        <h2 className="mb-2 font-extrabold">Activar código de passe</h2>
        <form onSubmit={handleRedeem} className="card p-4">
          <label htmlFor="pass-code-input" className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
            Já tens um código FL-...?
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="pass-code-input"
              type="text"
              value={passCode}
              onChange={(e) => {
                setPassCode(e.target.value.toUpperCase());
                if (codeError) setCodeError(null);
              }}
              placeholder="FL-MES-A1B2C3"
              autoCapitalize="characters"
              spellCheck={false}
              className="input !py-2.5 font-mono text-sm font-bold uppercase"
            />
            <button type="submit" disabled={redeeming || !passCode.trim()} className="btn btn-primary shrink-0 !px-4 !py-2.5 text-sm">
              {redeeming ? "…" : "Activar"}
            </button>
          </div>
          {codeError && <p className="mt-2 text-xs font-bold text-[var(--color-bad)]">{codeError}</p>}
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Após confirmares o pagamento por Multicaixa Express ou transferência, recebes um código único que desbloqueia o plano em todos os teus aparelhos.
          </p>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="mb-1 font-extrabold">Passes pré-pagos (Angola)</h2>
        <p className="mb-2 text-sm text-[var(--color-muted)]">Sem renovação automática: paga por Multicaixa Express ou carteira móvel e recebe o código.</p>
        <div className="flex flex-col gap-2">
          {PASSES.map((o) => (
            <Card key={o.id} o={o} />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-extrabold">Planos Premium</h2>
        <div className="flex flex-col gap-2">
          {PREMIUM.map((o) => (
            <Card key={o.id} o={o} />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-extrabold">Plano Gratuito</h2>
        <div className="card p-4 text-sm">
          <ul className="flex flex-col gap-1 text-[var(--color-muted)]">
            <li>• 1 idioma activo de cada vez</li>
            <li>• {FREE_CONVERSATIONS_PER_DAY} conversas com o tutor por dia</li>
            <li>• Vozes neurais HD (Microsoft Azure) ou voz do aparelho</li>
          </ul>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-extrabold">Escolas e empresas</h2>
        <div className="card p-4 text-sm">
          <p className="text-[var(--color-muted)]">Licença por turma ou equipa com códigos multi-utilizador (`FL-ESCOLA-...`).</p>
          <a className="btn btn-dark mt-3 w-full" href="mailto:sergio.eduardo.kuroko@gmail.com?subject=Licen%C3%A7a%20para%20escolas%20e%20empresas%20%E2%80%94%20FiguraLingu%C3%ADstica">
            Pedir proposta
          </a>
        </div>
      </section>

      <Sheet open={!!offer} onClose={() => setOffer(null)} title={offer?.title}>
        {offer && (
          <div>
            <div className="flex items-center justify-between rounded-2xl bg-[var(--color-lilac-soft)] p-3.5 text-sm">
              <div>
                <div className="font-extrabold">{offer.title}</div>
                <div className="text-xs text-[var(--color-muted)]">{offer.period}</div>
              </div>
              <div className="text-lg font-extrabold">{offer.priceLabel}</div>
            </div>

            <div className="mt-4 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Escolhe como preferes pagar</div>
            <div className="mt-2 flex flex-col gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  aria-pressed={method === m}
                  className={`flex items-center justify-between rounded-2xl p-3 text-left text-sm font-semibold ${method === m ? "bg-[var(--color-lilac-soft)] ring-2 ring-[var(--color-lilac)]" : "bg-[var(--color-bg)]"}`}
                >
                  {m} {method === m && <Icon name="check" size={18} />}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-[var(--color-bg)] p-3 text-xs leading-relaxed text-[var(--color-muted)]">
              <b>Como funciona:</b> clica abaixo para pedir as coordenadas de <b>{method}</b>. Assim que enviares o comprovativo, recebes um código <code>FL-...</code> para colares no topo desta página.
            </div>

            <a href={requestMailHref} className="btn btn-primary mt-4 w-full" onClick={() => setOffer(null)}>
              Pedir código de {offer.title} →
            </a>

            {isAdmin && (
              <button type="button" className="btn btn-soft mt-2 w-full text-xs" onClick={activateFounderDirect}>
                👑 Activar directamente (Modo Fundador)
              </button>
            )}
          </div>
        )}
      </Sheet>
      <Toast text={toast} onDone={() => setToast(null)} />
    </>
  );
}

export default function PlanosPage() {
  return (
    <AppFrame nav={false}>
      <Planos />
    </AppFrame>
  );
}

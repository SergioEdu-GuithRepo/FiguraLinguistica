"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppFrame } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { Sheet } from "@/components/Sheet";
import { Toast, TopBar } from "@/components/ui";
import { FREE_CONVERSATIONS_PER_DAY, isPremium, type Plan } from "@/lib/state";
import { useApp } from "@/lib/store";

interface Offer {
  id: string;
  plan: Plan;
  title: string;
  period: string;
  days: number | null;
  highlight?: boolean;
}

const DAY = 86_400_000;
const PREMIUM: Offer[] = [
  { id: "lifetime-dev", plan: "lifetime", title: "👑 Acesso Vitalício (Fundador)", period: "3 idiomas + conversas e downloads ilimitados para sempre", days: null, highlight: true },
  { id: "premium-m", plan: "premium", title: "Premium mensal", period: "renova todos os meses", days: 30 },
  { id: "premium-t", plan: "premium", title: "Premium trimestral", period: "renova a cada 3 meses", days: 90 },
  { id: "premium-a", plan: "premium", title: "Premium anual", period: "melhor valor", days: 365 },
];
const PASSES: Offer[] = [
  { id: "pass-w", plan: "pass-week", title: "Passe semanal", period: "7 dias, pré-pago, sem renovação", days: 7 },
  { id: "pass-m", plan: "pass-month", title: "Passe mensal", period: "30 dias, pré-pago, sem renovação", days: 30 },
];
const METHODS = ["Cartão internacional", "Multicaixa Express", "Referência de pagamento", "Carteira móvel"];

function Planos() {
  const { state, update } = useApp();
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [method, setMethod] = useState(METHODS[1]);
  const [toast, setToast] = useState<string | null>(null);
  const premium = isPremium(state);

  const activate = () => {
    if (!offer) return;
    update((s) => ({ ...s, plan: offer.plan, planExpires: offer.days ? Date.now() + offer.days * DAY : undefined }));
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
        <div className="font-bold">Kz —</div>
        <div className="text-[10px] text-[var(--color-muted)]">preço a anunciar</div>
      </div>
      <Icon name="chevron-right" className="text-[var(--color-muted)]" />
    </button>
  );

  return (
    <>
      <TopBar back={() => router.back()} title="Planos" />
      <div className="relative overflow-hidden rounded-[28px] bg-[var(--color-lilac)] p-6 text-white shadow-[var(--shadow-float)]">
        <div className="text-2xl font-extrabold">FiguraLinguística Premium</div>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {["Os 3 idiomas em simultâneo", "Conversas ilimitadas em modo guiado", "Descarregar lições (com áudio neural) para offline", "Relatório de progresso"].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Icon name="check" size={16} /> {f}
            </li>
          ))}
        </ul>
        {premium && <div className="mt-4 rounded-2xl bg-white/25 p-2 text-center text-sm font-bold">✓ O teu plano actual já inclui tudo isto</div>}
      </div>

      <section className="mt-6">
        <h2 className="mb-2 font-extrabold">Gratuito</h2>
        <div className="card p-4 text-sm">
          <ul className="flex flex-col gap-1 text-[var(--color-muted)]">
            <li>• 1 idioma activo de cada vez</li>
            <li>• {FREE_CONVERSATIONS_PER_DAY} conversas com o tutor por dia</li>
            <li>• Vozes neurais HD (Microsoft Azure) ou voz do aparelho</li>
          </ul>
          {state.plan !== "free" && (
            <button className="btn btn-soft mt-3 w-full" onClick={() => (update((s) => ({ ...s, plan: "free", planExpires: undefined })), setToast("Voltaste ao plano gratuito"))}>
              Mudar para gratuito
            </button>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-extrabold">Premium</h2>
        <div className="flex flex-col gap-2">
          {PREMIUM.map((o) => (
            <Card key={o.id} o={o} />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-1 font-extrabold">Passes pré-pagos</h2>
        <p className="mb-2 text-sm text-[var(--color-muted)]">Para quem não usa cartão: paga por referência ou carteira móvel.</p>
        <div className="flex flex-col gap-2">
          {PASSES.map((o) => (
            <Card key={o.id} o={o} />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-extrabold">Escolas e empresas</h2>
        <div className="card p-4 text-sm">
          <p className="text-[var(--color-muted)]">Licença por aluno com painel de acompanhamento para o professor.</p>
          <a className="btn btn-dark mt-3 w-full" href="mailto:escolas@figuralinguistica.app?subject=Licença%20para%20escolas">
            Pedir proposta
          </a>
        </div>
      </section>
      <p className="mt-6 text-center text-xs text-[var(--color-muted)]">Os preços em kwanzas serão definidos após o MVP, com base no custo médio por utilizador activo.</p>

      <Sheet open={!!offer} onClose={() => setOffer(null)} title={offer?.title}>
        {offer && (
          <div>
            <div className="rounded-2xl bg-[var(--color-yellow-soft)] p-3 text-sm">
              <b>Demonstração do MVP:</b> o fornecedor de pagamentos ainda está por definir, por isso nenhum valor é cobrado. O plano é activado neste dispositivo.
            </div>
            <div className="mt-4 text-sm font-bold text-[var(--color-muted)]">MÉTODO DE PAGAMENTO</div>
            <div className="mt-2 flex flex-col gap-2">
              {METHODS.map((m) => (
                <button key={m} onClick={() => setMethod(m)} aria-pressed={method === m} className={`flex items-center justify-between rounded-2xl p-3 text-left font-semibold ${method === m ? "bg-[var(--color-lilac-soft)] ring-2 ring-[var(--color-lilac)]" : "bg-[var(--color-bg)]"}`}>
                  {m} {method === m && <Icon name="check" size={18} />}
                </button>
              ))}
            </div>
            <button className="btn btn-primary mt-5 w-full" onClick={activate}>
              Activar {offer.title}
            </button>
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

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TokenLine, WordSheet } from "@/components/Reader";
import { AppFrame } from "@/components/Shell";
import { Icon } from "@/components/Icon";
import { SpeakButton, TopBar } from "@/components/ui";
import { CONTENT } from "@/content";
import { LANGS } from "@/lib/langs";
import { adaptOffline, prepareText } from "@/lib/adapt-offline";
import { currentLevel, rateItem } from "@/lib/state";
import { useApp } from "@/lib/store";
import type { RToken } from "@/lib/tokenize";

const DIFF_CLASS = { fácil: "bg-[var(--color-good-soft)] text-[var(--color-good)]", médio: "bg-[var(--color-yellow-soft)]", difícil: "bg-[var(--color-bad-soft)] text-[var(--color-bad)]" } as const;
const DIFF_DOT = { fácil: "bg-[var(--color-good)]", médio: "bg-[var(--color-yellow)]", difícil: "bg-[var(--color-bad)]" } as const;

interface Adapted {
  texto_adaptado: string;
  traducao_pt: string;
  vocabulario: { texto: string; pt: string }[];
  perguntas: { pergunta: string; resposta: string }[];
}

function Leitor() {
  const { state, update } = useApp();
  const router = useRouter();
  const lang = state.activeLang;
  const dict = CONTENT[lang].dictionary;
  const sample = CONTENT[lang].units[0]?.dialogue.map((d) => d.text.split("|").join("").replace(/‿/g, " ")).join("\n") ?? "";
  const [raw, setRaw] = useState("");
  const [shown, setShown] = useState<string[] | null>(null);
  const [word, setWord] = useState<RToken | null>(null);
  const [ai, setAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adapted, setAdapted] = useState<Adapted | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showPt, setShowPt] = useState(false);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [onlyMyLevel, setOnlyMyLevel] = useState(false);
  const [cloze, setCloze] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch("/api/tutor")
      .then((r) => r.json())
      .then((j) => setAi(!!j.ai))
      .catch(() => setAi(false));
  }, []);

  const offline = useMemo(() => (shown ? adaptOffline(shown, lang, dict) : null), [shown, lang, dict]);

  const adapt = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, level: currentLevel(state, lang), text: raw.slice(0, 2000) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Erro");
      setAdapted(j);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleBack = () => {
    if (shown) {
      setShown(null);
      setAdapted(null);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 2) router.back();
    else router.push("/licoes");
  };

  return (
    <>
      <TopBar back={handleBack} title={`Importar texto · ${LANGS[lang].flag}`} />
      {!shown ? (
        <>
          <p className="mb-3 text-sm text-[var(--color-muted)]">
            Cola uma mensagem, notícia ou letra em {LANGS[lang].name.toLowerCase()}. Vais poder tocar nas palavras que a app conhece para ver o significado.
          </p>
          <textarea className={`input min-h-48 ${lang === "ja" ? "jp" : ""}`} value={raw} maxLength={2000} onChange={(e) => setRaw(e.target.value)} placeholder="Cola aqui o texto…" lang={LANGS[lang].speechLang} />
          <div className="mt-1 flex justify-between text-xs text-[var(--color-muted)]">
            <button className="font-bold text-[var(--color-coral)]" onClick={() => setRaw(sample)}>
              Usar um exemplo
            </button>
            <span>{raw.length}/2000</span>
          </div>
          <button className="btn btn-primary mt-4 w-full" disabled={!raw.trim()} onClick={() => setShown(prepareText(raw, lang, dict))}>
            Ler com ajuda
          </button>
        </>
      ) : (
        <>
          {offline && (
            <div className="card mb-4 p-4 text-sm" data-testid="leitor-stats">
              <b>{Math.round(offline.coverage * 100)}%</b> das palavras estão no dicionário da app.
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                {(["fácil", "médio", "difícil"] as const).map((d) => (
                  <span key={d} className={`rounded-full px-3 py-1 ${DIFF_CLASS[d]}`}>
                    {offline.sentences.filter((x) => x.difficulty === d).length} {d === "fácil" ? "fáceis" : d === "médio" ? "médias" : "difíceis"}
                  </span>
                ))}
              </div>
              <label className="mt-3 flex items-center gap-2 font-semibold">
                <input type="checkbox" className="h-4 w-4 accent-[var(--color-coral)]" checked={onlyMyLevel} onChange={(e) => setOnlyMyLevel(e.target.checked)} />
                Mostrar só as frases ao meu nível
              </label>
              {offline.unknown.length > 0 && <div className="mt-2 text-[var(--color-muted)]">Novas: {offline.unknown.join(", ")}</div>}
            </div>
          )}
          <div className={`card flex flex-col gap-3 p-5 text-lg leading-relaxed lang-${lang}`}>
            {(offline?.sentences ?? [])
              .filter((s) => !onlyMyLevel || s.difficulty !== "difícil")
              .map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`mt-3 h-2 w-2 shrink-0 rounded-full ${DIFF_DOT[s.difficulty]}`} title={`frase ${s.difficulty}`} />
                  <p className="flex-1">
                    <TokenLine text={s.text} lang={lang} onWord={setWord} />
                  </p>
                  <SpeakButton text={s.text} lang={lang} size={32} />
                </div>
              ))}
          </div>

          {offline && (offline.vocab.length > 0 || offline.cloze.length > 0) && (
            <div className="card mt-4 p-5" data-testid="leitor-offline">
              <div className="flex items-center gap-2 font-extrabold">
                <Icon name="book" size={20} /> Adaptação guiada
              </div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">Vocabulário e perguntas criados a partir do dicionário da app (funciona sem internet).</p>
              {offline.vocab.length > 0 && (
                <>
                  <div className="mt-3 text-xs font-bold text-[var(--color-muted)]">VOCABULÁRIO DO TEXTO</div>
                  <ul className={`mt-1 flex flex-wrap gap-2 lang-${lang}`}>
                    {offline.vocab.map((v) => (
                      <li key={v.key} className={`chip target ${state.srs[lang][`w:${v.key}`] ? "!bg-[var(--color-good-soft)]" : ""}`}>
                        {v.text} <span className="font-normal text-[var(--color-muted)]">· {v.pt}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="btn btn-soft mt-3 w-full"
                    disabled={offline.vocab.every((v) => state.srs[lang][`w:${v.key}`])}
                    onClick={() =>
                      update((s) => offline.vocab.reduce((acc, v) => (acc.srs[lang][`w:${v.key}`] ? acc : rateItem(acc, lang, `w:${v.key}`, 2)), s))
                    }
                  >
                    {offline.vocab.every((v) => state.srs[lang][`w:${v.key}`]) ? "Tudo guardado para revisão ✓" : "Guardar palavras para revisão"}
                  </button>
                </>
              )}
              {offline.cloze.length > 0 && (
                <>
                  <div className="mt-4 text-xs font-bold text-[var(--color-muted)]">PERGUNTAS · COMPLETA A FRASE</div>
                  <ol className={`mt-1 flex flex-col gap-3 lang-${lang}`}>
                    {offline.cloze.map((q, qi) => {
                      const pick = cloze[qi];
                      return (
                        <li key={qi} className="rounded-2xl bg-[var(--color-bg)] p-3" data-testid="cloze">
                          <div className="target text-lg">
                            {q.tokens.map((t, k) =>
                              k === q.blank ? (
                                <span key={k} className={`mx-1 rounded-md border-b-2 px-1 font-bold ${pick ? (pick === q.answer ? "border-[var(--color-good)] text-[var(--color-good)]" : "border-[var(--color-bad)] text-[var(--color-bad)]") : "border-[var(--color-coral)] text-transparent"}`}>
                                  {pick ? q.tokens[k].text : "＿＿"}
                                </span>
                              ) : (
                                <span key={k}>
                                  {t.text}
                                  {lang !== "ja" && t.spaceAfter ? " " : ""}
                                </span>
                              ),
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {q.options.map((o) => (
                              <button
                                key={o}
                                className={`btn target min-h-[44px] text-sm ${pick ? (o === q.answer ? "!bg-[var(--color-good-soft)] text-[var(--color-good)]" : o === pick ? "!bg-[var(--color-bad-soft)] text-[var(--color-bad)]" : "btn-ghost") : "btn-ghost"}`}
                                onClick={() => !pick && setCloze((c) => ({ ...c, [qi]: o }))}
                              >
                                {o}
                              </button>
                            ))}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}
            </div>
          )}

          <div className="card mt-4 p-5">
            <div className="flex items-center gap-2 font-extrabold">
              <Icon name="sparkles" size={20} /> Adaptar ao meu nível com IA
            </div>
            {ai ? (
              <>
                <p className="mt-1 text-sm text-[var(--color-muted)]">O tutor reescreve o texto ao teu nível, traduz, cria vocabulário e perguntas.</p>
                {!adapted && (
                  <button className="btn btn-dark mt-3 w-full" onClick={adapt} disabled={busy}>
                    {busy ? "A adaptar…" : "Adaptar texto"}
                  </button>
                )}
                {err && <p className="mt-2 text-sm text-[var(--color-bad)]">{err}</p>}
              </>
            ) : (
              <p className="mt-1 text-sm text-[var(--color-muted)]">A reescrita e tradução completas ficam disponíveis quando a IA estiver configurada no servidor (ANTHROPIC_API_KEY).</p>
            )}
            {adapted && (
              <div className={`fade-in mt-3 lang-${lang}`}>
                <div className="flex items-start gap-2 rounded-2xl bg-[var(--color-bg)] p-3 text-lg">
                  <p className="flex-1">
                    <TokenLine text={prepareText(adapted.texto_adaptado, lang, dict).join(lang === "ja" ? "|" : " ")} lang={lang} onWord={setWord} />
                  </p>
                  <SpeakButton text={adapted.texto_adaptado} lang={lang} size={32} />
                </div>
                <button className="mt-2 text-sm font-bold text-[var(--color-lilac)]" onClick={() => setShowPt(!showPt)}>
                  {showPt ? "Esconder tradução" : "Ver tradução"}
                </button>
                {showPt && <p className="mt-1 text-sm text-[var(--color-muted)]">{adapted.traducao_pt}</p>}
                {adapted.vocabulario.length > 0 && (
                  <>
                    <div className="mt-3 text-xs font-bold text-[var(--color-muted)]">VOCABULÁRIO</div>
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {adapted.vocabulario.map((v, i) => (
                        <li key={i} className="chip target">
                          {v.texto} <span className="font-normal text-[var(--color-muted)]">· {v.pt}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {adapted.perguntas.length > 0 && (
                  <>
                    <div className="mt-3 text-xs font-bold text-[var(--color-muted)]">PERGUNTAS</div>
                    <ol className="mt-1 flex flex-col gap-2">
                      {adapted.perguntas.map((q, i) => (
                        <li key={i} className="rounded-2xl bg-[var(--color-bg)] p-3 text-sm">
                          <div className="target font-semibold">{q.pergunta}</div>
                          {answers[i] ? (
                            <div className="target mt-1 text-[var(--color-good)]">{q.resposta}</div>
                          ) : (
                            <button className="mt-1 text-xs font-bold text-[var(--color-coral)]" onClick={() => setAnswers((a) => ({ ...a, [i]: true }))}>
                              Ver resposta
                            </button>
                          )}
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            className="btn btn-soft mt-4 w-full"
            onClick={() => {
              setShown(null);
              setAdapted(null);
              setCloze({});
            }}
          >
            Outro texto
          </button>
        </>
      )}
      <WordSheet tok={word} lang={lang} onClose={() => setWord(null)} />
    </>
  );
}

export default function LeitorPage() {
  return (
    <AppFrame nav={false}>
      <Leitor />
    </AppFrame>
  );
}

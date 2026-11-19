"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import { CONTENT } from "@/content";
import { KANJI } from "@/content/ja/kanji";
import { segmentJa } from "@/lib/adapt-offline";
import { wordContextInfo } from "@/lib/contexts";
import { isStrong } from "@/lib/fsrs";
import { LANGS, POS_PT } from "@/lib/langs";
import { sfxSuccess, sfxTap } from "@/lib/sfx";
import { toggleWordSaved } from "@/lib/state";
import { useApp } from "@/lib/store";
import { hasKanji, plainText, tokenize, type RToken } from "@/lib/tokenize";
import type { DialogueLine, LangCode, Pattern, SentenceBlock } from "@/lib/types";

import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { CopyTextButton, SpeakButton, Toast } from "./ui";

const KANJI_CHAR_RE = /[\u4e00-\u9faf]/g;
const KANJI_BY_CHAR = new Map(KANJI.map((k) => [k.char, k]));

export interface ReaderLine {
  text: string;
  pt: string;
  romaji?: string;
  blocks?: SentenceBlock[];
  patternId?: string;
  speaker?: string;
}

/* ---------------- Token ---------------- */

function TokenView({ tok, lang, furigana, onTap }: { tok: RToken; lang: LangCode; furigana: boolean | ((t: string) => boolean); onTap: (t: RToken) => void }) {
  if (tok.isPunct) return <span>{tok.text}</span>;
  const e = tok.entry;
  const isParticle = e?.pos === "particle";
  let cls = "rounded-md -mx-[2px] px-[2px] transition hover:bg-[var(--color-lilac-soft)] focus-visible:bg-[var(--color-lilac-soft)] cursor-pointer";
  if (!e) cls = "cursor-default";
  if (lang === "ja" && isParticle) cls += " text-[var(--color-coral)] font-bold";
  if (lang === "fr" && e?.gender === "m") cls += " underline decoration-[#9A9AF0]/50 decoration-2 underline-offset-4";
  if (lang === "fr" && e?.gender === "f") cls += " underline decoration-[#E8735A]/50 decoration-2 underline-offset-4";
  if (tok.chunk && lang !== "ja") cls += " bg-[var(--color-yellow-soft)]";

  const showRuby = typeof furigana === "function" ? furigana(tok.text) : furigana;
  const content =
    lang === "ja" && e?.reading && showRuby && hasKanji(tok.text) ? (
      <ruby>
        {tok.text}
        <rt>{e.reading}</rt>
      </ruby>
    ) : (
      tok.text
    );

  if (!e) return <span className={cls}>{content}</span>;
  return (
    <button type="button" className={cls} onClick={(ev) => (ev.stopPropagation(), onTap(tok))}>
      {content}
    </button>
  );
}

export function TokenLine({
  text,
  lang,
  onWord,
  className = "",
}: {
  text: string;
  lang: LangCode;
  onWord: (t: RToken) => void;
  className?: string;
}) {
  const { state } = useApp();
  const dict = CONTENT[lang].dictionary;
  const prepared = useMemo(() => (lang === "ja" && !text.includes("|") ? segmentJa(text, dict) : text), [text, lang, dict]);
  const toks = useMemo(() => tokenize(prepared, lang, dict), [prepared, lang, dict]);
  const { furigana: furiOn, furiganaAuto } = state.settings;
  const kanaCards = state.kana;
  const furigana = useMemo(
    () => (!furiOn ? false : !furiganaAuto ? true : (t: string) => !(t.match(KANJI_CHAR_RE) ?? []).every((ch) => isStrong(kanaCards[ch]))),
    [furiOn, furiganaAuto, kanaCards],
  );
  // agrupa cada palavra com a pontuação que se segue, para a pontuação nunca ficar sozinha no início da linha
  const groups = useMemo(() => {
    const out: { tok: RToken; i: number }[][] = [];
    toks.forEach((t, i) => {
      if (t.isPunct && out.length && !/^[¿¡"«“‘(\[「『（]/.test(t.text)) out[out.length - 1].push({ tok: t, i });
      else out.push([{ tok: t, i }]);
    });
    return out;
  }, [toks]);
  const sep = (t: RToken, next?: RToken) =>
    t.liaison && !t.chunk ? (
      <span className="mx-[1px] text-[var(--color-teal)] font-bold" title="liaison">
        ‿
      </span>
    ) : t.spaceAfter ? (
      next?.isPunct ? "\u00A0" : " "
    ) : null;
  return (
    <span className={`target ${className}`}>
      {groups.map((g, gi) => {
        const last = g[g.length - 1];
        return (
          <React.Fragment key={gi}>
            <span className="whitespace-nowrap">
              {g.map(({ tok, i }, k) => (
                <React.Fragment key={i}>
                  <TokenView tok={tok} lang={lang} furigana={furigana} onTap={onWord} />
                  {k < g.length - 1 && sep(tok, toks[i + 1])}
                </React.Fragment>
              ))}
            </span>
            {sep(last.tok, toks[last.i + 1])}
          </React.Fragment>
        );
      })}
    </span>
  );
}

/* ---------------- Folha da palavra ---------------- */

export function WordSheet({ tok, lang, onClose }: { tok: RToken | null; lang: LangCode; onClose: () => void }) {
  const { state, update } = useApp();
  const [toast, setToast] = useState<string | null>(null);
  const [report, setReport] = useState(false);
  const [subTok, setSubTok] = useState<{ parentKey: string; tok: RToken } | null>(null);

  const rootKey = tok?.key ?? "";
  const activeTok = subTok && subTok.parentKey === rootKey ? subTok.tok : tok;
  const e = activeTok?.entry;
  const key = activeTok?.key ?? "";
  const card = state.srs[lang][`w:${key}`];
  const saved = !!card;
  const strong = saved && isStrong(card);
  const speechLang = LANGS[lang].speechLang;
  const dict = CONTENT[lang].dictionary;

  const ctxInfo = useMemo(() => (key ? wordContextInfo(lang, key) : null), [lang, key]);
  const primaryExample = e?.example ?? ctxInfo?.extraSentences[0];
  const primarySourceLabel = e?.example ? null : ctxInfo?.extraSentences[0]?.sourceLabel;
  const extraExamples = useMemo(() => {
    if (!ctxInfo) return [];
    return e?.example ? ctxInfo.extraSentences.slice(0, 2) : ctxInfo.extraSentences.slice(1, 3);
  }, [ctxInfo, e?.example]);

  const handleClose = () => {
    setSubTok(null);
    onClose();
  };

  return (
    <>
      <Sheet
        open={!!tok}
        onClose={handleClose}
        title={
          <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)]">
            <span>Palavra</span>
            {subTok && subTok.parentKey === rootKey && tok && (
              <button
                type="button"
                onClick={() => setSubTok(null)}
                className="rounded-full bg-[var(--color-bg)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-lilac-soft)]"
              >
                ← {tok.text}
              </button>
            )}
          </span>
        }
      >
        {activeTok && e && (
          <div className={`lang-${lang}`}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div lang={speechLang} className="target text-3xl font-extrabold">
                  {activeTok.text}
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">
                  {[e.reading, e.romaji, e.pron && `[${e.pron}]`].filter(Boolean).join(" · ")}
                </div>
              </div>
              <SpeakButton text={activeTok.text} lang={lang} size={46} />
              <SpeakButton text={activeTok.text} lang={lang} size={40} slow label="Ouvir devagar (0.6×)" />
              <CopyTextButton text={activeTok.text} lang={lang} size={40} label={`Copiar ${activeTok.text}`} />
            </div>
            <div className="mt-4 text-xl font-bold">{e.pt}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-[var(--color-lilac-soft)] px-3 py-1">{POS_PT[e.pos] ?? e.pos}</span>
              {e.lemma && e.lemma.toLowerCase() !== activeTok.text.toLowerCase() && (
                <span className="rounded-full bg-[var(--color-teal-soft)] px-3 py-1">
                  forma base: <span lang={speechLang} className="target">{e.lemma}</span>
                </span>
              )}
              {e.gender && (
                <span className="rounded-full bg-[var(--color-coral-soft)] px-3 py-1">{e.gender === "m" ? "masculino" : "feminino"}</span>
              )}
              {activeTok.chunk && <span className="rounded-full bg-[var(--color-yellow-soft)] px-3 py-1">expressão fixa</span>}
              {saved && (
                <span
                  className={`rounded-full px-3 py-1 font-bold ${
                    strong ? "bg-[var(--color-good-soft)] text-[var(--color-good)]" : "bg-[var(--color-bg)] text-[var(--color-muted)]"
                  }`}
                >
                  {strong ? "✓ Memória forte" : "🔄 Em revisão"}
                </span>
              )}
            </div>
            {e.conj && (
              <div className="mt-3 rounded-2xl bg-[var(--color-bg)] p-3 text-sm">
                <div className="mb-1 text-xs font-bold text-[var(--color-muted)]">CONJUGAÇÃO</div>
                <span lang={speechLang} className="target">{e.conj}</span>
              </div>
            )}
            {e.note && <div className="mt-3 rounded-2xl bg-[var(--color-yellow-soft)] p-3 text-sm">💡 {e.note}</div>}
            {ctxInfo && ctxInfo.confusableWith.length > 0 && (
              <div className="mt-3 space-y-2">
                {ctxInfo.confusableWith.map((cw) => {
                  const cwEntry = dict[cw.otherKey];
                  return (
                    <div
                      key={cw.otherKey}
                      className="rounded-2xl border border-[var(--color-coral)]/35 bg-[var(--color-coral-soft)]/55 p-3 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-[var(--color-coral)]">
                          ⚖️ Não confundir com{" "}
                          <span lang={speechLang} className="target underline">
                            {cw.otherKey}
                          </span>{" "}
                          ({cw.otherPt})
                        </span>
                        {cwEntry && (
                          <button
                            type="button"
                            onClick={() =>
                              setSubTok({
                                parentKey: rootKey,
                                tok: {
                                  text: cw.otherKey,
                                  key: cw.otherKey,
                                  entry: cwEntry,
                                  isPunct: false,
                                  spaceAfter: false,
                                  chunk: cw.otherKey.includes(" "),
                                },
                              })
                            }
                            className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-[var(--color-ink)] shadow-sm transition hover:bg-[var(--color-lilac-soft)]"
                          >
                            Ver «{cw.otherKey}» →
                          </button>
                        )}
                      </div>
                      <p className="mt-1 leading-relaxed text-[var(--color-ink)]">{cw.tipPt}</p>
                    </div>
                  );
                })}
              </div>
            )}
            {lang === "ja" && hasKanji(activeTok.text) && (
              <div className="mt-3 rounded-2xl bg-[var(--color-bg)] p-3 text-sm" data-testid="word-kanji">
                <div className="mb-1 text-xs font-bold text-[var(--color-muted)]">KANJI</div>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(activeTok.text.match(KANJI_CHAR_RE) ?? [])].map((ch) => {
                    const k = KANJI_BY_CHAR.get(ch);
                    return (
                      <Link key={ch} href={`/kanji?k=${encodeURIComponent(ch)}`} className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-[var(--shadow-card)]">
                        <span className="jp text-xl font-bold">{ch}</span>
                        <span className="text-xs">{k ? k.meaning : "—"}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            {primaryExample && (
              <div className="mt-3 flex items-start gap-3 rounded-2xl border border-[var(--color-line)] p-3">
                <div className="min-w-0 flex-1">
                  {primarySourceLabel && (
                    <div className="mb-1 text-[11px] font-bold text-[var(--color-muted)]">{primarySourceLabel}</div>
                  )}
                  <div lang={speechLang} className="target font-semibold">{plainText(primaryExample.text, lang)}</div>
                  <div className="text-sm text-[var(--color-muted)]">{primaryExample.pt}</div>
                </div>
                <SpeakButton text={primaryExample.text} lang={lang} size={34} />
              </div>
            )}
            {extraExamples.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
                  Mais frases em contexto real
                </div>
                {extraExamples.map((ex, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl bg-[var(--color-bg)] p-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 text-[11px] font-bold text-[var(--color-muted)]">{ex.sourceLabel}</div>
                      <div lang={speechLang} className="target text-sm font-semibold">{plainText(ex.text, lang)}</div>
                      <div className="text-xs text-[var(--color-muted)]">{ex.pt}</div>
                    </div>
                    <SpeakButton text={ex.text} lang={lang} size={32} className="!bg-white" />
                  </div>
                ))}
              </div>
            )}
            {ctxInfo && ctxInfo.collocations.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
                  Expressões e combinações frequentes
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ctxInfo.collocations.map((col) => {
                    const colEntry = dict[col.key];
                    if (!colEntry) return null;
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() =>
                          setSubTok({
                            parentKey: rootKey,
                            tok: {
                              text: col.key,
                              key: col.key,
                              entry: colEntry,
                              isPunct: false,
                              spaceAfter: false,
                              chunk: col.key.includes(" "),
                            },
                          })
                        }
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[var(--color-yellow-soft)]/80 px-3 py-1 text-xs font-semibold transition hover:bg-[var(--color-yellow-soft)]"
                      >
                        <span lang={speechLang} className="target font-bold">{col.key}</span>
                        <span className="text-[#6e530e]">· {col.pt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {ctxInfo && (ctxInfo.packs.length > 0 || ctxInfo.networks.length > 0) && (
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
                  Cenários e redes onde usar
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ctxInfo.packs.map((p) => (
                    <Link
                      key={p.id}
                      href={`/contextos?pack=${encodeURIComponent(p.id)}`}
                      onClick={handleClose}
                      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[var(--color-teal-soft)] px-3 py-1 text-xs font-bold text-[var(--color-ink)] transition hover:opacity-90"
                    >
                      <span>{p.emoji}</span>
                      <span>{p.title}</span>
                    </Link>
                  ))}
                  {ctxInfo.networks.map((n) => (
                    <Link
                      key={n.id}
                      href="/cursos/vocabulario"
                      onClick={handleClose}
                      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[var(--color-lilac-soft)] px-3 py-1 text-xs font-bold text-[var(--color-ink)] transition hover:opacity-90"
                    >
                      <span>{n.emoji}</span>
                      <span>{n.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {ctxInfo && ctxInfo.relatedWords.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-muted)]">
                  Palavras do mesmo contexto
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ctxInfo.relatedWords.map((rw) => {
                    const rwEntry = dict[rw.key];
                    if (!rwEntry) return null;
                    return (
                      <button
                        key={rw.key}
                        type="button"
                        onClick={() =>
                          setSubTok({
                            parentKey: rootKey,
                            tok: {
                              text: rw.key,
                              key: rw.key,
                              entry: rwEntry,
                              isPunct: false,
                              spaceAfter: false,
                              chunk: rw.key.includes(" "),
                            },
                          })
                        }
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[var(--color-bg)] px-3 py-1 text-xs font-semibold transition hover:bg-[var(--color-lilac-soft)]"
                      >
                        <span lang={speechLang} className="target font-bold">{rw.key}</span>
                        <span className="text-[var(--color-muted)]">· {rw.pt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={saved}
                className={`btn flex-1 ${saved ? "btn-soft" : "btn-primary"}`}
                onClick={() => {
                  const sfxOn = state.settings.soundEffects !== false;
                  const nextSaved = !saved;
                  if (nextSaved) sfxSuccess(sfxOn);
                  else sfxTap(sfxOn);
                  update((s) => toggleWordSaved(s, lang, key, 2).state);
                  setToast(nextSaved ? "✓ Guardada para revisão" : "Removida da revisão");
                }}
              >
                <Icon name="bookmark" size={19} filled={saved} />
                <span>{saved ? "Na revisão ✓" : "Guardar"}</span>
              </button>
              <Link
                href="/cursos/vocabulario?tab=treino"
                onClick={handleClose}
                className="btn btn-soft !px-3.5 text-sm"
              >
                <span>🧩 Treinar</span>
              </Link>
              <button type="button" className="btn btn-soft !px-3.5" onClick={() => setReport(true)} aria-label="Reportar erro">
                <Icon name="flag" size={20} />
              </button>
            </div>
          </div>
        )}
      </Sheet>
      <ReportSheet open={report} onClose={() => setReport(false)} refId={`${lang}:word:${key}`} text={activeTok?.text ?? ""} />
      <Toast text={toast} onDone={() => setToast(null)} />
    </>
  );
}

/* ---------------- Folha da frase ---------------- */

export function SentenceSheet({
  line,
  lang,
  patterns,
  onClose,
}: {
  line: ReaderLine | null;
  lang: LangCode;
  patterns?: Pattern[];
  onClose: () => void;
}) {
  const [report, setReport] = useState(false);
  const [word, setWord] = useState<RToken | null>(null);
  const pattern = line?.patternId ? patterns?.find((p) => p.id === line.patternId) : undefined;
  return (
    <>
      <Sheet open={!!line} onClose={onClose} title={<span className="text-[var(--color-muted)] text-sm font-semibold">Frase</span>}>
        {line && (
          <div className={`lang-${lang}`}>
            <div className="text-2xl font-bold leading-relaxed">
              <TokenLine text={line.text} lang={lang} onWord={setWord} />
            </div>
            {line.romaji && <div className="mt-1 text-sm italic text-[var(--color-muted)]">{line.romaji}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              <SpeakButton text={line.text} lang={lang} pillLabel="Ouvir" label="Ouvir frase" />
              <SpeakButton text={line.text} lang={lang} slow pillLabel="0.6×" label="Ouvir frase devagar" />
              <CopyTextButton text={line.text} lang={lang} pillLabel="Copiar" label="Copiar frase" />
            </div>
            <div className="mt-4 rounded-2xl bg-[var(--color-bg)] p-4">
              <div className="text-xs font-bold text-[var(--color-muted)]">TRADUÇÃO NATURAL</div>
              <div className="mt-1 text-lg font-semibold">{line.pt}</div>
            </div>
            {line.blocks && line.blocks.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-xs font-bold text-[var(--color-muted)]">DIVISÃO POR BLOCOS</div>
                <div className="flex flex-wrap gap-2">
                  {line.blocks.map((b, i) => (
                    <div
                      key={i}
                      className="rounded-2xl px-3 py-2"
                      style={{ background: ["var(--color-coral-soft)", "var(--color-yellow-soft)", "var(--color-teal-soft)", "var(--color-lilac-soft)"][i % 4] }}
                    >
                      <div className="target font-bold">{plainText(b.text, lang)}</div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">{b.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pattern && (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-[var(--color-coral)]/40 p-4">
                <div className="text-xs font-bold text-[var(--color-coral)]">MOLDE DE FRASE</div>
                <div className="target mt-1 text-lg font-bold">{plainText(pattern.template, lang).replaceAll("{x}", "[ … ]")}</div>
                {pattern.romaji && <div className="text-sm italic text-[var(--color-muted)]">{pattern.romaji.replaceAll("{x}", "[ … ]")}</div>}
                <div className="text-sm text-[var(--color-muted)]">{pattern.pt.replaceAll("{x}", "[ … ]")}</div>
                <div className="mt-2 text-sm">💡 {pattern.note}</div>
              </div>
            )}
            <button className="btn btn-soft mt-5 w-full" onClick={() => setReport(true)}>
              <Icon name="flag" size={18} /> Reportar erro nesta frase
            </button>
          </div>
        )}
      </Sheet>
      <WordSheet tok={word} lang={lang} onClose={() => setWord(null)} />
      <ReportSheet open={report} onClose={() => setReport(false)} refId={`${lang}:sentence`} text={line ? plainText(line.text, lang) : ""} />
    </>
  );
}

/* ---------------- Reportar erro ---------------- */

const REASONS = ["Tradução errada", "Frase pouco natural", "Erro de ortografia", "Áudio / pronúncia", "Outro"];

export function ReportSheet({ open, onClose, refId, text }: { open: boolean; onClose: () => void; refId: string; text: string }) {
  const { update } = useApp();
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async () => {
    const full = detail ? `${reason}: ${detail}` : reason;
    update((s) => ({
      ...s,
      reports: [...s.reports, { id: Math.random().toString(36).slice(2), ref: refId, text, reason: full, at: Date.now() }],
    }));
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: refId, text: text.slice(0, 800), reason: full.slice(0, 500) }),
      });
    } catch {
      /* offline: fica guardado localmente */
    }
    setSent(true);
  };
  return (
    <Sheet
      open={open}
      onClose={() => {
        onClose();
        setSent(false);
        setDetail("");
      }}
      title="Reportar erro"
    >
      {sent ? (
        <div className="py-6 text-center">
          <div className="text-4xl">🙏</div>
          <div className="mt-2 font-bold">Obrigado! A nossa equipa de nativos vai rever.</div>
        </div>
      ) : (
        <div>
          <div className="target mb-3 rounded-2xl bg-[var(--color-bg)] p-3 font-semibold">{text}</div>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                className={`chip ${reason === r ? "!bg-[var(--color-ink)] text-white" : ""}`}
                onClick={() => setReason(r)}
                aria-pressed={reason === r}
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            className="input mt-3 min-h-20"
            placeholder="Detalhes (opcional)"
            value={detail}
            maxLength={400}
            onChange={(e) => setDetail(e.target.value)}
          />
          <button className="btn btn-primary mt-3 w-full" onClick={submit}>
            Enviar
          </button>
        </div>
      )}
    </Sheet>
  );
}

/* ---------------- Leitor de diálogo ---------------- */

export function DialogueReader({
  lines,
  lang,
  patterns,
  activeIndex,
  onPlayLine,
}: {
  lines: (ReaderLine | DialogueLine)[];
  lang: LangCode;
  patterns?: Pattern[];
  activeIndex?: number;
  onPlayLine?: (i: number) => void;
}) {
  const { state } = useApp();
  const [word, setWord] = useState<RToken | null>(null);
  const [sent, setSent] = useState<ReaderLine | null>(null);
  const [showPt, setShowPt] = useState<Record<number, boolean>>({});
  const speakers = Array.from(new Set(lines.map((l) => l.speaker ?? "")));
  return (
    <div className={`flex flex-col gap-3 lang-${lang}`}>
      {lines.map((l, i) => {
        const right = speakers.indexOf(l.speaker ?? "") % 2 === 1;
        const active = activeIndex === i;
        return (
          <div key={i} className={`flex ${right ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] rounded-3xl p-4 transition ${right ? "rounded-br-lg bg-[var(--color-lilac-soft)]" : "rounded-bl-lg bg-white shadow-[var(--shadow-card)]"} ${
                active ? "ring-2 ring-[var(--color-coral)]" : ""
              }`}
            >
              {l.speaker && <div className="mb-1 text-xs font-bold text-[var(--color-muted)]">{l.speaker}</div>}
              <div className="text-lg font-semibold leading-relaxed">
                <TokenLine text={l.text} lang={lang} onWord={setWord} />
              </div>
              {lang === "ja" && state.settings.romaji && l.romaji && <div className="mt-0.5 text-sm italic text-[var(--color-muted)]">{l.romaji}</div>}
              {showPt[i] && <div className="fade-in mt-1 text-sm text-[var(--color-muted)]">{l.pt}</div>}
              <div className="mt-2 flex items-center gap-1.5">
                <SpeakButton text={l.text} lang={lang} size={32} />
                <button
                  className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-bg)]"
                  aria-label="Mostrar tradução"
                  aria-pressed={!!showPt[i]}
                  onClick={() => setShowPt((s) => ({ ...s, [i]: !s[i] }))}
                >
                  <Icon name="translate" size={16} />
                </button>
                <button
                  className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-bg)]"
                  aria-label="Analisar frase"
                  onClick={() => {
                    setSent(l);
                    onPlayLine?.(i);
                  }}
                >
                  <Icon name="layers" size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      <WordSheet tok={word} lang={lang} onClose={() => setWord(null)} />
      <SentenceSheet line={sent} lang={lang} patterns={patterns} onClose={() => setSent(null)} />
    </div>
  );
}

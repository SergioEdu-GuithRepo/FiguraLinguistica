import type { Dictionary, LangCode, LanguageContent, Unit } from "@/lib/types";
import { units as enUnits1 } from "./en/units";
import { dictionary as enDict1 } from "./en/dictionary";
import { units as enUnits2 } from "./en/units-rotina";
import { dictionary as enDict2 } from "./en/dictionary-rotina";
import { units as enUnits3 } from "./en/units-interaccao";
import { dictionary as enDict3 } from "./en/dictionary-interaccao";
import { units as enUnits4 } from "./en/units-autonomia";
import { dictionary as enDict4 } from "./en/dictionary-autonomia";
import { units as enUnits5 } from "./en/units-fluencia";
import { dictionary as enDict5 } from "./en/dictionary-fluencia";

import { units as frUnits1 } from "./fr/units";
import { dictionary as frDict1 } from "./fr/dictionary";
import { units as frUnits2 } from "./fr/units-rotina";
import { dictionary as frDict2 } from "./fr/dictionary-rotina";
import { units as frUnits3 } from "./fr/units-interaccao";
import { dictionary as frDict3 } from "./fr/dictionary-interaccao";
import { units as frUnits4 } from "./fr/units-autonomia";
import { dictionary as frDict4 } from "./fr/dictionary-autonomia";
import { units as frUnits5 } from "./fr/units-fluencia";
import { dictionary as frDict5 } from "./fr/dictionary-fluencia";

import { units as jaUnits1 } from "./ja/units";
import { dictionary as jaDict1 } from "./ja/dictionary";
import { units as jaUnits2 } from "./ja/units-rotina";
import { dictionary as jaDict2 } from "./ja/dictionary-rotina";
import { units as jaUnits3 } from "./ja/units-interaccao";
import { dictionary as jaDict3 } from "./ja/dictionary-interaccao";
import { units as jaUnits4 } from "./ja/units-autonomia";
import { dictionary as jaDict4 } from "./ja/dictionary-autonomia";
import { units as jaUnits5 } from "./ja/units-fluencia";
import { dictionary as jaDict5 } from "./ja/dictionary-fluencia";

/** Junta dicionários por etapa; as entradas das etapas anteriores prevalecem (não são redefinidas). */
function mergeDicts(...dicts: Dictionary[]): Dictionary {
  const out: Dictionary = {};
  for (const d of dicts) for (const [k, v] of Object.entries(d)) if (!(k in out)) out[k] = v;
  return out;
}

/** Dicionários por etapa (usados pelo validador para detectar chaves repetidas). */
export const DICT_PARTS: Record<LangCode, Dictionary[]> = {
  en: [enDict1, enDict2, enDict3, enDict4, enDict5],
  fr: [frDict1, frDict2, frDict3, frDict4, frDict5],
  ja: [jaDict1, jaDict2, jaDict3, jaDict4, jaDict5],
};

const enUnits = [...enUnits1, ...enUnits2, ...enUnits3, ...enUnits4, ...enUnits5];
const frUnits = [...frUnits1, ...frUnits2, ...frUnits3, ...frUnits4, ...frUnits5];
const jaUnits = [...jaUnits1, ...jaUnits2, ...jaUnits3, ...jaUnits4, ...jaUnits5];

export const CONTENT: Record<LangCode, LanguageContent> = {
  en: { code: "en", units: enUnits, dictionary: mergeDicts(...DICT_PARTS.en) },
  fr: { code: "fr", units: frUnits, dictionary: mergeDicts(...DICT_PARTS.fr) },
  ja: { code: "ja", units: jaUnits, dictionary: mergeDicts(...DICT_PARTS.ja) },
};

export function getUnit(id: string): Unit | undefined {
  const lang = id.split("-")[0] as LangCode;
  return CONTENT[lang]?.units.find((u) => u.id === id);
}

export function allUnits(): Unit[] {
  return [...enUnits, ...frUnits, ...jaUnits];
}

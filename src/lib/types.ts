/**
 * Tipos de conteúdo do FiguraLinguística.
 *
 * Convenções de texto (usadas pelo tokenizador em `tokenize.ts`):
 *  - Inglês / Francês: palavras separadas por espaços. Pontuação é separada automaticamente.
 *    Apóstrofos e hífenes fazem parte da palavra ("j'aimerais", "est-ce", "I'm").
 *    Francês: liaison obrigatória marca-se com "‿" entre as palavras: "Vous‿êtes".
 *  - Japonês: tokens separados por "|" (não aparece no ecrã): "コーヒー|を|ください|。"
 *
 * Cada token (exceto pontuação) deve existir no dicionário do idioma, com a chave em minúsculas.
 * Chaves com espaços (ex.: "would like", "thank you") são "chunks": o tokenizador junta-os.
 */

export type LangCode = "en" | "fr" | "ja";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adj"
  | "adv"
  | "pron"
  | "prep"
  | "det"
  | "conj"
  | "particle"
  | "interj"
  | "num"
  | "expr"
  | "aux"
  | "copula"
  | "suffix";

export interface DictEntry {
  /** Forma de dicionário (lema). Ex.: "be" para "am"; "être" para "suis"; "食べる" para "食べます". */
  lemma: string;
  pos: PartOfSpeech;
  /** Tradução curta em português. */
  pt: string;
  /** Japonês: leitura em hiragana (obrigatória para palavras com kanji ou katakana). */
  reading?: string;
  /** Japonês: romaji (Hepburn). Obrigatório em japonês. */
  romaji?: string;
  /** EN/FR: pronúncia aproximada para falantes de português. Ex.: "uóter", "bõjur". */
  pron?: string;
  /** FR: género dos substantivos. */
  gender?: "m" | "f";
  /** FR: infinitivo + nota de conjugação ao toque. Ex.: "être — je suis, tu es, il est". */
  conj?: string;
  /** Exemplo curto. */
  example?: { text: string; pt: string };
  /** Falso amigo / cognato (FR/EN). */
  note?: string;
}

export type Dictionary = Record<string, DictEntry>;

export interface SentenceBlock {
  /** Rótulo em português: "sujeito", "verbo", "complemento", "partícula", "tópico"... */
  label: string;
  text: string;
}

export interface DialogueLine {
  /** Nome do falante (ex.: "Emma", "Tu", "Empregado"). */
  speaker: string;
  /** Texto no idioma-alvo (ver convenções acima). */
  text: string;
  /** Tradução natural em português. */
  pt: string;
  /** Japonês: romaji da frase completa. */
  romaji?: string;
  /** Divisão por blocos (opcional mas recomendado). */
  blocks?: SentenceBlock[];
  /** id do molde (Pattern) que esta frase usa, se houver. */
  patternId?: string;
}

export interface PatternSlot {
  /** Texto a inserir no molde (idioma-alvo, mesmas convenções). */
  text: string;
  pt: string;
  romaji?: string;
}

export interface Pattern {
  id: string;
  /** Molde com "{x}" no lugar do espaço variável. Ex.: "I would like {x}, please." / "{x}|を|ください|。" */
  template: string;
  /** Tradução do molde com "{x}". Ex.: "Queria {x}, por favor." */
  pt: string;
  /** Japonês: romaji do molde com "{x}". */
  romaji?: string;
  /** Nota curta em português (uma linha) — "Porquê?". */
  note: string;
  /** 4 a 6 opções para o "Molde vivo". */
  slots: PatternSlot[];
}

export interface BuildExercise {
  /** Frase em português a construir. */
  pt: string;
  /** Blocos na ordem correcta (idioma-alvo). Em japonês, incluir partículas como blocos. */
  chunks: string[];
  /** Blocos extra (distractores), opcional. */
  distractors?: string[];
  /** Japonês: romaji da frase correcta. */
  romaji?: string;
}

export interface ConversationStep {
  /** Fala do tutor no idioma-alvo (mesmas convenções). */
  tutor: string;
  tutor_pt: string;
  tutor_romaji?: string;
  /** Respostas aceites do aluno (idioma-alvo, escritas como o aluno escreveria, sem "|"). 2 a 5 variantes. */
  expected: string[];
  /** Palavras-chave mínimas para considerar "compreensível" (idioma-alvo, minúsculas). */
  keywords: string[];
  /** Ajuda em escada: 1) dica em português */
  hint: string;
  /** 2) início da frase */
  starter: string;
  /** 3) frase completa modelo (idioma-alvo, sem "|") */
  model: string;
  /** 4) tradução da frase modelo */
  model_pt: string;
  model_romaji?: string;
}

export interface UnitConversation {
  /** Objectivo da conversa em português. */
  goal: string;
  steps: ConversationStep[];
  /** Fecho do tutor (idioma-alvo, sem "|"). */
  closing: string;
  closing_pt: string;
  /** 2 expressões novas para o resumo. */
  takeaways: { text: string; pt: string }[];
}

export interface Unit {
  /** "en-1" ... "en-9" */
  id: string;
  lang: LangCode;
  level: number;
  /** Título em português. Ex.: "No café". */
  title: string;
  /** Título no idioma-alvo. Ex.: "At the café". */
  titleTarget: string;
  /** Categoria (para a lista de Lições). Ex.: "Cumprimentos", "Comida", "Compras". */
  category: string;
  /** Emoji representativo da cena. */
  emoji: string;
  /** Objectivo em português. Ex.: "Vais pedir uma bebida e pagar." */
  objective: string;
  /** Mini-diálogo (6 a 8 linhas). */
  dialogue: DialogueLine[];
  /** 2 a 3 moldes. */
  patterns: Pattern[];
  /** 8 a 12 chaves do dicionário (vocabulário-chave). */
  vocab: string[];
  /** 3 a 4 exercícios "Montar a frase". */
  build: BuildExercise[];
  /** Conversa final (3 a 4 passos). */
  conversation: UnitConversation;
}

export interface LanguageContent {
  code: LangCode;
  units: Unit[];
  dictionary: Dictionary;
}

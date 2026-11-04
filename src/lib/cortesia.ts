/**
 * Módulo de Japonês Avançado: Contadores (助数詞) e Níveis de Cortesia / Keigo (敬語) — Secção 4.5.
 */

export interface CounterReading {
  n: number;
  kanji: string;
  reading: string;
  romaji: string;
  irregular?: boolean;
}

export interface CounterInfo {
  id: string;
  symbol: string;
  reading: string;
  romaji: string;
  titlePt: string;
  usagePt: string;
  tipPt: string;
  example: { ja: string; reading: string; romaji: string; pt: string };
  items: CounterReading[];
}

export interface PolitenessRow {
  id: string;
  meaningPt: string;
  casual: { ja: string; romaji: string; note: string };
  polite: { ja: string; romaji: string; note: string };
  keigo: { ja: string; romaji: string; type: "尊敬語 (respeitoso)" | "謙譲語 (humilde)" | "丁寧語 (formal)"; note: string };
}

export interface CortesiaQuestion {
  id: string;
  kind: "counter" | "keigo";
  promptPt: string;
  contextJa?: string;
  options: { label: string; sub?: string }[];
  correct: string;
  explanationPt: string;
}

export const COUNTERS: CounterInfo[] = [
  {
    id: "tsu",
    symbol: "つ",
    reading: "つ",
    romaji: "-tsu",
    titlePt: "Objectos em geral (1 a 10)",
    usagePt: "Contador universal nativo japonês. Funciona para encomendas num restaurante, fruta, ideias ou quando não te lembras do contador específico.",
    tipPt: "Pergunta-se com いくつ (ikutsu = quantos?). O número 10 (とお) não leva つ.",
    example: {
      ja: "コーヒーを 二つ ください。",
      reading: "コーヒーを ふたつ ください。",
      romaji: "Koohii o futatsu kudasai.",
      pt: "Dois cafés, por favor.",
    },
    items: [
      { n: 1, kanji: "一つ", reading: "ひとつ", romaji: "hitotsu", irregular: true },
      { n: 2, kanji: "二つ", reading: "ふたつ", romaji: "futatsu", irregular: true },
      { n: 3, kanji: "三つ", reading: "みっつ", romaji: "mittsu", irregular: true },
      { n: 4, kanji: "四つ", reading: "よっつ", romaji: "yottsu", irregular: true },
      { n: 5, kanji: "五つ", reading: "いつつ", romaji: "itsutsu" },
      { n: 6, kanji: "六つ", reading: "むっつ", romaji: "muttsu", irregular: true },
      { n: 7, kanji: "七つ", reading: "ななつ", romaji: "nanatsu" },
      { n: 8, kanji: "八つ", reading: "やっつ", romaji: "yattsu", irregular: true },
      { n: 9, kanji: "九つ", reading: "ここのつ", romaji: "kokonotsu" },
      { n: 10, kanji: "十", reading: "とお", romaji: "too", irregular: true },
    ],
  },
  {
    id: "nin",
    symbol: "人",
    reading: "にん",
    romaji: "-nin",
    titlePt: "Pessoas",
    usagePt: "Usado para contar pessoas (clientes num restaurante, membros da família, colegas).",
    tipPt: "1 pessoa (ひとり) e 2 pessoas (ふたり) usam leituras nativas especiais! A partir de 3 usa-se ～にん (4 é よにん, não よんにん).",
    example: {
      ja: "家族は 四人 です。",
      reading: "かぞくは よにん です。",
      romaji: "Kazoku wa yonin desu.",
      pt: "A minha família tem quatro pessoas.",
    },
    items: [
      { n: 1, kanji: "一人", reading: "ひとり", romaji: "hitori", irregular: true },
      { n: 2, kanji: "二人", reading: "ふたり", romaji: "futari", irregular: true },
      { n: 3, kanji: "三人", reading: "さんにん", romaji: "sannin" },
      { n: 4, kanji: "四人", reading: "よにん", romaji: "yonin", irregular: true },
      { n: 5, kanji: "五人", reading: "ごにん", romaji: "gonin" },
      { n: 6, kanji: "六人", reading: "ろくにん", romaji: "rokunin" },
      { n: 7, kanji: "七人", reading: "しちにん", romaji: "shichinin" },
      { n: 8, kanji: "八人", reading: "はちにん", romaji: "hachinin" },
      { n: 9, kanji: "九人", reading: "きゅうにん", romaji: "kyuunin" },
      { n: 10, kanji: "十人", reading: "じゅうにん", romaji: "juunin" },
    ],
  },
  {
    id: "hon",
    symbol: "本",
    reading: "ほん",
    romaji: "-hon / -pon / -bon",
    titlePt: "Objectos longos e cilíndricos",
    usagePt: "Garrafas, canetas, guarda-chuvas, árvores, comboios e até chamadas telefónicas.",
    tipPt: "Atenção à mudança de som: 1, 6, 8, 10 mudam para っぽん (-ppon) e 3 muda para ぼん (sanbon).",
    example: {
      ja: "水を 二本 買いました。",
      reading: "みずを にほん かいました。",
      romaji: "Mizu o nihon kaimashita.",
      pt: "Comprei duas garrafas de água.",
    },
    items: [
      { n: 1, kanji: "一本", reading: "いっぽん", romaji: "ippon", irregular: true },
      { n: 2, kanji: "二本", reading: "にほん", romaji: "nihon" },
      { n: 3, kanji: "三本", reading: "さんぼん", romaji: "sanbon", irregular: true },
      { n: 4, kanji: "四本", reading: "よんほん", romaji: "yonhon" },
      { n: 5, kanji: "五本", reading: "ごほん", romaji: "gohon" },
      { n: 6, kanji: "六本", reading: "ろっぽん", romaji: "roppon", irregular: true },
      { n: 7, kanji: "七本", reading: "ななほん", romaji: "nanahon" },
      { n: 8, kanji: "八本", reading: "はっぽん", romaji: "happon", irregular: true },
      { n: 9, kanji: "九本", reading: "きゅうほん", romaji: "kyuuhon" },
      { n: 10, kanji: "十本", reading: "じゅっぽん", romaji: "juppon", irregular: true },
    ],
  },
  {
    id: "mai",
    symbol: "枚",
    reading: "まい",
    romaji: "-mai",
    titlePt: "Objectos planos e finos",
    usagePt: "Bilhetes, folhas de papel, camisas, pratos, fatias de pão ou pizza.",
    tipPt: "É completamente regular! Basta juntar o número normal + まい (1 a 10 sem alterações fonéticas).",
    example: {
      ja: "きっぷを 二枚 ください。",
      reading: "きっぷを にまい ください。",
      romaji: "Kippu o nimai kudasai.",
      pt: "Dois bilhetes, por favor.",
    },
    items: [
      { n: 1, kanji: "一枚", reading: "いちまい", romaji: "ichimai" },
      { n: 2, kanji: "二枚", reading: "にまい", romaji: "nimai" },
      { n: 3, kanji: "三枚", reading: "さんまい", romaji: "sanmai" },
      { n: 4, kanji: "四枚", reading: "よんまい", romaji: "yonmai" },
      { n: 5, kanji: "五枚", reading: "ごまい", romaji: "gomai" },
      { n: 6, kanji: "六枚", reading: "ろくまい", romaji: "rokumai" },
      { n: 7, kanji: "七枚", reading: "ななまい", romaji: "nanamai" },
      { n: 8, kanji: "八枚", reading: "はちまい", romaji: "hachimai" },
      { n: 9, kanji: "九枚", reading: "きゅうまい", romaji: "kyuumai" },
      { n: 10, kanji: "十枚", reading: "じゅうまい", romaji: "juumai" },
    ],
  },
  {
    id: "hai",
    symbol: "杯",
    reading: "はい",
    romaji: "-hai / -pai / -bai",
    titlePt: "Copos, chávenas e tigelas",
    usagePt: "Chávenas de café/chá, copos de água ou cerveja, tigelas de arroz ou ramen.",
    tipPt: "Segue a mesma regra fonética de 本: 1, 6, 8, 10 levam っぱい (-ppai) e 3 leva ばい (sanbai).",
    example: {
      ja: "おちゃを 一杯 おねがいします。",
      reading: "おちゃを いっぱい おねがいします。",
      romaji: "Ocha o ippai onegaishimasu.",
      pt: "Uma chávena de chá, por favor.",
    },
    items: [
      { n: 1, kanji: "一杯", reading: "いっぱい", romaji: "ippai", irregular: true },
      { n: 2, kanji: "二杯", reading: "にはい", romaji: "nihai" },
      { n: 3, kanji: "三杯", reading: "さんばい", romaji: "sanbai", irregular: true },
      { n: 4, kanji: "四杯", reading: "よんはい", romaji: "yonhai" },
      { n: 5, kanji: "五杯", reading: "ごはい", romaji: "gohai" },
      { n: 6, kanji: "六杯", reading: "ろっぱい", romaji: "roppai", irregular: true },
      { n: 7, kanji: "七杯", reading: "ななはい", romaji: "nanahai" },
      { n: 8, kanji: "八杯", reading: "はっぱい", romaji: "happai", irregular: true },
      { n: 9, kanji: "九杯", reading: "きゅうはい", romaji: "kyuuhai" },
      { n: 10, kanji: "十杯", reading: "じゅっぱい", romaji: "juppai", irregular: true },
    ],
  },
];

export const POLITENESS_ROWS: PolitenessRow[] = [
  {
    id: "copula",
    meaningPt: "Ser / estar (afirmação)",
    casual: { ja: "だ (ou omitido)", romaji: "da", note: "Entre amigos íntimos e família" },
    polite: { ja: "です", romaji: "desu", note: "Padrão seguro no dia-a-dia" },
    keigo: {
      ja: "でございます",
      romaji: "de gozaimasu",
      type: "丁寧語 (formal)",
      note: "Atendimento ao cliente, hotéis e apresentações formais",
    },
  },
  {
    id: "go-come",
    meaningPt: "Ir / vir",
    casual: { ja: "行く / 来る", romaji: "iku / kuru", note: "Forma de dicionário (informal)" },
    polite: { ja: "行きます / 来ます", romaji: "ikimasu / kimasu", note: "Cortês padrão" },
    keigo: {
      ja: "いらっしゃいます / まいります",
      romaji: "irasshaimasu / mairimasu",
      type: "尊敬語 (respeitoso)",
      note: "いらっしゃいます (o cliente vai/vem) · まいります (eu vou/venho, humilde)",
    },
  },
  {
    id: "eat-drink",
    meaningPt: "Comer / beber",
    casual: { ja: "食べる / 飲む", romaji: "taberu / nomu", note: "Entre amigos" },
    polite: { ja: "食べます / 飲みます", romaji: "tabemasu / nomimasu", note: "Cortês padrão" },
    keigo: {
      ja: "めしあがります / いただきます",
      romaji: "meshiagarimasu / itadakimasu",
      type: "尊敬語 (respeitoso)",
      note: "めしあがります (o convidado come) · いただきます (eu como/recebo, humilde)",
    },
  },
  {
    id: "say",
    meaningPt: "Dizer",
    casual: { ja: "言う", romaji: "iu", note: "Informal" },
    polite: { ja: "言います", romaji: "iimasu", note: "Cortês padrão" },
    keigo: {
      ja: "おっしゃいます / もうします",
      romaji: "osshaimasu / moushimasu",
      type: "謙譲語 (humilde)",
      note: "おっしゃいます (o cliente diz) · ～と申します (chamo-me…, humilde)",
    },
  },
  {
    id: "do",
    meaningPt: "Fazer",
    casual: { ja: "する", romaji: "suru", note: "Informal" },
    polite: { ja: "します", romaji: "shimasu", note: "Cortês padrão" },
    keigo: {
      ja: "なさいます / いたします",
      romaji: "nasaimasu / itashimasu",
      type: "謙譲語 (humilde)",
      note: "なさいます (o cliente faz) · いたします (eu faço, ex.: おねがいいたします)",
    },
  },
  {
    id: "request",
    meaningPt: "Pedir um favor",
    casual: { ja: "～して！", romaji: "...shite!", note: "Directo, entre amigos" },
    polite: { ja: "～してください", romaji: "...shite kudasai", note: "Educado no quotidiano" },
    keigo: {
      ja: "～ていただけますか",
      romaji: "...te itadakemasu ka",
      type: "謙譲語 (humilde)",
      note: "«Poderia fazer o favor de…?» — ideal no trabalho ou com superiores",
    },
  },
];

export function buildCortesiaQuiz(): CortesiaQuestion[] {
  return [
    {
      id: "cq-1",
      kind: "counter",
      promptPt: "Como se diz «duas pessoas» (ex.: mesa para dois num restaurante)?",
      contextJa: "二人",
      options: [
        { label: "ふたり (futari)", sub: "Leitura nativa especial" },
        { label: "ににん (ninin)", sub: "Leitura regular" },
        { label: "ふたつ (futatsu)", sub: "Contador de objectos" },
        { label: "にまい (nimai)", sub: "Objectos planos" },
      ],
      correct: "ふたり (futari)",
      explanationPt: "1 pessoa é ひとり (hitori) e 2 pessoas é ふたり (futari). A partir de 3 usa-se ～にん.",
    },
    {
      id: "cq-2",
      kind: "counter",
      promptPt: "Como se lê «三本» (três garrafas ou três guarda-chuvas)?",
      contextJa: "三本",
      options: [
        { label: "さんぼん (sanbon)", sub: "Com som 'b'" },
        { label: "さんほん (sanhon)", sub: "Com som 'h'" },
        { label: "さんぽん (sanpon)", sub: "Com som 'p'" },
        { label: "みっつ (mittsu)", sub: "Contador geral" },
      ],
      correct: "さんぼん (sanbon)",
      explanationPt: "Depois de 三 (san), o contador 本 ganha sonorização (rendaku) e passa a ぼん: さんぼん (sanbon).",
    },
    {
      id: "cq-3",
      kind: "counter",
      promptPt: "Qual é o contador certo para pedir «dois bilhetes de comboio»?",
      contextJa: "きっぷを ＿＿ ください。",
      options: [
        { label: "二枚 (にまい · nimai)", sub: "Objectos finos e planos" },
        { label: "二本 (にほん · nihon)", sub: "Objectos cilíndricos" },
        { label: "二杯 (にはい · nihai)", sub: "Copos e chávenas" },
        { label: "二人 (ふたり · futari)", sub: "Pessoas" },
      ],
      correct: "二枚 (にまい · nimai)",
      explanationPt: "Bilhetes, folhas, pratos e camisas contam-se sempre com 枚 (まい).",
    },
    {
      id: "cq-4",
      kind: "keigo",
      promptPt: "Numa entrevista de trabalho, queres dizer «Chamo-me Ana» de forma humilde e muito educada (謙譲語):",
      contextJa: "アナと ＿＿。",
      options: [
        { label: "もうします (moushimasu)", sub: "Humilde / Keigo" },
        { label: "だ (da)", sub: "Casual" },
        { label: "おっしゃいます (osshaimasu)", sub: "Respeitoso (para o outro)" },
        { label: "言います (iimasu)", sub: "Cortês neutro" },
      ],
      correct: "もうします (moushimasu)",
      explanationPt: "～と申します (to moushimasu) é a forma humilde (謙譲語) usada para dizer o próprio nome em contexto profissional.",
    },
    {
      id: "cq-5",
      kind: "keigo",
      promptPt: "Estás a conversar com um amigo próximo e queres perguntar «O que vais fazer hoje?». Qual o registo natural?",
      contextJa: "今日 ＿＿？",
      options: [
        { label: "なに する？ (nani suru?)", sub: "Informal / Casual (普通形)" },
        { label: "なにを なさいますか？ (nani o nasaimasu ka?)", sub: "Keigo (clientes/superiores)" },
        { label: "なにを いたしますか？ (nani o itashimasu ka?)", sub: "Humilde" },
        { label: "でございますか？ (de gozaimasu ka?)", sub: "Formal de serviço" },
      ],
      correct: "なに する？ (nani suru?)",
      explanationPt: "Entre amigos íntimos usa-se a forma simples (普通形: する, 行く, 食べる) e omite-se muitas vezes a partícula.",
    },
    {
      id: "cq-6",
      kind: "keigo",
      promptPt: "No trabalho, precisas de pedir a um cliente ou superior que verifique um documento. Qual a expressão mais adequada?",
      contextJa: "かくにんして ＿＿。",
      options: [
        { label: "いただけますか (itadakemasu ka)", sub: "«Poderia fazer o favor de…?»" },
        { label: "ちょうだい (choudai)", sub: "Familiar" },
        { label: "くれ (kure)", sub: "Muito informal" },
        { label: "しなさい (shinasai)", sub: "Ordem" },
      ],
      correct: "いただけますか (itadakemasu ka)",
      explanationPt: "～ていただけますか é a forma padrão de cortesia profissional para pedir uma acção a um cliente ou superior.",
    },
  ];
}

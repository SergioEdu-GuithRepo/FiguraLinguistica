/** Hiragana e katakana: gojūon + dakuten/handakuten. [kana, romaji] */
export type KanaPair = [string, string];

export const HIRAGANA_ROWS: KanaPair[][] = [
  [["あ", "a"], ["い", "i"], ["う", "u"], ["え", "e"], ["お", "o"]],
  [["か", "ka"], ["き", "ki"], ["く", "ku"], ["け", "ke"], ["こ", "ko"]],
  [["さ", "sa"], ["し", "shi"], ["す", "su"], ["せ", "se"], ["そ", "so"]],
  [["た", "ta"], ["ち", "chi"], ["つ", "tsu"], ["て", "te"], ["と", "to"]],
  [["な", "na"], ["に", "ni"], ["ぬ", "nu"], ["ね", "ne"], ["の", "no"]],
  [["は", "ha"], ["ひ", "hi"], ["ふ", "fu"], ["へ", "he"], ["ほ", "ho"]],
  [["ま", "ma"], ["み", "mi"], ["む", "mu"], ["め", "me"], ["も", "mo"]],
  [["や", "ya"], ["ゆ", "yu"], ["よ", "yo"]],
  [["ら", "ra"], ["り", "ri"], ["る", "ru"], ["れ", "re"], ["ろ", "ro"]],
  [["わ", "wa"], ["を", "wo"], ["ん", "n"]],
];

export const HIRAGANA_DAKUTEN: KanaPair[][] = [
  [["が", "ga"], ["ぎ", "gi"], ["ぐ", "gu"], ["げ", "ge"], ["ご", "go"]],
  [["ざ", "za"], ["じ", "ji"], ["ず", "zu"], ["ぜ", "ze"], ["ぞ", "zo"]],
  [["だ", "da"], ["ぢ", "ji"], ["づ", "zu"], ["で", "de"], ["ど", "do"]],
  [["ば", "ba"], ["び", "bi"], ["ぶ", "bu"], ["べ", "be"], ["ぼ", "bo"]],
  [["ぱ", "pa"], ["ぴ", "pi"], ["ぷ", "pu"], ["ぺ", "pe"], ["ぽ", "po"]],
];

function toKatakana(rows: KanaPair[][]): KanaPair[][] {
  return rows.map((r) => r.map(([k, ro]) => [String.fromCharCode(k.charCodeAt(0) + 0x60), ro] as KanaPair));
}

export const KATAKANA_ROWS = toKatakana(HIRAGANA_ROWS);
export const KATAKANA_DAKUTEN = toKatakana(HIRAGANA_DAKUTEN);

export const KANA_TIPS: Record<string, string> = {
  し: "«shi», não «si».",
  ち: "«chi» como em «tchau».",
  つ: "«tsu»: t + s rápido.",
  ふ: "«fu»: entre «f» e «h», lábios quase fechados.",
  を: "Só se usa como partícula; lê-se «o».",
  ん: "Nasal, como o «m/n» final em português.",
  ら: "O «r» japonês é suave, entre «r» e «l».",
  ツ: "Cuidado: ツ (tsu) vs シ (shi) — traços de cima para baixo em ツ.",
  シ: "シ (shi): traços mais horizontais, de baixo para cima.",
  ソ: "ソ (so) vs ン (n): em ソ o traço longo desce de cima.",
  ン: "ン (n): o traço longo sobe de baixo.",
};

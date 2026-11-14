import type { LangCode } from "./types";

export interface LangMeta {
  code: LangCode;
  name: string; // PT
  nameNative: string;
  flag: string;
  speechLang: string;
  tutor: { name: string; city: string; avatar: string };
  praise: string[];
  repeat: string;
  hello: string;
  color: string;
}

export const LANGS: Record<LangCode, LangMeta> = {
  en: {
    code: "en",
    name: "Inglês",
    nameNative: "English",
    flag: "🇬🇧",
    speechLang: "en-GB",
    tutor: { name: "Emma", city: "Londres", avatar: "👩🏼" },
    praise: ["Great!", "Nice!", "Perfect!", "Well done!"],
    repeat: "Sorry, could you repeat?",
    hello: "Hi!",
    color: "#E8735A",
  },
  fr: {
    code: "fr",
    name: "Francês",
    nameNative: "Français",
    flag: "🇫🇷",
    speechLang: "fr-FR",
    tutor: { name: "Claire", city: "Paris", avatar: "👩🏻‍🦰" },
    praise: ["Super !", "Très bien !", "Parfait !", "Bravo !"],
    repeat: "Pardon ? Tu peux répéter ?",
    hello: "Salut !",
    color: "#9A9AF0",
  },
  ja: {
    code: "ja",
    name: "Japonês",
    nameNative: "日本語",
    flag: "🇯🇵",
    speechLang: "ja-JP",
    tutor: { name: "Haruto", city: "Tóquio", avatar: "👨🏻" },
    praise: ["いいですね！", "すばらしい！", "そうです！", "じょうずです！"],
    repeat: "すみません、もう一度お願いします。",
    hello: "こんにちは！",
    color: "#86C5BD",
  },
};

export const LANG_LIST: LangCode[] = ["en", "fr", "ja"];

export const TOTAL_LEVELS = 54;

export const STAGES = [
  { name: "Sobrevivência", from: 1, to: 9, goal: "Cumprimentos, apresentações, números, pedir coisas" },
  { name: "Rotina", from: 10, to: 18, goal: "Falar do dia, horas, família, comida, transporte" },
  { name: "Interacção", from: 19, to: 27, goal: "Perguntar, negociar, expressar gosto e opinião simples" },
  { name: "Autonomia", from: 28, to: 36, goal: "Contar o que aconteceu, planear, explicar problemas" },
  { name: "Fluência quotidiana", from: 37, to: 45, goal: "Conversar com ritmo natural, humor, conversa informal" },
  { name: "Domínio", from: 46, to: 54, goal: "Trabalho remoto, finanças, tecnologia, serviços e intercâmbio" },
];

export const INTEREST_OPTIONS: { id: string; label: string }[] = [
  { id: "viagens", label: "✈️ Viagens" },
  { id: "comida", label: "🍜 Comida" },
  { id: "negócios", label: "💼 Negócios" },
  { id: "tecnologia", label: "💻 Tecnologia" },
  { id: "finanças", label: "💳 Finanças" },
  { id: "saúde", label: "🏃 Saúde" },
  { id: "estudos", label: "🎓 Estudos" },
  { id: "música", label: "🎵 Música" },
  { id: "futebol", label: "⚽ Futebol" },
];

export const POS_PT: Record<string, string> = {
  noun: "substantivo",
  verb: "verbo",
  adj: "adjectivo",
  adv: "advérbio",
  pron: "pronome",
  prep: "preposição",
  det: "determinante",
  conj: "conjunção",
  particle: "partícula",
  interj: "interjeição",
  num: "numeral",
  expr: "expressão",
  aux: "auxiliar",
  copula: "cópula",
  suffix: "sufixo",
};

export const CATEGORY_COLORS = ["#E8735A", "#F0CF5E", "#86C5BD", "#9A9AF0"];

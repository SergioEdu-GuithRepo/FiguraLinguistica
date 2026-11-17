/**
 * Motor de Contextos Práticos, Kit de Bolso, Explorador de Dicionário
 * e Treino de Vocabulário em Contexto.
 */
import { CONTENT } from "@/content";
import type { Card } from "./fsrs";
import { isStrong } from "./fsrs";
import { normalizeAnswer, plainText, tokenize } from "./tokenize";
import type { ConversationStep, DialogueLine, DictEntry, LangCode, PartOfSpeech, Unit } from "./types";

export type RegisterLevel = "formal" | "neutro" | "informal";

export interface PocketPhrase {
  /** Frase no idioma-alvo (pode usar convenções de tokenização ou texto simples). */
  text: string;
  /** Tradução natural em português. */
  pt: string;
  /** Leitura em romaji (japonês). */
  romaji?: string;
  /** Registo social adequado. */
  register: RegisterLevel;
  /** Em que momento/situação usar. */
  whenToUse: string;
}

export interface SituationPrompt {
  id: string;
  situationPt: string;
  register: RegisterLevel;
  correct: string;
  options: string[];
  explanationPt: string;
}

export interface LocalizedContextPack {
  vocabKeys: string[];
  phrases: PocketPhrase[];
  culturalTip: string;
  situations: SituationPrompt[];
  miniDialogue?: DialogueLine[];
}

export interface ContextPack {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  tag: string;
  color: string;
  softColor: string;
  relatedLevels: number[];
  byLang: Record<LangCode, LocalizedContextPack>;
}

export const REGISTER_LABEL: Record<RegisterLevel, { label: string; badgeCls: string }> = {
  formal: { label: "Formal / Cortês", badgeCls: "bg-[var(--color-lilac-soft)] text-[var(--color-lilac)]" },
  neutro: { label: "Neutro / Dia-a-dia", badgeCls: "bg-[var(--color-teal-soft)] text-[#2a7a72]" },
  informal: { label: "Informal / Amigos", badgeCls: "bg-[var(--color-coral-soft)] text-[var(--color-coral)]" },
};

export const CONTEXT_PACKS: ContextPack[] = [
  {
    id: "aeroporto",
    emoji: "🛂",
    title: "Aeroporto, Voo & Imigração",
    subtitle: "Check-in, controlo de passaportes, escalas e bagagem sem stress",
    tag: "Viagens",
    color: "var(--color-teal)",
    softColor: "var(--color-teal-soft)",
    relatedLevels: [46, 28, 12],
    byLang: {
      en: {
        vocabKeys: [
          "boarding pass",
          "customs",
          "layover",
          "carry-on",
          "passport",
          "flight",
          "luggage",
          "gate",
          "aisle seat",
          "overhead locker",
        ],
        phrases: [
          {
            text: "Here is my passport and boarding pass.",
            pt: "Aqui está o meu passaporte e o meu cartão de embarque.",
            register: "neutro",
            whenToUse: "No controlo de segurança ou na porta de embarque",
          },
          {
            text: "I'm here on holiday for ten days.",
            pt: "Estou cá de férias por dez dias.",
            register: "formal",
            whenToUse: "Quando o agente de imigração pergunta o motivo da viagem",
          },
          {
            text: "Excuse me, my connecting flight is boarding soon.",
            pt: "Com licença, o meu voo de ligação vai embarcar em breve.",
            register: "formal",
            whenToUse: "Se a fila estiver longa durante uma escala curta",
          },
          {
            text: "My checked luggage hasn't arrived on the carousel.",
            pt: "A minha mala de porão não chegou ao tapete.",
            register: "formal",
            whenToUse: "No balcão de bagagem perdida (Lost Baggage)",
          },
          {
            text: "Nothing to declare, thank you.",
            pt: "Nada a declarar, obrigado.",
            register: "neutro",
            whenToUse: "Ao passar pela alfândega à saída do aeroporto",
          },
        ],
        culturalTip:
          "No controlo de fronteira no Reino Unido ou EUA, respostas curtas e directas funcionam melhor («I'm here on business for five days»). Nunca confundas «customs» (alfândega) com «costume» (fantasia)!",
        situations: [
          {
            id: "en-air-1",
            situationPt: "O agente de fronteira pergunta: «What is the purpose of your visit?». Vais em turismo por uma semana.",
            register: "formal",
            correct: "I'm here on holiday for a week.",
            options: [
              "I'm here on holiday for a week.",
              "I pretend to visit for one week.",
              "Nothing to declare at the costume.",
              "Give me the boarding pass now.",
            ],
            explanationPt: "«On holiday» (UK) / «on vacation» (US) é a resposta padrão e natural. «Pretend» significa fingir!",
          },
          {
            id: "en-air-2",
            situationPt: "A tua escala é curta e precisas de pedir passagem educadamente na fila de segurança.",
            register: "formal",
            correct: "Excuse me, my connecting flight leaves in twenty minutes.",
            options: [
              "Excuse me, my connecting flight leaves in twenty minutes.",
              "Move please, my plane goes fast.",
              "Hey, I want pass in front.",
              "Where is my carry-on customs?",
            ],
            explanationPt: "«Excuse me» + explicar o «connecting flight» é a forma educada e eficaz num aeroporto.",
          },
          {
            id: "en-air-3",
            situationPt: "Queres saber se a tua mochila pequena pode ir contigo na cabine do avião.",
            register: "neutro",
            correct: "Does this count as carry-on luggage?",
            options: [
              "Does this count as carry-on luggage?",
              "Is this bag going to layover?",
              "Have you got my passport control?",
              "Can I declare this backpack?",
            ],
            explanationPt: "«Carry-on luggage» (ou «hand luggage» no Reino Unido) designa a bagagem de mão.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "carte d'embarquement",
          "douane",
          "escale",
          "bagage cabine",
          "passeport",
          "vol",
          "valise",
          "billet",
          "porte d'embarquement",
          "correspondance",
        ],
        phrases: [
          {
            text: "Voici mon passeport et ma carte d'embarquement.",
            pt: "Aqui está o meu passaporte e o meu cartão de embarque.",
            register: "formal",
            whenToUse: "Ao entregar documentos no embarque ou controlo",
          },
          {
            text: "Je viens pour le tourisme pendant dix jours.",
            pt: "Venho em turismo durante dez dias.",
            register: "formal",
            whenToUse: "Na polícia de fronteira (Police aux Frontières)",
          },
          {
            text: "Excusez-moi, j'ai une correspondance très courte.",
            pt: "Desculpe, tenho um voo de ligação muito curto.",
            register: "formal",
            whenToUse: "Para pedir ajuda durante uma escala apertada",
          },
          {
            text: "Bonjour, ma valise n'est pas arrivée sur le tapis.",
            pt: "Bom dia, a minha mala não chegou ao tapete.",
            register: "formal",
            whenToUse: "No serviço de bagagens (Service Bagages)",
          },
          {
            text: "Je n'ai rien à déclarer.",
            pt: "Não tenho nada a declarar.",
            register: "neutro",
            whenToUse: "Ao passar na alfândega (douane)",
          },
        ],
        culturalTip:
          "Em França e na Bélgica, começa SEMPRE com «Bonjour» antes de qualquer pergunta a um funcionário do aeroporto — ir directo à pergunta sem cumprimentar soa brusco.",
        situations: [
          {
            id: "fr-air-1",
            situationPt: "Chegas ao balcão de embarque em Paris e pedem-te os documentos.",
            register: "formal",
            correct: "Bonjour, voici mon passeport et ma carte d'embarquement.",
            options: [
              "Bonjour, voici mon passeport et ma carte d'embarquement.",
              "Salut, regarde mon billet et ma douane.",
              "Je voudrais acheter une escale.",
              "Où est mon train de cabine ?",
            ],
            explanationPt: "«Bonjour, voici…» usa o registo cortês esperado com funcionários em países francófonos.",
          },
          {
            id: "fr-air-2",
            situationPt: "Queres confirmar se a tua mala pequena pode ir contigo no avião.",
            register: "neutro",
            correct: "Excusez-moi, ce sac passe en bagage cabine ?",
            options: [
              "Excusez-moi, ce sac passe en bagage cabine ?",
              "Ce sac va à la douane ?",
              "J'attends mon passeport sur le tapis.",
              "C'est combien le virement du vol ?",
            ],
            explanationPt: "«Passer en bagage cabine» é a expressão natural para perguntar se cumpre as medidas de mão.",
          },
          {
            id: "fr-air-3",
            situationPt: "Na alfândega perguntam se trazes mercadorias sujeitas a imposto.",
            register: "formal",
            correct: "Non, je n'ai rien à déclarer.",
            options: [
              "Non, je n'ai rien à déclarer.",
              "Oui, j'ai une escale demain.",
              "Merci, mon vol est en panne.",
              "Je cherche la salle d'attente.",
            ],
            explanationPt: "«Je n'ai rien à déclarer» é a fórmula oficial na alfândega.",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "パスポート",
          "にゅうこく",
          "とうじょうけん",
          "のりつぎ",
          "空港",
          "にもつ",
          "しんこく",
          "ビザ",
          "旅行",
          "時間",
        ],
        phrases: [
          {
            text: "パスポートと とうじょうけんです。おねがいします。",
            pt: "Aqui estão o passaporte e o cartão de embarque. Por favor.",
            romaji: "Pasupooto to toujouken desu. Onegaishimasu.",
            register: "formal",
            whenToUse: "Ao entregar os documentos no balcão ou porta de embarque",
          },
          {
            text: "かんこうで 十日間 います。",
            pt: "Estou cá em turismo por dez dias.",
            romaji: "Kankou de tookakan imasu.",
            register: "formal",
            whenToUse: "No controlo de imigração (入国審査)",
          },
          {
            text: "すみません、のりつぎの 時間が みじかいです。",
            pt: "Com licença, o tempo da minha escala é curto.",
            romaji: "Sumimasen, noritsugi no jikan ga mijikai desu.",
            register: "formal",
            whenToUse: "Se precisares de ajuda para não perder a ligação",
          },
          {
            text: "すみません、にもつが まだ 出てきません。",
            pt: "Com licença, a minha bagagem ainda não saiu.",
            romaji: "Sumimasen, nimotsu ga mada dete kimasen.",
            register: "formal",
            whenToUse: "Na recolha de bagagens quando a mala demora",
          },
          {
            text: "しんこくする ものは ありません。",
            pt: "Não tenho nada a declarar.",
            romaji: "Shinkoku suru mono wa arimasen.",
            register: "formal",
            whenToUse: "Na alfândega (税関) à chegada ao Japão",
          },
        ],
        culturalTip:
          "Nos aeroportos japoneses, entregar o passaporte com as duas mãos e um ligeiro aceno de cabeça acompanhado de «おねがいします» causa excelente impressão.",
        situations: [
          {
            id: "ja-air-1",
            situationPt: "No aeroporto de Haneda, o funcionário pede o teu passaporte e cartão de embarque.",
            register: "formal",
            correct: "パスポートと とうじょうけんです。おねがいします。",
            options: [
              "パスポートと とうじょうけんです。おねがいします。",
              "パスワードを わすれました。",
              "メニューを 見せてください。",
              "ふりこみで おねがいします。",
            ],
            explanationPt: "«とうじょうけん» é cartão de embarque; adicionar «おねがいします» ao entregar algo é essencial em japonês.",
          },
          {
            id: "ja-air-2",
            situationPt: "Tens uma ligação rápida em Tóquio e precisas de avisar a equipa de terra.",
            register: "formal",
            correct: "すみません、のりつぎの 時間が あまり ありません。",
            options: [
              "すみません、のりつぎの 時間が あまり ありません。",
              "すみません、しめきりは 金曜日です。",
              "ふくろは だいじょうぶです。",
              "りょうがえを おねがいします。",
            ],
            explanationPt: "«のりつぎ» (noritsugi) usa-se tanto para ligações de avião como para transbordos de comboio/metro.",
          },
          {
            id: "ja-air-3",
            situationPt: "Na imigração perguntam quanto tempo vais ficar em turismo.",
            register: "formal",
            correct: "かんこうで 一週間 います。",
            options: [
              "かんこうで 一週間 います。",
              "へんきんを おねがいします。",
              "がめんが 見えません。",
              "しょほうせんが あります。",
            ],
            explanationPt: "«かんこうで» (em turismo) + duração é a resposta clara e educada na imigração.",
          },
        ],
      },
    },
  },
  {
    id: "financas",
    emoji: "💳",
    title: "Banco, Câmbio & Pagamentos",
    subtitle: "Abrir conta, transferências, comissões, câmbio e pagamentos por aproximação",
    tag: "Finanças",
    color: "var(--color-yellow)",
    softColor: "var(--color-yellow-soft)",
    relatedLevels: [47, 5, 20],
    byLang: {
      en: {
        vocabKeys: [
          "exchange rate",
          "bank transfer",
          "fee",
          "contactless",
          "card",
          "cash",
          "account",
          "price",
          "receipt",
          "declined",
        ],
        phrases: [
          {
            text: "Can I pay contactless, or is it cash only?",
            pt: "Posso pagar por aproximação ou é só em dinheiro?",
            register: "neutro",
            whenToUse: "Em cafés, mercados ou táxis",
          },
          {
            text: "I'd like to open a current account, please.",
            pt: "Gostaria de abrir uma conta à ordem, por favor.",
            register: "formal",
            whenToUse: "Ao chegar a um banco no Reino Unido",
          },
          {
            text: "Are there any international transfer fees?",
            pt: "Há comissões de transferência internacional?",
            register: "formal",
            whenToUse: "Antes de enviar dinheiro para outro país",
          },
          {
            text: "My card was declined, let me try another one.",
            pt: "O meu cartão foi recusado, deixa-me tentar outro.",
            register: "neutro",
            whenToUse: "Se o terminal de pagamento der erro",
          },
          {
            text: "I need to freeze my card in the app right away.",
            pt: "Preciso de bloquear o meu cartão na app imediatamente.",
            register: "neutro",
            whenToUse: "Em caso de perda ou suspeita de uso indevido",
          },
        ],
        culturalTip:
          "No Reino Unido, conta à ordem diz-se «current account» (nos EUA: «checking account»). Cuidado: «tax» é imposto governamental; comissão bancária é sempre «fee» ou «charge»!",
        situations: [
          {
            id: "en-fin-1",
            situationPt: "Queres enviar dinheiro para Angola ou Portugal e perguntar ao banco se cobram comissão.",
            register: "formal",
            correct: "Is there a fee for international bank transfers?",
            options: [
              "Is there a fee for international bank transfers?",
              "Is there a recipe for bank transfers?",
              "Can I layover my money today?",
              "Do you have a contactless scholarship?",
            ],
            explanationPt: "«Fee» é a palavra exacta para taxas/comissões bancárias.",
          },
          {
            id: "en-fin-2",
            situationPt: "Num quiosque em Londres, queres pagar encostando o telemóvel ou cartão.",
            register: "neutro",
            correct: "Can I pay contactless?",
            options: [
              "Can I pay contactless?",
              "Can I pay without touch fee?",
              "Is my card on mute?",
              "Give me the exchange rate receipt.",
            ],
            explanationPt: "«Can I pay contactless?» é a pergunta mais natural do dia-a-dia.",
          },
          {
            id: "en-fin-3",
            situationPt: "O pagamento não passou na máquina e queres resolver sem constrangimento.",
            register: "neutro",
            correct: "Sorry, my card was declined. Can I try again?",
            options: [
              "Sorry, my card was declined. Can I try again?",
              "My card pretended to pay.",
              "Actually, I am sensible.",
              "Please refund my password.",
            ],
            explanationPt: "«My card was declined» significa que o pagamento não foi autorizado pelo terminal.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "virement",
          "taux de change",
          "frais bancaires",
          "sans contact",
          "carte",
          "espèces",
          "compte",
          "prix",
          "facture",
          "régler",
        ],
        phrases: [
          {
            text: "Vous prenez le sans contact ?",
            pt: "Aceitam pagamento por aproximação?",
            register: "formal",
            whenToUse: "Em padarias, lojas e cafés",
          },
          {
            text: "Je souhaiterais ouvrir un compte bancaire.",
            pt: "Gostaria de abrir uma conta bancária.",
            register: "formal",
            whenToUse: "Numa agência bancária",
          },
          {
            text: "Est-ce qu'il y a des frais bancaires mensuels ?",
            pt: "Existem comissões bancárias mensais?",
            register: "formal",
            whenToUse: "Ao comparar condições de uma conta ou cartão",
          },
          {
            text: "Je peux régler par virement ou par carte ?",
            pt: "Posso pagar por transferência ou com cartão?",
            register: "formal",
            whenToUse: "Ao pagar uma renda, curso ou factura",
          },
          {
            text: "J'ai perdu ma carte, je dois faire opposition.",
            pt: "Perdi o meu cartão, tenho de o cancelar/bloquear.",
            register: "neutro",
            whenToUse: "Urgência bancária quando se perde o cartão",
          },
        ],
        culturalTip:
          "Em francês, cancelar/bloquear um cartão perdido diz-se «faire opposition (sur ma carte)», e dinheiro vivo diz-se «en espèces» ou «en liquide»!",
        situations: [
          {
            id: "fr-fin-1",
            situationPt: "Perdeste a carteira em Paris e ligas ao banco para bloquear o cartão imediatamente.",
            register: "formal",
            correct: "Bonjour, j'ai perdu ma carte et je voudrais faire opposition.",
            options: [
              "Bonjour, j'ai perdu ma carte et je voudrais faire opposition.",
              "Bonjour, ma carte est en escale.",
              "Je voudrais partager mon écran bancaire.",
              "J'ai oublié mon ordonnance.",
            ],
            explanationPt: "«Faire opposition» é a expressão fixa francesa para bloquear um cartão ou cheque.",
          },
          {
            id: "fr-fin-2",
            situationPt: "Numa padaria, queres pagar um croissant encostando o cartão.",
            register: "formal",
            correct: "Je peux payer sans contact ?",
            options: [
              "Je peux payer sans contact ?",
              "Je paie avec des frais bancaires ?",
              "Vous avez un taux de stage ?",
              "Mon micro est coupé.",
            ],
            explanationPt: "«Payer sans contact» usa-se em todo o comércio francófono.",
          },
          {
            id: "fr-fin-3",
            situationPt: "O senhorio pede o pagamento da renda e queres confirmar se podes fazer transferência.",
            register: "formal",
            correct: "Je peux vous payer par virement bancaire ?",
            options: [
              "Je peux vous payer par virement bancaire ?",
              "Je peux vous attendre par colis ?",
              "Il faut une bourse d'embarquement ?",
              "C'est en panne aujourd'hui ?",
            ],
            explanationPt: "«Par virement bancaire» significa por transferência bancária.",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "ふりこみ",
          "てすうりょう",
          "りょうがえ",
          "キャッシュレス",
          "げんきん",
          "カード",
          "レシート",
          "ねだん",
          "円",
          "高い",
        ],
        phrases: [
          {
            text: "カードで はらえますか。",
            pt: "Posso pagar com cartão?",
            romaji: "Kaado de haraemasu ka.",
            register: "formal",
            whenToUse: "Antes de fazer o pedido em restaurantes pequenos",
          },
          {
            text: "ここで りょうがえは できますか。",
            pt: "É possível fazer câmbio de moeda aqui?",
            romaji: "Koko de ryougae wa dekimasu ka.",
            register: "formal",
            whenToUse: "Em bancos, hotéis ou aeroportos",
          },
          {
            text: "てすうりょうは いくらですか。",
            pt: "Quanto é a comissão / taxa?",
            romaji: "Tesuuryou wa ikura desu ka.",
            register: "formal",
            whenToUse: "No multibanco (ATM) ou balcão bancário",
          },
          {
            text: "ふりこみで おねがいします。",
            pt: "Por transferência bancária, por favor.",
            romaji: "Furikomi de onegaishimasu.",
            register: "formal",
            whenToUse: "Ao pagar propinas, renda ou serviços no Japão",
          },
          {
            text: "この店は キャッシュレスだけです。",
            pt: "Esta loja só aceita pagamento digital.",
            romaji: "Kono mise wa kyasshuresu dake desu.",
            register: "neutro",
            whenToUse: "Aviso muito comum em cafés modernos em Tóquio",
          },
        ],
        culturalTip:
          "Apesar da rápida expansão do «キャッシュレス» (cartões IC como Suica/Pasmo e QR), muitas tascas tradicionais e templos no Japão ainda só aceitam dinheiro vivo («げんきん»). Pergunta sempre «カードではらえますか»!",
        situations: [
          {
            id: "ja-fin-1",
            situationPt: "Queres saber quanto custa a comissão de levantamento ou transferência.",
            register: "formal",
            correct: "てすうりょうは いくらですか。",
            options: [
              "てすうりょうは いくらですか。",
              "とうじょうけんは いくらですか。",
              "しょほうせんは どこですか。",
              "しめきりは いつですか。",
            ],
            explanationPt: "«てすうりょう» (tesuuryou) é a comissão bancária ou taxa de serviço.",
          },
          {
            id: "ja-fin-2",
            situationPt: "Chegaste ao Japão com euros/dólares e queres trocar por ienes.",
            register: "formal",
            correct: "すみません、ここで りょうがえできますか。",
            options: [
              "すみません、ここで りょうがえできますか。",
              "すみません、ログインできません。",
              "すみません、ミュートになっています。",
              "すみません、のりつぎは どこですか。",
            ],
            explanationPt: "«りょうがえ» (ryougae) significa câmbio de moeda.",
          },
          {
            id: "ja-fin-3",
            situationPt: "Vais pagar uma factura ou inscrição por transferência bancária.",
            register: "formal",
            correct: "ふりこみで おねがいします。",
            options: [
              "ふりこみで おねがいします。",
              "こうかんで おねがいします。",
              "アレルギーが あります。",
              "おつかれさまです。",
            ],
            explanationPt: "«ふりこみ» (furikomi) é transferência bancária, muito usada no Japão.",
          },
        ],
      },
    },
  },
  {
    id: "remoto",
    emoji: "💻",
    title: "Trabalho Remoto & Reuniões",
    subtitle: "Videochamadas, partilha de ecrã, prazos e comunicação com a equipa",
    tag: "Trabalho",
    color: "var(--color-lilac)",
    softColor: "var(--color-lilac-soft)",
    relatedLevels: [48, 33, 43],
    byLang: {
      en: {
        vocabKeys: [
          "on mute",
          "share my screen",
          "deadline",
          "follow up",
          "attend",
          "meeting",
          "team",
          "project",
          "slides",
          "hybrid",
        ],
        phrases: [
          {
            text: "Sorry, I think you're on mute!",
            pt: "Desculpa, acho que estás com o microfone desligado!",
            register: "neutro",
            whenToUse: "Frase número 1 de qualquer videochamada",
          },
          {
            text: "Let me share my screen so everyone can see.",
            pt: "Deixa-me partilhar o meu ecrã para todos verem.",
            register: "neutro",
            whenToUse: "Ao mostrar slides, código ou relatórios na chamada",
          },
          {
            text: "Your audio is breaking up a bit, could you repeat that?",
            pt: "O teu som está a cortar um pouco, podias repetir?",
            register: "formal",
            whenToUse: "Quando a ligação de internet falha",
          },
          {
            text: "Can we push the deadline back to Wednesday?",
            pt: "Podemos adiar o prazo para quarta-feira?",
            register: "neutro",
            whenToUse: "Para renegociar um prazo de forma construtiva",
          },
          {
            text: "I'll follow up with a quick summary by email.",
            pt: "Dou seguimento com um breve resumo por e-mail.",
            register: "formal",
            whenToUse: "No final da reunião para alinhar próximos passos",
          },
        ],
        culturalTip:
          "Repara nos phrasal verbs de reunião: «push back» = adiar para mais tarde; «bring forward» = antecipar; «wrap up» = encerrar a reunião!",
        situations: [
          {
            id: "en-rem-1",
            situationPt: "Um colega está a falar na chamada Zoom/Meet, mas ninguém ouve nada.",
            register: "neutro",
            correct: "Sorry, I think you're on mute.",
            options: [
              "Sorry, I think you're on mute.",
              "Sorry, you are contactless.",
              "Please pretend your microphone.",
              "Your screen is on layover.",
            ],
            explanationPt: "«You're on mute» é a forma universal e simpática de avisar.",
          },
          {
            id: "en-rem-2",
            situationPt: "No fim da chamada, queres prometer que envias os pontos acordados por escrito.",
            register: "formal",
            correct: "I'll follow up by email with the main points.",
            options: [
              "I'll follow up by email with the main points.",
              "I'll refund the email tomorrow.",
              "Let's prescription the deadline.",
              "I attend the receipt now.",
            ],
            explanationPt: "«Follow up by email» transmite profissionalismo e clareza.",
          },
          {
            id: "en-rem-3",
            situationPt: "Queres mostrar uma tabela no teu computador aos colegas na videochamada.",
            register: "neutro",
            correct: "Let me share my screen for a second.",
            options: [
              "Let me share my screen for a second.",
              "Let me look my charger to you.",
              "Can I carry-on my screen?",
              "Actually, my password is open.",
            ],
            explanationPt: "«Share my screen» é a colocação exacta em inglês.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "micro coupé",
          "partager mon écran",
          "échéance",
          "faire le point",
          "assister",
          "réunion",
          "équipe",
          "travail",
          "télétravail",
          "écran",
        ],
        phrases: [
          {
            text: "Pardon, je crois que ton micro est coupé.",
            pt: "Desculpa, acho que o teu microfone está desligado.",
            register: "neutro",
            whenToUse: "Entre colegas numa videochamada (usa «votre micro» se for formal)",
          },
          {
            text: "Je vais partager mon écran, vous voyez bien ?",
            pt: "Vou partilhar o meu ecrã, conseguem ver bem?",
            register: "formal",
            whenToUse: "Ao iniciar uma apresentação remota",
          },
          {
            text: "Ça coupe un peu, vous pouvez répéter ?",
            pt: "Está a cortar um pouco, pode repetir?",
            register: "formal",
            whenToUse: "Quando a rede falha durante a reunião",
          },
          {
            text: "On fait le point demain matin à dix heures ?",
            pt: "Fazemos o ponto de situação amanhã às dez?",
            register: "neutro",
            whenToUse: "Para marcar um alinhamento rápido de equipa",
          },
          {
            text: "Nous devons respecter l'échéance de vendredi.",
            pt: "Temos de cumprir o prazo de sexta-feira.",
            register: "formal",
            whenToUse: "Ao organizar prioridades e entregas",
          },
        ],
        culturalTip:
          "Em França, «faire le point» é indispensável no trabalho (fazer o ponto de situação), e videochamada diz-se frequentemente apenas «une visio» («On se fait une visio ?»).",
        situations: [
          {
            id: "fr-rem-1",
            situationPt: "Queres combinar 10 minutos amanhã com a equipa para ver como avança o projecto.",
            register: "neutro",
            correct: "On fait le point demain matin ?",
            options: [
              "On fait le point demain matin ?",
              "On fait opposition demain matin ?",
              "On passe à la douane demain ?",
              "Mon chargeur est allergique.",
            ],
            explanationPt: "«Faire le point» = rever o estado actual do trabalho em equipa.",
          },
          {
            id: "fr-rem-2",
            situationPt: "Estás a apresentar um relatório online e queres mostrar o ecrã.",
            register: "formal",
            correct: "Je vais partager mon écran avec vous.",
            options: [
              "Je vais partager mon écran avec vous.",
              "Je vais rembourser mon écran.",
              "Je prends un bagage cabine.",
              "Mon colis est coupé.",
            ],
            explanationPt: "«Partager mon écran» é a expressão padrão nas plataformas de videochamada.",
          },
          {
            id: "fr-rem-3",
            situationPt: "A voz do cliente está a falhar devido à internet fraca.",
            register: "formal",
            correct: "Excusez-moi, ça coupe un peu. Pouvez-vous répéter ?",
            options: [
              "Excusez-moi, ça coupe un peu. Pouvez-vous répéter ?",
              "Votre virement est en panne.",
              "J'attends la bourse d'études.",
              "C'est sans contact, merci.",
            ],
            explanationPt: "«Ça coupe» é a forma mais natural de dizer que o áudio/chamada está a falhar.",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "がめん",
          "ミュート",
          "しめきり",
          "おつかれさまです",
          "きょうゆう",
          "問題",
          "本日",
          "会社",
          "仕事",
          "話す",
        ],
        phrases: [
          {
            text: "すみません、ミュートに なっていますよ。",
            pt: "Desculpe, está com o microfone desligado.",
            romaji: "Sumimasen, myuuto ni natte imasu yo.",
            register: "formal",
            whenToUse: "Para avisar educadamente um colega na chamada",
          },
          {
            text: "いま がめんを きょうゆうします。見えますか。",
            pt: "Vou partilhar o ecrã agora. Conseguem ver?",
            romaji: "Ima gamen o kyouyuu shimasu. Miemasu ka.",
            register: "formal",
            whenToUse: "Ao partilhar o ecrã numa reunião online",
          },
          {
            text: "こえが すこし とぎれています。",
            pt: "A voz está a cortar um pouco.",
            romaji: "Koe ga sukoshi togirete imasu.",
            register: "formal",
            whenToUse: "Quando a ligação falha",
          },
          {
            text: "この レポートの しめきりは いつですか。",
            pt: "Quando é o prazo-limite deste relatório?",
            romaji: "Kono repooto no shimekiri wa itsu desu ka.",
            register: "formal",
            whenToUse: "Para confirmar datas de entrega com clareza",
          },
          {
            text: "本日は ありがとうございました。おつかれさまでした！",
            pt: "Muito obrigado por hoje. Bom trabalho a todos!",
            romaji: "Honjitsu wa arigatou gozaimashita. Otsukaresama deshita!",
            register: "formal",
            whenToUse: "Ao encerrar uma videochamada de trabalho",
          },
        ],
        culturalTip:
          "No Japão, NUNCA saias de uma chamada de trabalho dizendo apenas «さようなら»! Fecha sempre com «おつかれさまでした» (entre colegas) ou «ありがとうございました。しつれいします» (com clientes).",
        situations: [
          {
            id: "ja-rem-1",
            situationPt: "Partilhaste o ecrã na reunião e queres confirmar se todos conseguem vê-lo.",
            register: "formal",
            correct: "がめんが 見えますか。",
            options: [
              "がめんが 見えますか。",
              "パスポートが 見えますか。",
              "てすうりょうは いくらですか。",
              "しょほうせんが あります。",
            ],
            explanationPt: "«がめんが見えますか» (Conseguem ver o ecrã?) usa o potencial «見える».",
          },
          {
            id: "ja-rem-2",
            situationPt: "A reunião com a tua equipa acabou de terminar.",
            register: "formal",
            correct: "おつかれさまでした！",
            options: [
              "おつかれさまでした！",
              "いらっしゃいませ！",
              "しんこくする ものは ありません。",
              "りょうがえを おねがいします。",
            ],
            explanationPt: "«おつかれさまでした» reconhece o esforço da equipa e encerra a reunião com cortesia.",
          },
          {
            id: "ja-rem-3",
            situationPt: "Precisas de confirmar o prazo de entrega de uma tarefa.",
            register: "formal",
            correct: "しめきりは 何曜日ですか。",
            options: [
              "しめきりは 何曜日ですか。",
              "のりつぎは 何時ですか。",
              "じゅうでんきは どこですか。",
              "アレルギーは ありますか。",
            ],
            explanationPt: "«しめきり» (shimekiri) é a palavra essencial para prazo-limite.",
          },
        ],
      },
    },
  },
  {
    id: "digital",
    emoji: "📱",
    title: "Tecnologia, Wi-Fi & Suporte",
    subtitle: "Palavras-passe, iniciar sessão, carregadores, rede e avarias técnicas",
    tag: "Tecnologia",
    color: "var(--color-coral)",
    softColor: "var(--color-coral-soft)",
    relatedLevels: [49, 19, 36],
    byLang: {
      en: {
        vocabKeys: [
          "password",
          "log in",
          "charger",
          "wi-fi",
          "phone",
          "app",
          "update",
          "socket",
          "lowercase",
          "help",
        ],
        phrases: [
          {
            text: "Sorry to bother you, what's the wi-fi password?",
            pt: "Desculpa incomodar, qual é a palavra-passe do wi-fi?",
            register: "neutro",
            whenToUse: "Num café, hotel ou espaço de coworking",
          },
          {
            text: "I can't log in — I didn't receive the verification code.",
            pt: "Não consigo entrar na conta — não recebi o código de verificação.",
            register: "neutro",
            whenToUse: "Com suporte técnico de uma app ou banco",
          },
          {
            text: "My battery is about to die, could I borrow a charger?",
            pt: "A minha bateria está quase a acabar, podias emprestar-me um carregador?",
            register: "neutro",
            whenToUse: "Entre colegas, amigos ou na recepção",
          },
          {
            text: "The app keeps crashing after the latest update.",
            pt: "A aplicação está sempre a fechar sozinha desde a última actualização.",
            register: "neutro",
            whenToUse: "Ao reportar um erro técnico",
          },
          {
            text: "Have you tried restarting the device?",
            pt: "Já tentaste reiniciar o aparelho?",
            register: "neutro",
            whenToUse: "Ao ajudar alguém a resolver uma falha simples",
          },
        ],
        culturalTip:
          "Em inglês, não se diz «my battery is finishing»! O natural é «my battery is low» (está fraca) ou «my phone is about to die / my phone died» (ficou sem bateria).",
        situations: [
          {
            id: "en-dig-1",
            situationPt: "Estás com 2% de bateria e precisas de pedir um carregador emprestado.",
            register: "neutro",
            correct: "My phone is about to die — could I borrow a charger?",
            options: [
              "My phone is about to die — could I borrow a charger?",
              "My phone is pretending — give me a receipt.",
              "Can I layover my battery?",
              "My wi-fi is allergic.",
            ],
            explanationPt: "«My phone is about to die» + «borrow a charger» soa 100% nativo.",
          },
          {
            id: "en-dig-2",
            situationPt: "Tentas entrar na tua conta, mas o SMS com o código não chega.",
            register: "formal",
            correct: "I can't log in because I haven't received the code.",
            options: [
              "I can't log in because I haven't received the code.",
              "I can't attend my password.",
              "Please refund my wi-fi.",
              "I have a carry-on update.",
            ],
            explanationPt: "«Log in» (verbo, separado) = iniciar sessão; «login» (junto) usa-se como substantivo/adjectivo.",
          },
          {
            id: "en-dig-3",
            situationPt: "Chegas a um café de trabalho e precisas de ligar o computador à internet.",
            register: "neutro",
            correct: "Excuse me, what's the wi-fi password?",
            options: [
              "Excuse me, what's the wi-fi password?",
              "What is the customs code?",
              "Is there a scholarship for internet?",
              "Can I share my screen to the coffee?",
            ],
            explanationPt: "Simples, educado e directo.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "mot de passe",
          "chargeur",
          "en panne",
          "téléphone",
          "internet",
          "terminal",
          "prise",
          "écran",
          "problème",
          "aide",
        ],
        phrases: [
          {
            text: "Excusez-moi, quel est le mot de passe du wi-fi ?",
            pt: "Com licença, qual é a palavra-passe do wi-fi?",
            register: "formal",
            whenToUse: "Num hotel, café ou biblioteca",
          },
          {
            text: "Je n'arrive pas à me connecter à mon compte.",
            pt: "Não consigo iniciar sessão na minha conta.",
            register: "neutro",
            whenToUse: "Ao explicar um problema de acesso ao suporte",
          },
          {
            text: "Plus de batterie ! Tu aurais un chargeur ?",
            pt: "Fiquei sem bateria! Terias um carregador?",
            register: "informal",
            whenToUse: "Com amigos ou colegas próximos",
          },
          {
            text: "Désolé, le terminal est en panne aujourd'hui.",
            pt: "Desculpe, o terminal está avariado hoje.",
            register: "formal",
            whenToUse: "Expressão frequente em lojas e serviços",
          },
          {
            text: "J'ai réinitialisé mon mot de passe par e-mail.",
            pt: "Repus a minha palavra-passe por e-mail.",
            register: "neutro",
            whenToUse: "Ao recuperar acesso a um serviço digital",
          },
        ],
        culturalTip:
          "Para dizer «não consigo fazer X» em francês falado, prefere «Je n'arrive pas à + infinitivo» («Je n'arrive pas à ouvrir le fichier») em vez de «Je ne peux pas» — soa muito mais natural!",
        situations: [
          {
            id: "fr-dig-1",
            situationPt: "Não consegues entrar na tua conta na aplicação e explicas isso ao apoio técnico.",
            register: "formal",
            correct: "Bonjour, je n'arrive pas à me connecter à mon compte.",
            options: [
              "Bonjour, je n'arrive pas à me connecter à mon compte.",
              "Bonjour, mon compte est sans contact.",
              "J'ai obtenu une bourse de mot de passe.",
              "Je n'ai rien à déclarer sur internet.",
            ],
            explanationPt: "«Je n'arrive pas à me connecter» = tento mas não consigo iniciar sessão.",
          },
          {
            id: "fr-dig-2",
            situationPt: "O elevador ou a máquina de bilhetes não funciona.",
            register: "neutro",
            correct: "La machine est en panne.",
            options: [
              "La machine est en panne.",
              "La machine fait le point.",
              "La machine a une ordonnance.",
              "La machine est en escale.",
            ],
            explanationPt: "«Être en panne» significa estar avariado(a).",
          },
          {
            id: "fr-dig-3",
            situationPt: "Pedes a palavra-passe da internet ao empregado do café.",
            register: "formal",
            correct: "S'il vous plaît, quel est le mot de passe du wi-fi ?",
            options: [
              "S'il vous plaît, quel est le mot de passe du wi-fi ?",
              "Quel est le taux de change du wi-fi ?",
              "Vous avez un justificatif de téléphone ?",
              "Mon colis est coupé.",
            ],
            explanationPt: "«Le mot de passe» é sempre masculino em francês.",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "パスワード",
          "ログイン",
          "じゅうでんき",
          "ネット",
          "スマホ",
          "wi-fi",
          "イヤホン",
          "おそい",
          "電話",
          "新しい",
        ],
        phrases: [
          {
            text: "すみません、Wi-Fiの パスワードを おしえてください。",
            pt: "Com licença, pode dizer-me a palavra-passe do Wi-Fi?",
            romaji: "Sumimasen, Wi-Fi no pasuwaado o oshiete kudasai.",
            register: "formal",
            whenToUse: "Em cafés, hotéis ou espaços de estudo",
          },
          {
            text: "アプリに ログインできません。",
            pt: "Não consigo iniciar sessão na aplicação.",
            romaji: "Apuri ni roguin dekimasen.",
            register: "formal",
            whenToUse: "Ao pedir ajuda técnica",
          },
          {
            text: "スマホの じゅうでんきを かして もらえますか。",
            pt: "Podia emprestar-me um carregador de telemóvel?",
            romaji: "Sumaho no juudenki o kashite moraemasu ka.",
            register: "neutro",
            whenToUse: "Quando precisas de carregar o telemóvel",
          },
          {
            text: "ネットが すこし おそいです。",
            pt: "A internet está um pouco lenta.",
            romaji: "Netto ga sukoshi osoi desu.",
            register: "neutro",
            whenToUse: "Ao explicar atrasos numa ligação",
          },
          {
            text: "パスワードを わすれて しまいました。",
            pt: "Acabei por me esquecer da palavra-passe.",
            romaji: "Pasuwaado o wasurete shimaimashita.",
            register: "formal",
            whenToUse: "O «〜てしまいました» exprime pequeno contratempo/lamento natural",
          },
        ],
        culturalTip:
          "No Japão, telemóvel smartphone abrevia-se quase sempre para «スマホ» (sumaho), e «〜てしまいました» («わすれてしまいました» = esqueci-me sem querer) suaviza qualquer contratempo.",
        situations: [
          {
            id: "ja-dig-1",
            situationPt: "Queres pedir a palavra-passe do Wi-Fi no hotel.",
            register: "formal",
            correct: "すみません、Wi-Fiの パスワードを おしえてください。",
            options: [
              "すみません、Wi-Fiの パスワードを おしえてください。",
              "すみません、パスポートを こうかんしてください。",
              "てすうりょうを おしえてください。",
              "しょほうせんを 見せてください。",
            ],
            explanationPt: "Atenção para não confundir «パスワード» (pasuwaado = palavra-passe) com «パスポート» (pasupooto = passaporte)!",
          },
          {
            id: "ja-dig-2",
            situationPt: "Não consegues entrar na aplicação do comboio e pedes ajuda.",
            register: "formal",
            correct: "すみません、アプリに ログインできません。",
            options: [
              "すみません、アプリに ログインできません。",
              "すみません、りょうがえできません。",
              "ふくろは だいじょうぶです。",
              "おつかれさまでした。",
            ],
            explanationPt: "Com «ログイン», usa-se a partícula «に» («アプリにログインする»).",
          },
          {
            id: "ja-dig-3",
            situationPt: "A bateria do teu telemóvel está no fim e precisas de um carregador.",
            register: "neutro",
            correct: "スマホの じゅうでんきは ありますか。",
            options: [
              "スマホの じゅうでんきは ありますか。",
              "大学の しょうがくきんは ありますか。",
              "とうじょうけんは ありますか。",
              "へんきんは ありますか。",
            ],
            explanationPt: "«じゅうでんき» (juudenki) = carregador.",
          },
        ],
      },
    },
  },
  {
    id: "saude",
    emoji: "🏥",
    title: "Saúde, Farmácia & Bem-Estar",
    subtitle: "Receitas médicas, alergias, sintomas, urgências e rotina de treino",
    tag: "Saúde",
    color: "var(--color-teal)",
    softColor: "var(--color-teal-soft)",
    relatedLevels: [52, 16, 32],
    byLang: {
      en: {
        vocabKeys: [
          "prescription",
          "allergic",
          "workout",
          "pharmacy",
          "doctor",
          "pain",
          "medicine",
          "healthy",
          "fever",
          "lozenges",
        ],
        phrases: [
          {
            text: "Do I need a prescription for this medicine?",
            pt: "Preciso de receita médica para este medicamento?",
            register: "formal",
            whenToUse: "Ao balcão da farmácia",
          },
          {
            text: "I'm allergic to nuts and penicillin.",
            pt: "Sou alérgico a frutos secos e a penicilina.",
            register: "neutro",
            whenToUse: "Em restaurantes, hospitais ou farmácias",
          },
          {
            text: "Take one tablet twice a day after meals.",
            pt: "Tome um comprimido duas vezes por dia após as refeições.",
            register: "formal",
            whenToUse: "Instrução típica do farmacêutico ou médico",
          },
          {
            text: "I'd like to sign up for a monthly gym membership.",
            pt: "Gostaria de me inscrever num plano mensal do ginásio.",
            register: "neutro",
            whenToUse: "Na recepção de um ginásio ou clube desportivo",
          },
          {
            text: "A short morning workout helps me sleep better.",
            pt: "Um treino curto de manhã ajuda-me a dormir melhor.",
            register: "informal",
            whenToUse: "Conversa sobre saúde e bem-estar",
          },
        ],
        culturalTip:
          "Lembra-te: «prescription» = receita médica; «receipt» = recibo de compra; «recipe» = receita de culinária! Confundir estas três é um dos erros mais comuns.",
        situations: [
          {
            id: "en-sau-1",
            situationPt: "Estás na farmácia e queres saber se podes comprar o medicamento sem ir ao médico antes.",
            register: "formal",
            correct: "Can I buy this over the counter, or do I need a prescription?",
            options: [
              "Can I buy this over the counter, or do I need a prescription?",
              "Do I need a kitchen recipe for this medicine?",
              "Can I get a layover for my headache?",
              "Is this tablet on mute?",
            ],
            explanationPt: "«Over the counter» = venda livre; «prescription» = receita médica.",
          },
          {
            id: "en-sau-2",
            situationPt: "No hospital ou restaurante, precisas de avisar sobre uma alergia importante.",
            register: "neutro",
            correct: "Just so you know, I'm allergic to shellfish.",
            options: [
              "Just so you know, I'm allergic to shellfish.",
              "Actually, I pretend shellfish.",
              "I am sensible to medicine.",
              "Give me a contactless refund.",
            ],
            explanationPt: "«I'm allergic to…» é a estrutura essencial para segurança alimentar e médica.",
          },
          {
            id: "en-sau-3",
            situationPt: "Contas a um amigo como manténs a energia durante a semana.",
            register: "informal",
            correct: "I try to do a quick workout three times a week.",
            options: [
              "I try to do a quick workout three times a week.",
              "I make three prescriptions in the gym.",
              "I attend three customs every week.",
              "I follow up my boarding pass.",
            ],
            explanationPt: "«Do a workout» ou «work out» (verbo) é a expressão natural para treinar.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "ordonnance",
          "allergique",
          "entraînement",
          "pharmacie",
          "médecin",
          "médicament",
          "comprimé",
          "fièvre",
          "mal",
          "sport",
        ],
        phrases: [
          {
            text: "Est-ce qu'il faut une ordonnance pour ce médicament ?",
            pt: "É preciso receita médica para este medicamento?",
            register: "formal",
            whenToUse: "Na farmácia (em França reconhece-se pela cruz verde luminosa)",
          },
          {
            text: "Attention, je suis allergique à la pénicilline.",
            pt: "Atenção, sou alérgico à penicilina.",
            register: "formal",
            whenToUse: "Numa consulta ou urgência médica",
          },
          {
            text: "Prenez un comprimé matin et soir pendant cinq jours.",
            pt: "Tome um comprimido de manhã e à noite durante cinco dias.",
            register: "formal",
            whenToUse: "Posologia habitual explicada na farmácia",
          },
          {
            text: "Je voudrais m'inscrire à la salle de sport.",
            pt: "Gostaria de me inscrever no ginásio.",
            register: "neutro",
            whenToUse: "Na recepção de um ginásio",
          },
          {
            text: "J'ai un entraînement de course ce soir.",
            pt: "Tenho treino de corrida hoje à noite.",
            register: "informal",
            whenToUse: "Ao falar da rotina saudável com amigos",
          },
        ],
        culturalTip:
          "Em França, os farmacêuticos têm formação clínica avançada: para dores ligeiras, constipações ou picadas, podes ir primeiro à «pharmacie» pedir aconselhamento gratuito antes de marcar médico!",
        situations: [
          {
            id: "fr-sau-1",
            situationPt: "Entras numa farmácia em Lyon para perguntar se um xarope exige receita.",
            register: "formal",
            correct: "Bonjour, faut-il une ordonnance pour ce sirop ?",
            options: [
              "Bonjour, faut-il une ordonnance pour ce sirop ?",
              "Bonjour, avez-vous la recette de cuisine ?",
              "Je voudrais faire opposition au sirop.",
              "Ce médicament passe en bagage cabine ?",
            ],
            explanationPt: "«Une ordonnance» = receita médica (nunca «recette»!).",
          },
          {
            id: "fr-sau-2",
            situationPt: "Num restaurante ou clínica, precisas de avisar que tens alergia a frutos secos.",
            register: "formal",
            correct: "Je suis allergique aux fruits à coque.",
            options: [
              "Je suis allergique aux fruits à coque.",
              "Je suis en panne de fruits.",
              "J'assiste aux fruits à coque.",
              "Voici mon justificatif de sport.",
            ],
            explanationPt: "«Être allergique à…» contrai com «les» → «aux».",
          },
          {
            id: "fr-sau-3",
            situationPt: "Um amigo convida-te para jantar, mas tens treino marcado.",
            register: "informal",
            correct: "À dix-neuf heures j'ai mon entraînement, on dîne après ?",
            options: [
              "À dix-neuf heures j'ai mon entraînement, on dîne après ?",
              "J'ai mon virement de course à dix-neuf heures.",
              "Mon exposé est allergique ce soir.",
              "J'ai une escale à la pharmacie.",
            ],
            explanationPt: "«Un entraînement» = sessão de treino desportivo.",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "しょほうせん",
          "アレルギー",
          "トレーニング",
          "病院",
          "薬",
          "痛い",
          "ねつ",
          "健康",
          "元気",
          "休む",
        ],
        phrases: [
          {
            text: "病院の しょほうせんが あります。",
            pt: "Tenho uma receita médica do hospital.",
            romaji: "Byouin no shohousen ga arimasu.",
            register: "formal",
            whenToUse: "Ao entregar a receita numa farmácia (薬局 / ドラッグストア)",
          },
          {
            text: "えびと かにの アレルギーが あります。",
            pt: "Tenho alergia a camarão e caranguejo.",
            romaji: "Ebi to kani no arerugii ga arimasu.",
            register: "formal",
            whenToUse: "Em restaurantes ou consultas médicas",
          },
          {
            text: "この 薬は ごはんの あとに のんでください。",
            pt: "Tome este medicamento depois das refeições, por favor.",
            romaji: "Kono kusuri wa gohan no ato ni nonde kudasai.",
            register: "formal",
            whenToUse: "Instrução importante do farmacêutico (em japonês «beber» usa-se para comprimidos!)",
          },
          {
            text: "週に 三回 ジムで トレーニングを しています。",
            pt: "Treino no ginásio três vezes por semana.",
            romaji: "Shuu ni sankai jimu de toreeningu o shite imasu.",
            register: "neutro",
            whenToUse: "Ao falar dos teus hábitos de saúde",
          },
          {
            text: "すこし つかれたので、今日は 早く 休みます。",
            pt: "Como estou um pouco cansado, hoje vou descansar cedo.",
            romaji: "Sukoshi tsukareta node, kyou wa hayaku yasumimasu.",
            register: "neutro",
            whenToUse: "Para cuidar do descanso com naturalidade",
          },
        ],
        culturalTip:
          "Curiosidade essencial: em japonês, tomar comprimidos ou cápsulas diz-se «薬をのむ» (literalmente «beber o remédio»), nunca «たべる»!",
        situations: [
          {
            id: "ja-sau-1",
            situationPt: "Saíste da consulta no hospital e entregas a receita na farmácia ao lado.",
            register: "formal",
            correct: "おねがいします。病院の しょほうせんです。",
            options: [
              "おねがいします。病院の しょほうせんです。",
              "おねがいします。とうじょうけんです。",
              "パスワードを わすれました。",
              "ふりこみで おねがいします。",
            ],
            explanationPt: "«しょほうせん» (shohousen) = receita médica.",
          },
          {
            id: "ja-sau-2",
            situationPt: "Antes de pedir um prato num restaurante em Tóquio, queres avisar sobre alergia a ovos.",
            register: "formal",
            correct: "すみません、たまごの アレルギーが あります。",
            options: [
              "すみません、たまごの アレルギーが あります。",
              "すみません、たまごの しめきりが あります。",
              "たまごは ミュートです。",
              "たまごを りょうがえしてください。",
            ],
            explanationPt: "«[alimento] の アレルギーが あります» é claro e imediatamente compreendido.",
          },
          {
            id: "ja-sau-3",
            situationPt: "Falas com o Haruto sobre a tua rotina de exercício semanal.",
            register: "neutro",
            correct: "毎朝 すこし トレーニングを しています。",
            options: [
              "毎朝 すこし トレーニングを しています。",
              "毎朝 へんきんを しています。",
              "毎朝 のりつぎを しています。",
              "毎朝 ログインを のんでいます。",
            ],
            explanationPt: "«トレーニングをしています» exprime um hábito contínuo.",
          },
        ],
      },
    },
  },
  {
    id: "estudos",
    emoji: "🎓",
    title: "Universidade, Bolsas & Exames",
    subtitle: "Candidaturas, bolsas de estudo, aulas, trabalhos académicos e apresentações",
    tag: "Estudos",
    color: "var(--color-lilac)",
    softColor: "var(--color-lilac-soft)",
    relatedLevels: [50, 22, 39],
    byLang: {
      en: {
        vocabKeys: [
          "scholarship",
          "lecture",
          "assignment",
          "deadline",
          "attend",
          "study",
          "university",
          "question",
          "draft",
          "reference",
        ],
        phrases: [
          {
            text: "I'm applying for a master's scholarship abroad.",
            pt: "Estou a candidatar-me a uma bolsa de mestrado no estrangeiro.",
            register: "neutro",
            whenToUse: "Em entrevistas académicas ou conversas sobre estudos",
          },
          {
            text: "When is the deadline to submit the assignment?",
            pt: "Qual é o prazo para entregar o trabalho?",
            register: "formal",
            whenToUse: "Ao confirmar datas com um professor ou colega",
          },
          {
            text: "Today's presentation is divided into three main parts.",
            pt: "A apresentação de hoje divide-se em três partes principais.",
            register: "formal",
            whenToUse: "Abertura clássica e clara para apresentações académicas ou profissionais",
          },
          {
            text: "Could you clarify the requirements for the final exam?",
            pt: "Podia esclarecer os requisitos para o exame final?",
            register: "formal",
            whenToUse: "Na aula ou no horário de atendimento do professor",
          },
          {
            text: "That's a great question — let me give you an example.",
            pt: "Excelente pergunta — deixe-me dar-lhe um exemplo.",
            register: "formal",
            whenToUse: "Para ganhar alguns segundos e responder com segurança após apresentar",
          },
        ],
        culturalTip:
          "Falsos amigos académicos em inglês: «lecture» = aula universitária/palestra (não leitura!); «college» nos EUA = faculdade/universidade (não colégio secundário!); «apply for» = candidatar-se a.",
        situations: [
          {
            id: "en-est-1",
            situationPt: "Queres contar que estás a concorrer a uma bolsa de estudos internacional.",
            register: "neutro",
            correct: "I'm applying for an international scholarship.",
            options: [
              "I'm applying for an international scholarship.",
              "I'm pretending a scholarship.",
              "I'm making a prescription at university.",
              "I have a carry-on lecture.",
            ],
            explanationPt: "Diz-se sempre «apply for a scholarship / a job / a visa».",
          },
          {
            id: "en-est-2",
            situationPt: "Começas a tua apresentação na faculdade e queres estruturar o que vais dizer.",
            register: "formal",
            correct: "Today I'd like to focus on three key points.",
            options: [
              "Today I'd like to focus on three key points.",
              "Today my screen is contactless.",
              "Give me the tracking number of the class.",
              "Nothing to declare in this lecture.",
            ],
            explanationPt: "Estruturar logo no início («focus on three key points») prende a atenção da audiência.",
          },
          {
            id: "en-est-3",
            situationPt: "Precisas de perguntar ao colega quando têm de entregar o trabalho escrito.",
            register: "neutro",
            correct: "When do we have to hand in the assignment?",
            options: [
              "When do we have to hand in the assignment?",
              "When do we refund the lecture?",
              "Is the professor on layover?",
              "Where is the exchange rate?",
            ],
            explanationPt: "«Hand in» ou «submit an assignment» = entregar um trabalho.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "bourse",
          "exposé",
          "stage",
          "échéance",
          "assister",
          "dossier",
          "lettre de motivation",
          "université",
          "article",
          "question",
        ],
        phrases: [
          {
            text: "Je prépare mon dossier pour une bourse d'études.",
            pt: "Estou a preparar o meu processo de candidatura a uma bolsa de estudos.",
            register: "neutro",
            whenToUse: "Candidaturas Campus France, Erasmus ou pós-graduação",
          },
          {
            text: "J'ai un exposé oral à présenter mardi prochain.",
            pt: "Tenho uma apresentação oral na próxima terça-feira.",
            register: "neutro",
            whenToUse: "Vida universitária e escolar",
          },
          {
            text: "Je cherche un stage de fin d'études dans ce domaine.",
            pt: "Procuro um estágio de fim de curso nesta área.",
            register: "formal",
            whenToUse: "Em feiras de emprego, entrevistas ou LinkedIn",
          },
          {
            text: "Mon exposé s'organise en deux parties principales.",
            pt: "A minha apresentação organiza-se em duas partes principais.",
            register: "formal",
            whenToUse: "Estrutura clássica valorizada nas universidades francófonas",
          },
          {
            text: "Merci pour votre attention, avez-vous des questions ?",
            pt: "Obrigado pela vossa atenção, têm alguma pergunta?",
            register: "formal",
            whenToUse: "Para fechar uma apresentação com elegância",
          },
        ],
        culturalTip:
          "Nas universidades francesas valoriza-se imenso o «plan» (estrutura em 2 ou 3 partes claras anunciadas logo na introdução do «exposé»)! E lembra-te: «un stage» = um estágio.",
        situations: [
          {
            id: "fr-est-1",
            situationPt: "Num evento universitário, explicas que procuras um estágio profissional de seis meses.",
            register: "formal",
            correct: "Je cherche un stage de six mois à partir de septembre.",
            options: [
              "Je cherche un stage de six mois à partir de septembre.",
              "Je cherche une douane de six mois.",
              "Je fais opposition à l'université.",
              "Mon colis est en stage.",
            ],
            explanationPt: "«Chercher un stage» é o termo exacto para estágio curricular ou profissional.",
          },
          {
            id: "fr-est-2",
            situationPt: "Queres candidatar-te a apoio financeiro para estudar em França.",
            register: "formal",
            correct: "Quelles sont les conditions pour demander une bourse ?",
            options: [
              "Quelles sont les conditions pour demander une bourse ?",
              "Quelles sont les ordonnances du vol ?",
              "Vous prenez le sans contact à l'examen ?",
              "Mon micro est en panne.",
            ],
            explanationPt: "«Demander une bourse (d'études)» = candidatar-se a uma bolsa.",
          },
          {
            id: "fr-est-3",
            situationPt: "Terminas a tua apresentação oral diante da turma e do professor.",
            register: "formal",
            correct: "Merci de votre attention. Avez-vous des questions ?",
            options: [
              "Merci de votre attention. Avez-vous des questions ?",
              "Rien à déclarer, salut !",
              "Gardez le ticket de caisse.",
              "Ça coupe un peu, au revoir.",
            ],
            explanationPt: "Fórmula clara, respeitosa e natural para abrir o debate.",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "しょうがくきん",
          "レポート",
          "しめきり",
          "発表",
          "もうしこむ",
          "学ぶ",
          "学生",
          "先生",
          "読む",
          "書く",
        ],
        phrases: [
          {
            text: "日本の しょうがくきんに もうしこみたいです。",
            pt: "Quero candidatar-me a uma bolsa de estudos no Japão.",
            romaji: "Nihon no shougakukin ni moushikomitai desu.",
            register: "formal",
            whenToUse: "Ao falar de intercâmbio ou bolsas (como MEXT)",
          },
          {
            text: "先生、すこし しつもんしても いいですか。",
            pt: "Professor(a), posso fazer uma pequena pergunta?",
            romaji: "Sensei, sukoshi shitsumon shite mo ii desu ka.",
            register: "formal",
            whenToUse: "No final da aula ou no gabinete do professor",
          },
          {
            text: "金曜日までに レポートを 出さなければ なりません。",
            pt: "Tenho de entregar o trabalho até sexta-feira.",
            romaji: "Kinyoubi made ni repooto o dasanakereba narimasen.",
            register: "neutro",
            whenToUse: "Atenção à diferença entre まで (até) e までに (prazo-limite até!)",
          },
          {
            text: "これから 私の テーマについて 話します。",
            pt: "Vou agora falar sobre o meu tema.",
            romaji: "Kore kara watashi no teema ni tsuite hanashimasu.",
            register: "formal",
            whenToUse: "Início claro de uma apresentação académica",
          },
          {
            text: "ごせいちょう ありがとうございました。",
            pt: "Muito obrigado por me ouvirem atentamente.",
            romaji: "Goseichou arigatou gozaimashita.",
            register: "formal",
            whenToUse: "Fecho clássico de apresentações no Japão",
          },
        ],
        culturalTip:
          "Repara em «金曜日までに» (até sexta-feira como prazo máximo para concluir uma acção pontual) vs. «金曜日まで» (acção contínua que dura até sexta). Para prazos («しめきり»), usa sempre «までに»!",
        situations: [
          {
            id: "ja-est-1",
            situationPt: "Terminou a aula na universidade e queres tirar uma dúvida com o professor.",
            register: "formal",
            correct: "先生、いま 少し しつもんしても いいですか。",
            options: [
              "先生、いま 少し しつもんしても いいですか。",
              "先生、へんきんしても いいですか。",
              "先生、りょうがえは いくらですか。",
              "先生、ふくろは だいじょうぶです。",
            ],
            explanationPt: "Chamar pelo título «先生» (Sensei) + «〜てもいいですか» é muito respeitoso.",
          },
          {
            id: "ja-est-2",
            situationPt: "Explicas o teu objectivo de concorrer a uma bolsa universitária.",
            register: "formal",
            correct: "しょうがくきんに もうしこみたいです。",
            options: [
              "しょうがくきんに もうしこみたいです。",
              "しょほうせんに もうしこみたいです。",
              "じゅうでんきに ログインしたいです。",
              "のりつぎを のみたいです。",
            ],
            explanationPt: "Não confundas «しょうがくきん» (bolsa de estudos) com «しょほうせん» (receita médica)!",
          },
          {
            id: "ja-est-3",
            situationPt: "Queres avisar um colega que o relatório tem de ser entregue até amanhã.",
            register: "neutro",
            correct: "明日までに レポートを 出します。",
            options: [
              "明日までに レポートを 出します。",
              "明日までに パスポートを のみます。",
              "てすうりょうを 読みます。",
              "ミュートを 書きます。",
            ],
            explanationPt: "«レポートを出す» = entregar um relatório/trabalho.",
          },
        ],
      },
    },
  },
  {
    id: "servicos",
    emoji: "🧾",
    title: "Encomendas, Trocas & Contratos",
    subtitle: "Apoio ao cliente, reembolsos, rastreio de encomendas e documentos oficiais",
    tag: "Serviços",
    color: "var(--color-yellow)",
    softColor: "var(--color-yellow-soft)",
    relatedLevels: [51, 53, 34],
    byLang: {
      en: {
        vocabKeys: [
          "refund",
          "receipt",
          "tracking number",
          "fee",
          "order",
          "delivery",
          "contract",
          "sign",
          "cancel",
          "proof of address",
        ],
        phrases: [
          {
            text: "My order arrived damaged — could I get a replacement or a refund?",
            pt: "A minha encomenda chegou danificada — podia pedir substituição ou reembolso?",
            register: "formal",
            whenToUse: "No apoio ao cliente de uma loja online",
          },
          {
            text: "Here is the receipt and the order number.",
            pt: "Aqui está o talão e o número da encomenda.",
            register: "neutro",
            whenToUse: "Ao fazer uma troca numa loja física",
          },
          {
            text: "According to the tracking number, the parcel is still in transit.",
            pt: "Segundo o número de rastreio, a encomenda ainda está em trânsito.",
            register: "formal",
            whenToUse: "Quando uma entrega está atrasada",
          },
          {
            text: "How much notice do I need to give to cancel the contract?",
            pt: "Com quanta antecedência preciso de avisar para cancelar o contrato?",
            register: "formal",
            whenToUse: "Arrendamento, internet, ginásio ou telecomunicações",
          },
          {
            text: "What documents count as proof of address?",
            pt: "Que documentos servem como comprovativo de morada?",
            register: "formal",
            whenToUse: "Em serviços públicos, bancos ou contratos",
          },
        ],
        culturalTip:
          "Para reclamar em inglês com eficácia máxima, evita imperativos directos: usa «I'm afraid there's an issue with…» + «Could you possibly arrange a refund?». Firme, mas impecavelmente educado!",
        situations: [
          {
            id: "en-srv-1",
            situationPt: "Compraste uns auscultadores que vieram avariados e tens o talão na mão.",
            register: "formal",
            correct: "I'm afraid these are faulty. Could I get a refund? I have the receipt.",
            options: [
              "I'm afraid these are faulty. Could I get a refund? I have the receipt.",
              "Give back my money, I have the kitchen recipe.",
              "These headphones are on layover.",
              "I pretend to exchange my scholarship.",
            ],
            explanationPt: "«Faulty» (com defeito) + «refund» + «receipt» resolve qualquer devolução com classe.",
          },
          {
            id: "en-srv-2",
            situationPt: "Antes de assinar contrato de internet, queres saber o prazo de pré-aviso para cancelar.",
            register: "formal",
            correct: "How much notice do I have to give to cancel?",
            options: [
              "How much notice do I have to give to cancel?",
              "How much news do I give to cancel?",
              "Is this contract contactless?",
              "Can I mute the signature?",
            ],
            explanationPt: "«Give notice» = dar pré-aviso formal num contrato ou emprego.",
          },
          {
            id: "en-srv-3",
            situationPt: "A encomenda devia ter chegado ontem e queres consultar onde está.",
            register: "neutro",
            correct: "Could you check the tracking number for my parcel?",
            options: [
              "Could you check the tracking number for my parcel?",
              "Could you check my boarding pass?",
              "Where is my workout fee?",
              "Do I need a prescription for delivery?",
            ],
            explanationPt: "«Tracking number» + «parcel» (UK) / «package» (US).",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "remboursement",
          "colis",
          "justificatif",
          "ticket de caisse",
          "facture",
          "contrat",
          "abîmé",
          "frais bancaires",
          "problème",
          "carte",
        ],
        phrases: [
          {
            text: "Bonjour, mon colis est arrivé abîmé. Puis-je avoir un remboursement ?",
            pt: "Bom dia, a minha encomenda chegou danificada. Posso obter um reembolso?",
            register: "formal",
            whenToUse: "Com o apoio ao cliente (Service Client)",
          },
          {
            text: "J'ai gardé le ticket de caisse pour faire un échange.",
            pt: "Guardei o talão de caixa para fazer uma troca.",
            register: "neutro",
            whenToUse: "Ao devolver ou trocar roupa ou equipamento numa loja",
          },
          {
            text: "Il me faut un justificatif de domicile de moins de trois mois.",
            pt: "Preciso de um comprovativo de morada com menos de três meses.",
            register: "formal",
            whenToUse: "Requisito clássico da administração francesa!",
          },
          {
            text: "Comment faire pour résilier mon abonnement sans frais ?",
            pt: "Como faço para cancelar a minha subscrição sem penalização?",
            register: "formal",
            whenToUse: "Telemóvel, ginásio, seguros ou electricidade",
          },
          {
            text: "Je voudrais prendre rendez-vous à la mairie, s'il vous plaît.",
            pt: "Gostaria de marcar atendimento na câmara municipal, por favor.",
            register: "formal",
            whenToUse: "Para tratar de documentos oficiais",
          },
        ],
        culturalTip:
          "Expressão-chave da vida prática em França: «un justificatif de domicile de moins de trois mois» (factura de luz/internet recente como comprovativo de morada) e «résilier» (rescindir/cancelar um contrato ou assinatura).",
        situations: [
          {
            id: "fr-srv-1",
            situationPt: "A encomenda que pediste online chegou partida e contactas o serviço de apoio.",
            register: "formal",
            correct: "Bonjour, j'ai reçu mon colis abîmé et je souhaiterais un remboursement.",
            options: [
              "Bonjour, j'ai reçu mon colis abîmé et je souhaiterais un remboursement.",
              "Bonjour, mon colis a une escale à la douane.",
              "Je voudrais partager mon colis à l'écran.",
              "J'ai oublié mon ordonnance de caisse.",
            ],
            explanationPt: "«Je souhaiterais un remboursement» usa o condicional de cortesia ideal para reclamações.",
          },
          {
            id: "fr-srv-2",
            situationPt: "No banco em França pedem-te um documento que prove onde moras.",
            register: "formal",
            correct: "Voici mon justificatif de domicile.",
            options: [
              "Voici mon justificatif de domicile.",
              "Voici ma carte d'embarquement.",
              "Voici mon entraînement du mois.",
              "Voici mon taux de change.",
            ],
            explanationPt: "«Un justificatif de domicile» é indispensável para abrir conta ou assinar contratos.",
          },
          {
            id: "fr-srv-3",
            situationPt: "Queres cancelar o contrato do ginásio ou internet no fim do período.",
            register: "formal",
            correct: "Je voudrais savoir comment résilier mon contrat.",
            options: [
              "Je voudrais savoir comment résilier mon contrat.",
              "Je voudrais assister mon contrat.",
              "Mon contrat est allergique.",
              "On fait le point sans contact.",
            ],
            explanationPt: "Para contratos e subscrições usa-se «résilier» (enquanto para uma reserva/consulta se usa «annuler»).",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "へんきん",
          "こうかん",
          "けいやく",
          "レシート",
          "かくにん",
          "ほしょう",
          "もうしわけ",
          "だいじょうぶ",
          "店",
          "買う",
        ],
        phrases: [
          {
            text: "すみません、こわれて いたので、こうかんして もらえますか。",
            pt: "Desculpe, como veio partido, poderia trocá-lo?",
            romaji: "Sumimasen, kowarete ita node, koukan shite moraemasu ka.",
            register: "formal",
            whenToUse: "Ao pedir troca de um produto com defeito",
          },
          {
            text: "レシートは こちらです。へんきんを おねがいできますか。",
            pt: "Aqui está o talão. Poderia fazer o reembolso?",
            romaji: "Reshiito wa kochira desu. Henkin o onegai dekimasu ka.",
            register: "formal",
            whenToUse: "Para pedir devolução do valor pago",
          },
          {
            text: "けいやくの 前に、もう 一度 かくにんさせてください。",
            pt: "Antes do contrato, deixe-me confirmar mais uma vez.",
            romaji: "Keiyaku no mae ni, mou ichido kakunin sasete kudasai.",
            register: "formal",
            whenToUse: "Ao assinar telemóvel, casa ou serviços no Japão",
          },
          {
            text: "にもつが まだ とどいて いません。",
            pt: "A encomenda ainda não chegou.",
            romaji: "Nimotsu ga mada todoite imasen.",
            register: "formal",
            whenToUse: "Ao contactar entregas (宅急便)",
          },
          {
            text: "ふくろは だいじょうぶです、ありがとうございます。",
            pt: "Não preciso de saco, muito obrigado.",
            romaji: "Fukuro wa daijoubu desu, arigatou gozaimasu.",
            register: "formal",
            whenToUse: "Nas lojas de conveniência (コンビニ) quando perguntam do saco!",
          },
        ],
        culturalTip:
          "Nos «コンビニ» (7-Eleven, Lawson, FamilyMart), perguntam sempre «ふくろは ごりようですか» (Precisa de saco?) ou «あたためますか» (Quer que aqueça?). Responder «だいじょうぶです» significa «Não é preciso, obrigado»!",
        situations: [
          {
            id: "ja-srv-1",
            situationPt: "Compraste um artigo que não funciona e tens o recibo para pedir troca.",
            register: "formal",
            correct: "すみません、新しいものと こうかんして もらえますか。",
            options: [
              "すみません、新しいものと こうかんして もらえますか。",
              "すみません、りょうがえして もらえますか。",
              "しょうがくきんを おねがいします。",
              "ミュートに なっていますよ。",
            ],
            explanationPt: "«こうかんしてもらえますか» pede a troca de forma muito educada.",
          },
          {
            id: "ja-srv-2",
            situationPt: "Na caixa do supermercado perguntam se queres saco plástico, mas já tens mochila.",
            register: "formal",
            correct: "ふくろは だいじょうぶです。",
            options: [
              "ふくろは だいじょうぶです。",
              "ふくろは しめきりです。",
              "ふくろに ログインします。",
              "パスポートは こちらです。",
            ],
            explanationPt: "Frase ultra-útil todos os dias no Japão!",
          },
          {
            id: "ja-srv-3",
            situationPt: "Queres ler com calma os detalhes antes de assinar um contrato.",
            register: "formal",
            correct: "けいやくの 前に、よく 読みたいです。",
            options: [
              "けいやくの 前に、よく 読みたいです。",
              "のりつぎの 前に、のみたいです。",
              "しょほうせんを こうかんします。",
              "がめんは キャッシュレスです。",
            ],
            explanationPt: "«けいやく» (keiyaku) = contrato.",
          },
        ],
      },
    },
  },
  {
    id: "falsos-amigos",
    emoji: "💡",
    title: "Expressões & Falsos Amigos",
    subtitle: "Armadilhas clássicas para falantes de português e como soar 100% natural",
    tag: "Fluência",
    color: "var(--color-coral)",
    softColor: "var(--color-coral-soft)",
    relatedLevels: [40, 44, 54],
    byLang: {
      en: {
        vocabKeys: [
          "actually",
          "currently",
          "pretend",
          "intend",
          "attend",
          "sensible",
          "sensitive",
          "eventually",
          "sympathetic",
          "realize",
          "library",
          "relatives",
        ],
        phrases: [
          {
            text: "Actually, I'm from Angola, not Brazil!",
            pt: "Na verdade, sou de Angola, não do Brasil!",
            register: "neutro",
            whenToUse: "Para corrigir uma suposição com simpatia («actually» ≠ actualmente)",
          },
          {
            text: "I intend to move abroad next year.",
            pt: "Pretendo / Tenciono mudar-me para o estrangeiro no próximo ano.",
            register: "neutro",
            whenToUse: "Nunca uses «pretend» aqui («pretend» = fingir!)",
          },
          {
            text: "That sounds like a very sensible plan.",
            pt: "Parece-me um plano muito sensato.",
            register: "neutro",
            whenToUse: "«sensible» = sensato; «sensitive» = sensível",
          },
          {
            text: "Are you going to attend the conference on Friday?",
            pt: "Vais assistir / estar presente na conferência de sexta-feira?",
            register: "formal",
            whenToUse: "«attend» = participar em (não «atender» o telefone!)",
          },
          {
            text: "We got lost at first, paper map in hand, and eventually found the café.",
            pt: "Perdemo-nos ao início e, no fim, acabámos por encontrar o café.",
            register: "informal",
            whenToUse: "«eventually» = no fim / mais tarde (não «talvez»!)",
          },
        ],
        culturalTip:
          "Os 5 falsos amigos de ouro para lusófonos em inglês: «actually» (na verdade), «currently» (actualmente), «pretend» (fingir), «intend» (pretender), «sensible» (sensato)!",
        situations: [
          {
            id: "en-fa-1",
            situationPt: "Queres dizer numa entrevista: «Actualmente trabalho em Luanda, mas pretendo estudar em Londres.»",
            register: "formal",
            correct: "Currently I work in Luanda, and I intend to study in London.",
            options: [
              "Currently I work in Luanda, and I intend to study in London.",
              "Actually I work in Luanda, and I pretend to study in London.",
              "Eventually I attend Luanda and sensible London.",
              "Presently I recipe in Luanda.",
            ],
            explanationPt: "«Actually + pretend» significaria «Na verdade trabalho em Luanda e finjo estudar em Londres»!",
          },
          {
            id: "en-fa-2",
            situationPt: "Um amigo toma uma decisão prudente com o orçamento e queres elogiá-lo.",
            register: "neutro",
            correct: "That's a really sensible choice.",
            options: [
              "That's a really sensible choice.",
              "That's a really prescription choice.",
              "You pretended very well.",
              "That's a layover decision.",
            ],
            explanationPt: "«Sensible» = sensato, equilibrado e prático.",
          },
          {
            id: "en-fa-3",
            situationPt: "Depois de duas horas à procura de bilhetes, finalmente conseguiram comprar.",
            register: "neutro",
            correct: "We eventually managed to get tickets!",
            options: [
              "We eventually managed to get tickets!",
              "We actually pretended the tickets!",
              "We attended the receipt!",
              "We muted the customs!",
            ],
            explanationPt: "«Eventually» indica que algo aconteceu finalmente após espera ou esforço.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "attendre",
          "répondre",
          "entendre",
          "comprendre",
          "pourtant",
          "donc",
          "assister",
          "location",
          "librairie",
          "stage",
          "actuellement",
          "presque",
        ],
        phrases: [
          {
            text: "Tu peux m'attendre deux minutes devant la gare ?",
            pt: "Podes esperar dois minutos por mim em frente à estação?",
            register: "informal",
            whenToUse: "«attendre» = esperar (atender o telefone é «répondre au téléphone»)",
          },
          {
            text: "Désolé, il y a du bruit, je ne t'entends pas bien.",
            pt: "Desculpa, há barulho, não te estou a ouvir bem.",
            register: "neutro",
            whenToUse: "«entendre» = ouvir (entender/compreender é «comprendre»!)",
          },
          {
            text: "Il a beaucoup étudié, et pourtant il était nerveux.",
            pt: "Ele estudou muito e, no entanto, estava nervoso.",
            register: "neutro",
            whenToUse: "«pourtant» = no entanto / contudo (portanto = «donc»!)",
          },
          {
            text: "J'ai assisté à un concert incroyable hier soir.",
            pt: "Estive presente / Assisti a um concerto incrível ontem à noite.",
            register: "neutro",
            whenToUse: "«assister à» = presenciar",
          },
          {
            text: "J'ai tout compris, donc je commence demain !",
            pt: "Entendi tudo, portanto começo amanhã!",
            register: "neutro",
            whenToUse: "Contraste perfeito: «comprendre» (entender) + «donc» (portanto)",
          },
        ],
        culturalTip:
          "Triângulo clássico de falsos amigos em francês: «entendre» (ouvir) ≠ «comprendre» (entender); «attendre» (esperar) ≠ «répondre» (atender); «pourtant» (no entanto) ≠ «donc» (portanto)!",
        situations: [
          {
            id: "fr-fa-1",
            situationPt: "Há barulho na rua e queres dizer: «Eu ouço-te, mas não entendo esta palavra.»",
            register: "neutro",
            correct: "Je t'entends, mais je ne comprends pas ce mot.",
            options: [
              "Je t'entends, mais je ne comprends pas ce mot.",
              "Je t'attends, pourtant je n'assiste pas ce mot.",
              "Je te comprends le bruit à la douane.",
              "Mon micro t'attend bien.",
            ],
            explanationPt: "«Entendre» = captar o som (ouvir); «comprendre» = compreender o sentido.",
          },
          {
            id: "fr-fa-2",
            situationPt: "Queres dizer «É caro e, no entanto, está sempre cheio!»",
            register: "neutro",
            correct: "C'est cher, et pourtant c'est toujours plein !",
            options: [
              "C'est cher, et pourtant c'est toujours plein !",
              "C'est cher, et en panne c'est plein !",
              "C'est cher, sans contact d'ordonnance !",
              "C'est cher, voici mon justificatif !",
            ],
            explanationPt: "«Pourtant» exprime oposição («apesar disso / no entanto»), nunca conclusão!",
          },
          {
            id: "fr-fa-3",
            situationPt: "Pedes ao teu amigo que aguarde um instante à porta do metro.",
            register: "informal",
            correct: "Attends-moi une minute devant le métro !",
            options: [
              "Attends-moi une minute devant le métro !",
              "Entends-moi un colis au métro !",
              "Résilie-moi devant le métro !",
              "Rembourse-moi une minute !",
            ],
            explanationPt: "«Attends-moi !» = Espera por mim!",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "だいじょうぶ",
          "おつかれさまです",
          "おせわになります",
          "やっぱり",
          "なるほど",
          "おじゃまします",
          "またこんど",
          "そうです",
          "すごく",
          "きをつけて",
        ],
        phrases: [
          {
            text: "あ、コーヒーは だいじょうぶです。お水を ください。",
            pt: "Ah, café não é preciso, obrigado. Dê-me água, por favor.",
            romaji: "A, koohii wa daijoubu desu. Omizu o kudasai.",
            register: "formal",
            whenToUse: "Recusar uma oferta com suavidade sem dizer «いいえ» directo",
          },
          {
            text: "すみません、これ おねがいします… あ、すみません、ありがとうございます！",
            pt: "Com licença, queria isto… ah, obrigado (e desculpe o incómodo)!",
            romaji: "Sumimasen, kore onegaishimasu... a, sumimasen, arigatou gozaimasu!",
            register: "formal",
            whenToUse: "«すみません» serve para chamar, pedir desculpa E agradecer um favor!",
          },
          {
            text: "ちょっと かんがえても いいですか。",
            pt: "Posso pensar um bocadinho? (Na prática: «vai ser difícil / prefiro não comprar agora»)",
            romaji: "Chotto kangaete mo ii desu ka.",
            register: "formal",
            whenToUse: "Forma japonesa super educada de sair de uma loja sem pressão",
          },
          {
            text: "今日は ちょっと… また こんど 行きましょう！",
            pt: "Hoje dá-me um pouco de mau jeito… vamos numa próxima vez!",
            romaji: "Kyou wa chotto... mata kondo ikimashou!",
            register: "neutro",
            whenToUse: "«今日はちょっと…» recusa um convite sem soar rude",
          },
          {
            text: "いつも おせわに なって おります。",
            pt: "Muito obrigado pelo vosso apoio contínuo.",
            romaji: "Itsumo osewa ni natte orimasu.",
            register: "formal",
            whenToUse: "Saudação de abertura em e-mails e chamadas profissionais no Japão",
          },
        ],
        culturalTip:
          "Em japonês, dizer «いいえ、できません» (Não, não posso) de forma seca pode soar brusco. Usa «ちょっと…» («今日はちょっと…») para recusar convites com delicadeza, e lembra-te que «すみません» muitas vezes quer dizer «obrigado pelo incómodo que teve por mim»!",
        situations: [
          {
            id: "ja-fa-1",
            situationPt: "Um amigo convida-te para sair hoje à noite, mas tens de trabalhar cedo amanhã. Como recusas com naturalidade?",
            register: "neutro",
            correct: "ごめん、今日は ちょっと… また こんど 行こう！",
            options: [
              "ごめん、今日は ちょっと… また こんど 行こう！",
              "しんこくする ものは ありません！",
              "てすうりょうは いくらですか。",
              "しょほうせんを ください。",
            ],
            explanationPt: "Deixar a frase suspensa em «今日はちょっと…» e sugerir «またこんど» preserva a harmonia.",
          },
          {
            id: "ja-fa-2",
            situationPt: "Numa loja de roupa em Shibuya, o preço é alto e queres sair educadamente sem comprar.",
            register: "formal",
            correct: "ありがとうございます。ちょっと かんがえます。",
            options: [
              "ありがとうございます。ちょっと かんがえます。",
              "へんきんを おねがいします。",
              "ミュートに なっています。",
              "アレルギーが あります。",
            ],
            explanationPt: "«ちょっとかんがえます» (Vou pensar um pouco) é compreendido por qualquer vendedor como uma despedida educada.",
          },
          {
            id: "ja-fa-3",
            situationPt: "Alguém segura a porta do elevador para ti no escritório.",
            register: "formal",
            correct: "あ、すみません！ありがとうございます。",
            options: [
              "あ、すみません！ありがとうございます。",
              "ふくろは だいじょうぶです。",
              "りょうがえを おねがいします。",
              "ログインできません。",
            ],
            explanationPt: "Combinar «すみません» (pelo esforço da outra pessoa) + «ありがとうございます» soa 100% nativo.",
          },
        ],
      },
    },
  },
  {
    id: "habitacao",
    emoji: "🏠",
    title: "Casa, Arrendamento & Vizinhança",
    subtitle: "Arrendar apartamento, caução, despesas incluídas, avarias e vizinhos",
    tag: "Habitação",
    color: "var(--color-teal)",
    softColor: "var(--color-teal-soft)",
    relatedLevels: [15, 29, 51],
    byLang: {
      en: {
        vocabKeys: ["rent", "deposit", "landlord", "tenant", "utilities", "lease", "leak", "furnished", "neighbour", "heating"],
        phrases: [
          {
            text: "Are utilities included in the monthly rent?",
            pt: "As despesas de água e luz estão incluídas na renda mensal?",
            register: "formal",
            whenToUse: "Ao visitar um apartamento ou quarto para arrendar",
          },
          {
            text: "How much is the security deposit, and when is it returned?",
            pt: "Qual é o valor da caução e quando é devolvida?",
            register: "formal",
            whenToUse: "Antes de assinar o contrato de arrendamento (lease)",
          },
          {
            text: "Hi, there's a water leak under the kitchen sink.",
            pt: "Olá, há uma fuga de água debaixo do lava-loiça.",
            register: "neutro",
            whenToUse: "Ao contactar o senhorio ou agência para reparação urgente",
          },
          {
            text: "The central heating isn't working properly today.",
            pt: "O aquecimento central hoje não está a funcionar bem.",
            register: "neutro",
            whenToUse: "Problemas de inverno num apartamento arrendado",
          },
          {
            text: "Hi! I'm your new neighbour — I just moved into flat 3B.",
            pt: "Olá! Sou o teu novo vizinho — acabei de me mudar para o 3B.",
            register: "informal",
            whenToUse: "Para te apresentares com simpatia no prédio",
          },
        ],
        culturalTip:
          "No Reino Unido diz-se «flat» (nos EUA: «apartment») e «council tax» é o imposto municipal pago pelo inquilino — pergunta sempre se «bills / utilities» estão incluídas antes de fechar negócio!",
        situations: [
          {
            id: "en-hab-1",
            situationPt: "Estás a visitar um apartamento em Londres e queres saber se a água, luz e gás já estão no preço.",
            register: "formal",
            correct: "Are utilities included in the rent?",
            options: [
              "Are utilities included in the rent?",
              "Are prescriptions included in the layover?",
              "Is the landlord contactless?",
              "Do I pretend the deposit?",
            ],
            explanationPt: "«Utilities» engloba electricidade, água, gás (e por vezes internet).",
          },
          {
            id: "en-hab-2",
            situationPt: "Há água a pingar na casa de banho e precisas de avisar o senhorio.",
            register: "neutro",
            correct: "Hi, I need to report a water leak in the bathroom.",
            options: [
              "Hi, I need to report a water leak in the bathroom.",
              "Hi, I need a return ticket for the sink.",
              "My bathroom is on mute.",
              "Could I split the bill with the boiler?",
            ],
            explanationPt: "«Report a water leak» comunica o problema de forma clara e imediata.",
          },
          {
            id: "en-hab-3",
            situationPt: "Queres saber se o apartamento já vem com cama, sofá e mesa.",
            register: "formal",
            correct: "Does the flat come furnished?",
            options: [
              "Does the flat come furnished?",
              "Does the flat come allergic?",
              "Is the lease gluten-free?",
              "Can I top up the neighbour?",
            ],
            explanationPt: "«Furnished» = mobilado; «unfurnished» = sem mobília.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Hi! Does the flat come furnished, and are utilities included in the rent?",
            pt: "Olá! O apartamento vem mobilado e as despesas estão incluídas na renda?",
          },
          {
            speaker: "Landlord",
            text: "Yes, it's fully furnished. Water is included, and heating is separate.",
            pt: "Sim, está totalmente mobilado. A água está incluída e o aquecimento é à parte.",
          },
          {
            speaker: "Tu",
            text: "Great. How much is the deposit if I sign a one-year lease?",
            pt: "Óptimo. Qual é o valor da caução se eu assinar um contrato de um ano?",
          },
          {
            speaker: "Landlord",
            text: "One month's rent, and you get it back when you move out.",
            pt: "Um mês de renda, e recebe-a de volta quando sair.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "loyer",
          "caution",
          "propriétaire",
          "locataire",
          "charges comprises",
          "état des lieux",
          "fuite",
          "voisin",
          "location",
          "chauffage",
        ],
        phrases: [
          {
            text: "Est-ce que le loyer est charges comprises ?",
            pt: "A renda já tem as despesas incluídas?",
            register: "formal",
            whenToUse: "Ao visitar um estúdio ou apartamento em França/Bélgica",
          },
          {
            text: "Quand est-ce qu'on fait l'état des lieux d'entrée ?",
            pt: "Quando fazemos a vistoria de entrada do imóvel?",
            register: "formal",
            whenToUse: "Antes de receber as chaves para registar o estado da casa",
          },
          {
            text: "Bonjour, il y a une fuite d'eau sous l'évier de la cuisine.",
            pt: "Bom dia, há uma fuga de água debaixo do lava-loiça da cozinha.",
            register: "formal",
            whenToUse: "Ao ligar ao senhorio (propriétaire) ou agência",
          },
          {
            text: "J'ai un préavis d'un mois avant de déménager.",
            pt: "Tenho um aviso prévio de um mês antes de mudar de casa.",
            register: "neutro",
            whenToUse: "Ao preparar a saída de um apartamento arrendado",
          },
          {
            text: "Bonjour ! Je suis votre nouveau voisin du troisième étage.",
            pt: "Bom dia! Sou o vosso novo vizinho do terceiro andar.",
            register: "neutro",
            whenToUse: "Para criar boa relação no prédio logo à chegada",
          },
        ],
        culturalTip:
          "Em França, «une location» significa arrendamento (não localização!), e o «état des lieux» (vistoria detalhada à entrada e saída) é sagrado para reaveres a «caution»!",
        situations: [
          {
            id: "fr-hab-1",
            situationPt: "Vês um anúncio «750 € CC» em Paris e queres confirmar se o aquecimento faz parte das despesas.",
            register: "formal",
            correct: "Bonjour, le chauffage est inclus dans les charges comprises ?",
            options: [
              "Bonjour, le chauffage est inclus dans les charges comprises ?",
              "Bonjour, le chauffage passe en bagage cabine ?",
              "Je voudrais faire opposition au voisin.",
              "Vous avez une carafe de loyer ?",
            ],
            explanationPt: "«Charges comprises (CC)» indica despesas de condomínio/água e por vezes aquecimento colectivo.",
          },
          {
            id: "fr-hab-2",
            situationPt: "Vais assinar o contrato e queres combinar a vistoria do apartamento antes de entrar.",
            register: "formal",
            correct: "Quand pouvons-nous faire l'état des lieux ?",
            options: [
              "Quand pouvons-nous faire l'état des lieux ?",
              "Quand pouvons-nous prendre un verre de fuite ?",
              "Où est le quai du propriétaire ?",
              "Il faut une ordonnance pour la caution ?",
            ],
            explanationPt: "«Faire l'état des lieux» protege o inquilino e o proprietário.",
          },
          {
            id: "fr-hab-3",
            situationPt: "Apareceu uma infiltração na casa de banho e ligas ao senhorio.",
            register: "formal",
            correct: "Excusez-moi de vous déranger, il y a une fuite d'eau dans la salle de bain.",
            options: [
              "Excusez-moi de vous déranger, il y a une fuite d'eau dans la salle de bain.",
              "Excusez-moi, ma salle de bain est en grève.",
              "J'ai perdu mon aller-retour dans la cuisine.",
              "Mon micro est coupé chez le voisin.",
            ],
            explanationPt: "Educado e claro: «une fuite d'eau» = fuga de água.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Bonjour, je visite l'appartement en location. Le loyer est charges comprises ?",
            pt: "Bom dia, venho visitar o apartamento para arrendar. A renda tem despesas incluídas?",
          },
          {
            speaker: "Propriétaire",
            text: "Oui, l'eau froide et le chauffage collectif sont compris.",
            pt: "Sim, a água fria e o aquecimento central estão incluídos.",
          },
          {
            speaker: "Tu",
            text: "Parfait ! Et quel est le montant de la caution ?",
            pt: "Perfeito! E qual é o valor da caução?",
          },
          {
            speaker: "Propriétaire",
            text: "Un mois de loyer. On fera l'état des lieux vendredi matin.",
            pt: "Um mês de renda. Faremos a vistoria na sexta-feira de manhã.",
          },
        ],
      },
      ja: {
        vocabKeys: ["やちん", "しききん", "れいきん", "おおや", "こうねつひ", "ひっこし", "しゅうり", "となり", "エアコン", "けいやく"],
        phrases: [
          {
            text: "やちんに こうねつひは 入っていますか。",
            pt: "As despesas de luz, água e gás estão incluídas na renda?",
            romaji: "Yachin ni kounetsuhi wa haitte imasu ka.",
            register: "formal",
            whenToUse: "Numa agência imobiliária (不動産屋) ao procurar casa",
          },
          {
            text: "しききんと れいきんは いくらですか。",
            pt: "Quanto são a caução e a taxa de entrada (reikin)?",
            romaji: "Shikikin to reikin wa ikura desu ka.",
            register: "formal",
            whenToUse: "Essencial para calcular o custo inicial de mudança no Japão",
          },
          {
            text: "すみません、へやの エアコンが うごきません。しゅうりを おねがいできますか。",
            pt: "Desculpe, o ar condicionado do quarto não funciona. Poderia pedir a reparação?",
            romaji: "Sumimasen, heya no eakon ga ugokimasen. Shuuri o onegai dekimasu ka.",
            register: "formal",
            whenToUse: "Ao ligar ao senhorio (大家さん) ou empresa de gestão",
          },
          {
            text: "となりに ひっこして きました。よろしく おねがいします。",
            pt: "Mudei-me agora para a casa ao lado. Muito gosto em ser vosso vizinho!",
            romaji: "Tonari ni hikkoshite kimashita. Yoroshiku onegaishimasu.",
            register: "formal",
            whenToUse: "Tradição simpática de cumprimentar o vizinho após a mudança",
          },
          {
            text: "来月 ひっこしを する 予定です。",
            pt: "Tenciono mudar de casa no próximo mês.",
            romaji: "Raigetsu hikkoshi o suru yotei desu.",
            register: "neutro",
            whenToUse: "Ao contar planos de mudança a colegas ou amigos",
          },
        ],
        culturalTip:
          "No Japão, muitos contratos pedem «しききん» (caução reembolsável) e «れいきん» (presente não reembolsável ao senhorio). Hoje já existem muitos apartamentos «礼金ゼロ» (zero reikin) — vale sempre a pena perguntar!",
        situations: [
          {
            id: "ja-hab-1",
            situationPt: "O ar condicionado avariou em pleno verão e ligas ao senhorio para pedir arranjo.",
            register: "formal",
            correct: "すみません、エアコンの しゅうりを おねがいできますか。",
            options: [
              "すみません、エアコンの しゅうりを おねがいできますか。",
              "すみません、エアコンを わりかんに できますか。",
              "エアコンの とうじょうけんを ください。",
              "エアコンに ログインできません。",
            ],
            explanationPt: "«しゅうりをおねがいできますか» é a forma mais cortês de pedir uma reparação.",
          },
          {
            id: "ja-hab-2",
            situationPt: "Acabaste de te mudar e tocas à campainha do vizinho do lado para te apresentares.",
            register: "formal",
            correct: "となりに ひっこして きました。よろしく おねがいします。",
            options: [
              "となりに ひっこして きました。よろしく おねがいします。",
              "しんこくする ものは ありません。",
              "おもちかえりで おねがいします。",
              "しゅうでんの 時間です。",
            ],
            explanationPt: "Saudação clássica de boa vizinhança no Japão.",
          },
          {
            id: "ja-hab-3",
            situationPt: "Na imobiliária, queres saber se existe apartamento sem taxa não-reembolsável ao senhorio.",
            register: "formal",
            correct: "れいきんが ない へやは ありますか。",
            options: [
              "れいきんが ない へやは ありますか。",
              "しょほうせんが ない へやは ありますか。",
              "おかわりが ない へやは ありますか。",
              "かいさつが ない へやは ありますか。",
            ],
            explanationPt: "«れいきんがないへや» = apartamento sem key money.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "すみません、この へやの やちんに こうねつひは 入っていますか。",
            pt: "Com licença, a renda deste apartamento inclui as despesas de luz e água?",
            romaji: "Sumimasen, kono heya no yachin ni kounetsuhi wa haitte imasu ka.",
          },
          {
            speaker: "おおや",
            text: "水道は 入っていますが、電気と ガスは べつです。",
            pt: "A água está incluída, mas a electricidade e o gás são à parte.",
            romaji: "Suidou wa haitte imasu ga, denki to gasu wa betsu desu.",
          },
          {
            speaker: "Tu",
            text: "なるほど。れいきんは ありますか。",
            pt: "Estou a ver. Tem taxa de entrada (reikin)?",
            romaji: "Naruhodo. Reikin wa arimasu ka.",
          },
          {
            speaker: "おおや",
            text: "れいきんは ゼロで、しききんだけ 一か月分です。",
            pt: "O reikin é zero; há apenas um mês de caução.",
            romaji: "Reikin wa zero de, shikikin dake ikkagetsubun desu.",
          },
        ],
      },
    },
  },
  {
    id: "restaurante",
    emoji: "🍽️",
    title: "Restaurante, Café & Restrições",
    subtitle: "Reservar mesa, opções vegetarianas/alergias, dividir a conta e pedir para levar",
    tag: "Gastronomia",
    color: "var(--color-coral)",
    softColor: "var(--color-coral-soft)",
    relatedLevels: [3, 14, 24],
    byLang: {
      en: {
        vocabKeys: [
          "reservation",
          "split the bill",
          "takeaway",
          "tap water",
          "vegetarian",
          "gluten-free",
          "dairy-free",
          "starter",
          "exquisite",
          "allergic",
        ],
        phrases: [
          {
            text: "Hi, I have a reservation for two under Mateus.",
            pt: "Olá, tenho uma reserva para duas pessoas em nome de Mateus.",
            register: "neutro",
            whenToUse: "Ao chegar à entrada do restaurante («under + nome»!)",
          },
          {
            text: "Could we get some tap water for the table, please?",
            pt: "Podia trazer água da torneira para a mesa, por favor?",
            register: "neutro",
            whenToUse: "Para pedir água gratuita em restaurantes no Reino Unido ou EUA",
          },
          {
            text: "Do you have any vegetarian or gluten-free options?",
            pt: "Têm opções vegetarianas ou sem glúten?",
            register: "formal",
            whenToUse: "Ao consultar a ementa com restrições alimentares",
          },
          {
            text: "Could we split the bill, please?",
            pt: "Podíamos dividir a conta, por favor?",
            register: "neutro",
            whenToUse: "No final de um jantar entre amigos ou colegas",
          },
          {
            text: "Could I get a flat white with oat milk to takeaway?",
            pt: "Podia dar-me um café com bebida de aveia para levar?",
            register: "neutro",
            whenToUse: "Num café moderno de manhã",
          },
        ],
        culturalTip:
          "Atenção: dizer que uma reserva está «em nome de X» em inglês é «under the name X» (nunca «in name of»). E elogiar a comida dizendo «exquisite!» significa requintada/deliciosa — nunca «esquisita»!",
        situations: [
          {
            id: "en-res-1",
            situationPt: "Jantaste com colegas em Londres e cada um quer pagar a sua parte no cartão.",
            register: "neutro",
            correct: "Could we split the bill, please?",
            options: [
              "Could we split the bill, please?",
              "Could we layover the receipt, please?",
              "Let's top up the starter!",
              "Can we compromise the tap water?",
            ],
            explanationPt: "«Split the bill» (ou «pay separately») é natural e aceite em quase todo o lado.",
          },
          {
            id: "en-res-2",
            situationPt: "Não queres pagar água engarrafada cara e preferes um jarro de água gratuita.",
            register: "neutro",
            correct: "Could we have some tap water for the table, please?",
            options: [
              "Could we have some tap water for the table, please?",
              "Give us a leak of water, please.",
              "Do you have rush hour water?",
              "Is this water furnished?",
            ],
            explanationPt: "«Tap water for the table» é comum e perfeitamente educado.",
          },
          {
            id: "en-res-3",
            situationPt: "O chefe pergunta se gostaste do prato e queres fazer um grande elogio.",
            register: "formal",
            correct: "Everything was exquisite, thank you!",
            options: [
              "Everything was exquisite, thank you!",
              "Everything was faulty, thank you!",
              "The food was stolen, cheers!",
              "Actually, I pretended the starter.",
            ],
            explanationPt: "«Exquisite» é um enorme elogio gastronómico em inglês!",
          },
        ],
        miniDialogue: [
          {
            speaker: "Waiter",
            text: "Good evening! Are you ready to order, or do you need a minute?",
            pt: "Boa noite! Já estão prontos para pedir ou precisam de um minuto?",
          },
          {
            speaker: "Tu",
            text: "Ready! Do you have a dairy-free or vegetarian starter?",
            pt: "Prontos! Têm alguma entrada sem lacticínios ou vegetariana?",
          },
          {
            speaker: "Waiter",
            text: "Yes, our roasted tomato soup is both vegetarian and gluten-free.",
            pt: "Sim, a nossa sopa de tomate assado é vegetariana e sem glúten.",
          },
          {
            speaker: "Tu",
            text: "Perfect, I'll have that — and some tap water for the table, please.",
            pt: "Perfeito, vou querer essa — e água da torneira para a mesa, por favor.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "réservation",
          "addition",
          "carafe d'eau",
          "à emporter",
          "pourboire",
          "végétarien",
          "sans gluten",
          "sans lactose",
          "entrée",
          "allergique",
        ],
        phrases: [
          {
            text: "Bonjour, j'ai une réservation pour deux au nom de Costa.",
            pt: "Bom dia, tenho uma reserva para dois em nome de Costa.",
            register: "formal",
            whenToUse: "Ao chegar a um bistrô ou restaurante",
          },
          {
            text: "Une carafe d'eau et du pain, s'il vous plaît.",
            pt: "Um jarro de água e pão, por favor.",
            register: "formal",
            whenToUse: "Segredo local em França: ambos são gratuitos e podes repetir!",
          },
          {
            text: "Excusez-moi, avez-vous des plats végétariens ou sans gluten ?",
            pt: "Com licença, têm pratos vegetarianos ou sem glúten?",
            register: "formal",
            whenToUse: "Ao verificar ingredientes antes de pedir",
          },
          {
            text: "C'est pour manger sur place ou à emporter ?",
            pt: "É para comer aqui ou para levar?",
            register: "neutro",
            whenToUse: "Pergunta que ouvirás em todas as padarias e cafés",
          },
          {
            text: "S'il vous plaît, on pourrait avoir l'addition ?",
            pt: "Por favor, poderia trazer-nos a conta?",
            register: "formal",
            whenToUse: "Em França nunca trazem a conta sem pedires (seria considerado apressar o cliente!)",
          },
        ],
        culturalTip:
          "Em França o serviço («service compris» — 15%) já vem incluído na conta por lei! Deixar 1 a 3 euros de «pourboire» é apenas um gesto simpático extra quando gostaste muito. E pede sempre «une carafe d'eau»!",
        situations: [
          {
            id: "fr-res-1",
            situationPt: "Numa padaria em Paris perguntam «Sur place ou à emporter ?» e queres levar na mão.",
            register: "formal",
            correct: "À emporter, s'il vous plaît.",
            options: [
              "À emporter, s'il vous plaît.",
              "Charges comprises, s'il vous plaît.",
              "En panne, s'il vous plaît.",
              "Aller-retour, s'il vous plaît.",
            ],
            explanationPt: "«Sur place» = comer no local; «à emporter» = para levar.",
          },
          {
            id: "fr-res-2",
            situationPt: "Queres pedir água gratuita na mesa durante o almoço em França.",
            register: "formal",
            correct: "Pourriez-vous nous apporter une carafe d'eau, s'il vous plaît ?",
            options: [
              "Pourriez-vous nous apporter une carafe d'eau, s'il vous plaît ?",
              "Pourriez-vous résilier l'eau, s'il vous plaît ?",
              "Une fuite d'eau pour la table, s'il vous plaît.",
              "Voici le devis de l'addition.",
            ],
            explanationPt: "«Une carafe d'eau» garante água filtrada/da torneira sem custo.",
          },
          {
            id: "fr-res-3",
            situationPt: "Terminaram o jantar e queres pedir a conta educadamente.",
            register: "formal",
            correct: "Excusez-moi, l'addition s'il vous plaît.",
            options: [
              "Excusez-moi, l'addition s'il vous plaît.",
              "Excusez-moi, la caution s'il vous plaît.",
              "La correspondance, s'il vous plaît.",
              "Mon entretien, s'il vous plaît.",
            ],
            explanationPt: "No restaurante a conta é «l'addition» (e na loja o talão é «le ticket de caisse»).",
          },
        ],
        miniDialogue: [
          {
            speaker: "Serveur",
            text: "Bonsoir ! Vous avez choisi ?",
            pt: "Boa noite! Já escolheram?",
          },
          {
            speaker: "Tu",
            text: "Bonsoir ! Oui, avez-vous un plat végétarien et sans lactose ?",
            pt: "Boa noite! Sim, têm algum prato vegetariano e sem lactose?",
          },
          {
            speaker: "Serveur",
            text: "Bien sûr, le risotto aux champignons est préparé à l'huile d'olive.",
            pt: "Claro, o risoto de cogumelos é preparado com azeite.",
          },
          {
            speaker: "Tu",
            text: "Parfait, je prends ça, avec une carafe d'eau s'il vous plaît !",
            pt: "Perfeito, fico com esse, e um jarro de água por favor!",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "よやく",
          "わりかん",
          "おもちかえり",
          "おひや",
          "ベジタリアン",
          "かいけい",
          "おすすめ",
          "ちゅうもん",
          "ごちそうさま",
          "おかわり",
        ],
        phrases: [
          {
            text: "すみません、ちゅうもんを おねがいします。今日の おすすめは 何ですか。",
            pt: "Com licença, queria fazer o pedido. Qual é a recomendação de hoje?",
            romaji: "Sumimasen, chuumon o onegaishimasu. Kyou no osusume wa nan desu ka.",
            register: "formal",
            whenToUse: "Ao chamar o empregado para pedir num izakaya ou restaurante",
          },
          {
            text: "私は ベジタリアンです。肉と 魚が 入っていない 料理は ありますか。",
            pt: "Sou vegetariano. Têm algum prato que não leve carne nem peixe?",
            romaji: "Watashi wa bejitarian desu. Niku to sakana ga haitte inai ryouri wa arimasu ka.",
            register: "formal",
            whenToUse: "Muito útil no Japão, onde muitos caldos levam peixe (dashi)",
          },
          {
            text: "これ、おもちかえりに できますか。",
            pt: "Posso pedir isto para levar?",
            romaji: "Kore, omochikaeri ni dekimasu ka.",
            register: "formal",
            whenToUse: "Em cafés, padarias ou balcões de comida",
          },
          {
            text: "すみません、おかいけいを おねがいします。べつべつに はらえますか。",
            pt: "Com licença, a conta por favor. Podemos pagar separadamente?",
            romaji: "Sumimasen, okaikei o onegaishimasu. Betsubetsu ni haraemasu ka.",
            register: "formal",
            whenToUse: "Na hora de pagar (muitas vezes paga-se na caixa à saída!)",
          },
          {
            text: "とても おいしかったです。ごちそうさまでした！",
            pt: "Estava mesmo delicioso. Muito obrigado pela refeição!",
            romaji: "Totemo oishikatta desu. Gochisousama deshita!",
            register: "formal",
            whenToUse: "Ao levantar-te e sair de qualquer restaurante no Japão",
          },
        ],
        culturalTip:
          "No Japão NÃO existe gorjeta (se deixares moedas na mesa, o empregado corre atrás de ti na rua para devolver o troco esquecido!). O melhor agradecimento é dizer «ごちそうさまでした！» com um sorriso ao sair.",
        situations: [
          {
            id: "ja-res-1",
            situationPt: "Entras num pequeno restaurante em Quioto e queres saber qual é o prato especial do dia.",
            register: "formal",
            correct: "すみません、今日の おすすめは 何ですか。",
            options: [
              "すみません、今日の おすすめは 何ですか。",
              "すみません、今日の しめきりは 何ですか。",
              "すみません、れいきんは 何ですか。",
              "きゅうきゅうしゃは 何ですか。",
            ],
            explanationPt: "«おすすめ» (osusume) = recomendação do chefe/casa.",
          },
          {
            id: "ja-res-2",
            situationPt: "Acabaste de jantar ramen e vais agradecer ao cozinheiro antes de sair.",
            register: "formal",
            correct: "ごちそうさまでした！",
            options: [
              "ごちそうさまでした！",
              "おじゃまします！",
              "たすけてください！",
              "のりかえです！",
            ],
            explanationPt: "«ごちそうさまでした» expressa gratidão a quem preparou e serviu a refeição.",
          },
          {
            id: "ja-res-3",
            situationPt: "Combinas com os teus colegas dividir a conta igualmente entre todos.",
            register: "informal",
            correct: "今日は わりかんに しよう！",
            options: [
              "今日は わりかんに しよう！",
              "今日は ちえんに しよう！",
              "今日は わすれものに しよう！",
              "今日は しききんに しよう！",
            ],
            explanationPt: "«わりかんにする» = dividir a despesa entre o grupo.",
          },
        ],
        miniDialogue: [
          {
            speaker: "店員",
            text: "いらっしゃいませ！よやくは ありますか。",
            pt: "Bem-vindo! Tem reserva?",
            romaji: "Irasshaimase! Yoyaku wa arimasu ka.",
          },
          {
            speaker: "Tu",
            text: "いいえ、二人です。ベジタリアンの メニューは ありますか。",
            pt: "Não, somos dois. Têm menu vegetariano?",
            romaji: "Iie, futari desu. Bejitarian no menyuu wa arimasu ka.",
          },
          {
            speaker: "店員",
            text: "はい、こちらの やさいカレーが おすすめです。",
            pt: "Sim, recomendamos este caril de legumes.",
            romaji: "Hai, kochira no yasai karee ga osusume desu.",
          },
          {
            speaker: "Tu",
            text: "じゃあ、それと おひやを 二つ おねがいします。",
            pt: "Então queria esse e dois copos de água fresca, por favor.",
            romaji: "Jaa, sore to ohiya o futatsu onegaishimasu.",
          },
        ],
      },
    },
  },
  {
    id: "transportes",
    emoji: "🚆",
    title: "Comboios, Metro & Mobilidade",
    subtitle: "Plataformas, passes urbanos, transbordos, atrasos e último comboio",
    tag: "Viagens",
    color: "var(--color-yellow)",
    softColor: "var(--color-yellow-soft)",
    relatedLevels: [8, 17, 28],
    byLang: {
      en: {
        vocabKeys: [
          "return ticket",
          "top up",
          "fare",
          "rush hour",
          "platform",
          "delay",
          "commute",
          "in advance",
          "signal",
          "service",
        ],
        phrases: [
          {
            text: "Excuse me, which platform does the train to Oxford leave from?",
            pt: "Com licença, de que plataforma parte o comboio para Oxford?",
            register: "formal",
            whenToUse: "Nas grandes estações ferroviárias",
          },
          {
            text: "Where can I top up my travel card?",
            pt: "Onde posso carregar o saldo do meu passe de transporte?",
            register: "neutro",
            whenToUse: "No metro (Oyster card, MetroCard, etc.)",
          },
          {
            text: "It's much cheaper if you book train tickets in advance.",
            pt: "Fica muito mais barato se comprares bilhetes de comboio com antecedência.",
            register: "neutro",
            whenToUse: "Dica de ouro para comboios interurbanos no Reino Unido",
          },
          {
            text: "Sorry I'm late — there was a twenty-minute signal delay on my line.",
            pt: "Desculpa o atraso — houve uma falha de sinalização de vinte minutos na minha linha.",
            register: "neutro",
            whenToUse: "Ao justificar um atraso no trabalho ou encontro",
          },
          {
            text: "Do I need to change trains, or is this service direct?",
            pt: "Preciso de mudar de comboio ou este serviço é directo?",
            register: "formal",
            whenToUse: "Antes de entrar na carruagem",
          },
        ],
        culturalTip:
          "Em Londres não precisas sequer de comprar cartão físico: basta encostar o teu cartão bancário «contactless» nos torniquetes à entrada («tap in») e à saída («tap out»), e o sistema aplica o tecto diário automático!",
        situations: [
          {
            id: "en-tra-1",
            situationPt: "Queres comprar um bilhete de ida e volta para Brighton na bilheteira.",
            register: "formal",
            correct: "Could I have a return ticket to Brighton, please?",
            options: [
              "Could I have a return ticket to Brighton, please?",
              "Could I have a rain check ticket to Brighton?",
              "Can I split the platform to Brighton?",
              "Give me a furnished fare, please.",
            ],
            explanationPt: "«Return ticket» (UK) / «round-trip ticket» (US) = ida e volta.",
          },
          {
            id: "en-tra-2",
            situationPt: "O teu cartão do metro ficou sem saldo e procuras a máquina de carregamento.",
            register: "neutro",
            correct: "Excuse me, where can I top up my card?",
            options: [
              "Excuse me, where can I top up my card?",
              "Where can I summarize my card?",
              "Can I leak my card here?",
              "Is my card gluten-free?",
            ],
            explanationPt: "«Top up» é o phrasal verb indispensável para recarregar passes e telemóveis.",
          },
          {
            id: "en-tra-3",
            situationPt: "Avisas um colega que os comboios das 8h30 vêm sempre apinhados.",
            register: "informal",
            correct: "The trains are packed during morning rush hour.",
            options: [
              "The trains are packed during morning rush hour.",
              "The trains are exquisite during takeaway.",
              "The platform is sympathetic.",
              "I commute on mute.",
            ],
            explanationPt: "«Rush hour» = hora de ponta (manhã e fim de tarde).",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Excuse me, does this train stop at Central Station?",
            pt: "Com licença, este comboio pára na Estação Central?",
          },
          {
            speaker: "Staff",
            text: "No, this is the fast train. Take the next one from platform four.",
            pt: "Não, este é o rápido. Apanhe o próximo na plataforma quatro.",
          },
          {
            speaker: "Tu",
            text: "Thank you! Is there any delay on that line today?",
            pt: "Obrigado! Há algum atraso nessa linha hoje?",
          },
          {
            speaker: "Staff",
            text: "Just five minutes because of rush hour. Have a safe trip!",
            pt: "Apenas cinco minutos por causa da hora de ponta. Boa viagem!",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "quai",
          "aller-retour",
          "aller simple",
          "recharger",
          "correspondance",
          "retard",
          "grève",
          "heure de pointe",
          "en avance",
          "départ",
        ],
        phrases: [
          {
            text: "Bonjour, le train pour Lyon part de quel quai ?",
            pt: "Bom dia, de que plataforma parte o comboio para Lyon?",
            register: "formal",
            whenToUse: "Nas estações SNCF (Gare de Lyon, Gare du Nord, etc.)",
          },
          {
            text: "Où est-ce que je peux recharger mon pass de métro ?",
            pt: "Onde posso recarregar o meu passe de metro?",
            register: "neutro",
            whenToUse: "Ao procurar máquinas ou aplicação Île-de-France Mobilités",
          },
          {
            text: "Attention, il faut changer à Châtelet pour la correspondance.",
            pt: "Atenção, é preciso mudar em Châtelet para fazer transbordo.",
            register: "neutro",
            whenToUse: "Ao orientar-te no metro de Paris, Bruxelas ou Montreal",
          },
          {
            text: "Désolé, mon train a vingt minutes de retard à cause de la grève.",
            pt: "Desculpa, o meu comboio tem vinte minutos de atraso por causa da greve.",
            register: "neutro",
            whenToUse: "Frase realista e indispensável em França!",
          },
          {
            text: "Arrivons dix minutes en avance sur le quai.",
            pt: "Vamos chegar dez minutos adiantados à plataforma.",
            register: "neutro",
            whenToUse: "Nos TGV as portas fecham 2 minutos antes da hora exacta de partida!",
          },
        ],
        culturalTip:
          "Nos comboios TGV em França, o acesso à plataforma fecha 2 minutos antes da partida («accès au train fermé») — chega sempre «en avance» e verifica o número da carruagem («voiture») no painel!",
        situations: [
          {
            id: "fr-tra-1",
            situationPt: "Queres comprar um bilhete de ida e volta para Marselha.",
            register: "formal",
            correct: "Bonjour, je voudrais un aller-retour pour Marseille, s'il vous plaît.",
            options: [
              "Bonjour, je voudrais un aller-retour pour Marseille, s'il vous plaît.",
              "Bonjour, je voudrais un état des lieux pour Marseille.",
              "Un pourboire pour Marseille, s'il vous plaît.",
              "Je prends un verre de quai.",
            ],
            explanationPt: "«Un aller-retour» = ida e volta; «un aller simple» = só ida.",
          },
          {
            id: "fr-tra-2",
            situationPt: "Perguntas a um passageiro se precisas de mudar de linha para chegar à Bastilha.",
            register: "formal",
            correct: "Excusez-moi, il y a une correspondance pour aller à Bastille ?",
            options: [
              "Excusez-moi, il y a une correspondance pour aller à Bastille ?",
              "Excusez-moi, il y a une caution pour Bastille ?",
              "Vous avez une carafe d'eau à Bastille ?",
              "La ligne est sans gluten ?",
            ],
            explanationPt: "«Une correspondance» designa o transbordo entre linhas de metro, autocarro ou comboio.",
          },
          {
            id: "fr-tra-3",
            situationPt: "Avisas a equipa que vais chegar mais tarde porque o metro parou.",
            register: "neutro",
            correct: "Désolé, j'aurai dix minutes de retard, le métro est bloqué.",
            options: [
              "Désolé, j'aurai dix minutes de retard, le métro est bloqué.",
              "Désolé, j'ai dix minutes de loyer.",
              "Mon métro est à emporter.",
              "J'ai fait opposition au train.",
            ],
            explanationPt: "«Avoir X minutes de retard» = estar X minutos atrasado.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Excusez-moi, le train pour Bordeaux part bien du quai six ?",
            pt: "Com licença, o comboio para Bordéus parte mesmo da plataforma seis?",
          },
          {
            speaker: "Agent",
            text: "Non, il a changé : départ quai huit, avec cinq minutes de retard.",
            pt: "Não, mudou: partida na plataforma oito, com cinco minutos de atraso.",
          },
          {
            speaker: "Tu",
            text: "Merci beaucoup ! C'est un train direct sans correspondance ?",
            pt: "Muito obrigado! É um comboio directo sem transbordo?",
          },
          {
            speaker: "Agent",
            text: "Oui, direct en deux heures. Bon voyage !",
            pt: "Sim, directo em duas horas. Boa viagem!",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "ホーム",
          "おうふく",
          "かたみち",
          "チャージ",
          "のりかえ",
          "ちえん",
          "きゅうこう",
          "かくえき",
          "かいさつ",
          "しゅうでん",
        ],
        phrases: [
          {
            text: "すみません、この 電車は 渋谷に とまりますか。",
            pt: "Com licença, este comboio pára em Shibuya?",
            romaji: "Sumimasen, kono densha wa Shibuya ni tomarimasu ka.",
            register: "formal",
            whenToUse: "Antes de entrar num comboio expresso (きゅうこう) que salta estações!",
          },
          {
            text: "Suicaに 二千円 チャージしたいです。",
            pt: "Quero carregar dois mil ienes no cartão Suica.",
            romaji: "Suica ni nisen-en chaaji shitai desu.",
            register: "neutro",
            whenToUse: "Nas máquinas da estação ou loja de conveniência",
          },
          {
            text: "新宿で のりかえです。三番 ホームへ 行きましょう。",
            pt: "Fazemos transbordo em Shinjuku. Vamos para a plataforma número três.",
            romaji: "Shinjuku de norikae desu. Sanban hoomu e ikimashou.",
            register: "neutro",
            whenToUse: "Ao navegar nas grandes estações japonesas",
          },
          {
            text: "電車が ちえんして いたので、少し おくれました。",
            pt: "Como o comboio estava atrasado, cheguei um pouco tarde.",
            romaji: "Densha ga chien shite ita node, sukoshi okuremashita.",
            register: "formal",
            whenToUse: "Nas estações até entregam comprovativo oficial de atraso (遅延証明書)!",
          },
          {
            text: "そろそろ しゅうでんの 時間だから、帰らなきゃ！",
            pt: "Já está quase na hora do último comboio, por isso tenho de ir!",
            romaji: "Sorosoro shuuden no jikan dakara, kaeranakya!",
            register: "informal",
            whenToUse: "Com amigos à noite (por volta da meia-noite)",
          },
        ],
        culturalTip:
          "Armadilha número 1 nas estações japonesas: na mesma plataforma («ホーム») passam comboios locais («かくえき» — param em todas) e expressos («きゅうこう» — saltam várias estações). Confirma sempre no painel antes de entrar!",
        situations: [
          {
            id: "ja-tra-1",
            situationPt: "Combinas encontrar-te com um amigo junto aos torniquetes da estação.",
            register: "neutro",
            correct: "駅の かいさつの 前で 会いましょう。",
            options: [
              "駅の かいさつの 前で 会いましょう。",
              "駅の しききんの 前で 会いましょう。",
              "駅の おかわりの 前で 会いましょう。",
              "駅の りれきしょで 会いましょう。",
            ],
            explanationPt: "«かいさつ» (torniquetes/pórticos) é o ponto de encontro mais clássico no Japão.",
          },
          {
            id: "ja-tra-2",
            situationPt: "Não queres perder o último comboio da noite para voltar ao hotel.",
            register: "formal",
            correct: "しゅうでんは 何時ですか。",
            options: [
              "しゅうでんは 何時ですか。",
              "おひやは 何時ですか。",
              "わりかんは 何時ですか。",
              "れいきんは 何時ですか。",
            ],
            explanationPt: "«しゅうでん» (shuuden) = último comboio da noite.",
          },
          {
            id: "ja-tra-3",
            situationPt: "O teu cartão IC apitou nos torniquetes por falta de saldo.",
            register: "formal",
            correct: "すみません、どこで チャージできますか。",
            options: [
              "すみません、どこで チャージできますか。",
              "すみません、どこで ごちそうさまですか。",
              "どこで ベジタリアンですか。",
              "どこで おじゃましますか。",
            ],
            explanationPt: "Existem máquinas amarelas «のりこし精算機» mesmo antes de sair dos torniquetes para fazer «チャージ»!",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "すみません、東京駅へ 行きたいんですが、この きゅうこうに のっても いいですか。",
            pt: "Com licença, quero ir para a Estação de Tóquio; posso apanhar este expresso?",
            romaji: "Sumimasen, Toukyou-eki e ikitain desu ga, kono kyuukou ni notte mo ii desu ka.",
          },
          {
            speaker: "駅員",
            text: "はい、大丈夫です。でも 次の 駅で 二番 ホームに のりかえてください。",
            pt: "Sim, pode. Mas na próxima estação mude para a plataforma dois.",
            romaji: "Hai, daijoubu desu. Demo tsugi no eki de niban hoomu ni norikaete kudasai.",
          },
          {
            speaker: "Tu",
            text: "ありがとうございます！おうふくの きっぷは ここで 買えますか。",
            pt: "Muito obrigado! Posso comprar bilhete de ida e volta aqui?",
            romaji: "Arigatou gozaimasu! Oufuku no kippu wa koko de kaemasu ka.",
          },
          {
            speaker: "駅員",
            text: "はい、かいさつの となりの きかいで 買えますよ。",
            pt: "Sim, pode comprar na máquina ao lado dos torniquetes.",
            romaji: "Hai, kaisatsu no tonari no kikai de kaemasu yo.",
          },
        ],
      },
    },
  },
  {
    id: "carreira",
    emoji: "💼",
    title: "Entrevista de Emprego, CV & Carreira",
    subtitle: "Apresentar o percurso, pontos fortes, salário, regime híbrido e candidatura",
    tag: "Trabalho",
    color: "var(--color-lilac)",
    softColor: "var(--color-lilac-soft)",
    relatedLevels: [21, 33, 48],
    byLang: {
      en: {
        vocabKeys: [
          "interview",
          "resume",
          "summarize",
          "background",
          "salary",
          "strengths",
          "compromise",
          "appointment",
          "remote work",
          "cover letter",
        ],
        phrases: [
          {
            text: "Thank you for inviting me to the interview today.",
            pt: "Muito obrigado por me convidarem para a entrevista de hoje.",
            register: "formal",
            whenToUse: "Ao cumprimentar o recrutador no início da entrevista",
          },
          {
            text: "My background is in finance, with four years of project experience.",
            pt: "O meu percurso é na área financeira, com quatro anos de experiência em projectos.",
            register: "formal",
            whenToUse: "Ao responder a «Tell me a bit about yourself»",
          },
          {
            text: "One of my main strengths is staying calm under tight deadlines.",
            pt: "Um dos meus principais pontos fortes é manter a calma sob prazos apertados.",
            register: "formal",
            whenToUse: "Ao destacar qualidades com exemplos concretos",
          },
          {
            text: "Does the role offer hybrid or remote work options?",
            pt: "A função oferece opções de regime híbrido ou trabalho remoto?",
            register: "formal",
            whenToUse: "No momento das perguntas finais ao entrevistador",
          },
          {
            text: "Could you share the salary range for this position?",
            pt: "Poderia partilhar o intervalo salarial previsto para esta função?",
            register: "formal",
            whenToUse: "Forma diplomática e profissional de falar de remuneração",
          },
        ],
        culturalTip:
          "Dois falsos amigos perigosos em entrevistas em inglês: «resume» como verbo («rizúm») significa retomar — para «resumir o teu percurso» diz «summarize my background»! E «compromise» significa ceder de parte a parte (não «compromisso na agenda» = «appointment»).",
        situations: [
          {
            id: "en-car-1",
            situationPt: "O recrutador pede para falares sobre a tua formação e experiência anterior.",
            register: "formal",
            correct: "Let me briefly summarize my professional background.",
            options: [
              "Let me briefly summarize my professional background.",
              "Let me pretend my resume at rush hour.",
              "My background is gluten-free and furnished.",
              "I have a police report for my salary.",
            ],
            explanationPt: "«Summarize my professional background» soa estruturado e executivo.",
          },
          {
            id: "en-car-2",
            situationPt: "No final da entrevista perguntam «Do you have any questions for us?» e queres saber sobre teletrabalho.",
            register: "formal",
            correct: "Yes — what is the policy on hybrid or remote work?",
            options: [
              "Yes — what is the policy on hybrid or remote work?",
              "Yes — can we split the bill of the salary?",
              "Where do I top up my cover letter?",
              "Is the landlord attending the interview?",
            ],
            explanationPt: "Perguntar sobre «hybrid or remote work policy» é hoje padrão em entrevistas internacionais.",
          },
          {
            id: "en-car-3",
            situationPt: "Queres explicar uma das tuas melhores qualidades profissionais.",
            register: "formal",
            correct: "One of my key strengths is clear communication across teams.",
            options: [
              "One of my key strengths is clear communication across teams.",
              "One of my tap waters is takeaway.",
              "Actually, I am stolen at work.",
              "I take a rain check on deadlines.",
            ],
            explanationPt: "«One of my key/main strengths is…» responde directamente à pergunta clássica de RH.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Recruiter",
            text: "Welcome! Could you start by telling us about your background?",
            pt: "Bem-vindo! Poderia começar por nos falar do seu percurso?",
          },
          {
            speaker: "Tu",
            text: "Of course. My background is in design, and I currently lead a small product team.",
            pt: "Claro. O meu percurso é em design e actualmente lidero uma pequena equipa de produto.",
          },
          {
            speaker: "Recruiter",
            text: "Great! What would you say are your main strengths?",
            pt: "Excelente! Quais diria que são os seus principais pontos fortes?",
          },
          {
            speaker: "Tu",
            text: "Problem solving and clear communication, especially in remote work.",
            pt: "Resolução de problemas e comunicação clara, especialmente em trabalho remoto.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "entretien",
          "parcours",
          "compétences",
          "salaire",
          "candidature",
          "télétravail",
          "lettre de motivation",
          "cv",
          "stage",
          "boulot",
        ],
        phrases: [
          {
            text: "Bonjour, je vous remercie de me recevoir pour cet entretien.",
            pt: "Bom dia, agradeço-lhe por me receber para esta entrevista.",
            register: "formal",
            whenToUse: "Abertura impecável numa entrevista em França, Bélgica ou Suíça",
          },
          {
            text: "Je vais vous présenter brièvement mon parcours et mes compétences.",
            pt: "Vou apresentar-lhe brevemente o meu percurso e as minhas competências.",
            register: "formal",
            whenToUse: "Ao responder a «Parlez-moi de vous»",
          },
          {
            text: "J'ai envoyé ma candidature avec mon CV et ma lettre de motivation.",
            pt: "Enviei a minha candidatura com o meu CV e carta de motivação.",
            register: "neutro",
            whenToUse: "Processo de recrutamento francófono",
          },
          {
            text: "Est-ce que le poste prévoit deux jours de télétravail par semaine ?",
            pt: "A vaga prevê dois dias de teletrabalho por semana?",
            register: "formal",
            whenToUse: "Ao esclarecer a organização semanal da equipa",
          },
          {
            text: "Franchement, j'adore mon nouveau boulot, l'équipe est super sympa !",
            pt: "Francamente, adoro o meu novo emprego, a equipa é super simpática!",
            register: "informal",
            whenToUse: "Entre amigos («boulot» = emprego/trabalho em registo coloquial)",
          },
        ],
        culturalTip:
          "Em França, a «lettre de motivation» ainda é muito lida e valorizada, e nas entrevistas usa-se sempre «vous» até indicação explícita em contrário — mesmo em startups jovens!",
        situations: [
          {
            id: "fr-car-1",
            situationPt: "Começa a entrevista de emprego e pedem-te para resumires a tua experiência.",
            register: "formal",
            correct: "Je vais vous présenter mon parcours professionnel.",
            options: [
              "Je vais vous présenter mon parcours professionnel.",
              "Je vais faire l'état des lieux de l'addition.",
              "Mon boulot est à emporter sans gluten.",
              "J'ai perdu mon quai au commissariat.",
            ],
            explanationPt: "«Mon parcours professionnel» é a expressão francesa ideal para trajectória de carreira.",
          },
          {
            id: "fr-car-2",
            situationPt: "Queres perguntar ao recrutador qual é a faixa salarial prevista para a função.",
            register: "formal",
            correct: "Quelle est la fourchette de salaire prévue pour ce poste ?",
            options: [
              "Quelle est la fourchette de salaire prévue pour ce poste ?",
              "Quel est le pourboire de la grève ?",
              "Vous prenez la caution sans lactose ?",
              "Où sont les objets trouvés du stage ?",
            ],
            explanationPt: "«La fourchette de salaire» = o intervalo salarial.",
          },
          {
            id: "fr-car-3",
            situationPt: "Contas a um amigo ao café que estás com imenso trabalho esta semana.",
            register: "informal",
            correct: "J'ai énormément de boulot cette semaine !",
            options: [
              "J'ai énormément de boulot cette semaine !",
              "J'ai énormément de fuite d'eau au CV !",
              "Je fais opposition à mes compétences !",
              "Mon aller-retour est végétarien !",
            ],
            explanationPt: "«Avoir beaucoup de boulot» é super natural na conversa informal.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Recruteur",
            text: "Bonjour ! Pouvez-vous nous résumer votre parcours ?",
            pt: "Bom dia! Pode resumir-nos o seu percurso?",
          },
          {
            speaker: "Tu",
            text: "Avec plaisir. Après un stage à Lyon, j'ai travaillé trois ans en gestion de projet.",
            pt: "Com todo o gosto. Depois de um estágio em Lyon, trabalhei três anos em gestão de projectos.",
          },
          {
            speaker: "Recruteur",
            text: "Très bien. Quelles compétences souhaitez-vous apporter à l'équipe ?",
            pt: "Muito bem. Que competências deseja trazer para a equipa?",
          },
          {
            speaker: "Tu",
            text: "L'organisation, l'écoute client et l'habitude du télétravail international.",
            pt: "A organização, a escuta ao cliente e o hábito de teletrabalho internacional.",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "めんせつ",
          "りれきしょ",
          "けいけん",
          "つよみ",
          "きゅうりょう",
          "おうぼ",
          "リモートワーク",
          "働く",
          "おせわになります",
          "しめきり",
        ],
        phrases: [
          {
            text: "本日は めんせつの お時間を いただき、ありがとうございます。",
            pt: "Muito obrigado por me concederem tempo para a entrevista de hoje.",
            romaji: "Honjitsu wa mensetsu no ojikan o itadaki, arigatou gozaimasu.",
            register: "formal",
            whenToUse: "Frase de abertura de ouro numa entrevista no Japão",
          },
          {
            text: "三年間の 仕事の けいけんが あります。",
            pt: "Tenho três anos de experiência profissional.",
            romaji: "Sannenkan no shigoto no keiken ga arimasu.",
            register: "formal",
            whenToUse: "Ao apresentar o currículo (りれきしょ)",
          },
          {
            text: "私の つよみは 新しい ことを 早く 学ぶ ことです。",
            pt: "O meu ponto forte é aprender coisas novas rapidamente.",
            romaji: "Watashi no tsuyomi wa atarashii koto o hayaku manabu koto desu.",
            register: "formal",
            whenToUse: "Ao falar de pontos fortes (自己PR)",
          },
          {
            text: "リモートワークは 週に 何日 できますか。",
            pt: "Quantos dias por semana é possível fazer trabalho remoto?",
            romaji: "Rimootowaaku wa shuu ni nannichi dekimasu ka.",
            register: "formal",
            whenToUse: "Nas perguntas finais ao entrevistador (逆質問)",
          },
          {
            text: "今日から おせわに なります。どうぞ よろしく おねがいします。",
            pt: "A partir de hoje trabalharei convosco. Conto com o vosso apoio!",
            romaji: "Kyou kara osewa ni narimasu. Douzo yoroshiku onegaishimasu.",
            register: "formal",
            whenToUse: "No primeiro dia num novo emprego ou projecto no Japão",
          },
        ],
        culturalTip:
          "Nas entrevistas japonesas, antes de entrar na sala bate-se à porta três vezes, espera-se por «どうぞ» e diz-se «しつれいします» (Com licença). No primeiro dia de trabalho, «今日からおせわになります» conquista toda a equipa!",
        situations: [
          {
            id: "ja-car-1",
            situationPt: "Enviaste o teu currículo por e-mail para concorrer a uma vaga em Tóquio.",
            register: "formal",
            correct: "メールで りれきしょを おくりました。",
            options: [
              "メールで りれきしょを おくりました。",
              "メールで しょほうせんを のみました。",
              "メールで おひやを わりかんしました。",
              "メールで しゅうでんに のりました。",
            ],
            explanationPt: "«りれきしょ» (rirekisho) = currículo (CV).",
          },
          {
            id: "ja-car-2",
            situationPt: "O entrevistador pergunta qual é a tua principal qualidade profissional.",
            register: "formal",
            correct: "私の つよみは チームで 働く ことです。",
            options: [
              "私の つよみは チームで 働く ことです。",
              "私の わすれものは さいふです。",
              "私の やちんは こうねつひです。",
              "私の おかわりは かたみちです。",
            ],
            explanationPt: "«私のつよみは〜ことです» = O meu ponto forte é…",
          },
          {
            id: "ja-car-3",
            situationPt: "É o teu primeiro dia na empresa nova e apresentas-te à equipa.",
            register: "formal",
            correct: "今日から おせわに なります。よろしく おねがいします。",
            options: [
              "今日から おせわに なります。よろしく おねがいします。",
              "ごちそうさまでした！おもちかえりです。",
              "ふくろは だいじょうぶです。",
              "きゅうきゅうしゃを よんでください。",
            ],
            explanationPt: "Saudação profissional essencial ao iniciar qualquer colaboração.",
          },
        ],
        miniDialogue: [
          {
            speaker: "面接官",
            text: "この 仕事に おうぼした りゆうを おしえてください。",
            pt: "Pode dizer-nos o motivo pelo qual se candidatou a esta função?",
            romaji: "Kono shigoto ni oubo shita riyuu o oshiete kudasai.",
          },
          {
            speaker: "Tu",
            text: "これまでの けいけんを いかして、日本の チームで 働きたいからです。",
            pt: "Porque quero aproveitar a minha experiência anterior e trabalhar numa equipa no Japão.",
            romaji: "Kore made no keiken o ikashite, Nihon no chiimu de hatarakitai kara desu.",
          },
          {
            speaker: "面接官",
            text: "なるほど。あなたの つよみは 何ですか。",
            pt: "Compreendo. E qual é o seu ponto forte?",
            romaji: "Naruhodo. Anata no tsuyomi wa nan desu ka.",
          },
          {
            speaker: "Tu",
            text: "しめきりを まもり、ていねいに コミュニケーションを とる ことです。",
            pt: "Cumprir os prazos e comunicar com cuidado e clareza.",
            romaji: "Shimekiri o mamori, teinei ni komyunikeeshon o toru koto desu.",
          },
        ],
      },
    },
  },
  {
    id: "emergencia",
    emoji: "🚨",
    title: "Emergências, Polícia & Perdidos",
    subtitle: "Carteira ou passaporte perdido, esquadra, seguro de viagem e embaixada",
    tag: "Segurança",
    color: "var(--color-coral)",
    softColor: "var(--color-coral-soft)",
    relatedLevels: [9, 32, 46],
    byLang: {
      en: {
        vocabKeys: [
          "emergency",
          "lost property",
          "police report",
          "embassy",
          "wallet",
          "stolen",
          "insurance",
          "passport",
          "ambulance",
          "medical",
        ],
        phrases: [
          {
            text: "Excuse me, I left my bag on the train — where is the lost property office?",
            pt: "Com licença, deixei o meu saco no comboio — onde fica a secção de perdidos e achados?",
            register: "formal",
            whenToUse: "Imediatamente após sair do comboio, metro ou aeroporto",
          },
          {
            text: "My wallet and phone were stolen. I need to file a police report.",
            pt: "A minha carteira e o telemóvel foram furtados. Preciso de fazer uma participação policial.",
            register: "formal",
            whenToUse: "Na esquadra de polícia (indispensável para accionar o seguro!)",
          },
          {
            text: "I've lost my passport and need to contact my embassy urgently.",
            pt: "Perdi o meu passaporte e preciso de contactar a minha embaixada com urgência.",
            register: "formal",
            whenToUse: "Em viagem internacional",
          },
          {
            text: "Does my travel insurance cover emergency medical treatment?",
            pt: "O meu seguro de viagem cobre tratamento médico de urgência?",
            register: "formal",
            whenToUse: "Ao ligar para a linha de assistência do seguro",
          },
          {
            text: "This is an emergency — please call an ambulance right away!",
            pt: "Isto é uma emergência — por favor chame uma ambulância imediatamente!",
            register: "neutro",
            whenToUse: "Números de emergência: 999 (Reino Unido), 911 (EUA/Canadá), 112 (União Europeia)",
          },
        ],
        culturalTip:
          "Guarda estes números: no Reino Unido liga-se 999 (ou 111 para aconselhamento médico não urgente do NHS); nos EUA/Canadá é 911. E para o seguro («travel insurance») reembolsar um furto, pede sempre o número de referência do «police report»!",
        situations: [
          {
            id: "en-eme-1",
            situationPt: "Esqueceste-te da mochila no comboio em Londres e vais falar com o funcionário da estação.",
            register: "formal",
            correct: "Excuse me, where is the lost property office? I left my bag on the train.",
            options: [
              "Excuse me, where is the lost property office? I left my bag on the train.",
              "Where is the takeaway starter? I left my bag.",
              "Can I split the bill with the embassy?",
              "Is my backpack gluten-free?",
            ],
            explanationPt: "No Reino Unido diz-se «lost property» (nos EUA: «lost and found»).",
          },
          {
            id: "en-eme-2",
            situationPt: "Furtaram-te o telemóvel e o seguro pede um documento oficial da polícia.",
            register: "formal",
            correct: "I need a copy of the police report for my insurance.",
            options: [
              "I need a copy of the police report for my insurance.",
              "I need a cover letter for my landlord.",
              "Could I get tap water for my wallet?",
              "Let's take a rain check on my passport.",
            ],
            explanationPt: "«A police report for my insurance» explica exactamente o documento de que precisas.",
          },
          {
            id: "en-eme-3",
            situationPt: "Perdeste o passaporte no estrangeiro e precisas de um documento de viagem provisório.",
            register: "formal",
            correct: "How do I get to the nearest embassy or consulate?",
            options: [
              "How do I get to the nearest embassy or consulate?",
              "How do I top up the rush hour?",
              "Is the factory furnished?",
              "Can I summarize the leak?",
            ],
            explanationPt: "A embaixada («embassy») ou consulado emite documentos de viagem de emergência.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Officer",
            text: "Good afternoon. How can I help you today?",
            pt: "Boa tarde. Como posso ajudá-lo hoje?",
          },
          {
            speaker: "Tu",
            text: "Hello, my wallet was stolen near Central Station an hour ago.",
            pt: "Olá, a minha carteira foi furtada perto da Estação Central há uma hora.",
          },
          {
            speaker: "Officer",
            text: "I'm sorry to hear that. Have you already frozen your bank cards?",
            pt: "Lamento ouvir isso. Já bloqueou os seus cartões bancários?",
          },
          {
            speaker: "Tu",
            text: "Yes, right away. Could I file a police report for my travel insurance?",
            pt: "Sim, logo de seguida. Poderia registar uma participação policial para o meu seguro de viagem?",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "urgence",
          "objets trouvés",
          "commissariat",
          "ambassade",
          "portefeuille",
          "assurance",
          "déclaration",
          "volé",
          "pièce d'identité",
          "passeport",
        ],
        phrases: [
          {
            text: "Excusez-moi, où se trouve le bureau des objets trouvés ?",
            pt: "Com licença, onde fica o gabinete de perdidos e achados?",
            register: "formal",
            whenToUse: "Em estações de comboio, aeroportos ou museus",
          },
          {
            text: "On m'a volé mon portefeuille, je dois aller au commissariat.",
            pt: "Roubaram-me a carteira, tenho de ir à esquadra da polícia.",
            register: "neutro",
            whenToUse: "Note a construção natural francesa: «On m'a volé…»!",
          },
          {
            text: "J'ai perdu mon passeport et ma pièce d'identité.",
            pt: "Perdi o meu passaporte e o meu documento de identificação.",
            register: "formal",
            whenToUse: "Ao explicar a perda na polícia ou no consulado",
          },
          {
            text: "Il me faut une attestation de déclaration pour mon assurance.",
            pt: "Preciso de um comprovativo da participação para o meu seguro.",
            register: "formal",
            whenToUse: "No commissariat após registar perda ou furto",
          },
          {
            text: "C'est une urgence médicale, appelez le quinze ou le cent douze !",
            pt: "É uma urgência médica, liguem para o 15 ou para o 112!",
            register: "neutro",
            whenToUse: "Em França: 15 (SAMU médico), 17 (Polícia), 18 (Bombeiros), 112 (Europeu)",
          },
        ],
        culturalTip:
          "Em francês falado não se diz «Mon téléphone a été volé» (passiva pesada) — toda a gente diz «On m'a volé mon téléphone / mon portefeuille»! E guarda o 112 (funciona em toda a Europa) e o 15 (SAMU médico em França).",
        situations: [
          {
            id: "fr-eme-1",
            situationPt: "Deixaste o casaco no TGV e queres perguntar onde ficam os perdidos e achados na estação.",
            register: "formal",
            correct: "Bonjour, où est le service des objets trouvés, s'il vous plaît ?",
            options: [
              "Bonjour, où est le service des objets trouvés, s'il vous plaît ?",
              "Bonjour, où est la lettre de motivation du quai ?",
              "Vous avez une carafe d'objets à emporter ?",
              "Je voudrais résilier mon manteau.",
            ],
            explanationPt: "«Les objets trouvés» = perdidos e achados.",
          },
          {
            id: "fr-eme-2",
            situationPt: "Tiraram-te a carteira no metro e vais à esquadra apresentar queixa.",
            register: "formal",
            correct: "Bonjour, on m'a volé mon portefeuille dans le métro.",
            options: [
              "Bonjour, on m'a volé mon portefeuille dans le métro.",
              "Bonjour, mon portefeuille est charges comprises.",
              "J'ai un entretien d'embauche avec mon portefeuille.",
              "Ça marche, prenons un verre au commissariat !",
            ],
            explanationPt: "«On m'a volé…» é a estrutura idiomática exacta para relatar um furto.",
          },
          {
            id: "fr-eme-3",
            situationPt: "Precisas de ajuda consular urgente por teres ficado sem passaporte.",
            register: "formal",
            correct: "Je dois contacter mon ambassade de toute urgence.",
            options: [
              "Je dois contacter mon ambassade de toute urgence.",
              "Je dois recharger mon pourboire d'urgence.",
              "Mon ambassade est sans lactose.",
              "Je fais l'état des lieux du passeport.",
            ],
            explanationPt: "«De toute urgence» = com a máxima urgência.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Agent",
            text: "Bonjour, que puis-je faire pour vous au commissariat ?",
            pt: "Bom dia, em que posso ajudá-lo na esquadra?",
          },
          {
            speaker: "Tu",
            text: "Bonjour, j'ai perdu mon portefeuille avec ma pièce d'identité ce matin.",
            pt: "Bom dia, perdi a minha carteira com o meu documento de identificação esta manhã.",
          },
          {
            speaker: "Agent",
            text: "Avez-vous déjà fait opposition sur vos cartes bancaires ?",
            pt: "Já bloqueou os seus cartões bancários?",
          },
          {
            speaker: "Tu",
            text: "Oui, tout de suite. Il me faudrait un récépissé pour mon assurance.",
            pt: "Sim, imediatamente. Precisava de um comprovativo para o meu seguro.",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "きんきゅう",
          "こうばん",
          "わすれもの",
          "たいしかん",
          "さいふ",
          "ほけん",
          "たすけて",
          "きゅうきゅうしゃ",
          "旅行",
          "パスポート",
        ],
        phrases: [
          {
            text: "すみません、電車に わすれものを して しまいました。",
            pt: "Com licença, acabei por deixar um objecto esquecido no comboio.",
            romaji: "Sumimasen, densha ni wasuremono o shite shimaimashita.",
            register: "formal",
            whenToUse: "No balcão da estação — no Japão a taxa de recuperação de objectos é altíssima!",
          },
          {
            text: "さいふを なくして しまいました。近くに こうばんは ありますか。",
            pt: "Perdi a minha carteira. Há algum posto policial (Koban) aqui perto?",
            romaji: "Saifu o nakushite shimaimashita. Chikaku ni kouban wa arimasu ka.",
            register: "formal",
            whenToUse: "Na rua ou junto à estação — muitas carteiras já estão entregues no Koban!",
          },
          {
            text: "パスポートを なくしたので、たいしかんに 電話したいです。",
            pt: "Como perdi o passaporte, quero telefonar para a embaixada.",
            romaji: "Pasupooto o nakushita node, taishikan ni denwa shitai desu.",
            register: "formal",
            whenToUse: "Ao pedir apoio no hotel ou posto policial",
          },
          {
            text: "旅行の ほけんに 入っています。",
            pt: "Tenho seguro de viagem activo.",
            romaji: "Ryokou no hoken ni haitte imasu.",
            register: "formal",
            whenToUse: "Numa clínica ou hospital («ほけんに入る» = ter/subscrever seguro!)",
          },
          {
            text: "きんきゅうです！きゅうきゅうしゃを よんでください！",
            pt: "É uma emergência! Chame uma ambulância, por favor!",
            romaji: "Kinkyuu desu! Kyuukyuusha o yonde kudasai!",
            register: "neutro",
            whenToUse: "No Japão: 119 (ambulância e bombeiros) e 110 (polícia)!",
          },
        ],
        culturalTip:
          "Números vitais no Japão: 110 para a Polícia e 119 para Ambulância/Bombeiros! Se perderes a carteira («さいふ») ou telemóvel, vai logo ao «こうばん» (posto policial de bairro) ou à estação — a maioria dos objectos perdidos no Japão aparece intacta!",
        situations: [
          {
            id: "ja-eme-1",
            situationPt: "Deixaste o guarda-chuva ou mochila na carruagem do metro e falas com o funcionário.",
            register: "formal",
            correct: "すみません、電車に わすれものを しました。",
            options: [
              "すみません、電車に わすれものを しました。",
              "すみません、電車で わりかんを しました。",
              "電車に りれきしょを のみました。",
              "電車は ごちそうさまでした。",
            ],
            explanationPt: "Indica a linha, a hora e a carruagem — os funcionários ligam na hora para a estação seguinte!",
          },
          {
            id: "ja-eme-2",
            situationPt: "Não encontras a tua carteira e queres ir ao posto policial junto à estação.",
            register: "formal",
            correct: "すみません、一番 近い こうばんは どこですか。",
            options: [
              "すみません、一番 近い こうばんは どこですか。",
              "すみません、一番 近い おひやは どこですか。",
              "一番 近い しききんは どこですか。",
              "一番 近い つよみは どこですか。",
            ],
            explanationPt: "«こうばん» (Koban) é o pequeno posto policial de proximidade.",
          },
          {
            id: "ja-eme-3",
            situationPt: "Alguém desmaiou na rua e precisas que chamem socorro médico imediato.",
            register: "neutro",
            correct: "たすけてください！きゅうきゅうしゃを よんでください！",
            options: [
              "たすけてください！きゅうきゅうしゃを よんでください！",
              "おじゃまします！おかわりを ください！",
              "ふくろは だいじょうぶです！",
              "リモートワークを おねがいします！",
            ],
            explanationPt: "«きゅうきゅうしゃをよんでください» (Chame uma ambulância!) é a frase de emergência mais importante.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "すみません、さっき カフェで さいふを なくして しまいました。",
            pt: "Com licença, há pouco perdi a minha carteira num café.",
            romaji: "Sumimasen, sakki kafe de saifu o nakushite shimaimashita.",
          },
          {
            speaker: "けいさつかん",
            text: "どんな さいふですか。中に パスポートは 入っていましたか。",
            pt: "Como é a carteira? Tinha o passaporte lá dentro?",
            romaji: "Donna saifu desu ka. Naka ni pasupooto wa haitte imashita ka.",
          },
          {
            speaker: "Tu",
            text: "黒い さいふです。パスポートは ホテルに あります。",
            pt: "É uma carteira preta. O passaporte está no hotel.",
            romaji: "Kuroi saifu desu. Pasupooto wa hoteru ni arimasu.",
          },
          {
            speaker: "けいさつかん",
            text: "分かりました。とどいたら、すぐ スマホに 電話しますね。",
            pt: "Entendido. Assim que for entregue, ligamos logo para o seu telemóvel.",
            romaji: "Wakarimashita. Todoitara, sugu sumaho ni denwa shimasu ne.",
          },
        ],
      },
    },
  },
  {
    id: "social",
    emoji: "🤝",
    title: "Vida Social, Convites & Amizades",
    subtitle: "Marcar encontros, pôr a conversa em dia, agradecer e adiar sem constrangimento",
    tag: "Social",
    color: "var(--color-teal)",
    softColor: "var(--color-teal-soft)",
    relatedLevels: [1, 25, 37],
    byLang: {
      en: {
        vocabKeys: [
          "catch up",
          "rain check",
          "no worries",
          "sounds good",
          "makes sense",
          "friendly",
          "sympathetic",
          "appointment",
          "in advance",
          "actually",
        ],
        phrases: [
          {
            text: "It's been ages! Let's grab a coffee and catch up this week.",
            pt: "Há quanto tempo! Vamos tomar um café e pôr a conversa em dia esta semana.",
            register: "informal",
            whenToUse: "Ao reencontrar um amigo ou colega de quem gostas",
          },
          {
            text: "Are you free on Friday evening, or do you already have plans?",
            pt: "Estás livre na sexta à noite ou já tens planos?",
            register: "neutro",
            whenToUse: "Para convidar alguém sem criar pressão",
          },
          {
            text: "I'm swamped tonight — can I take a rain check and do next Tuesday?",
            pt: "Estou cheio de trabalho hoje — podemos adiar e combinar para a próxima terça?",
            register: "informal",
            whenToUse: "A melhor forma nativa de adiar um convite mantendo todo o entusiasmo!",
          },
          {
            text: "No worries at all! Get some rest and let me know when you're free.",
            pt: "Sem problema nenhum! Descansa e diz-me quando estiveres livre.",
            register: "informal",
            whenToUse: "Quando um amigo pede desculpa por cancelar ou chegar tarde",
          },
          {
            text: "Thanks so much for having us — everyone was so friendly!",
            pt: "Muito obrigado por nos receberes — toda a gente foi tão simpática!",
            register: "neutro",
            whenToUse: "Mensagem simpática depois de um jantar em casa de amigos",
          },
        ],
        culturalTip:
          "Cuidado com «I have a compromise tonight» (erro clássico de lusófonos!): em inglês diz-se «I have plans tonight» ou «I have an appointment». E para elogiar um anfitrião simpático usa «friendly / welcoming», não «sympathetic»!",
        situations: [
          {
            id: "en-soc-1",
            situationPt: "Encontraste uma antiga colega de curso e queres combinar um café para conversar.",
            register: "informal",
            correct: "We should definitely grab a coffee and catch up soon!",
            options: [
              "We should definitely grab a coffee and catch up soon!",
              "We should file a police report and commute soon!",
              "Let's top up our landlord soon!",
              "Can we summarize our utilities?",
            ],
            explanationPt: "«Grab a coffee and catch up» é o convite social mais natural em inglês.",
          },
          {
            id: "en-soc-2",
            situationPt: "Convidaram-te para jantar hoje, mas surgiu um imprevisto e queres deixar para a semana que vem.",
            register: "informal",
            correct: "So sorry, could I take a rain check? How about next Thursday?",
            options: [
              "So sorry, could I take a rain check? How about next Thursday?",
              "So sorry, I pretend a compromise tonight.",
              "Actually, give me a return ticket for dinner.",
              "Is Thursday dairy-free?",
            ],
            explanationPt: "«Take a rain check» mostra imediatamente que queres mesmo ir noutra data.",
          },
          {
            id: "en-soc-3",
            situationPt: "O teu amigo pede mil desculpas por se ter atrasado cinco minutos.",
            register: "informal",
            correct: "No worries at all, I just got here myself!",
            options: [
              "No worries at all, I just got here myself!",
              "Nothing to declare at customs!",
              "Your wallet is faulty!",
              "Please attach your cover letter!",
            ],
            explanationPt: "«No worries (at all)!» deixa qualquer conversa leve e descontraída.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Maya",
            text: "Hey! Long time no see — are you free to catch up after work today?",
            pt: "Olá! Há quanto tempo — estás livre para pôr a conversa em dia hoje depois do trabalho?",
          },
          {
            speaker: "Tu",
            text: "I'd love to, but I have a dentist appointment at six. Can I take a rain check?",
            pt: "Adorava, mas tenho consulta no dentista às seis. Podemos deixar para outro dia?",
          },
          {
            speaker: "Maya",
            text: "No worries at all! How does Saturday morning sound?",
            pt: "Sem problema nenhum! Que tal sábado de manhã?",
          },
          {
            speaker: "Tu",
            text: "Saturday works great — I know a really friendly café near the park!",
            pt: "Sábado dá perfeitamente — conheço um café super acolhedor perto do parque!",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "prendre un verre",
          "ça marche",
          "pas de souci",
          "du coup",
          "sympa",
          "se tenir au courant",
          "remettre ça",
          "à bientôt",
          "en avance",
          "boulot",
        ],
        phrases: [
          {
            text: "Ça te dit d'aller prendre un verre jeudi après le boulot ?",
            pt: "Apetece-te ir tomar um copo na quinta-feira depois do trabalho?",
            register: "informal",
            whenToUse: "«Ça te dit de + infinitivo ?» é o convite mais natural entre amigos!",
          },
          {
            text: "Carrément ! Dix-neuf heures devant le métro, ça marche pour toi ?",
            pt: "Com certeza! Dezanove horas em frente ao metro, dá para ti?",
            register: "informal",
            whenToUse: "Ao confirmar hora e ponto de encontro",
          },
          {
            text: "Je suis vraiment désolé pour ce soir, on peut remettre ça à la semaine prochaine ?",
            pt: "Peço mesmo desculpa por hoje à noite, podemos adiar para a próxima semana?",
            register: "neutro",
            whenToUse: "Para remarcar um encontro sem soar frio",
          },
          {
            text: "Merci pour la soirée, tes amis sont vraiment super sympas !",
            pt: "Obrigado pelo serão, os teus amigos são mesmo super simpáticos!",
            register: "informal",
            whenToUse: "Ao agradecer depois de um jantar ou festa",
          },
          {
            text: "On se tient au courant demain ! À bientôt !",
            pt: "Vamos dando notícias amanhã! Até breve!",
            register: "neutro",
            whenToUse: "Despedida calorosa e muito frequente no dia-a-dia",
          },
        ],
        culturalTip:
          "Quando fores convidado para jantar em casa de alguém em França, nunca chegues «en avance» (chegar 10–15 minutos depois da hora marcada — o famoso «quart d'heure de politesse» — dá tempo ao anfitrião para terminar os preparativos) e leva uma garrafa ou sobremesa!",
        situations: [
          {
            id: "fr-soc-1",
            situationPt: "Queres convidar um colega próximo para tomar algo ao fim da tarde.",
            register: "informal",
            correct: "Ça te dit d'aller prendre un verre après le boulot ?",
            options: [
              "Ça te dit d'aller prendre un verre après le boulot ?",
              "Ça te dit de faire l'état des lieux au commissariat ?",
              "On fait opposition après le boulot ?",
              "Tu veux résilier un verre ?",
            ],
            explanationPt: "«Prendre un verre» usa-se mesmo que bebas sumo, café ou chá!",
          },
          {
            id: "fr-soc-2",
            situationPt: "A tua amiga sugere encontrarem-se sábado às 16h e o horário é perfeito para ti.",
            register: "informal",
            correct: "Parfait, ça marche pour moi !",
            options: [
              "Parfait, ça marche pour moi !",
              "Parfait, c'est en panne pour moi !",
              "Charges comprises pour moi !",
              "Rien à déclarer pour samedi !",
            ],
            explanationPt: "«Ça marche !» = Combinado! / Funciona perfeitamente!",
          },
          {
            id: "fr-soc-3",
            situationPt: "Não vais conseguir ir hoje ao cinema, mas queres propor sexta-feira.",
            register: "neutro",
            correct: "Désolé pour ce soir, on peut remettre ça à vendredi ?",
            options: [
              "Désolé pour ce soir, on peut remettre ça à vendredi ?",
              "Désolé, j'ai perdu mon ambassade vendredi.",
              "Une carafe d'eau à vendredi ?",
              "Mon aller-retour est allergique.",
            ],
            explanationPt: "«Remettre ça à [dia]» = adiar/remarcar o plano para outro dia.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Chloé",
            text: "Salut ! Ça te dit d'aller prendre un verre ce soir après le boulot ?",
            pt: "Olá! Apetece-te ir tomar algo hoje à noite depois do trabalho?",
          },
          {
            speaker: "Tu",
            text: "Ah mince, ce soir je finis tard… On peut remettre ça à demain ?",
            pt: "Ah poxa, hoje acabo tarde… Podemos deixar para amanhã?",
          },
          {
            speaker: "Chloé",
            text: "Oui, bien sûr ! Demain à dix-neuf heures, ça marche ?",
            pt: "Sim, claro! Amanhã às dezanove horas, combinado?",
          },
          {
            speaker: "Tu",
            text: "Ça marche ! Je connais un petit café très sympa dans le quartier.",
            pt: "Combinado! Conheço um pequeno café muito simpático no bairro.",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "ひさしぶり",
          "たのしみ",
          "おじゃまします",
          "またこんど",
          "ざんねん",
          "もちろん",
          "きをつけて",
          "今週末",
          "やっぱり",
          "なるほど",
        ],
        phrases: [
          {
            text: "おひさしぶりです！さいきん どうですか。",
            pt: "Há quanto tempo! Como têm corrido as coisas ultimamente?",
            romaji: "Ohisashiburi desu! Saikin dou desu ka.",
            register: "formal",
            whenToUse: "Ao reencontrar colegas ou conhecidos (com amigos íntimos: «ひさしぶり！»)",
          },
          {
            text: "よかったら、今週末 いっしょに ごはんを 食べませんか。",
            pt: "Se lhe der jeito, gostaria de jantar comigo este fim-de-semana?",
            romaji: "Yokattara, konshuumatsu issho ni gohan o tabemasen ka.",
            register: "formal",
            whenToUse: "Usar «〜ませんか» + «よかったら» faz o convite soar super gentil!",
          },
          {
            text: "いいですね！日曜日が とても たのしみです！",
            pt: "Que boa ideia! Estou mesmo entusiasmado por domingo!",
            romaji: "Ii desu ne! Nichiyoubi ga totemo tanoshimi desu!",
            register: "neutro",
            whenToUse: "Para aceitar um convite mostrando alegria genuína",
          },
          {
            text: "おじゃまします！わあ、すてきな へやですね。",
            pt: "Com licença por entrar! Uau, que casa tão bonita.",
            romaji: "Ojamashimasu! Waa, suteki na heya desu ne.",
            register: "formal",
            whenToUse: "No exacto momento em que entras em casa de um amigo no Japão",
          },
          {
            text: "今日は ありがとう！気をつけて 帰ってね。",
            pt: "Obrigado pelo dia de hoje! Volta para casa com cuidado.",
            romaji: "Kyou wa arigatou! Ki o tsukete kaette ne.",
            register: "informal",
            whenToUse: "Despedida carinhosa à noite na estação",
          },
        ],
        culturalTip:
          "Ao visitar a casa de alguém no Japão, diz sempre «おじゃまします» ao entrar, tira os sapatos no degrau da entrada («げんかん») virando-os para a porta, e leva uma pequena lembrança docinha («おみやげ»)!",
        situations: [
          {
            id: "ja-soc-1",
            situationPt: "Entras pela primeira vez no apartamento de um colega japonês que te convidou para jantar.",
            register: "formal",
            correct: "おじゃまします！",
            options: [
              "おじゃまします！",
              "ごちそうさまでした！",
              "おかいけいを おねがいします！",
              "チャージを おねがいします！",
            ],
            explanationPt: "«おじゃまします» diz-se sempre ao cruzar a entrada da casa de outra pessoa.",
          },
          {
            id: "ja-soc-2",
            situationPt: "Um amigo não pode vir hoje ao jantar e queres dizer «Que pena! Fica para uma próxima vez!»",
            register: "neutro",
            correct: "ざんねんですね！またこんど 行きましょう。",
            options: [
              "ざんねんですね！またこんど 行きましょう。",
              "きゅうきゅうしゃですね！こうばんへ 行きましょう。",
              "れいきんですね！しゅうりしましょう。",
              "りれきしょですね！おうぼしましょう。",
            ],
            explanationPt: "«ざんねん» (que pena) + «またこんど» (numa próxima vez) mostra carinho e compreensão.",
          },
          {
            id: "ja-soc-3",
            situationPt: "Despedes-te de uma amiga à noite junto à estação enquanto chove.",
            register: "informal",
            correct: "きをつけて 帰ってね！またね！",
            options: [
              "きをつけて 帰ってね！またね！",
              "わすれものを してね！",
              "しききんを はらってね！",
              "ミュートに なってね！",
            ],
            explanationPt: "«きをつけて帰ってね» é a despedida mais calorosa e natural entre amigos.",
          },
        ],
        miniDialogue: [
          {
            speaker: "けんた",
            text: "ひさしぶり！金曜日の 夜、みんなで ごはんに 行かない？",
            pt: "Há quanto tempo! Sexta à noite queres ir jantar connosco?",
            romaji: "Hisashiburi! Kinyoubi no yoru, minna de gohan ni ikanai?",
          },
          {
            speaker: "Tu",
            text: "もちろん！すごく たのしみ！何時に どこで 会う？",
            pt: "Claro! Que entusiasmo! A que horas e onde nos encontramos?",
            romaji: "Mochiron! Sugoku tanoshimi! Nanji ni doko de au?",
          },
          {
            speaker: "けんた",
            text: "七時に 渋谷駅の かいさつで どう？",
            pt: "Que tal às sete nos torniquetes da estação de Shibuya?",
            romaji: "Shichiji ni Shibuya-eki no kaisatsu de dou?",
          },
          {
            speaker: "Tu",
            text: "いいね！じゃあ 金曜日にね。きをつけてね！",
            pt: "Óptimo! Até sexta, então. Vai com cuidado!",
            romaji: "Ii ne! Jaa kinyoubi ni ne. Ki o tsukete ne!",
          },
        ],
      },
    },
  },
  {
    id: "hotel",
    emoji: "🏨",
    title: "Hotel, Alojamento & Check-in",
    subtitle: "Recepção, pequeno-almoço, problemas no quarto e guardar malas",
    tag: "Viagens",
    color: "var(--color-teal)",
    softColor: "var(--color-teal-soft)",
    relatedLevels: [31, 28, 7],
    byLang: {
      en: {
        vocabKeys: [
          "reservation",
          "check-in",
          "check-out",
          "front desk",
          "key card",
          "single room",
          "double room",
          "towel",
          "air conditioning",
          "luggage storage",
        ],
        phrases: [
          {
            text: "Hello, I have a reservation under Silva for three nights.",
            pt: "Olá, tenho uma reserva em nome de Silva por três noites.",
            register: "formal",
            whenToUse: "Ao chegar à recepção do hotel para o check-in",
          },
          {
            text: "What time is breakfast, and is it included?",
            pt: "A que horas é o pequeno-almoço e está incluído?",
            register: "neutro",
            whenToUse: "Para confirmar horários e condições da estadia",
          },
          {
            text: "Sorry, my key card isn't working and the air conditioning is noisy.",
            pt: "Desculpe, o meu cartão-chave não funciona e o ar condicionado faz barulho.",
            register: "formal",
            whenToUse: "Se houver algum problema técnico no quarto",
          },
          {
            text: "Could we get two fresh towels and an extra pillow, please?",
            pt: "Podíamos pedir duas toalhas limpas e uma almofada extra, por favor?",
            register: "formal",
            whenToUse: "Ao ligar para a recepção ou falar com a equipa de limpeza",
          },
          {
            text: "Can we leave our bags in luggage storage after check-out?",
            pt: "Podemos deixar as malas no guarda-bagagens depois do check-out?",
            register: "neutro",
            whenToUse: "No último dia quando o voo ou comboio é mais tarde",
          },
        ],
        culturalTip:
          "Nos hotéis britânicos e americanos, «double room» tem UMA cama de casal; se viajas com um amigo ou colega e querem duas camas separadas, pede sempre «a twin room»!",
        situations: [
          {
            id: "en-hot-1",
            situationPt: "Já fizeste check-out às 11h, mas o teu voo é só à noite e queres passear sem as malas.",
            register: "neutro",
            correct: "Could we leave our bags in luggage storage until five?",
            options: [
              "Could we leave our bags in luggage storage until five?",
              "Give me a single room for my customs.",
              "My key card is included in breakfast.",
              "Where is the self-checkout trolley?",
            ],
            explanationPt: "«Luggage storage» (ou «left luggage») é o serviço gratuito de guarda de malas na recepção.",
          },
          {
            id: "en-hot-2",
            situationPt: "Subiste ao quarto e o cartão magnético não abre a porta.",
            register: "formal",
            correct: "Excuse me, my key card isn't working on the door.",
            options: [
              "Excuse me, my key card isn't working on the door.",
              "My boarding pass is on mute.",
              "I'd like to cancel my towel.",
              "Nothing to declare at the front desk.",
            ],
            explanationPt: "«My key card isn't working» explica o problema claramente na recepção («front desk»).",
          },
          {
            id: "en-hot-3",
            situationPt: "Queres reservar um quarto para duas pessoas, mas com duas camas individuais separadas.",
            register: "formal",
            correct: "Could we switch to a twin room, please?",
            options: [
              "Could we switch to a twin room, please?",
              "We want two double rooms for one person.",
              "Is the pillow pet-friendly?",
              "Can I have a return ticket for the bed?",
            ],
            explanationPt: "«Twin room» = duas camas individuais; «double room» = uma cama de casal.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Reception",
            text: "Welcome! Checking in? May I see your passport, please?",
            pt: "Bem-vindo! Vem fazer o check-in? Posso ver o seu passaporte, por favor?",
          },
          {
            speaker: "Tu",
            text: "Yes, here you go. I booked a double room for two nights.",
            pt: "Sim, aqui tem. Reservei um quarto duplo por duas noites.",
          },
          {
            speaker: "Reception",
            text: "Here is your key card for room four. Breakfast is from seven to ten.",
            pt: "Aqui está o cartão-chave do quarto quatro. O pequeno-almoço é das sete às dez.",
          },
          {
            speaker: "Tu",
            text: "Thank you! Do you also have luggage storage after check-out?",
            pt: "Obrigado! Também têm guarda-bagagens depois do check-out?",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "réservation",
          "réception",
          "chambre double",
          "petit-déjeuner",
          "serviette",
          "climatisation",
          "clé",
          "consigne",
          "ascenseur",
          "complet",
        ],
        phrases: [
          {
            text: "Bonjour, j'ai une réservation au nom de Costa pour deux nuits.",
            pt: "Bom dia, tenho uma reserva em nome de Costa por duas noites.",
            register: "formal",
            whenToUse: "Ao chegar à recepção do hotel",
          },
          {
            text: "Est-ce que le petit-déjeuner est inclus et servi jusqu'à dix heures ?",
            pt: "O pequeno-almoço está incluído e é servido até às dez horas?",
            register: "neutro",
            whenToUse: "Para confirmar o horário do pequeno-almoço",
          },
          {
            text: "Excusez-moi, la climatisation ne marche pas dans ma chambre.",
            pt: "Com licença, o ar condicionado não funciona no meu quarto.",
            register: "formal",
            whenToUse: "Para reportar uma avaria no quarto",
          },
          {
            text: "Pourrais-je avoir deux serviettes propres et un oreiller, s'il vous plaît ?",
            pt: "Poderia ter duas toalhas limpas e uma almofada, por favor?",
            register: "formal",
            whenToUse: "Ao pedir roupa de banho ou cama adicional",
          },
          {
            text: "Puis-je laisser mes bagages à la consigne de l'hôtel cet après-midi ?",
            pt: "Posso deixar as minhas malas no guarda-bagagens do hotel esta tarde?",
            register: "formal",
            whenToUse: "Antes do check-in ou depois de entregar o quarto",
          },
        ],
        culturalTip:
          "Em França, lembra-te de que o «rez-de-chaussée» corresponde ao rés-do-chão e o «premier étage» já é o 1.º andar acima! E atenção: «serviette» significa toalha no hotel, mas guardanapo no restaurante.",
        situations: [
          {
            id: "fr-hot-1",
            situationPt: "Chegas ao hotel em Lyon e queres anunciar a tua reserva na recepção.",
            register: "formal",
            correct: "Bonjour, j'ai une réservation au nom de Costa pour trois nuits.",
            options: [
              "Bonjour, j'ai une réservation au nom de Costa pour trois nuits.",
              "Salut, donne-moi une clé complète.",
              "Où est la caisse automatique du petit-déjeuner ?",
              "Je n'ai rien à déclarer dans l'ascenseur.",
            ],
            explanationPt: "«Bonjour, j'ai une réservation au nom de…» é a fórmula natural e educada.",
          },
          {
            id: "fr-hot-2",
            situationPt: "Entregaste o quarto de manhã, mas queres guardar a mala no hotel até à tarde.",
            register: "formal",
            correct: "Puis-je laisser ma valise à la consigne jusqu'à dix-sept heures ?",
            options: [
              "Puis-je laisser ma valise à la consigne jusqu'à dix-sept heures ?",
              "Ma valise prend le petit-déjeuner à dix heures.",
              "La climatisation est en promotion.",
              "Voici mon titre de séjour pour la serviette.",
            ],
            explanationPt: "«La consigne (à bagages)» designa a sala onde o hotel guarda as malas dos hóspedes.",
          },
          {
            id: "fr-hot-3",
            situationPt: "Queres saber onde fica o elevador para subir com as malas.",
            register: "neutro",
            correct: "Pardon, où se trouve l'ascenseur, s'il vous plaît ?",
            options: [
              "Pardon, où se trouve l'ascenseur, s'il vous plaît ?",
              "L'hôtel est complet dans le couloir ?",
              "Je voudrais couper les pointes de la clé.",
              "Quel est le montant de la douane ?",
            ],
            explanationPt: "«Où se trouve l'ascenseur ?» é simples e natural.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Réception",
            text: "Bonjour et bienvenue ! Vous avez une réservation ?",
            pt: "Bom dia e bem-vindo! Tem uma reserva?",
          },
          {
            speaker: "Tu",
            text: "Bonjour, oui, une chambre double au nom de Costa.",
            pt: "Bom dia, sim, um quarto duplo em nome de Costa.",
          },
          {
            speaker: "Réception",
            text: "Voici votre clé. Le petit-déjeuner est servi à partir de sept heures, et l'ascenseur est à droite.",
            pt: "Aqui está a sua chave. O pequeno-almoço é servido a partir das sete horas e o elevador fica à direita.",
          },
          {
            speaker: "Tu",
            text: "Parfait, merci ! Puis-je laisser ma valise à la consigne demain matin ?",
            pt: "Perfeito, obrigado! Posso deixar a minha mala no guarda-bagagens amanhã de manhã?",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "よやく",
          "チェックイン",
          "チェックアウト",
          "フロント",
          "へや",
          "かぎ",
          "タオル",
          "エアコン",
          "エレベーター",
          "あさごはん",
        ],
        phrases: [
          {
            text: "すみません|、|チェックイン|を|おねがいします|。",
            pt: "Com licença, gostaria de fazer o check-in, por favor.",
            romaji: "Sumimasen, chekkuin o onegaishimasu.",
            register: "formal",
            whenToUse: "Ao chegar ao balcão (フロント) do hotel ou ryokan",
          },
          {
            text: "あさごはん|は|ついていますか|。|何時|から|ですか|。",
            pt: "O pequeno-almoço está incluído? A partir de que horas é?",
            romaji: "Asagohan wa tsuite imasu ka. Nanji kara desu ka.",
            register: "formal",
            whenToUse: "Para confirmar se a tarifa inclui pequeno-almoço e o horário",
          },
          {
            text: "すみません|、|へや|の|エアコン|が|うごきません|。",
            pt: "Desculpe, o ar condicionado do quarto não funciona.",
            romaji: "Sumimasen, heya no eakon ga ugokimasen.",
            register: "formal",
            whenToUse: "Se precisares de assistência técnica no quarto",
          },
          {
            text: "新しい|タオル|を|二枚|もらえますか|。",
            pt: "Poderia dar-me duas toalhas limpas?",
            romaji: "Atarashii taoru o nimai moraemasu ka.",
            register: "formal",
            whenToUse: "Para pedir toalhas adicionais na recepção",
          },
          {
            text: "チェックイン|の|前|に|にもつ|を|あずけて|も|いい|ですか|。",
            pt: "Posso deixar a bagagem guardada antes do check-in?",
            romaji: "Chekkuin no mae ni nimotsu o azukete mo ii desu ka.",
            register: "formal",
            whenToUse: "Quando chegas cedo à cidade e o quarto só abre às 15h",
          },
        ],
        culturalTip:
          "Nos hotéis japoneses, o check-in às 15h00 é cumprido ao minuto, mas quase todos guardam as malas gratuitamente («にもつをあずける»). Nos ryokan tradicionais, tira SEMPRE os sapatos à entrada!",
        situations: [
          {
            id: "ja-hot-1",
            situationPt: "Chegaste ao hotel às 11h da manhã e queres deixar a mala na recepção antes do check-in.",
            register: "formal",
            correct: "すみません、にもつを あずけても いいですか。",
            options: [
              "すみません、にもつを あずけても いいですか。",
              "あさごはんは うりきれですか。",
              "エレベーターを 二枚 ください。",
              "へやの しょうみきげんは いつですか。",
            ],
            explanationPt: "«にもつをあずけてもいいですか» (Posso deixar a bagagem guardada?) usa-se em qualquer hotel no Japão.",
          },
          {
            id: "ja-hot-2",
            situationPt: "A chave ou cartão do teu quarto não está a abrir a porta.",
            register: "formal",
            correct: "すみません、へやの かぎが あきません。",
            options: [
              "すみません、へやの かぎが あきません。",
              "フロントで 肉と 魚を 買いました。",
              "タオルに サインを おねがいします。",
              "チェックアウトは おつかれさまです。",
            ],
            explanationPt: "«かぎがあきません» significa literalmente «a chave/fechadura não abre».",
          },
          {
            id: "ja-hot-3",
            situationPt: "Queres saber a que horas tens de entregar o quarto amanhã.",
            register: "formal",
            correct: "明日の チェックアウトは 何時ですか。",
            options: [
              "明日の チェックアウトは 何時ですか。",
              "きのうの レジは いくらですか。",
              "ざいりゅうカードに のれますか。",
              "びよういんで あさごはんを 食べます。",
            ],
            explanationPt: "«明日のチェックアウトは何時ですか» pergunta a hora limite de saída.",
          },
        ],
        miniDialogue: [
          {
            speaker: "フロント",
            text: "いらっしゃいませ|。|チェックイン|ですか|。|パスポート|を|おねがいします|。",
            pt: "Bem-vindo! Vem fazer o check-in? O passaporte, por favor.",
            romaji: "Irasshaimase. Chekkuin desu ka. Pasupooto o onegaishimasu.",
          },
          {
            speaker: "Tu",
            text: "はい|、|よやく|した|マテウス|です|。|あさごはん|は|ついていますか|。",
            pt: "Sim, tenho reserva em nome de Mateus. O pequeno-almoço está incluído?",
            romaji: "Hai, yoyaku shita Mateusu desu. Asagohan wa tsuite imasu ka.",
          },
          {
            speaker: "フロント",
            text: "はい|、|七時|から|です|。|こちら|が|へや|の|かぎ|です|。",
            pt: "Sim, é a partir das sete horas. Aqui tem a chave do quarto.",
            romaji: "Hai, shichiji kara desu. Kochira ga heya no kagi desu.",
          },
          {
            speaker: "Tu",
            text: "ありがとうございます|。|エレベーター|は|どちら|ですか|。",
            pt: "Muito obrigado. Para que lado fica o elevador?",
            romaji: "Arigatou gozaimasu. Erebeetaa wa dochira desu ka.",
          },
        ],
      },
    },
  },
  {
    id: "supermercado",
    emoji: "🛒",
    title: "Supermercado, Feira & Compras",
    subtitle: "Corredores, frescos ao peso, prazos de validade, sacos e caixa automática",
    tag: "Dia-a-dia",
    color: "var(--color-coral)",
    softColor: "var(--color-coral-soft)",
    relatedLevels: [13, 21, 5],
    byLang: {
      en: {
        vocabKeys: [
          "aisle",
          "trolley",
          "basket",
          "expiry date",
          "self-checkout",
          "carrier bag",
          "loyalty card",
          "on sale",
          "organic",
          "bakery",
        ],
        phrases: [
          {
            text: "Excuse me, which aisle is the pasta and olive oil in?",
            pt: "Com licença, em que corredor estão a massa e o azeite?",
            register: "neutro",
            whenToUse: "Para encontrar rapidamente um produto no supermercado",
          },
          {
            text: "Could I have six slices of ham from the counter, please?",
            pt: "Podia dar-me seis fatias de fiambre do balcão, por favor?",
            register: "formal",
            whenToUse: "Na charcutaria, talho ou queijaria",
          },
          {
            text: "Let's check the expiry date on the dairy products.",
            pt: "Vamos verificar a data de validade nos lacticínios.",
            register: "informal",
            whenToUse: "Ao fazer compras do dia-a-dia em família ou com colegas",
          },
          {
            text: "No carrier bag needed, thanks — I brought my own.",
            pt: "Não preciso de saco, obrigado — trouxe o meu.",
            register: "neutro",
            whenToUse: "Quando o caixa pergunta se queres saco de plástico/papel",
          },
          {
            text: "Excuse me, the self-checkout screen says assistance needed.",
            pt: "Com licença, o ecrã da caixa automática pede assistência.",
            register: "formal",
            whenToUse: "O clássico aviso «Unexpected item in bagging area»!",
          },
        ],
        culturalTip:
          "No Reino Unido e EUA, repara na diferença nos rótulos: «Use by» é um limite de segurança alimentar (carne, peixe, leite fresco), enquanto «Best before» indica apenas qualidade ideal!",
        situations: [
          {
            id: "en-sup-1",
            situationPt: "Não encontras o café no supermercado e queres perguntar em que corredor está.",
            register: "neutro",
            correct: "Excuse me, which aisle is the coffee in?",
            options: [
              "Excuse me, which aisle is the coffee in?",
              "Where is the coffee layover?",
              "Is the coffee on mute today?",
              "Can I renew my basket here?",
            ],
            explanationPt: "«Which aisle is … in?» (pronuncia-se «áil») é a pergunta mais útil num supermercado.",
          },
          {
            id: "en-sup-2",
            situationPt: "Na caixa perguntam «Do you need a bag?» mas tu já trouxeste mochila.",
            register: "neutro",
            correct: "No thanks, I brought my own bag.",
            options: [
              "No thanks, I brought my own bag.",
              "Nothing to declare in my trolley.",
              "Yes, give me the loyalty card fee.",
              "The expiry date is sold out.",
            ],
            explanationPt: "Nos supermercados os sacos («carrier bags») são pagos à parte; «I brought my own» é a resposta natural.",
          },
          {
            id: "en-sup-3",
            situationPt: "Queres saber se os morangos biológicos estão com desconto hoje.",
            register: "neutro",
            correct: "Are these organic strawberries on sale today?",
            options: [
              "Are these organic strawberries on sale today?",
              "Are these strawberries for lease?",
              "Do strawberries have a boarding pass?",
              "Can I check out my room at the bakery?",
            ],
            explanationPt: "«On sale» significa em promoção / com desconto.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Excuse me, where can I find the organic milk and fresh bread?",
            pt: "Com licença, onde posso encontrar o leite biológico e o pão fresco?",
          },
          {
            speaker: "Staff",
            text: "The bakery is at the back, and dairy is in aisle three!",
            pt: "A padaria fica ao fundo e os lacticínios estão no corredor três!",
          },
          {
            speaker: "Cashier",
            text: "Hi there! Do you have a loyalty card, or need a carrier bag?",
            pt: "Olá! Tem cartão de cliente ou precisa de saco de compras?",
          },
          {
            speaker: "Tu",
            text: "No carrier bag, thanks. Can I pay contactless here?",
            pt: "Sem saco, obrigado. Posso pagar por aproximação aqui?",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "rayon",
          "panier",
          "caddie",
          "date de péremption",
          "caisse automatique",
          "sac réutilisable",
          "carte de fidélité",
          "promotion",
          "en vrac",
          "bio",
        ],
        phrases: [
          {
            text: "Excusez-moi, dans quel rayon se trouve l'huile d'olive ?",
            pt: "Com licença, em que corredor fica o azeite?",
            register: "formal",
            whenToUse: "Para pedir ajuda a um funcionário da loja",
          },
          {
            text: "Bonjour, je voudrais quatre tranches de jambon, s'il vous plaît.",
            pt: "Bom dia, queria quatro fatias de fiambre, por favor.",
            register: "formal",
            whenToUse: "No balcão de charcutaria ou mercado",
          },
          {
            text: "N'oublie pas de peser les fruits bio avant de passer en caisse !",
            pt: "Não te esqueças de pesar a fruta biológica antes de ir para a caixa!",
            register: "informal",
            whenToUse: "Muitos supermercados em França exigem pesar e colar etiqueta na secção da fruta",
          },
          {
            text: "Merci, j'ai déjà mon sac réutilisable.",
            pt: "Obrigado, já tenho o meu saco reutilizável.",
            register: "neutro",
            whenToUse: "No momento de pagar na caixa",
          },
          {
            text: "Avez-vous la carte de fidélité ? Ces articles sont en promotion.",
            pt: "Tem o cartão de fidelidade? Estes artigos estão em promoção.",
            register: "formal",
            whenToUse: "Pergunta típica que vais ouvir do operador de caixa",
          },
        ],
        culturalTip:
          "Em muitos supermercados franceses, tens de pesar tu próprio a fruta e os legumes na balança do corredor («peser») para imprimir a etiqueta antes da caixa — caso contrário terás de voltar atrás!",
        situations: [
          {
            id: "fr-sup-1",
            situationPt: "Procuras a secção de produtos biológicos num supermercado em Paris.",
            register: "formal",
            correct: "Bonjour, où se trouve le rayon bio, s'il vous plaît ?",
            options: [
              "Bonjour, où se trouve le rayon bio, s'il vous plaît ?",
              "Où est le quai de péremption ?",
              "Je voudrais louer un caddie meublé.",
              "Avez-vous une ordonnance en vrac ?",
            ],
            explanationPt: "«Le rayon…» designa o corredor ou secção específica do supermercado.",
          },
          {
            id: "fr-sup-2",
            situationPt: "Tens apenas três artigos e queres pagar depressa sem fila.",
            register: "informal",
            correct: "On passe à la caisse automatique, c'est plus rapide !",
            options: [
              "On passe à la caisse automatique, c'est plus rapide !",
              "On va à la préfecture avec le panier !",
              "Je laisse le jambon à la consigne !",
              "La date de péremption est complète !",
            ],
            explanationPt: "«La caisse automatique» é a caixa de pagamento rápido self-service.",
          },
          {
            id: "fr-sup-3",
            situationPt: "Na caixa perguntam se precisas de saco, mas tu trouxeste o teu.",
            register: "neutro",
            correct: "Non merci, j'ai mon sac réutilisable.",
            options: [
              "Non merci, j'ai mon sac réutilisable.",
              "Oui, donnez-moi une tranche de caddie.",
              "Je n'ai pas de billet de train.",
              "Voici mon état des lieux.",
            ],
            explanationPt: "Em França os sacos descartáveis foram abolidos; levar um «sac réutilisable» (ou «cabas») é hábito diário.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Bonjour, excusez-moi, où se trouve le rayon des légumes bio ?",
            pt: "Bom dia, desculpe, onde fica o corredor dos legumes biológicos?",
          },
          {
            speaker: "Employé",
            text: "Tout au fond à gauche ! Pensez à les peser avant la caisse.",
            pt: "Lá ao fundo à esquerda! Lembre-se de os pesar antes da caixa.",
          },
          {
            speaker: "Caissière",
            text: "Bonjour ! Vous avez la carte de fidélité du magasin ?",
            pt: "Bom dia! Tem o cartão de cliente da loja?",
          },
          {
            speaker: "Tu",
            text: "Non, pas encore. J'ai mon sac réutilisable et je règle par carte.",
            pt: "Não, ainda não. Tenho o meu saco reutilizável e pago com cartão.",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "スーパー",
          "うりば",
          "かご",
          "レジ",
          "セルフレジ",
          "ふくろ",
          "しょうみきげん",
          "わりびき",
          "ポイントカード",
          "しんせん",
        ],
        phrases: [
          {
            text: "すみません|、|水|と|お茶|の|うりば|は|どこ|ですか|。",
            pt: "Com licença, onde fica a secção de água e chá?",
            romaji: "Sumimasen, mizu to ocha no uriba wa doko desu ka.",
            register: "formal",
            whenToUse: "Para perguntar por qualquer produto num supermercado ou loja",
          },
          {
            text: "レジ|ふくろ|を|一枚|おねがいします|。",
            pt: "Queria um saco de compras, por favor.",
            romaji: "Reji fukuro o ichimai onegaishimasu.",
            register: "formal",
            whenToUse: "Os sacos custam 3 a 5 ienes no Japão e tens de os pedir",
          },
          {
            text: "ポイントカード|は|もっていません|。|カード|で|はらいます|。",
            pt: "Não tenho cartão de pontos. Vou pagar com cartão.",
            romaji: "Pointokaado wa motte imasen. Kaado de haraimasu.",
            register: "formal",
            whenToUse: "Resposta indispensável — perguntam SEMPRE pelo cartão de pontos na caixa!",
          },
          {
            text: "夜|八時|から|おべんとう|が|わりびき|に|なります|ね|。",
            pt: "A partir das oito da noite as marmitas ficam com desconto, não é?",
            romaji: "Yoru hachiji kara obentou ga waribiki ni narimasu ne.",
            register: "neutro",
            whenToUse: "Para aproveitar os famosos autocolantes de desconto nocturno nos supermercados japoneses",
          },
          {
            text: "この|魚|は|しんせん|です|ね|。|しょうみきげん|は|明日|まで|です|。",
            pt: "Este peixe está fresco! O prazo de validade é até amanhã.",
            romaji: "Kono sakana wa shinsen desu ne. Shoumikigen wa ashita made desu.",
            register: "neutro",
            whenToUse: "Ao verificar a frescura e a etiqueta de validade",
          },
        ],
        culturalTip:
          "Nos supermercados e コンビニ japoneses vais ouvir sempre duas perguntas rápidas na caixa: «ポイントカードはおもちですか» (Tem cartão de pontos?) e «ふくろはご利用ですか» (Precisa de saco?). Depois de pagar, embalaste tu mesmo as compras numa bancada à parte!",
        situations: [
          {
            id: "ja-sup-1",
            situationPt: "Na caixa do supermercado perguntam: «ポイントカードはおもちですか». Não tens cartão de pontos.",
            register: "formal",
            correct: "いいえ、もっていません。",
            options: [
              "いいえ、もっていません。",
              "はい、うりきれです。",
              "しょうみきげんを ください。",
              "エレベーターで はらいます。",
            ],
            explanationPt: "«いいえ、もっていません» (Não, não tenho) ou um simples «大丈夫です» resolve a pergunta instantaneamente.",
          },
          {
            id: "ja-sup-2",
            situationPt: "Esqueceste-te da mochila e precisas de comprar um saco de plástico na caixa.",
            register: "formal",
            correct: "すみません、ふくろを 一枚 おねがいします。",
            options: [
              "すみません、ふくろを 一枚 おねがいします。",
              "かごを 一枚 食べます。",
              "セルフレジを あたためてください。",
              "わりびきの へやは どこですか。",
            ],
            explanationPt: "Sacos contam-se com «枚» (まい — objectos planos): «ふくろを一枚おねがいします».",
          },
          {
            id: "ja-sup-3",
            situationPt: "Não encontras a secção da carne e do peixe no supermercado.",
            register: "formal",
            correct: "すみません、肉と 魚の うりばは どこですか。",
            options: [
              "すみません、肉と 魚の うりばは どこですか。",
              "肉と 魚の しめきりは いつですか。",
              "この レジは しんせんですか。",
              "ポイントカードに のりかえます。",
            ],
            explanationPt: "«〜のうりばはどこですか» serve para encontrar qualquer corredor ou secção.",
          },
        ],
        miniDialogue: [
          {
            speaker: "店員",
            text: "いらっしゃいませ|！|ポイントカード|は|おもちですか|。",
            pt: "Bem-vindo! Tem cartão de pontos?",
            romaji: "Irasshaimase! Pointokaado wa omochi desu ka.",
          },
          {
            speaker: "Tu",
            text: "いいえ|、|もっていません|。|ふくろ|を|一枚|ください|。",
            pt: "Não, não tenho. Dê-me um saco, por favor.",
            romaji: "Iie, motte imasen. Fukuro o ichimai kudasai.",
          },
          {
            speaker: "店員",
            text: "かしこまりました|。|おべんとう|は|わりびき|で|五百円|です|。",
            pt: "Com certeza. A marmita com desconto fica por quinhentos ienes.",
            romaji: "Kashikomarimashita. Obentou wa waribiki de gohyaku-en desu.",
          },
          {
            speaker: "Tu",
            text: "ありがとうございます|。|Suica|は|つかえますか|。",
            pt: "Muito obrigado. Posso pagar com o cartão Suica?",
            romaji: "Arigatou gozaimasu. Suika wa tsukaemasu ka.",
          },
        ],
      },
    },
  },
  {
    id: "burocracia",
    emoji: "🏛️",
    title: "Vistos, Registo & Serviços Públicos",
    subtitle: "Autorização de residência, comprovativo de morada, formulários e atendimento",
    tag: "Burocracia",
    color: "var(--color-lilac)",
    softColor: "var(--color-lilac-soft)",
    relatedLevels: [53, 34, 3],
    byLang: {
      en: {
        vocabKeys: [
          "residence permit",
          "proof of address",
          "application form",
          "appointment",
          "signature",
          "tax number",
          "town hall",
          "id card",
          "renew",
          "visa",
        ],
        phrases: [
          {
            text: "Good morning, I have an appointment at ten to renew my residence permit.",
            pt: "Bom dia, tenho marcação às dez para renovar a minha autorização de residência.",
            register: "formal",
            whenToUse: "À chegada aos serviços de imigração ou câmara municipal",
          },
          {
            text: "Does a bank statement or lease count as proof of address?",
            pt: "Um extracto bancário ou contrato de arrendamento serve como comprovativo de morada?",
            register: "formal",
            whenToUse: "Ao reunir documentos para abrir conta, registar morada ou obter número fiscal",
          },
          {
            text: "I've filled in the application form — where do you need my signature?",
            pt: "Já preenchi o formulário — onde é necessária a minha assinatura?",
            register: "formal",
            whenToUse: "Ao entregar impressos num balcão público",
          },
          {
            text: "How do I apply for a tax number so I can start working?",
            pt: "Como peço um número fiscal para poder começar a trabalhar?",
            register: "neutro",
            whenToUse: "Para tratar do National Insurance Number (UK) ou SSN/TIN",
          },
          {
            text: "Do you need the original documents, or is a copy enough?",
            pt: "Precisa dos documentos originais ou basta uma cópia?",
            register: "neutro",
            whenToUse: "Antes de entregar passaporte, diplomas ou certidões",
          },
        ],
        culturalTip:
          "No Reino Unido não existe Bilhete de Identidade obrigatório para cidadãos locais — por isso pedem sempre DOIS documentos separados: identidade («passport / ID card») + comprovativo de morada («proof of address», como contrato ou conta da luz)!",
        situations: [
          {
            id: "en-bur-1",
            situationPt: "Estás na câmara municipal e queres saber se o teu contrato de arrendamento serve para comprovar onde moras.",
            register: "formal",
            correct: "Does my lease contract count as proof of address?",
            options: [
              "Does my lease contract count as proof of address?",
              "Can I check in my visa at the cloakroom?",
              "Is my tax number on sale today?",
              "Give me a signature without luggage.",
            ],
            explanationPt: "«Count as proof of address» é a expressão exacta usada por bancos e serviços públicos.",
          },
          {
            id: "en-bur-2",
            situationPt: "O teu visto de trabalho termina em breve e precisas de marcar a renovação.",
            register: "formal",
            correct: "I'd like to book an appointment to renew my visa.",
            options: [
              "I'd like to book an appointment to renew my visa.",
              "I pretend to cancel my passport.",
              "Where is the town hall self-checkout?",
              "My ID card has a twenty-minute layover.",
            ],
            explanationPt: "«Book an appointment to renew…» é claro, formal e directo.",
          },
          {
            id: "en-bur-3",
            situationPt: "Já preencheste o impresso todo e queres confirmar onde assinar e carimbar.",
            register: "formal",
            correct: "Where should I put my signature on the application form?",
            options: [
              "Where should I put my signature on the application form?",
              "Where is the expiry date of the barber?",
              "Can you stamp my carrier bag?",
              "Is the embassy subtitled?",
            ],
            explanationPt: "«Application form» (impresso/requerimento) e «signature» (assinatura) são termos-chave.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Officer",
            text: "Good morning. How can I help you at the town hall today?",
            pt: "Bom dia. Como posso ajudá-lo hoje na câmara municipal?",
          },
          {
            speaker: "Tu",
            text: "Hello, I have an appointment to register my address and apply for a tax number.",
            pt: "Olá, tenho marcação para registar a morada e pedir o número fiscal.",
          },
          {
            speaker: "Officer",
            text: "Great. May I see your passport, application form and proof of address?",
            pt: "Óptimo. Posso ver o passaporte, o formulário e o comprovativo de morada?",
          },
          {
            speaker: "Tu",
            text: "Here are the documents and a copy. Where do you need my signature?",
            pt: "Aqui estão os documentos e uma cópia. Onde precisa da minha assinatura?",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "titre de séjour",
          "justificatif de domicile",
          "formulaire",
          "mairie",
          "préfecture",
          "rendez-vous",
          "signature",
          "pièce d'identité",
          "renouveler",
          "dossier",
        ],
        phrases: [
          {
            text: "Bonjour, j'ai rendez-vous à la préfecture pour renouveler mon titre de séjour.",
            pt: "Bom dia, tenho marcação na prefeitura para renovar o meu título de residência.",
            register: "formal",
            whenToUse: "Ao apresentar-se na segurança ou balcão da Préfecture",
          },
          {
            text: "Quels documents acceptez-vous comme justificatif de domicile ?",
            pt: "Que documentos aceitam como comprovativo de morada?",
            register: "formal",
            whenToUse: "Em França exige-se geralmente factura de luz/gás/internet com menos de 3 meses!",
          },
          {
            text: "J'ai apporté les originaux ainsi qu'une copie de ma pièce d'identité.",
            pt: "Trouxe os originais bem como uma cópia do meu documento de identificação.",
            register: "formal",
            whenToUse: "Regra de ouro da administração francesa: leva SEMPRE original + fotocópia!",
          },
          {
            text: "Pourriez-vous m'aider à remplir et signer ce formulaire, s'il vous plaît ?",
            pt: "Poderia ajudar-me a preencher e assinar este formulário, por favor?",
            register: "formal",
            whenToUse: "Se tiveres dúvida num campo administrativo (ex.: CAF, Ameli, Mairie)",
          },
          {
            text: "Est-ce que mon dossier est complet maintenant ?",
            pt: "O meu processo está completo agora?",
            register: "formal",
            whenToUse: "Antes de sair do balcão para evitar ter de voltar noutra semana",
          },
        ],
        culturalTip:
          "Na administração francesa («Mairie», «Préfecture», «CAF»), a palavra mágica é «dossier complet»: leva sempre os originais («les originaux»), fotocópias e um «justificatif de domicile» com menos de 3 meses!",
        situations: [
          {
            id: "fr-bur-1",
            situationPt: "Entregas todos os papéis na prefeitura e queres confirmar se não falta nenhum documento no processo.",
            register: "formal",
            correct: "Excusez-moi, est-ce que mon dossier est complet ?",
            options: [
              "Excusez-moi, est-ce que mon dossier est complet ?",
              "Est-ce que la mairie est en vrac ?",
              "Je voudrais couper mon titre de séjour.",
              "Voici ma carte de fidélité pour la douane.",
            ],
            explanationPt: "«Un dossier complet» significa um processo com todos os comprovativos exigidos.",
          },
          {
            id: "fr-bur-2",
            situationPt: "Pedem-te um comprovativo de morada recente e queres saber se a factura da electricidade serve.",
            register: "formal",
            correct: "Une facture sert-elle de justificatif de domicile ?",
            options: [
              "Une facture sert-elle de justificatif de domicile ?",
              "Où est le vestiaire de la préfecture ?",
              "Mon passeport est en VOSTFR.",
              "Puis-je peser ce formulaire ?",
            ],
            explanationPt: "«Justificatif de domicile» é um dos termos mais importantes para viver em França ou na Bélgica.",
          },
          {
            id: "fr-bur-3",
            situationPt: "O teu título de residência caduca em dois meses e precisas de o renovar.",
            register: "formal",
            correct: "Je souhaiterais prendre rendez-vous pour renouveler mon titre de séjour.",
            options: [
              "Je souhaiterais prendre rendez-vous pour renouveler mon titre de séjour.",
              "Salut, change ma pièce d'identité tout de suite.",
              "J'ai laissé ma signature à la consigne.",
              "Le formulaire a vingt minutes de grève.",
            ],
            explanationPt: "«Je souhaiterais prendre rendez-vous pour renouveler…» tem o nível exacto de cortesia administrativa.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Guichet",
            text: "Bonjour ! Avez-vous votre convocation ou un rendez-vous ?",
            pt: "Bom dia! Tem a sua convocatória ou marcação?",
          },
          {
            speaker: "Tu",
            text: "Bonjour, oui, je viens renouveler mon titre de séjour. Voici mon dossier.",
            pt: "Bom dia, sim, venho renovar o meu título de residência. Aqui está o meu processo.",
          },
          {
            speaker: "Guichet",
            text: "Merci. J'ai besoin d'une pièce d'identité et d'un justificatif de domicile.",
            pt: "Obrigado. Preciso de um documento de identificação e de um comprovativo de morada.",
          },
          {
            speaker: "Tu",
            text: "Voici les originaux et une copie. Où dois-je mettre ma signature sur le formulaire ?",
            pt: "Aqui estão os originais e uma cópia. Onde devo pôr a minha assinatura no formulário?",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "しやくしょ",
          "ざいりゅうカード",
          "じゅうしょ",
          "てつづき",
          "しんせいしょ",
          "サイン",
          "まどぐち",
          "みぶんしょう",
          "こうしん",
          "はんこ",
        ],
        phrases: [
          {
            text: "すみません|、|新しい|じゅうしょ|の|とうろく|に|きました|。",
            pt: "Com licença, vim fazer o registo da minha nova morada.",
            romaji: "Sumimasen, atarashii juusho no touroku ni kimashita.",
            register: "formal",
            whenToUse: "Obrigatório na câmara (市役所) nos primeiros 14 dias após mudar de casa no Japão!",
          },
          {
            text: "ビザ|の|こうしん|の|てつづき|は|何番|の|まどぐち|ですか|。",
            pt: "Em que número de balcão se trata da renovação do visto?",
            romaji: "Biza no koushin no tetsuzuki wa nanban no madoguchi desu ka.",
            register: "formal",
            whenToUse: "Ao chegar à imigração ou câmara municipal cheia de balcões numerados",
          },
          {
            text: "はんこ|を|もっていません|。|サイン|でも|大丈夫|ですか|。",
            pt: "Não tenho carimbo pessoal. Posso assinar à mão?",
            romaji: "Hanko o motte imasen. Sain demo daijoubu desu ka.",
            register: "formal",
            whenToUse: "Frase salvadora para estrangeiros em bancos, câmaras e contratos no Japão!",
          },
          {
            text: "はい|、|パスポート|と|ざいりゅうカード|は|こちら|です|。",
            pt: "Sim, aqui estão o passaporte e o cartão de residência.",
            romaji: "Hai, pasupooto to zairyuu kaado wa kochira desu.",
            register: "formal",
            whenToUse: "Ao apresentar identificação oficial",
          },
          {
            text: "この|しんせいしょ|の|書きかた|を|おしえて|いただけますか|。",
            pt: "Poderia explicar-me como preencher este formulário, por favor?",
            romaji: "Kono shinseisho no kakikata o oshiete itadakemasu ka.",
            register: "formal",
            whenToUse: "Quando o impresso está todo em kanji administrativos",
          },
        ],
        culturalTip:
          "Quem vai estudar ou trabalhar no Japão tem de ir à câmara municipal («しやくしょ») nos primeiros 14 dias registar a morada nas costas do «ざいりゅうカード» (cartão de residência) e inscrever-se no seguro nacional de saúde!",
        situations: [
          {
            id: "ja-bur-1",
            situationPt: "No balcão pedem-te carimbo japonês («はんこ»), mas és estrangeiro e só tens caneta para assinar.",
            register: "formal",
            correct: "すみません、はんこが ないので サインでも 大丈夫ですか。",
            options: [
              "すみません、はんこが ないので サインでも 大丈夫ですか。",
              "ざいりゅうカードを あたためてください。",
              "まどぐちは うりきれです。",
              "しんせいしょを 二枚 食べます。",
            ],
            explanationPt: "«サインでも大丈夫ですか» (Posso assinar?) é aceite hoje na grande maioria das repartições japonesas.",
          },
          {
            id: "ja-bur-2",
            situationPt: "Mudaste de apartamento e vais à câmara municipal registar o novo endereço.",
            register: "formal",
            correct: "ひっこしの じゅうしょの てつづきを おねがいします。",
            options: [
              "ひっこしの じゅうしょの てつづきを おねがいします。",
              "しやくしょの あさごはんは 何時ですか。",
              "ポイントカードの こうしんは どこですか。",
              "みぶんしょうで 映画を 見ます。",
            ],
            explanationPt: "«じゅうしょのてつづき» refere-se ao trâmite de registo/alteração de morada.",
          },
          {
            id: "ja-bur-3",
            situationPt: "Não sabes qual dos balcões atende o teu pedido.",
            register: "formal",
            correct: "すみません、何番の まどぐちへ 行けば いいですか。",
            options: [
              "すみません、何番の まどぐちへ 行けば いいですか。",
              "何番の ロッカーに すんでいますか。",
              "しんせいしょの わりびきは ありますか。",
              "はんこは しんせんですか。",
            ],
            explanationPt: "Nos serviços públicos japoneses tudo funciona por números de balcão («何番のまどぐち»).",
          },
        ],
        miniDialogue: [
          {
            speaker: "係員",
            text: "こんにちは|。|今日|は|どのような|てつづき|ですか|。",
            pt: "Bom dia. De que procedimento vem tratar hoje?",
            romaji: "Konnichiwa. Kyou wa dono you na tetsuzuki desu ka.",
          },
          {
            speaker: "Tu",
            text: "新しい|じゅうしょ|の|とうろく|に|きました|。|ざいりゅうカード|は|こちら|です|。",
            pt: "Vim registar a minha nova morada. Aqui está o cartão de residência.",
            romaji: "Atarashii juusho no touroku ni kimashita. Zairyuu kaado wa kochira desu.",
          },
          {
            speaker: "係員",
            text: "ありがとうございます|。|この|しんせいしょ|に|名前|と|じゅうしょ|を|書いてください|。",
            pt: "Obrigado. Escreva o nome e a morada neste formulário, por favor.",
            romaji: "Arigatou gozaimasu. Kono shinseisho ni namae to juusho o kaite kudasai.",
          },
          {
            speaker: "Tu",
            text: "分かりました|。|はんこ|が|ない|ので|、|サイン|でも|大丈夫|ですか|。",
            pt: "Compreendi. Como não tenho carimbo, posso assinar?",
            romaji: "Wakarimashita. Hanko ga nai node, sain demo daijoubu desu ka.",
          },
        ],
      },
    },
  },
  {
    id: "bem-estar",
    emoji: "🏋️",
    title: "Ginásio, Cabeleireiro & Bem-Estar",
    subtitle: "Inscrição no ginásio, aulas experimentais, corte de cabelo, dentista e óptica",
    tag: "Bem-estar",
    color: "var(--color-yellow)",
    softColor: "var(--color-yellow-soft)",
    relatedLevels: [52, 16, 9],
    byLang: {
      en: {
        vocabKeys: [
          "gym",
          "membership",
          "trial class",
          "locker",
          "workout",
          "haircut",
          "trim",
          "barber",
          "dentist",
          "glasses",
        ],
        phrases: [
          {
            text: "Hi, do you offer a free trial class before signing up for a membership?",
            pt: "Olá, oferecem uma aula experimental gratuita antes de fazer a inscrição?",
            register: "neutro",
            whenToUse: "Ao visitar um ginásio, estúdio de ioga ou clube desportivo",
          },
          {
            text: "Where is the changing room, and do I need a coin for the locker?",
            pt: "Onde fica o balneário e preciso de moeda para o cacifo?",
            register: "neutro",
            whenToUse: "No primeiro treino num ginásio ou piscina",
          },
          {
            text: "Just a trim on the ends, please — not too short on the sides.",
            pt: "Só aparar as pontas, por favor — não demasiado curto dos lados.",
            register: "neutro",
            whenToUse: "Frase essencial no cabeleireiro ou barbeiro para evitar surpresas!",
          },
          {
            text: "Hello, I'd like to book a check-up with the dentist next week.",
            pt: "Olá, gostaria de marcar uma consulta de rotina no dentista na próxima semana.",
            register: "formal",
            whenToUse: "Ao ligar ou ir a uma clínica dentária",
          },
          {
            text: "Excuse me, could you adjust my glasses? They feel a bit loose.",
            pt: "Com licença, podia ajustar os meus óculos? Estão um pouco largos.",
            register: "formal",
            whenToUse: "Numa óptica (geralmente fazem este ajuste gratuitamente)",
          },
        ],
        culturalTip:
          "No cabeleireiro em países anglófonos, «haircut» pode significar mudar bastante o comprimento; se queres apenas manter o corte e tirar as pontas, diz sempre «just a trim, please»!",
        situations: [
          {
            id: "en-wel-1",
            situationPt: "Estás no cabeleireiro e queres apenas tirar as pontas estragadas sem encurtar muito.",
            register: "neutro",
            correct: "Just a trim on the ends, please.",
            options: [
              "Just a trim on the ends, please.",
              "Cancel my membership on the sides.",
              "Give me a double room haircut.",
              "Put my glasses in the self-checkout.",
            ],
            explanationPt: "«Just a trim» deixa claro que queres apenas aparar ligeiramente.",
          },
          {
            id: "en-wel-2",
            situationPt: "Queres experimentar um ginásio do bairro antes de pagar a mensalidade.",
            register: "neutro",
            correct: "Can I book a trial class before getting a membership?",
            options: [
              "Can I book a trial class before getting a membership?",
              "Do you have luggage storage for my dentist?",
              "Is this locker subtitled?",
              "Where is the barber's boarding pass?",
            ],
            explanationPt: "«Trial class» (aula experimental) e «membership» (mensalidade/inscrição) são o par perfeito aqui.",
          },
          {
            id: "en-wel-3",
            situationPt: "Chegaste ao ginásio com mochila e queres saber onde a guardar.",
            register: "neutro",
            correct: "Can I use any empty locker in the changing room?",
            options: [
              "Can I use any empty locker in the changing room?",
              "Can I leave my workout at customs?",
              "Is the dentist on sale in aisle four?",
              "Where do I sign the towel?",
            ],
            explanationPt: "«Locker» (cacifo) e «changing room» (balneário — UK; «locker room» — US).",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Hi! I'd like to ask about your monthly gym membership.",
            pt: "Olá! Gostaria de perguntar sobre a mensalidade do ginásio.",
          },
          {
            speaker: "Trainer",
            text: "Sure! You can cancel anytime, and your first trial class is free.",
            pt: "Claro! Pode cancelar quando quiser e a primeira aula experimental é gratuita.",
          },
          {
            speaker: "Tu",
            text: "Sounds good! Do I need to bring my own towel and lock for the locker?",
            pt: "Parece-me bem! Preciso de trazer a minha própria toalha e cadeado para o cacifo?",
          },
          {
            speaker: "Trainer",
            text: "Towels are included — just bring clean shoes for your workout!",
            pt: "As toalhas estão incluídas — traga apenas ténis limpos para o treino!",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "salle de sport",
          "abonnement",
          "séance d'essai",
          "casier",
          "entraînement",
          "coiffeur",
          "couper les pointes",
          "dentiste",
          "lunettes",
          "massage",
        ],
        phrases: [
          {
            text: "Bonjour, proposez-vous un abonnement mensuel sans engagement ?",
            pt: "Bom dia, têm uma subscrição mensal sem fidelização?",
            register: "formal",
            whenToUse: "Muito importante em França — muitos ginásios têm fidelização anual («engagement 12 mois»)",
          },
          {
            text: "Est-ce que je peux faire une séance d'essai aujourd'hui ?",
            pt: "Posso fazer uma aula experimental hoje?",
            register: "neutro",
            whenToUse: "Ao visitar uma «salle de sport» ou estúdio",
          },
          {
            text: "Bonjour, je voudrais juste couper les pointes, pas trop court.",
            pt: "Bom dia, queria só cortar as pontas, não demasiado curto.",
            register: "formal",
            whenToUse: "Ao explicar o corte no cabeleireiro («chez le coiffeur»)",
          },
          {
            text: "J'ai mal à une dent, auriez-vous un créneau chez le dentiste ?",
            pt: "Dói-me um dente, teriam uma vaga no dentista?",
            register: "formal",
            whenToUse: "Ao marcar consulta urgente ou na plataforma Doctolib",
          },
          {
            text: "Excusez-moi, pourriez-vous ajuster mes lunettes, s'il vous plaît ?",
            pt: "Com licença, poderia ajustar os meus óculos, por favor?",
            register: "formal",
            whenToUse: "Numa óptica («chez l'opticien»)",
          },
        ],
        culturalTip:
          "Em França, verifica sempre se a mensalidade do ginásio é «sans engagement» (sem período de fidelização) — caso contrário ficarás vinculado por 12 meses! Para consultas médicas e dentista, toda a gente marca pela app «Doctolib».",
        situations: [
          {
            id: "fr-wel-1",
            situationPt: "Queres inscrever-te num ginásio em Bordéus, mas sem ficar preso a um contrato de um ano.",
            register: "formal",
            correct: "Avez-vous un abonnement mensuel sans engagement ?",
            options: [
              "Avez-vous un abonnement mensuel sans engagement ?",
              "Avez-vous un casier en vrac ?",
              "Je voudrais couper les pointes du dentiste.",
              "Où est le titre de séjour des lunettes ?",
            ],
            explanationPt: "«Sans engagement» significa sem período obrigatório de fidelização.",
          },
          {
            id: "fr-wel-2",
            situationPt: "Chegas ao cabeleireiro e só queres aparar ligeiramente as pontas.",
            register: "formal",
            correct: "Bonjour, je voudrais juste couper les pointes, s'il vous plaît.",
            options: [
              "Bonjour, je voudrais juste couper les pointes, s'il vous plaît.",
              "Je voudrais renouveler mon caddie, s'il vous plaît.",
              "La salle de sport est complète sur le tapis.",
              "Puis-je peser mon massage ?",
            ],
            explanationPt: "«Couper les pointes» é a expressão exacta para aparar as pontas do cabelo.",
          },
          {
            id: "fr-wel-3",
            situationPt: "Queres experimentar um treino antes de te inscreveres no ginásio.",
            register: "neutro",
            correct: "Est-ce possible de faire une séance d'essai ?",
            options: [
              "Est-ce possible de faire une séance d'essai ?",
              "Est-ce possible de déclarer mes lunettes ?",
              "Où se trouve la mairie du coiffeur ?",
              "Mon entraînement a une date de péremption.",
            ],
            explanationPt: "«Une séance d'essai» designa uma aula ou treino experimental.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Bonjour ! Je cherche une salle de sport avec abonnement sans engagement.",
            pt: "Bom dia! Procuro um ginásio com mensalidade sem fidelização.",
          },
          {
            speaker: "Accueil",
            text: "Bonjour ! Oui, notre formule mensuelle inclut tous les cours et un casier.",
            pt: "Bom dia! Sim, a nossa modalidade mensal inclui todas as aulas e um cacifo.",
          },
          {
            speaker: "Tu",
            text: "Super ! Est-ce que je peux faire une séance d'essai ce soir ?",
            pt: "Óptimo! Posso fazer uma sessão experimental hoje à noite?",
          },
          {
            speaker: "Accueil",
            text: "Bien sûr ! Apportez simplement une serviette propre pour votre entraînement.",
            pt: "Claro! Traga apenas uma toalha limpa para o seu treino.",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "ジム",
          "ロッカー",
          "たいけん",
          "うんどう",
          "びよういん",
          "かみをきる",
          "はいしゃ",
          "めがね",
          "ストレッチ",
          "よやくする",
        ],
        phrases: [
          {
            text: "ジム|の|たいけん|レッスン|を|よやく|したい|です|。",
            pt: "Gostaria de reservar uma aula experimental no ginásio.",
            romaji: "Jimu no taiken ressun o yoyaku shitai desu.",
            register: "formal",
            whenToUse: "Ao experimentar um ginásio ou aula desportiva no Japão",
          },
          {
            text: "すみません|、|ロッカー|と|シャワー|は|どこ|ですか|。",
            pt: "Com licença, onde ficam os cacifos e os chuveiros?",
            romaji: "Sumimasen, rokkaa to shawaa wa doko desu ka.",
            register: "formal",
            whenToUse: "Na recepção do ginásio ou piscina",
          },
          {
            text: "この|しゃしん|の|ように|、|かみ|を|少し|だけ|きって|ください|。",
            pt: "Corte o cabelo só um pouco, como nesta fotografia, por favor.",
            romaji: "Kono shashin no you ni, kami o sukoshi dake kitte kudasai.",
            register: "formal",
            whenToUse: "Dica de ouro: mostrar uma foto no «びよういん» evita qualquer mal-entendido!",
          },
          {
            text: "来週|、|はいしゃ|の|よやく|は|あいていますか|。",
            pt: "Há vaga para consulta no dentista na próxima semana?",
            romaji: "Raishuu, haisha no yoyaku wa aite imasu ka.",
            register: "formal",
            whenToUse: "Ao ligar ou ir a uma clínica dentária",
          },
          {
            text: "うんどう|の|前|に|ストレッチ|を|しましょう|。",
            pt: "Vamos fazer alongamentos antes do exercício.",
            romaji: "Undou no mae ni sutorecchi o shimashou.",
            register: "neutro",
            whenToUse: "Ao treinar com amigos ou colegas",
          },
        ],
        culturalTip:
          "Nos ginásios japoneses é obrigatório levar ténis de sola limpa usados APENAS em recinto interior — entrar na sala de máquinas com os sapatos da rua não é permitido!",
        situations: [
          {
            id: "ja-wel-1",
            situationPt: "Estás num salão de cabeleireiro («びよういん») e queres cortar apenas um pouco, mostrando uma foto.",
            register: "formal",
            correct: "この しゃしんの ように、少しだけ きってください。",
            options: [
              "この しゃしんの ように、少しだけ きってください。",
              "めがねを 二枚 あたためてください。",
              "ロッカーの しょうみきげんは いつですか。",
              "はいしゃは うりきれです。",
            ],
            explanationPt: "«少しだけきってください» (corte só um pouco, por favor) + mostrar uma foto funciona sempre.",
          },
          {
            id: "ja-wel-2",
            situationPt: "Queres saber se há vaga no dentista amanhã à tarde.",
            register: "formal",
            correct: "明日の 午後、はいしゃの よやくは あいていますか。",
            options: [
              "明日の 午後、はいしゃの よやくは あいていますか。",
              "ストレッチに サインしても いいですか。",
              "びよういんで 魚を 買います。",
              "ジムの ざいりゅうカードを ください。",
            ],
            explanationPt: "«よやくはあいていますか» pergunta se há horário livre para marcação.",
          },
          {
            id: "ja-wel-3",
            situationPt: "Queres experimentar o ginásio pela primeira vez antes de te inscreveres.",
            register: "formal",
            correct: "たいけんレッスンを もうしこみたいです。",
            options: [
              "たいけんレッスンを もうしこみたいです。",
              "かみをきる レシートを なくしました。",
              "エレベーターで うんどうを します。",
              "めがねを 一枚 ください。",
            ],
            explanationPt: "«たいけんレッスンをもうしこみたい» = quero inscrever-me numa aula experimental.",
          },
        ],
        miniDialogue: [
          {
            speaker: "スタッフ",
            text: "こんにちは|！|びよういん|の|よやく|は|あります|か|。",
            pt: "Olá! Tem marcação aqui no cabeleireiro?",
            romaji: "Konnichiwa! Biyouin no yoyaku wa arimasu ka.",
          },
          {
            speaker: "Tu",
            text: "はい|、|三時|に|よやく|した|マテウス|です|。",
            pt: "Sim, sou o Mateus, marquei para as três horas.",
            romaji: "Hai, sanji ni yoyaku shita Mateusu desu.",
          },
          {
            speaker: "スタッフ",
            text: "どうぞ|！|今日|は|どの|くらい|かみをきる|予定|ですか|。",
            pt: "Por favor, sente-se! Quanto pensa cortar o cabelo hoje?",
            romaji: "Douzo! Kyou wa dono kurai kami o kiru yotei desu ka.",
          },
          {
            speaker: "Tu",
            text: "この|しゃしん|の|ように|、|少し|だけ|きって|ください|。",
            pt: "Corte só um pouco, como nesta fotografia, por favor.",
            romaji: "Kono shashin no you ni, sukoshi dake kitte kudasai.",
          },
        ],
      },
    },
  },
  {
    id: "familia",
    emoji: "👨‍👩‍👧",
    title: "Família, Crianças & Animais",
    subtitle: "Creche, escola, restaurante com crianças, parques e veterinário",
    tag: "Dia-a-dia",
    color: "var(--color-coral)",
    softColor: "var(--color-coral-soft)",
    relatedLevels: [10, 16, 15],
    byLang: {
      en: {
        vocabKeys: [
          "nursery",
          "playground",
          "pushchair",
          "babysitter",
          "high chair",
          "vet",
          "leash",
          "pet-friendly",
          "vaccine",
          "bedtime",
        ],
        phrases: [
          {
            text: "Could we get a high chair and a small glass of water for our child?",
            pt: "Podiam trazer uma cadeira alta e um copo pequeno de água para a criança?",
            register: "formal",
            whenToUse: "Ao sentar-se em família num restaurante ou café",
          },
          {
            text: "Is there step-free lift access for a pushchair at this station?",
            pt: "Há acesso por elevador sem degraus para carrinho de bebé nesta estação?",
            register: "neutro",
            whenToUse: "Essencial no metro de Londres ou comboios quando andas com carrinho",
          },
          {
            text: "My son has a mild fever today, so he won't attend nursery.",
            pt: "O meu filho tem uma febre ligeira hoje, por isso não vai à creche.",
            register: "formal",
            whenToUse: "Ao avisar a creche ou escola de manhã",
          },
          {
            text: "Excuse me, is your outdoor terrace pet-friendly?",
            pt: "Com licença, a vossa esplanada aceita animais de estimação?",
            register: "neutro",
            whenToUse: "Ao chegar a um café, pub ou hotel com cão",
          },
          {
            text: "Hello, my dog hurt his paws — could we see the vet today?",
            pt: "Olá, o meu cão magoou as patas — podíamos ser vistos pelo veterinário hoje?",
            register: "formal",
            whenToUse: "Ao ligar para uma clínica veterinária",
          },
        ],
        culturalTip:
          "No Reino Unido, muitos pubs tradicionais e esplanadas são super «dog-friendly» (têm até taças de água à porta!), e nas estações de metro procura o símbolo azul de «step-free access» para carrinhos de bebé («pushchair»).",
        situations: [
          {
            id: "en-fam-1",
            situationPt: "Entras num restaurante com um bebé e precisas de uma cadeira própria para a mesa.",
            register: "formal",
            correct: "Could we have a high chair for the baby, please?",
            options: [
              "Could we have a high chair for the baby, please?",
              "Could we have a leash for the locker, please?",
              "Is the bedtime on sale today?",
              "Do you offer a student discount for the vet?",
            ],
            explanationPt: "«High chair» é a cadeira alta de bebé nos restaurantes.",
          },
          {
            id: "en-fam-2",
            situationPt: "Estás a passear o teu cão e queres saber se podes sentar-te com ele na esplanada do café.",
            register: "neutro",
            correct: "Hi, is this café pet-friendly?",
            options: [
              "Hi, is this café pet-friendly?",
              "Hi, is this pushchair subtitled?",
              "Does my dog need a tax number?",
              "Where is the nursery self-checkout?",
            ],
            explanationPt: "«Pet-friendly» (ou «dog-friendly») é a forma mais natural de perguntar.",
          },
          {
            id: "en-fam-3",
            situationPt: "Levas o teu animal à consulta anual e entregas o boletim de vacinas.",
            register: "formal",
            correct: "Here is his vaccine record for the check-up.",
            options: [
              "Here is his vaccine record for the check-up.",
              "Here is his boarding pass for the playground.",
              "He needs a trim at the box office.",
              "Can I renew my babysitter at customs?",
            ],
            explanationPt: "«Vaccine record» designa o registo/boletim de vacinação no veterinário.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Hello, table for three, please — and could we get a high chair?",
            pt: "Olá, mesa para três, por favor — e podiam trazer uma cadeira de bebé?",
          },
          {
            speaker: "Host",
            text: "Of course! There's plenty of space here for your pushchair too.",
            pt: "Claro! Aqui também há bastante espaço para o vosso carrinho de bebé.",
          },
          {
            speaker: "Tu",
            text: "Thank you! By the way, is your garden terrace pet-friendly?",
            pt: "Obrigado! Já agora, a vossa esplanada do jardim aceita animais?",
          },
          {
            speaker: "Host",
            text: "Yes, dogs on a leash are always welcome outside!",
            pt: "Sim, cães de trela são sempre bem-vindos lá fora!",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "crèche",
          "parc",
          "poussette",
          "garde d'enfants",
          "chaise haute",
          "vétérinaire",
          "laisse",
          "vaccin",
          "école primaire",
          "animaux acceptés",
        ],
        phrases: [
          {
            text: "Bonjour, auriez-vous une chaise haute et de la place pour la poussette ?",
            pt: "Bom dia, teriam uma cadeira de bebé e espaço para o carrinho?",
            register: "formal",
            whenToUse: "Ao chegar a um café ou restaurante em família",
          },
          {
            text: "Notre fille a un peu de fièvre, elle ne viendra pas à la crèche aujourd'hui.",
            pt: "A nossa filha tem um pouco de febre, hoje não irá à creche.",
            register: "formal",
            whenToUse: "Para avisar a creche ou escola primária",
          },
          {
            text: "Excusez-moi, est-ce que les chiens en laisse sont acceptés en terrasse ?",
            pt: "Com licença, os cães de trela são aceites na esplanada?",
            register: "formal",
            whenToUse: "Antes de se sentar numa esplanada ou hotel com animal",
          },
          {
            text: "Bonjour, je voudrais prendre rendez-vous chez le vétérinaire pour un vaccin.",
            pt: "Bom dia, gostaria de marcar consulta no veterinário para uma vacina.",
            register: "formal",
            whenToUse: "Ao ligar para uma clínica veterinária",
          },
          {
            text: "On va au parc après l'école primaire vers seize heures trente ?",
            pt: "Vamos ao parque depois da escola primária por volta das dezasseis e trinta?",
            register: "informal",
            whenToUse: "Em França as aulas da primária costumam terminar às 16h30 («la sortie d'école»)",
          },
        ],
        culturalTip:
          "Em França, muitos jardins públicos de Paris têm placas «Interdit aux chiens» nos relvados — procura sempre os parques assinalados com «Chiens tenus en laisse acceptés»!",
        situations: [
          {
            id: "fr-fam-1",
            situationPt: "Entras numa brasserie com um bebé e queres saber se têm cadeira alta.",
            register: "formal",
            correct: "Bonjour, auriez-vous une chaise haute pour le bébé ?",
            options: [
              "Bonjour, auriez-vous une chaise haute pour le bébé ?",
              "Auriez-vous un casier pour le vétérinaire ?",
              "La crèche est en VOSTFR aujourd'hui ?",
              "Puis-je peser la poussette en caisse ?",
            ],
            explanationPt: "«Une chaise haute» é a cadeira alta para bebés e crianças pequenas.",
          },
          {
            id: "fr-fam-2",
            situationPt: "Levas o teu cão ao veterinário para a vacinação anual e entregas a caderneta.",
            register: "formal",
            correct: "Bonjour, voici le carnet de vaccin de mon chien.",
            options: [
              "Bonjour, voici le carnet de vaccin de mon chien.",
              "Voici le titre de séjour de ma poussette.",
              "Mon chien voudrait couper les pointes.",
              "Où est la billetterie de l'école primaire ?",
            ],
            explanationPt: "«Le carnet de vaccin / carnet de santé» é o boletim de saúde e vacinas.",
          },
          {
            id: "fr-fam-3",
            situationPt: "Queres confirmar se o hotel onde vais ficar aceita animais de estimação.",
            register: "formal",
            correct: "Excusez-moi, les animaux sont-ils acceptés à l'hôtel ?",
            options: [
              "Excusez-moi, les animaux sont-ils acceptés à l'hôtel ?",
              "Les laisses sont-elles en promotion au rayon ?",
              "Y a-t-il une grève à la garde d'enfants ?",
              "La fièvre est incluse au petit-déjeuner ?",
            ],
            explanationPt: "Nos sites e placas francesas verás frequentemente «Animaux acceptés».",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Bonjour ! Une table pour trois, avec une chaise haute s'il vous plaît.",
            pt: "Bom dia! Uma mesa para três, com uma cadeira de bebé por favor.",
          },
          {
            speaker: "Serveur",
            text: "Bien sûr ! Vous pouvez laisser la poussette juste ici près de l'entrée.",
            pt: "Claro! Podem deixar o carrinho de bebé mesmo aqui perto da entrada.",
          },
          {
            speaker: "Tu",
            text: "Merci beaucoup ! Les petits chiens en laisse sont aussi acceptés en terrasse ?",
            pt: "Muito obrigado! Cães pequenos de trela também são aceites na esplanada?",
          },
          {
            speaker: "Serveur",
            text: "Oui, sans souci, je lui apporte un bol d'eau tout de suite !",
            pt: "Sim, sem problema, trago-lhe já uma taça de água!",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "ほいくえん",
          "こうえん",
          "ベビーカー",
          "こどもよう",
          "どうぶつびょういん",
          "ペット",
          "さんぽ",
          "ワクチン",
          "おむつ",
          "かぞく",
        ],
        phrases: [
          {
            text: "すみません|、|こどもよう|の|いす|と|水|を|おねがいします|。",
            pt: "Com licença, uma cadeira de criança e água, por favor.",
            romaji: "Sumimasen, kodomoyou no isu to mizu o onegaishimasu.",
            register: "formal",
            whenToUse: "Nos restaurantes familiares («ファミレス») do Japão",
          },
          {
            text: "おむつ|を|かえる|へや|や|エレベーター|は|あります|か|。",
            pt: "Há sala para mudar a fralda e elevador?",
            romaji: "Omutsu o kaeru heya ya erebeetaa wa arimasu ka.",
            register: "formal",
            whenToUse: "Os centros comerciais e estações japonesas têm excelentes salas de bebé («ベビールーム»)",
          },
          {
            text: "子ども|に|少し|ねつ|が|ある|ので|、|今日|は|ほいくえん|を|休みます|。",
            pt: "Como a criança tem um pouco de febre, hoje vai faltar à creche.",
            romaji: "Kodomo ni sukoshi netsu ga aru node, kyou wa hoikuen o yasumimasu.",
            register: "formal",
            whenToUse: "Ao ligar para a creche ou escola de manhã",
          },
          {
            text: "すみません|、|テラス|は|ペット|も|大丈夫|ですか|。",
            pt: "Com licença, na esplanada também aceitam animais de estimação?",
            romaji: "Sumimasen, terasu wa petto mo daijoubu desu ka.",
            register: "formal",
            whenToUse: "Antes de entrar numa esplanada ou parque com animal",
          },
          {
            text: "どうぶつびょういん|で|ワクチン|の|よやく|を|したい|です|。",
            pt: "Queria marcar uma vacina na clínica veterinária.",
            romaji: "Doubutsu byouin de wakuchin no yoyaku o shitai desu.",
            register: "formal",
            whenToUse: "Ao contactar o veterinário",
          },
        ],
        culturalTip:
          "O Japão é incrivelmente preparado para famílias com bebés: quase todas as grandes estações e centros comerciais têm salas limpas para mudar fraldas («おむつ») e água quente para biberões. Nos comboios, usa as carruagens com espaço assinalado para «ベビーカー»!",
        situations: [
          {
            id: "ja-fam-1",
            situationPt: "Entras num restaurante em família e queres pedir uma cadeira própria para criança.",
            register: "formal",
            correct: "すみません、こどもようの いすは ありますか。",
            options: [
              "すみません、こどもようの いすは ありますか。",
              "ざいりゅうカードの さんぽは ありますか。",
              "ベビーカーを 二枚 あたためてください。",
              "どうぶつびょういんは うりきれです。",
            ],
            explanationPt: "«こどもようのいす» significa cadeira para criança (e «こどもようのフォーク» talheres de criança).",
          },
          {
            id: "ja-fam-2",
            situationPt: "Precisas de encontrar um fraldário num centro comercial em Tóquio.",
            register: "formal",
            correct: "すみません、おむつを かえる へやは どこですか。",
            options: [
              "すみません、おむつを かえる へやは どこですか。",
              "ワクチンの うりばは いくらですか。",
              "ほいくえんで かみをきりたいです。",
              "かぞくの しょうみきげんは 明日です。",
            ],
            explanationPt: "«おむつをかえるへや» (sala para mudar fraldas) é imediatamente compreendido pelos funcionários.",
          },
          {
            id: "ja-fam-3",
            situationPt: "Estás a passear o teu animal no parque e queres saber se a esplanada do café o aceita.",
            register: "formal",
            correct: "すみません、ここは ペットも 大丈夫ですか。",
            options: [
              "すみません、ここは ペットも 大丈夫ですか。",
              "ここは はんこも しんせんですか。",
              "こうえんに チェックインします。",
              "さんぽの しめきりは 金曜日です。",
            ],
            explanationPt: "«ペットも大丈夫ですか» é curto, educado e muito natural.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "こんにちは|。|かぞく|三人|です|。|ベビーカー|でも|入れます|か|。",
            pt: "Olá. Somos três de família. Podemos entrar com carrinho de bebé?",
            romaji: "Konnichiwa. Kazoku sannin desu. Bebiikaa demo hairemasu ka.",
          },
          {
            speaker: "店員",
            text: "はい|、|どうぞ|！|こどもよう|の|いす|も|ごよういします|ね|。",
            pt: "Sim, por favor entrem! Vou preparar também uma cadeira de criança.",
            romaji: "Hai, douzo! Kodomoyou no isu mo goyoui shimasu ne.",
          },
          {
            speaker: "Tu",
            text: "ありがとうございます|。|近く|に|おむつ|を|かえる|へや|は|あります|か|。",
            pt: "Muito obrigado. Há alguma sala para mudar fraldas aqui perto?",
            romaji: "Arigatou gozaimasu. Chikaku ni omutsu o kaeru heya wa arimasu ka.",
          },
          {
            speaker: "店員",
            text: "はい|、|エレベーター|の|となり|に|あります|よ|。",
            pt: "Sim, fica mesmo ao lado do elevador.",
            romaji: "Hai, erebeetaa no tonari ni arimasu yo.",
          },
        ],
      },
    },
  },
  {
    id: "cultura",
    emoji: "🎭",
    title: "Museus, Cinema, Concertos & Lazer",
    subtitle: "Bilheteiras, descontos de estudante, sessões legendadas, visitas guiadas e bengaleiro",
    tag: "Cultura",
    color: "var(--color-lilac)",
    softColor: "var(--color-lilac-soft)",
    relatedLevels: [42, 17, 14],
    byLang: {
      en: {
        vocabKeys: [
          "exhibition",
          "guided tour",
          "audio guide",
          "subtitled",
          "box office",
          "cloakroom",
          "sold out",
          "student discount",
          "row",
          "dubbed",
        ],
        phrases: [
          {
            text: "Two tickets for the temporary exhibition, please — do you offer a student discount?",
            pt: "Dois bilhetes para a exposição temporária, por favor — têm desconto de estudante?",
            register: "formal",
            whenToUse: "Na bilheteira de museus, galerias e monumentos",
          },
          {
            text: "What time does the next guided tour start, or is there an audio guide?",
            pt: "A que horas começa a próxima visita guiada, ou há audioguia?",
            register: "neutro",
            whenToUse: "À entrada de um museu ou palácio histórico",
          },
          {
            text: "Excuse me, is the eight o'clock screening subtitled or dubbed?",
            pt: "Com licença, a sessão das oito horas é legendada ou dobrada?",
            register: "neutro",
            whenToUse: "Antes de comprar bilhetes de cinema para filmes estrangeiros",
          },
          {
            text: "Can we take photos inside without flash, and where is the cloakroom?",
            pt: "Podemos tirar fotografias lá dentro sem flash, e onde fica o bengaleiro?",
            register: "neutro",
            whenToUse: "Muitos museus exigem deixar mochilas grandes no «cloakroom»",
          },
          {
            text: "Let's book in advance — Friday night concerts get sold out fast!",
            pt: "Vamos reservar com antecedência — os concertos de sexta à noite esgotam depressa!",
            register: "informal",
            whenToUse: "Ao combinar um programa cultural com amigos",
          },
        ],
        culturalTip:
          "Boa notícia em Londres: a entrada permanente na maioria dos grandes museus nacionais (British Museum, National Gallery, Tate Modern) é gratuita — pagas apenas pelas «temporary exhibitions»!",
        situations: [
          {
            id: "en-cul-1",
            situationPt: "Estás na bilheteira de um museu com o teu cartão universitário e queres saber se há preço reduzido.",
            register: "formal",
            correct: "Do you offer a student discount for the exhibition?",
            options: [
              "Do you offer a student discount for the exhibition?",
              "Is the box office pet-friendly on a leash?",
              "Can I check out my row at customs?",
              "Does this audio guide count as proof of address?",
            ],
            explanationPt: "«Student discount» (ou «concession ticket» no Reino Unido) dá acesso à tarifa reduzida.",
          },
          {
            id: "en-cul-2",
            situationPt: "Tens uma mochila grande num museu e pedem-te para a guardar antes de entrar nas salas.",
            register: "neutro",
            correct: "Sure, where is the cloakroom?",
            options: [
              "Sure, where is the cloakroom?",
              "Sure, where is the bakery aisle?",
              "Is my backpack dubbed or subtitled?",
              "Can I trim my ticket at the front desk?",
            ],
            explanationPt: "«Cloakroom» é o bengaleiro de museus, teatros e salas de espectáculo.",
          },
          {
            id: "en-cul-3",
            situationPt: "Queres ver um filme no áudio original com legendas, e não dobrado.",
            register: "neutro",
            correct: "Is the evening screening subtitled?",
            options: [
              "Is the evening screening subtitled?",
              "Is the concert on mute?",
              "Are the seats organic?",
              "Did the guided tour expire?",
            ],
            explanationPt: "«Subtitled» = legendado; «dubbed» = dobrado.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Hello! Two tickets for the modern art exhibition, please.",
            pt: "Olá! Dois bilhetes para a exposição de arte moderna, por favor.",
          },
          {
            speaker: "Box Office",
            text: "Certainly. Tonight's guided tour is sold out, would you like an audio guide?",
            pt: "Com certeza. A visita guiada de hoje está esgotada, gostaria de um audioguia?",
          },
          {
            speaker: "Tu",
            text: "Yes, please — and can we get a student discount with our ID card?",
            pt: "Sim, por favor — e temos desconto de estudante com o nosso cartão?",
          },
          {
            speaker: "Box Office",
            text: "Of course! Please leave large bags in the cloakroom on your left, and no flash photos.",
            pt: "Claro! Deixem por favor as malas grandes no bengaleiro à esquerda, e fotos só sem flash.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "exposition",
          "visite guidée",
          "audioguide",
          "vostfr",
          "billetterie",
          "vestiaire",
          "complet",
          "tarif réduit",
          "séance",
          "scène",
        ],
        phrases: [
          {
            text: "Bonjour, deux places pour l'exposition temporaire au tarif réduit, s'il vous plaît.",
            pt: "Bom dia, dois bilhetes para a exposição temporaire à tarifa reduzida, por favor.",
            register: "formal",
            whenToUse: "Em França os menores de 26 anos da UE entram grátis ou com «tarif réduit» nos museus nacionais!",
          },
          {
            text: "Est-ce que la séance de vingt heures est bien en VOSTFR ?",
            pt: "A sessão das vinte horas é mesmo em versão original legendada (VOSTFR)?",
            register: "neutro",
            whenToUse: "Fundamental nos cinemas franceses para não apanhares um filme dobrado («VF») por engano!",
          },
          {
            text: "À quelle heure commence la prochaine visite guidée, ou avez-vous un audioguide ?",
            pt: "A que horas começa a próxima visita guiada, ou têm audioguia?",
            register: "formal",
            whenToUse: "Na recepção ou bilheteira de museus e castelos",
          },
          {
            text: "Peut-on prendre des photos sans flash, et où se trouve le vestiaire ?",
            pt: "Pode tirar-se fotografias sem flash, e onde fica o bengaleiro?",
            register: "neutro",
            whenToUse: "À entrada das salas de exposição ou teatro",
          },
          {
            text: "Dépêche-toi de réserver en ligne, sinon le concert sera complet !",
            pt: "Despacha-te a reservar online, senão o concerto vai esgotar!",
            register: "informal",
            whenToUse: "Ao comprar bilhetes com amigos («complet» = esgotado)",
          },
        ],
        culturalTip:
          "Nos cinemas em França, presta muita atenção às siglas no cartaz: «VF» (Version Française) é dobrado em francês, enquanto «VOSTFR» (Version Originale Sous-Titrée) mantém as vozes originais com legendas!",
        situations: [
          {
            id: "fr-cul-1",
            situationPt: "Vais ao cinema em Paris e queres ter a certeza de que o filme tem o áudio original com legendas.",
            register: "neutro",
            correct: "Excusez-moi, cette séance est en VOSTFR ?",
            options: [
              "Excusez-moi, cette séance est en VOSTFR ?",
              "Cette séance est en vrac au rayon ?",
              "Avez-vous une ordonnance pour la scène ?",
              "Le vestiaire a de la fièvre ?",
            ],
            explanationPt: "«En VOSTFR» garante áudio original com legendas em francês.",
          },
          {
            id: "fr-cul-2",
            situationPt: "És estudante e queres pedir desconto na bilheteira de um museu.",
            register: "formal",
            correct: "Bonjour, ai-je droit au tarif réduit avec ma carte d'étudiant ?",
            options: [
              "Bonjour, ai-je droit au tarif réduit avec ma carte d'étudiant ?",
              "Puis-je renouveler mon audioguide à la préfecture ?",
              "Je laisse la billetterie en laisse.",
              "Où est la caisse automatique de la scène ?",
            ],
            explanationPt: "«Le tarif réduit» abrange estudantes, jovens (< 26 anos) e seniores.",
          },
          {
            id: "fr-cul-3",
            situationPt: "Queres avisar um amigo de que já não há bilhetes para o concerto de sábado.",
            register: "informal",
            correct: "Dommage, le concert de samedi est déjà complet !",
            options: [
              "Dommage, le concert de samedi est déjà complet !",
              "Le concert est meublé avec chauffage !",
              "La visite guidée coupe les pointes !",
              "Prends un comprimé à la billetterie !",
            ],
            explanationPt: "Em francês usa-se «complet» tanto para hotéis lotados como para espectáculos esgotados.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Bonjour ! Deux places pour l'exposition, dont une au tarif réduit étudiant.",
            pt: "Bom dia! Dois bilhetes para a exposição, sendo um com tarifa reduzida de estudante.",
          },
          {
            speaker: "Billetterie",
            text: "Voici vos billets ! Souhaitez-vous aussi un audioguide ? La visite guidée est complète.",
            pt: "Aqui estão os bilhetes! Desejam também um audioguia? A visita guiada está esgotada.",
          },
          {
            speaker: "Tu",
            text: "Oui, volontiers ! Peut-on prendre des photos sans flash dans les salles ?",
            pt: "Sim, com todo o gosto! Podemos tirar fotografias sem flash nas salas?",
          },
          {
            speaker: "Billetterie",
            text: "Oui, bien sûr. Merci simplement de déposer votre sac au vestiaire à droite.",
            pt: "Sim, claro. Agradecemos apenas que deixe a mochila no bengaleiro à direita.",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "びじゅつかん",
          "てんらんかい",
          "チケット",
          "じまく",
          "おんせいガイド",
          "ざせき",
          "うりきれ",
          "がくせいわりびき",
          "しゃしん",
          "コンサート",
        ],
        phrases: [
          {
            text: "てんらんかい|の|チケット|を|二枚|ください|。|がくせいわりびき|は|あります|か|。",
            pt: "Dois bilhetes para a exposição, por favor. Há desconto de estudante?",
            romaji: "Tenrankai no chiketto o nimai kudasai. Gakusei waribiki wa arimasu ka.",
            register: "formal",
            whenToUse: "Na bilheteira de museus, templos ou exposições",
          },
          {
            text: "英語|の|おんせいガイド|を|かりられますか|。",
            pt: "Posso alugar um audioguia em inglês?",
            romaji: "Eigo no onsei gaido o kariraremasu ka.",
            register: "formal",
            whenToUse: "Nos grandes museus («びじゅつかん» / «はくぶつかん»)",
          },
          {
            text: "すみません|、|ここ|で|フラッシュ|なしで|しゃしん|を|とっても|いい|ですか|。",
            pt: "Com licença, posso tirar fotografias aqui sem flash?",
            romaji: "Sumimasen, koko de furasshu nashi de shashin o totte mo ii desu ka.",
            register: "formal",
            whenToUse: "Pergunta sempre em museus e templos japoneses — algumas salas proíbem fotos!",
          },
          {
            text: "この|映画|は|じまく|ですか|。",
            pt: "Este filme é legendado?",
            romaji: "Kono eiga wa jimaku desu ka.",
            register: "neutro",
            whenToUse: "Nos cinemas japoneses escolhes entre «字幕» (じまく — legendado) e «吹替» (dobrado)",
          },
          {
            text: "金曜日の|コンサート|の|チケット|は|もう|うりきれ|です|。",
            pt: "Os bilhetes para o concerto de sexta-feira já estão esgotados.",
            romaji: "Kinyoubi no konsaato no chiketto wa mou urikire desu.",
            register: "neutro",
            whenToUse: "Muito comum no Japão, onde muitos concertos funcionam por reserva antecipada ou sorteio!",
          },
        ],
        culturalTip:
          "No Japão, os bilhetes para concertos, museus famosos (como Ghibli ou teamLab) e eventos compram-se frequentemente nas máquinas das lojas «コンビニ» (Lawson, Seven-Eleven, FamilyMart) antes de esgotarem («うりきれ»)!",
        situations: [
          {
            id: "ja-cul-1",
            situationPt: "Estás num museu de arte em Tóquio e queres perguntar educadamente se é permitido fotografar.",
            register: "formal",
            correct: "すみません、ここで しゃしんを とっても いいですか。",
            options: [
              "すみません、ここで しゃしんを とっても いいですか。",
              "ここで おむつを 食べても いいですか。",
              "ざせきの しょうみきげんは いつですか。",
              "びじゅつかんに はんこを ください。",
            ],
            explanationPt: "«しゃしんをとってもいいですか» é essencial em museus, galerias e santuários.",
          },
          {
            id: "ja-cul-2",
            situationPt: "Queres comprar dois bilhetes para a exposição e saber se tens desconto de estudante.",
            register: "formal",
            correct: "チケットを 二枚 ください。がくせいわりびきは つかえますか。",
            options: [
              "チケットを 二枚 ください。がくせいわりびきは つかえますか。",
              "おんせいガイドは しんせんですか。",
              "コンサートを セルフレジで あたためます。",
              "じまくの まどぐちは 何番ですか。",
            ],
            explanationPt: "Bilhetes contam-se com «枚» (まい), e «がくせいわりびき» é o desconto de estudante.",
          },
          {
            id: "ja-cul-3",
            situationPt: "Chegas à bilheteira e infelizmente já não há lugares disponíveis para hoje.",
            register: "formal",
            correct: "すみません、今日の チケットは うりきれです。",
            options: [
              "すみません、今日の チケットは うりきれです。",
              "今日の てんらんかいは ミュートです。",
              "ざせきに ねつが あります。",
              "びじゅつかんを 少し きってください。",
            ],
            explanationPt: "«うりきれ» (esgotado) aparece em máquinas de bilhetes, lojas e restaurantes.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "こんにちは|。|てんらんかい|の|チケット|を|二枚|おねがいします|。",
            pt: "Olá. Dois bilhetes para a exposição, por favor.",
            romaji: "Konnichiwa. Tenrankai no chiketto o nimai onegaishimasu.",
          },
          {
            speaker: "うけつけ",
            text: "ありがとうございます|。|がくせいわりびき|を|つかいます|か|。",
            pt: "Obrigado. Vai utilizar desconto de estudante?",
            romaji: "Arigatou gozaimasu. Gakusei waribiki o tsukaimasu ka.",
          },
          {
            speaker: "Tu",
            text: "はい|、|学生|です|。|英語|の|おんせいガイド|も|かりられますか|。",
            pt: "Sim, sou estudante. Também posso alugar um audioguia em inglês?",
            romaji: "Hai, gakusei desu. Eigo no onsei gaido mo kariraremasu ka.",
          },
          {
            speaker: "うけつけ",
            text: "はい|、|こちら|です|。|中|では|フラッシュ|なしで|しゃしん|を|とって|ください|。",
            pt: "Sim, aqui tem. Lá dentro tire fotografias sem flash, por favor.",
            romaji: "Hai, kochira desu. Naka de wa furasshu nashi de shashin o totte kudasai.",
          },
        ],
      },
    },
  },
  {
    id: "conducao",
    emoji: "🚗",
    title: "Condução, Aluguer de Carro & Estrada",
    subtitle: "Alugar viatura, seguro e franquia, abastecer, portagens, estacionamento e avarias",
    tag: "Viagens",
    color: "var(--color-teal)",
    softColor: "var(--color-teal-soft)",
    relatedLevels: [12, 28, 34],
    byLang: {
      en: {
        vocabKeys: [
          "car rental",
          "driver's license",
          "full insurance",
          "deductible",
          "petrol station",
          "toll",
          "parking lot",
          "flat tyre",
          "speed limit",
          "roundabout",
        ],
        phrases: [
          {
            text: "Hi, I booked a car rental online — here is my driver's license.",
            pt: "Olá, reservei um aluguer de carro online — aqui está a minha carta de condução.",
            register: "formal",
            whenToUse: "Ao levantar a viatura no balcão da agência de aluguer",
          },
          {
            text: "Does full insurance reduce the deductible to zero?",
            pt: "O seguro contra todos os riscos reduz a franquia a zero?",
            register: "formal",
            whenToUse: "Essencial perguntar antes de assinar o contrato de aluguer!",
          },
          {
            text: "Excuse me, where is the nearest petrol station, and is this car unleaded or diesel?",
            pt: "Com licença, onde fica a bomba de combustível mais próxima, e este carro é a gasolina ou gasóleo?",
            register: "neutro",
            whenToUse: "Antes de abastecer para devolver o depósito cheio",
          },
          {
            text: "Take the second exit at the roundabout and watch the speed limit.",
            pt: "Sai na segunda saída da rotunda e tem atenção ao limite de velocidade.",
            register: "informal",
            whenToUse: "Ao dar indicações de estrada a quem vai ao volante",
          },
          {
            text: "Hello, we have a flat tyre near the toll booth — could you send roadside assistance?",
            pt: "Olá, temos um pneu furado perto da portagem — poderiam enviar assistência em viagem?",
            register: "formal",
            whenToUse: "Em caso de furo ou avaria na auto-estrada",
          },
        ],
        culturalTip:
          "No Reino Unido conduz-se pela esquerda («left-hand traffic») e entra-se nas rotundas no sentido dos ponteiros do relógio! Além disso, diz-se «petrol station» e «tyre» no UK, mas «gas station» e «tire» nos EUA.",
        situations: [
          {
            id: "en-drv-1",
            situationPt: "Estás a alugar um carro e queres confirmar se o seguro cobre tudo sem franquia em caso de danos.",
            register: "formal",
            correct: "Does full insurance cover everything with zero deductible?",
            options: [
              "Does full insurance cover everything with zero deductible?",
              "Is the roundabout subtitled at the toll?",
              "Can I borrow a recipe for my flat tyre?",
              "Where is the fitting room for this petrol station?",
            ],
            explanationPt: "«Full insurance» com «zero deductible» (ou «zero excess» no UK) evita surpresas na caução.",
          },
          {
            id: "en-drv-2",
            situationPt: "Ficaste com um pneu furado na berma e ligas para a linha de assistência da rent-a-car.",
            register: "formal",
            correct: "Hello, we have a flat tyre — could you send roadside assistance?",
            options: [
              "Hello, we have a flat tyre — could you send roadside assistance?",
              "Hi, please wrap my speed limit as a gift.",
              "Can I pay the parking lot on mute?",
              "My driver's license is sold out.",
            ],
            explanationPt: "«Flat tyre» (pneu furado) e «roadside assistance» (assistência em viagem) são os termos-chave.",
          },
          {
            id: "en-drv-3",
            situationPt: "Queres perguntar se o parque de estacionamento aceita pagamento por cartão.",
            register: "neutro",
            correct: "Can we pay for the parking lot by card at the exit?",
            options: [
              "Can we pay for the parking lot by card at the exit?",
              "Is this roundabout dry cleaning only?",
              "Did the toll expire in the fridge?",
              "Have you got a looser driver's license?",
            ],
            explanationPt: "«Parking lot» (US) / «car park» (UK) refere-se ao parque de estacionamento.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Good morning! I have a reservation for a compact car rental for four days.",
            pt: "Bom dia! Tenho uma reserva de aluguer de um carro compacto por quatro dias.",
          },
          {
            speaker: "Agent",
            text: "Welcome! May I see your passport, credit card, and driver's license, please?",
            pt: "Bem-vindo! Posso ver o seu passaporte, cartão de crédito e carta de condução, por favor?",
          },
          {
            speaker: "Tu",
            text: "Here you go. I'd like to add full insurance with zero deductible, please.",
            pt: "Aqui tem. Gostaria de adicionar o seguro completo sem franquia, por favor.",
          },
          {
            speaker: "Agent",
            text: "All set! Return the tank full — there's a petrol station right past the roundabout.",
            pt: "Tudo pronto! Devolva com o depósito cheio — há uma bomba de gasolina logo depois da rotunda.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "location de voiture",
          "permis de conduire",
          "assurance tous risques",
          "franchise",
          "station-service",
          "péage",
          "parking",
          "pneu crevé",
          "limitation de vitesse",
          "rond-point",
        ],
        phrases: [
          {
            text: "Bonjour, j'ai réservé une location de voiture — voici mon permis de conduire.",
            pt: "Bom dia, reservei um aluguer de carro — aqui está a minha carta de condução.",
            register: "formal",
            whenToUse: "Ao levantar o carro numa agência em estação TGV ou aeroporto",
          },
          {
            text: "Est-ce que l'assurance tous risques réduit bien la franchise à zéro ?",
            pt: "O seguro contra todos os riscos reduz mesmo a franquia a zero?",
            register: "formal",
            whenToUse: "Em França «la franchise» de aluguer pode ultrapassar 1000 € sem cobertura extra!",
          },
          {
            text: "Excusez-moi, cette voiture roule au sans-plomb ou au gazole ?",
            pt: "Com licença, este carro anda a gasolina sem chumbo ou a gasóleo?",
            register: "neutro",
            whenToUse: "Antes de sair do parque ou parar na «station-service»",
          },
          {
            text: "Prends la deuxième sortie au rond-point et fais attention à la limitation de vitesse.",
            pt: "Sai na segunda saída da rotunda e tem atenção ao limite de velocidade.",
            register: "informal",
            whenToUse: "Em França há muitos radares automáticos nas estradas e auto-estradas!",
          },
          {
            text: "Bonjour, nous avons un pneu crevé après le péage — pouvez-vous envoyer une dépanneuse ?",
            pt: "Bom dia, temos um pneu furado depois da portagem — podem enviar um reboque?",
            register: "formal",
            whenToUse: "Ao ligar para a assistência na auto-estrada («autoroute»)",
          },
        ],
        culturalTip:
          "Nas auto-estradas francesas («autoroutes»), quase todos os troços têm portagem («péage»): tiras um bilhete à entrada e pagas com cartão ou dinheiro à saída. Nas bombas, gasolina é «sans-plomb 95/98» e gasóleo é «gazole»!",
        situations: [
          {
            id: "fr-drv-1",
            situationPt: "No balcão de aluguer em Lyon, queres garantir o seguro completo sem franquia.",
            register: "formal",
            correct: "Bonjour, je voudrais ajouter l'assurance tous risques sans franchise.",
            options: [
              "Bonjour, je voudrais ajouter l'assurance tous risques sans franchise.",
              "Bonjour, quelle est la pointure du rond-point ?",
              "Avez-vous une ordonnance pour le péage ?",
              "Je laisse le pneu crevé au vestiaire.",
            ],
            explanationPt: "«L'assurance tous risques sans franchise» protege contra custos elevados por pequenos riscos.",
          },
          {
            id: "fr-drv-2",
            situationPt: "Precisas de abastecer antes de entregar o carro e procuras uma bomba de combustível.",
            register: "neutro",
            correct: "Excusez-moi, où se trouve la station-service la plus proche ?",
            options: [
              "Excusez-moi, où se trouve la station-service la plus proche ?",
              "Où se trouve la cabine d'essayage de l'autoroute ?",
              "Est-ce que le parking est fait maison ?",
              "Le permis de conduire est déjà complet ?",
            ],
            explanationPt: "«La station-service» é a bomba de combustível / área de serviço.",
          },
          {
            id: "fr-drv-3",
            situationPt: "Tens um furo na estrada e precisas de explicar o problema à assistência.",
            register: "formal",
            correct: "Bonjour, j'ai un pneu crevé près de la sortie du parking.",
            options: [
              "Bonjour, j'ai un pneu crevé près de la sortie du parking.",
              "J'ai une averse sur ma facture.",
              "Mon rond-point est trop serré.",
              "Je voudrais emballer la limitation de vitesse.",
            ],
            explanationPt: "«Avoir un pneu crevé» é a expressão natural para ter um pneu furado.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Bonjour ! J'ai réservé une location de voiture pour trois jours.",
            pt: "Bom dia! Reservei um aluguer de carro por três dias.",
          },
          {
            speaker: "Agence",
            text: "Bonjour ! Puis-je voir votre permis de conduire et une carte bancaire pour la caution ?",
            pt: "Bom dia! Posso ver a sua carta de condução e um cartão bancário para a caução?",
          },
          {
            speaker: "Tu",
            text: "Voici. Je préfère prendre l'assurance tous risques pour réduire la franchise.",
            pt: "Aqui estão. Prefiro fazer o seguro contra todos os riscos para reduzir a franquia.",
          },
          {
            speaker: "Agence",
            text: "Parfait ! La voiture est au parking niveau moins un, et il y a une station-service près du rond-point.",
            pt: "Perfeito! O carro está no estacionamento piso menos um, e há uma bomba perto da rotunda.",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "レンタカー",
          "めんきょ",
          "ほけん",
          "ガソリンスタンド",
          "まんたん",
          "こうそくどうろ",
          "駐車場",
          "じこ",
          "運転",
          "カーナビ",
        ],
        phrases: [
          {
            text: "予約|した|レンタカー|を|かります|。|これ|が|こくさい|めんきょ|です|。",
            pt: "Venho levantar o carro alugado que reservei. Aqui está a carta de condução internacional.",
            romaji: "Yoyaku shita rentakaa o karimasu. Kore ga kokusai menkyo desu.",
            register: "formal",
            whenToUse: "O Japão exige carta internacional («国際免許» — kokusai menkyo) emitida ao abrigo da Convenção de Genebra!",
          },
          {
            text: "フルカバー|の|ほけん|も|つけたい|です|。",
            pt: "Gostaria também de incluir o seguro com cobertura completa.",
            romaji: "Furukabaa no hoken mo tsuketai desu.",
            register: "formal",
            whenToUse: "No balcão de aluguer de carros (Toyota Rent a Car, Nippon, Times)",
          },
          {
            text: "すみません|、|レギュラー|を|まんたん|で|おねがいします|。",
            pt: "Com licença, ateste o depósito com gasolina normal, por favor.",
            romaji: "Sumimasen, regyuraa o mantan de onegaishimasu.",
            register: "formal",
            whenToUse: "Nos «ガソリンスタンド» japoneses a gasolina comum chama-se «レギュラー» (vermelho) e «まんたん» é depósito cheio!",
          },
          {
            text: "カーナビ|を|英語|に|かえて|もらえますか|。",
            pt: "Poderia mudar o GPS do carro para inglês?",
            romaji: "Kaanabi o eigo ni kaete moraemasu ka.",
            register: "formal",
            whenToUse: "Antes de arrancar do parque da agência",
          },
          {
            text: "近く|に|駐車場|は|あります|か|。",
            pt: "Há algum parque de estacionamento aqui perto?",
            romaji: "Chikaku ni chuushajou wa arimasu ka.",
            register: "neutro",
            whenToUse: "No Japão é proibido estacionar na rua — procura sempre um «駐車場» (コインパーキング)!",
          },
        ],
        culturalTip:
          "No Japão conduz-se pela esquerda, o limite de álcool no sangue é ZERO absoluto (0,0%) e nunca se estaciona na berma da rua — usa sempre parques pagos («駐車場»). Nos postos de combustível, «レギュラー満タン» significa atestar gasolina normal!",
        situations: [
          {
            id: "ja-drv-1",
            situationPt: "Paraste numa bomba de gasolina no Japão antes de devolver o carro e queres atestar o depósito.",
            register: "formal",
            correct: "すみません、レギュラーを まんたんで おねがいします。",
            options: [
              "すみません、レギュラーを まんたんで おねがいします。",
              "駐車場を あたためて ください。",
              "この カーナビは きついです。",
              "こうそくどうろを 二枚 ください。",
            ],
            explanationPt: "«レギュラーをまんたん» (gasolina normal, depósito cheio) é a frase padrão para devolver um «レンタカー».",
          },
          {
            id: "ja-drv-2",
            situationPt: "Queres pedir ao funcionário que configure o GPS da viatura em inglês.",
            register: "formal",
            correct: "カーナビを 英語に かえて もらえますか。",
            options: [
              "カーナビを 英語に かえて もらえますか。",
              "めんきょの しょうみきげんは いつですか。",
              "ほけんを つつんで ください。",
              "ガソリンスタンドで しちゃくしても いいですか。",
            ],
            explanationPt: "«カーナビ» é o sistema de navegação automóvel; «かえてもらえますか» pede a alteração com cortesia.",
          },
          {
            id: "ja-drv-3",
            situationPt: "Chegaste perto de um restaurante e precisas de saber onde deixar o carro legalmente.",
            register: "neutro",
            correct: "すみません、近くに 駐車場は ありますか。",
            options: [
              "すみません、近くに 駐車場は ありますか。",
              "じこを おみやげに 買いました。",
              "こうそくどうろは ゆるいですか。",
              "運転を わりびきして ください。",
            ],
            explanationPt: "«駐車場» (ちゅうしゃじょう) é o sinal «P» que vês por todas as cidades japonesas.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "こんにちは|。|予約|した|レンタカー|を|おねがいします|。",
            pt: "Olá. Venho levantar o carro de aluguer que reservei, por favor.",
            romaji: "Konnichiwa. Yoyaku shita rentakaa o onegaishimasu.",
          },
          {
            speaker: "スタッフ",
            text: "かしこまりました|。|パスポート|と|こくさい|めんきょ|を|見せて|ください|。",
            pt: "Com certeza. Mostre-me o passaporte e a carta internacional, por favor.",
            romaji: "Kashikomarimashita. Pasupooto to kokusai menkyo o misete kudasai.",
          },
          {
            speaker: "Tu",
            text: "はい|、|どうぞ|。|ほけん|も|つけて|、|カーナビ|を|英語|に|おねがいします|。",
            pt: "Sim, aqui tem. Inclua também o seguro e ponha o GPS em inglês, por favor.",
            romaji: "Hai, douzo. Hoken mo tsukete, kaanabi o eigo ni onegaishimasu.",
          },
          {
            speaker: "スタッフ",
            text: "分かりました|！|帰る|まえ|に|近く|の|ガソリンスタンド|で|まんたん|に|して|ください|。",
            pt: "Compreendido! Antes de devolver, ateste o depósito na bomba aqui perto, por favor.",
            romaji: "Wakarimashita! Kaeru mae ni chikaku no gasorin sutando de mantan ni shite kudasai.",
          },
        ],
      },
    },
  },
  {
    id: "vestuario",
    emoji: "🧥",
    title: "Roupa, Calçado, Tamanhos & Lavandaria",
    subtitle: "Provadores, pedir outro número, tecidos, bainhas e limpeza a seco",
    tag: "Dia-a-dia",
    color: "var(--color-coral)",
    softColor: "var(--color-coral-soft)",
    relatedLevels: [8, 21, 30],
    byLang: {
      en: {
        vocabKeys: [
          "fitting room",
          "try on",
          "size",
          "tight",
          "loose",
          "cotton",
          "waterproof",
          "dry cleaning",
          "stain",
          "tailor",
        ],
        phrases: [
          {
            text: "Excuse me, could I try this jacket on? Where is the fitting room?",
            pt: "Com licença, posso experimentar este casaco? Onde fica o provador?",
            register: "neutro",
            whenToUse: "Em qualquer loja de roupa ou grandes armazéns",
          },
          {
            text: "These shoes feel a bit tight — do you have them half a size bigger?",
            pt: "Estes sapatos estão um pouco apertados — têm meio número acima?",
            register: "neutro",
            whenToUse: "Na sapataria (atenção: 40 EU corresponde aprox. a UK 6.5 / US 7.5–8.5!)",
          },
          {
            text: "Is this sweater pure cotton, and is the coat waterproof?",
            pt: "Esta camisola é de puro algodão, e o casaco é impermeável?",
            register: "neutro",
            whenToUse: "Ao verificar a etiqueta de materiais antes do Inverno ou chuva",
          },
          {
            text: "The waist is a little loose — does your store have a tailor for alterations?",
            pt: "A cintura está um pouco larga — a loja tem alfaiate para arranjos?",
            register: "formal",
            whenToUse: "Ao comprar calças, fatos ou vestidos",
          },
          {
            text: "Hi, I need dry cleaning for this coat — can you get this coffee stain out?",
            pt: "Olá, preciso de limpeza a seco para este sobretudo — conseguem tirar esta nódoa de café?",
            register: "neutro",
            whenToUse: "Na lavandaria / limpeza a seco («dry cleaner's»)",
          },
        ],
        culturalTip:
          "Os tamanhos de calçado e roupa mudam bastante entre a Europa (38/40/42), o Reino Unido (UK 5/6/8) e os EUA (US 7/8/10) — pede sempre para experimentar («try on») e guarda o «receipt» para trocas!",
        situations: [
          {
            id: "en-clo-1",
            situationPt: "Pegaste numa camisa e queres saber onde a podes experimentar.",
            register: "neutro",
            correct: "Excuse me, can I try this on? Where is the fitting room?",
            options: [
              "Excuse me, can I try this on? Where is the fitting room?",
              "Excuse me, where is the toll booth for this cotton?",
              "Can I refuel this jacket at the roundabout?",
              "Is this stain subtitled or dubbed?",
            ],
            explanationPt: "«Try on» (experimentar roupa/calçado) e «fitting room» (ou «changing room» no UK) são indispensáveis.",
          },
          {
            id: "en-clo-2",
            situationPt: "Experimentaste umas calças mas ficaram apertadas; queres o tamanho acima.",
            register: "neutro",
            correct: "These are a bit tight — have you got the next size up?",
            options: [
              "These are a bit tight — have you got the next size up?",
              "These are a bit waterproof — have you got a flat tyre?",
              "Can I declare these trousers at customs?",
              "My size has a zero deductible.",
            ],
            explanationPt: "«Tight» = apertado; «loose» = largo; «the next size up/down» = o tamanho acima/abaixo.",
          },
          {
            id: "en-clo-3",
            situationPt: "Entornaste café num casaco delicado e levas à lavandaria.",
            register: "neutro",
            correct: "Could you dry-clean this coat and remove the stain on the sleeve?",
            options: [
              "Could you dry-clean this coat and remove the stain on the sleeve?",
              "Could you warm up this coat in the stadium?",
              "Does this stain include a student discount?",
              "Please lend my tailor to the petrol station.",
            ],
            explanationPt: "«Dry cleaning» (limpeza a seco) e «stain» (nódoa) resolvem qualquer imprevisto com roupa.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Excuse me, do you have this waterproof jacket in medium size?",
            pt: "Com licença, têm este casaco impermeável no tamanho médio?",
          },
          {
            speaker: "Shop Assistant",
            text: "Here is a medium! The fitting room is right over there by the mirror.",
            pt: "Aqui tem um M! O provador fica logo ali ao pé do espelho.",
          },
          {
            speaker: "Tu",
            text: "Thanks! The shoulders feel a little tight — could I try on a large instead?",
            pt: "Obrigado! Os ombros estão um pouco apertados — posso experimentar um L?",
          },
          {
            speaker: "Shop Assistant",
            text: "Of course, the large fits much better! Keep your receipt for thirty days in case you need an exchange.",
            pt: "Claro, o L assenta muito melhor! Guarde o talão durante trinta dias caso precise de trocar.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "cabine d'essayage",
          "essayer",
          "pointure",
          "taille",
          "serré",
          "large",
          "coton",
          "imperméable",
          "pressing",
          "tache",
        ],
        phrases: [
          {
            text: "Bonjour, puis-je essayer ce manteau ? Où sont les cabines d'essayage ?",
            pt: "Bom dia, posso experimentar este casaco? Onde ficam os provadores?",
            register: "formal",
            whenToUse: "Ao entrar numa loja de roupa em França (lembra-te do «Bonjour» à entrada!)",
          },
          {
            text: "C'est un peu serré aux épaules — auriez-vous la taille au-dessus ?",
            pt: "Está um pouco apertado nos ombros — teria o tamanho acima?",
            register: "formal",
            whenToUse: "Usa «la taille» para roupa e «la pointure» exclusivamente para calçado!",
          },
          {
            text: "Excusez-moi, avez-vous ces chaussures en pointure quarante et un ?",
            pt: "Com licença, têm estes sapatos no número quarenta e um?",
            register: "formal",
            whenToUse: "Felizmente a numeração francesa de calçado é igual à portuguesa (EU)!",
          },
          {
            text: "Est-ce que cette veste est vraiment imperméable pour la pluie ?",
            pt: "Este blusão é mesmo impermeável para a chuva?",
            register: "neutro",
            whenToUse: "«Un imperméable» (ou «un imper») significa também gabardina!",
          },
          {
            text: "Bonjour, je dépose ma chemise au pressing pour enlever cette tache.",
            pt: "Bom dia, venho deixar a minha camisa na limpeza a seco para tirar esta nódoa.",
            register: "formal",
            whenToUse: "Atenção ao falso anglicismo francês: «le pressing» não é ginásio nem imprensa — é a lavandaria a seco!",
          },
        ],
        culturalTip:
          "Falso amigo inglês dentro do francês: em França, «le pressing» significa lavandaria / limpeza a seco (e não passar a ferro, que é «repasser»), e «un smoking» é o fato de gala (smoking/tuxedo)!",
        situations: [
          {
            id: "fr-clo-1",
            situationPt: "Estás numa sapataria em Bordéus e queres pedir uns ténis no número 39.",
            register: "formal",
            correct: "Bonjour, auriez-vous ce modèle en pointure trente-neuf ?",
            options: [
              "Bonjour, auriez-vous ce modèle en pointure trente-neuf ?",
              "Bonjour, quelle est la franchise de ce coton ?",
              "Puis-je essayer ce pneu crevé au pressing ?",
              "Avez-vous une tache avec assurance tous risques ?",
            ],
            explanationPt: "Para calçado usa-se sempre «la pointure» (e não «la taille»).",
          },
          {
            id: "fr-clo-2",
            situationPt: "As calças ficaram largas demais na cintura e queres o tamanho abaixo.",
            register: "neutro",
            correct: "Ce pantalon est trop large — avez-vous la taille en dessous ?",
            options: [
              "Ce pantalon est trop large — avez-vous la taille en dessous ?",
              "Ce pantalon est au péage de la station-service.",
              "La cabine d'essayage est déjà complète au stade.",
              "Je voudrais porter un toast à ma chemise.",
            ],
            explanationPt: "«Trop large» = demasiado largo; «la taille en dessous» = o tamanho abaixo.",
          },
          {
            id: "fr-clo-3",
            situationPt: "Precisas de mandar limpar a seco um casaco com uma nódoa.",
            register: "formal",
            correct: "Bonjour, pouvez-vous nettoyer ce manteau au pressing et enlever cette tache ?",
            options: [
              "Bonjour, pouvez-vous nettoyer ce manteau au pressing et enlever cette tache ?",
              "Bonjour, pouvez-vous garer ma chemise au parking ?",
              "Est-ce que cette tache passe en VOSTFR ?",
              "Je viens emprunter une pointure à la douane.",
            ],
            explanationPt: "«Le pressing» é a limpeza a seco e «enlever une tache» é tirar uma nódoa.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Bonjour ! Est-ce que je peux essayer cet imperméable en taille M ?",
            pt: "Bom dia! Posso experimentar esta gabardina no tamanho M?",
          },
          {
            speaker: "Vendeuse",
            text: "Bien sûr ! Les cabines d'essayage sont au fond du magasin à gauche.",
            pt: "Claro! Os provadores ficam ao fundo da loja à esquerda.",
          },
          {
            speaker: "Tu",
            text: "Il est un peu serré avec un pull — auriez-vous la taille au-dessus ?",
            pt: "Fica um pouco apertada com uma camisola — teria o tamanho acima?",
          },
          {
            speaker: "Vendeuse",
            text: "Voici le L en coton imperméable — il vous va très bien !",
            pt: "Aqui tem o L em algodão impermeável — fica-lhe muito bem!",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "しちゃくしつ",
          "しちゃく",
          "サイズ",
          "きつい",
          "ゆるい",
          "めん",
          "ぼうすい",
          "クリーニング",
          "しみ",
          "おなおし",
        ],
        phrases: [
          {
            text: "すみません|、|これ|を|しちゃく|しても|いい|ですか|。",
            pt: "Com licença, posso experimentar esta peça?",
            romaji: "Sumimasen, kore o shichaku shite mo ii desu ka.",
            register: "formal",
            whenToUse: "Nas lojas de roupa no Japão tira-se SEMPRE os sapatos antes de pisar o tapete do provador («試着室»)!",
          },
          {
            text: "少し|きつい|ので|、|もう|一つ|大きい|サイズ|は|あります|か|。",
            pt: "Está um pouco apertado; têm um tamanho acima?",
            romaji: "Sukoshi kitsui node, mou hitotsu ookii saizu wa arimasu ka.",
            register: "formal",
            whenToUse: "Os tamanhos japoneses costumam ser um número mais pequenos do que os europeus!",
          },
          {
            text: "この|くつ|は|二十六|センチ|が|あります|か|。",
            pt: "Têm estes sapatos no tamanho vinte e seis centímetros?",
            romaji: "Kono kutsu wa nijuu-roku senchi ga arimasu ka.",
            register: "formal",
            whenToUse: "No Japão o calçado mede-se directamente em centímetros (ex.: 40 EU ≈ 25.5 cm; 42 EU ≈ 26.5–27 cm)!",
          },
          {
            text: "ズボン|が|長い|ので|、|すそ|の|おなおし|を|おねがいします|。",
            pt: "As calças estão compridas; gostaria de pedir para fazer a bainha, por favor.",
            romaji: "Zubon ga nagai node, suso no onaoshi o onegaishimasu.",
            register: "formal",
            whenToUse: "Muitas lojas japonesas (como a Uniqlo) fazem bainhas («すそのおなおし») na hora!",
          },
          {
            text: "この|しみ|を|クリーニング|で|おとせますか|。",
            pt: "Conseguem tirar esta nódoa na limpeza a seco?",
            romaji: "Kono shimi o kuriiningu de otosemasu ka.",
            register: "formal",
            whenToUse: "Na lavandaria («クリーニング店»)",
          },
        ],
        culturalTip:
          "Etiqueta essencial nos provadores («しちゃくしつ») no Japão: descalça os sapatos antes de entrar no tapete e, se usares maquilhagem, o funcionário dar-te-á uma touca descartável («フェイスカバー») para proteger a roupa ao vestir!",
        situations: [
          {
            id: "ja-clo-1",
            situationPt: "Encontraste um casaco numa loja em Tóquio e queres pedir para o experimentar.",
            register: "formal",
            correct: "すみません、これを しちゃくしても いいですか。",
            options: [
              "すみません、これを しちゃくしても いいですか。",
              "これを まんたんに しても いいですか。",
              "しちゃくしつの しょうひきげんは いつですか。",
              "この しみを かります。",
            ],
            explanationPt: "«しちゃくしてもいいですか» é a frase exacta para pedir acesso ao provador.",
          },
          {
            id: "ja-clo-2",
            situationPt: "A camisola ficou apertada e precisas de um tamanho maior.",
            register: "formal",
            correct: "少し きついので、大きい サイズは ありますか。",
            options: [
              "少し きついので、大きい サイズは ありますか。",
              "少し ゆるいので、駐車場は ありますか。",
              "クリーニングを 二杯 ください。",
              "この めんは うりきれです。",
            ],
            explanationPt: "«きつい» = apertado; «ゆるい» = largo; «大きいサイズ» = tamanho maior.",
          },
          {
            id: "ja-clo-3",
            situationPt: "Compraste umas calças compridas e queres pedir o ajuste da bainha na loja.",
            register: "formal",
            correct: "すみません、すその おなおしを おねがいします。",
            options: [
              "すみません、すその おなおしを おねがいします。",
              "すみません、カーナビを 英語に おねがいします。",
              "ぼうすいの チケットを 二枚 ください。",
              "ただいま、クリーニングです。",
            ],
            explanationPt: "«すそのおなおし» (arranjo da bainha) é rápido e muitas vezes gratuito nas lojas japonesas.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "すみません|、|この|ぼうすい|ジャケット|を|しちゃく|しても|いい|ですか|。",
            pt: "Com licença, posso experimentar este blusão impermeável?",
            romaji: "Sumimasen, kono bousui jaketto o shichaku shite mo ii desu ka.",
          },
          {
            speaker: "店員",
            text: "はい|、|どうぞ|！|くつ|を|ぬいで|、|こちら|の|しちゃくしつ|へ|お入り|ください|。",
            pt: "Sim, faça favor! Descalce os sapatos e entre neste provador, por favor.",
            romaji: "Hai, douzo! Kutsu o nuide, kochira no shichakushitsu e ohairi kudasai.",
          },
          {
            speaker: "Tu",
            text: "ありがとうございます|。|少し|きつい|ので|、|もう|一つ|大きい|サイズ|は|あります|か|。",
            pt: "Obrigado. Está um pouco apertado; têm um tamanho acima?",
            romaji: "Arigatou gozaimasu. Sukoshi kitsui node, mou hitotsu ookii saizu wa arimasu ka.",
          },
          {
            speaker: "店員",
            text: "はい|、|エル|サイズ|が|ございます|。|すぐ|おもちします|！",
            pt: "Sim, temos o tamanho L. Vou já buscá-lo!",
            romaji: "Hai, eru saizu ga gozaimasu. Sugu omochishimasu!",
          },
        ],
      },
    },
  },
  {
    id: "clima",
    emoji: "🌦️",
    title: "Clima, Natureza, Trilhos & Alertas",
    subtitle: "Previsão meteorológica, vagas de calor, chuvadas, tufões, sismos e trilhos",
    tag: "Natureza",
    color: "var(--color-teal)",
    softColor: "var(--color-teal-soft)",
    relatedLevels: [14, 29, 38],
    byLang: {
      en: {
        vocabKeys: [
          "weather forecast",
          "heatwave",
          "downpour",
          "thunderstorm",
          "hiking trail",
          "sunscreen",
          "shade",
          "slippery",
          "shelter",
          "chilly",
        ],
        phrases: [
          {
            text: "Have you checked the weather forecast? They're expecting a thunderstorm later.",
            pt: "Já viste a previsão do tempo? Estão a prever trovoada mais logo.",
            register: "neutro",
            whenToUse: "Antes de sair para passear ou planear actividades ao ar livre",
          },
          {
            text: "Put on plenty of sunscreen and stay in the shade during this heatwave.",
            pt: "Põe bastante protector solar e fica à sombra durante esta vaga de calor.",
            register: "informal",
            whenToUse: "Em dias de verão intenso na praia ou cidade",
          },
          {
            text: "Excuse me, is this hiking trail safe after yesterday's downpour, or is it too slippery?",
            pt: "Com licença, este trilho pedestre é seguro depois da chuvada de ontem, ou está demasiado escorregadio?",
            register: "neutro",
            whenToUse: "Num centro de visitantes de parque natural ou montanha",
          },
          {
            text: "Let's wait under that shelter until the heavy rain stops.",
            pt: "Vamos esperar debaixo daquele abrigo até a chuva forte parar.",
            register: "informal",
            whenToUse: "Quando és surpreendido por um aguaceiro repentino",
          },
          {
            text: "Bring a light jacket — it gets chilly in the evening by the coast.",
            pt: "Traz um casaco leve — fica fresquinho à noite junto à costa.",
            register: "informal",
            whenToUse: "«Chilly» descreve aquele frio ligeiro que pede agasalho",
          },
        ],
        culturalTip:
          "No Reino Unido falar do tempo («Lovely day, isn't it?» / «Bit chilly today!») é a forma número um de quebrar o gelo em elevadores, lojas e paragens — não é uma pergunta técnica, é simpatia social!",
        situations: [
          {
            id: "en-wea-1",
            situationPt: "Vais fazer uma caminhada na serra após um dia de chuva e queres saber o estado do caminho.",
            register: "neutro",
            correct: "Is the hiking trail slippery after the rain?",
            options: [
              "Is the hiking trail slippery after the rain?",
              "Is the thunderstorm dry cleaning only?",
              "Does this heatwave have a zero deductible?",
              "Where is the fitting room for the sunscreen?",
            ],
            explanationPt: "«Hiking trail» (trilho pedestre) e «slippery» (escorregadio) ajudam a evitar acidentes.",
          },
          {
            id: "en-wea-2",
            situationPt: "Está um calor abrasador ao meio-dia e sugeres procurar uma mesa à sombra e usar protector.",
            register: "informal",
            correct: "Let's sit in the shade and put on some sunscreen.",
            options: [
              "Let's sit in the shade and put on some sunscreen.",
              "Let's pay the toll in the downpour.",
              "Could I try on a chilly roundabout?",
              "Keep the recipe for the weather forecast.",
            ],
            explanationPt: "«In the shade» = à sombra (não confundir com «shadow», que é a silhueta proyectada!).",
          },
          {
            id: "en-wea-3",
            situationPt: "Começa uma trovoada forte e vês um coberto onde esperar.",
            register: "neutro",
            correct: "There's a thunderstorm coming — let's find shelter quickly!",
            options: [
              "There's a thunderstorm coming — let's find shelter quickly!",
              "The heatwave is half a size bigger!",
              "Our sunscreen has a flat tyre!",
              "Nothing to declare at the chilly!",
            ],
            explanationPt: "«Find shelter» / «take shelter» significa abrigar-se do mau tempo.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Did you see the weather forecast for our hike tomorrow morning?",
            pt: "Viste a previsão do tempo para a nossa caminhada de amanhã de manhã?",
          },
          {
            speaker: "Ranger",
            text: "Sunny early on, though chilly at the top, with a chance of a brief downpour after three.",
            pt: "Sol cedo, embora fresco no topo, com hipótese de um aguaceiro curto depois das três.",
          },
          {
            speaker: "Tu",
            text: "Good to know! Are the rocks on the main hiking trail slippery right now?",
            pt: "Bom saber! As pedras no trilho principal estão escorregadias neste momento?",
          },
          {
            speaker: "Ranger",
            text: "Only near the river — bring waterproof shoes, sunscreen, and note the wooden shelter halfway up.",
            pt: "Só perto do rio — tragam calçado impermeável, protector solar e reparem no abrigo de madeira a meio da subida.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "météo",
          "canicule",
          "averse",
          "orage",
          "sentier",
          "crème solaire",
          "ombre",
          "glissant",
          "abri",
          "frais",
        ],
        phrases: [
          {
            text: "Tu as regardé la météo ? On annonce un orage en fin d'après-midi.",
            pt: "Viste a meteorologia? Anunciam trovoada ao fim da tarde.",
            register: "informal",
            whenToUse: "«La météo» usa-se tanto para o boletim como para o estado do tempo!",
          },
          {
            text: "Pendant la canicule, pensez à boire de l'eau et à rester à l'ombre.",
            pt: "Durante a vaga de calor, lembre-se de beber água e ficar à sombra.",
            register: "formal",
            whenToUse: "Aviso frequente nos transportes e parques franceses no Verão («Plan Canicule»)",
          },
          {
            text: "Excusez-moi, est-ce que le sentier de randonnée est glissant après l'averse ?",
            pt: "Com licença, o trilho de caminhada está escorregadio depois do aguaceiro?",
            register: "formal",
            whenToUse: "Nos Alpes, Pirenéus ou parques naturais",
          },
          {
            text: "N'oublie pas la crème solaire, le soleil tape fort aujourd'hui !",
            pt: "Não te esqueças do protector solar, o sol está forte hoje!",
            register: "informal",
            whenToUse: "Na praia, esplanada ou passeio de montanha",
          },
          {
            text: "Mets une petite veste, le vent devient frais le soir.",
            pt: "Veste um casaco leve, o vento fica fresco à noite.",
            register: "informal",
            whenToUse: "Ao sair para jantar numa esplanada",
          },
        ],
        culturalTip:
          "Atenção em francês: para dizer «está calor / está frio» sobre o tempo usa-se «Il fait chaud / Il fait frais / Il fait froid» — nunca «C'est chaud» (que significa 'está perigoso/tenso' na gíria) nem «Je suis chaud» ('estou entusiasmado/alinhado')!",
        situations: [
          {
            id: "fr-wea-1",
            situationPt: "Está uma vaga de calor em França e queres pedir uma mesa à sombra na esplanada.",
            register: "formal",
            correct: "Bonjour, auriez-vous une table à l'ombre avec cette canicule ?",
            options: [
              "Bonjour, auriez-vous une table à l'ombre avec cette canicule ?",
              "Bonjour, auriez-vous un orage au pressing ?",
              "Le sentier passe en bagage cabine ?",
              "Quelle est la pointure de cette averse ?",
            ],
            explanationPt: "«À l'ombre» (à sombra) e «la canicule» (vaga de calor) ouvem-se durante todo o Verão.",
          },
          {
            id: "fr-wea-2",
            situationPt: "Cai um aguaceiro forte e sugeres esperar debaixo de um abrigo.",
            register: "informal",
            correct: "C'est une grosse averse, mettons-nous sous cet abri cinq minutes !",
            options: [
              "C'est une grosse averse, mettons-nous sous cet abri cinq minutes !",
              "Mettons la crème solaire au péage !",
              "Ce sentier a une franchise trop serrée !",
              "Je dépose la météo dans la cabine d'essayage !",
            ],
            explanationPt: "«Une averse» é uma chuvada passageira; «se mettre à l'abri / sous un abri» é abrigar-se.",
          },
          {
            id: "fr-wea-3",
            situationPt: "Queres avisar um amigo para ter cuidado porque o trilho de pedra escorrega.",
            register: "informal",
            correct: "Fais attention, le sentier est très glissant après la pluie !",
            options: [
              "Fais attention, le sentier est très glissant après la pluie !",
              "Le sentier est déjà complet à la billetterie !",
              "L'orage roule au gazole !",
              "Voici mon permis de conduire frais !",
            ],
            explanationPt: "«Glissant» significa escorregadio (muito comum em placas «Sol glissant»).",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Bonjour ! Nous voudrions marcher jusqu'au lac — que dit la météo aujourd'hui ?",
            pt: "Bom dia! Gostaríamos de caminhar até ao lago — o que diz a meteorologia hoje?",
          },
          {
            speaker: "Guide",
            text: "Il fait beau ce matin, mais un petit orage est possible vers seize heures.",
            pt: "Está bom tempo esta manhã, mas é possível uma pequena trovoada por volta das dezasseis horas.",
          },
          {
            speaker: "Tu",
            text: "Merci ! Le sentier est-il glissant, et y a-t-il un abri sur la route ?",
            pt: "Obrigado! O trilho está escorregadio, e há algum abrigo pelo caminho?",
          },
          {
            speaker: "Guide",
            text: "Non, le chemin est sec : prenez de la crème solaire et un coupe-vent, il fait frais là-haut !",
            pt: "Não, o caminho está seco: levem protector solar e um corta-vento, está fresco lá em cima!",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "てんきよほう",
          "台風",
          "じしん",
          "ひなんじょ",
          "蒸し暑い",
          "日焼け止め",
          "ハイキング",
          "かさ",
          "すべりやすい",
          "すずしい",
        ],
        phrases: [
          {
            text: "てんきよほう|に|よると|、|午後|から|強い|雨|が|ふります|。",
            pt: "Segundo a previsão do tempo, vai chover forte a partir da tarde.",
            romaji: "Tenki yohou ni yoru to, gogo kara tsuyoi ame ga furimasu.",
            register: "neutro",
            whenToUse: "«〜によると» ('segundo / de acordo com') é super útil para citar notícias e avisos!",
          },
          {
            text: "台風|で|電車|が|止まって|います|か|。",
            pt: "Os comboios estão parados por causa do tufão?",
            romaji: "Taifuu de densha ga tomatte imasu ka.",
            register: "formal",
            whenToUse: "Entre Agosto e Outubro no Japão, os tufões podem suspender o Shinkansen e os voos",
          },
          {
            text: "じしん|です|！|あわてないで|、|近く|の|ひなんじょ|は|どこ|ですか|。",
            pt: "É um sismo! Sem pânico — onde fica o local de evacuação mais próximo?",
            romaji: "Jishin desu! Awatenaide, chikaku no hinanjo wa doko desu ka.",
            register: "formal",
            whenToUse: "Frase vital de segurança no Japão: as escolas e parques funcionam como «避難所» (ひなんじょ)!",
          },
          {
            text: "今日|は|とても|蒸し暑い|から|、|水|と|日焼け止め|を|わすれないで|ね|。",
            pt: "Hoje está muito quente e húmido, por isso não te esqueças de água e protector solar.",
            romaji: "Kyou wa totemo mushiatsui kara, mizu to hiyakedome o wasurenaide ne.",
            register: "informal",
            whenToUse: "O verão japonês é famoso pelo calor húmido («蒸し暑い» — mushiatsui)!",
          },
          {
            text: "雨|の|あと|で|道|が|すべりやすい|です|。|きをつけて|ください|。",
            pt: "O caminho está escorregadio depois da chuva. Tenha cuidado, por favor.",
            romaji: "Ame no ato de michi ga suberiyasui desu. Ki o tsukete kudasai.",
            register: "formal",
            whenToUse: "Em degraus de templos, estações ou trilhos de montanha",
          },
        ],
        culturalTip:
          "No Japão, descarrega uma aplicação de alertas sísmicos e meteorológicos (como «Safety tips» ou «NERV»): verás placas verdes com uma pessoa a correr que indicam o «避難所» (ひなんじょ — abrigo de evacuação) em todos os bairros!",
        situations: [
          {
            id: "ja-wea-1",
            situationPt: "Aproxima-se um tufão e queres perguntar na estação se a linha de comboio parou.",
            register: "formal",
            correct: "すみません、台風で 電車が 止まって いますか。",
            options: [
              "すみません、台風で 電車が 止まって いますか。",
              "すみません、台風を しちゃくしても いいですか。",
              "じしんを まんたんで おねがいします。",
              "日焼け止めの すそを おなおしして ください。",
            ],
            explanationPt: "«台風で電車が止まっていますか» confirma se a circulação ferroviária foi suspensa.",
          },
          {
            id: "ja-wea-2",
            situationPt: "Sentes um tremor de terra e queres saber qual é o ponto oficial de abrigo do bairro.",
            register: "formal",
            correct: "すみません、近くの ひなんじょは どこですか。",
            options: [
              "すみません、近くの ひなんじょは どこですか。",
              "蒸し暑い サイズは ありますか。",
              "かさの しょうひきげんは 今日です。",
              "ハイキングを クリーニングで おとせますか。",
            ],
            explanationPt: "«ひなんじょ» (避難所) é o ponto de evacuação e abrigo designado em cada zona.",
          },
          {
            id: "ja-wea-3",
            situationPt: "Vais subir um trilho no Verão húmido japonês e lembras o teu amigo do protector solar.",
            register: "informal",
            correct: "今日は 蒸し暑いから、日焼け止めと 水を もっていこう！",
            options: [
              "今日は 蒸し暑いから、日焼け止めと 水を もっていこう！",
              "今日は 寒いから、レンタカーを 食べよう！",
              "道が きつい サイズだから、かさを かします！",
              "てんきよほうは うりきれです！",
            ],
            explanationPt: "«蒸し暑い» (quente e húmido) e «日焼け止め» (protector solar) são essenciais de Junho a Setembro.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "明日|の|ハイキング|です|が|、|てんきよほう|を|見ました|か|。",
            pt: "Sobre a caminhada de amanhã, já viste a previsão do tempo?",
            romaji: "Ashita no haikingu desu ga, tenki yohou o mimashita ka.",
          },
          {
            speaker: "けんた",
            text: "うん|、|朝|は|すずしい|けれど|、|昼|は|蒸し暑い|みたい|だ|よ|。",
            pt: "Sim, parece que de manhã está fresco, mas ao almoço vai estar quente e abafado.",
            romaji: "Un, asa wa suzushii keredo, hiru wa mushiatsui mitai da yo.",
          },
          {
            speaker: "Tu",
            text: "なるほど|！|日焼け止め|と|おりたたみ|の|かさ|も|もっていきます|。",
            pt: "Percebido! Vou levar protector solar e também um guarda-chuva dobrável.",
            romaji: "Naruhodo! Hiyakedome to oritatami no kasa mo motte ikimasu.",
          },
          {
            speaker: "けんた",
            text: "いいね|！|山|の|道|は|すべりやすい|ところ|が|ある|から|、|きをつけよう|。",
            pt: "Boa! O caminho da montanha tem partes escorregadias, por isso vamos ter cuidado.",
            romaji: "Ii ne! Yama no michi wa suberiyasui tokoro ga aru kara, ki o tsukeyou.",
          },
        ],
      },
    },
  },
  {
    id: "desporto",
    emoji: "⚽",
    title: "Desporto, Jogos, Estádio & Equipa",
    subtitle: "Futebol, apoiar no estádio, reservar campo, resultado e jogar com amigos",
    tag: "Lazer",
    color: "var(--color-yellow)",
    softColor: "var(--color-yellow-soft)",
    relatedLevels: [17, 23, 40],
    byLang: {
      en: {
        vocabKeys: [
          "match",
          "stadium",
          "score",
          "draw",
          "team",
          "coach",
          "warm up",
          "pitch",
          "referee",
          "supporter",
        ],
        phrases: [
          {
            text: "What's the score so far, and which team are you supporting?",
            pt: "Qual é o resultado até agora, e que equipa estás a apoiar?",
            register: "informal",
            whenToUse: "Ao ver um jogo num café desportivo ou no estádio",
          },
          {
            text: "It was a thrilling match — it ended in a two-all draw in the last minute!",
            pt: "Foi um jogo emocionante — terminou num empate a dois no último minuto!",
            register: "neutro",
            whenToUse: "Em inglês um empate 2–2 diz-se «two-all» e 0–0 diz-se «nil-nil»!",
          },
          {
            text: "Excuse me, which gate leads to block B of the stadium?",
            pt: "Com licença, que porta dá acesso ao sector B do estádio?",
            register: "neutro",
            whenToUse: "Ao chegar a um estádio ou arena desportiva",
          },
          {
            text: "We booked a five-a-side pitch for Thursday evening — want to join our team?",
            pt: "Reservámos um campo de futebol de cinco para quinta à noite — queres juntar-te à nossa equipa?",
            register: "informal",
            whenToUse: "Excelente forma de fazer amigos locais através de desporto amador!",
          },
          {
            text: "Let's warm up properly for ten minutes so we don't pull a muscle.",
            pt: "Vamos aquecer bem durante dez minutos para não fazermos uma distensão.",
            register: "informal",
            whenToUse: "Antes de correr, jogar futebol, ténis ou basquetebol",
          },
        ],
        culturalTip:
          "No Reino Unido diz-se «football» e «pitch» (campo) e o zero no marcador lê-se «nil» («two-nil» = 2–0); nos EUA e Canadá diz-se «soccer», «field» e «two-zero»!",
        situations: [
          {
            id: "en-spo-1",
            situationPt: "Chegaste a meio da transmissão de um jogo e queres saber quanto está o resultado.",
            register: "informal",
            correct: "Hey, what's the score so far?",
            options: [
              "Hey, what's the score so far?",
              "Hey, what's the deductible of the referee?",
              "Is the stadium dry cleaning only?",
              "Did the coach expire in the shade?",
            ],
            explanationPt: "«What's the score?» pergunta o resultado actual ou final da partida.",
          },
          {
            id: "en-spo-2",
            situationPt: "O jogo terminou 1–1 sem vencedor e estás a contar a um colega.",
            register: "neutro",
            correct: "It was a close match — it ended in a draw.",
            options: [
              "It was a close match — it ended in a draw.",
              "The pitch had a flat tyre at customs.",
              "We tried on the supporter in the fitting room.",
              "The thunderstorm scored a receipt.",
            ],
            explanationPt: "«End in a draw» (UK) / «tie» (US) significa terminar empatado.",
          },
          {
            id: "en-spo-3",
            situationPt: "Vais jogar com amigos num dia frio e lembras o grupo de aquecer antes de começar.",
            register: "informal",
            correct: "Let's warm up for a few minutes before we start playing.",
            options: [
              "Let's warm up for a few minutes before we start playing.",
              "Let's pay the toll on the pitch.",
              "Could you tailor the referee's stain?",
              "Put sunscreen on the score.",
            ],
            explanationPt: "«Warm up» é fazer o aquecimento físico antes do desporto.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Hey Sam! Are you watching the big match on Saturday evening?",
            pt: "Olá Sam! Vais ver o grande jogo no sábado à noite?",
          },
          {
            speaker: "Sam",
            text: "Definitely! I managed to get two tickets at the stadium — want to come along?",
            pt: "Sem dúvida! Consegui arranjar dois bilhetes no estádio — queres vir comigo?",
          },
          {
            speaker: "Tu",
            text: "I'd love to! Last time those two teams played, it ended in a thrilling draw.",
            pt: "Adorava! Da última vez que essas duas equipas jogaram, acabou num empate emocionante.",
          },
          {
            speaker: "Sam",
            text: "True! Let's meet outside gate four early — the supporters create an amazing atmosphere!",
            pt: "Verdade! Encontramo-nos cedo à porta quatro — os adeptos criam um ambiente incrível!",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "match",
          "stade",
          "score",
          "match nul",
          "équipe",
          "entraîneur",
          "s'échauffer",
          "terrain",
          "arbitre",
          "supporter",
        ],
        phrases: [
          {
            text: "C'est combien le score ? Quelle équipe est-ce que tu supportes ?",
            pt: "Quanto está o resultado? Que equipa apoias?",
            register: "informal",
            whenToUse: "Ao assistir a futebol ou râguebi (muito popular no sul de França!)",
          },
          {
            text: "Quel match intense ! Les deux équipes ont fait match nul deux partout.",
            pt: "Que jogo intenso! As duas equipas empataram dois a dois.",
            register: "neutro",
            whenToUse: "«Faire match nul» = empatar; «deux partout» = 2–2; «zéro à zéro» = 0–0!",
          },
          {
            text: "Excusez-moi, par quelle porte entre-t-on pour la tribune nord du stade ?",
            pt: "Com licença, por que porta se entra para a bancada norte do estádio?",
            register: "formal",
            whenToUse: "No acesso ao estádio ou pavilhão desportivo",
          },
          {
            text: "On a réservé un terrain de foot à cinq jeudi soir — ça te dit de jouer ?",
            pt: "Reservámos um campo de futebol de cinco na quinta à noite — alinhas jogar?",
            register: "informal",
            whenToUse: "Convite descontraído entre colegas ou vizinhos",
          },
          {
            text: "Il faut bien s'échauffer pendant dix minutes avant d'entrer sur le terrain.",
            pt: "É preciso aquecer bem durante dez minutos antes de entrar em campo.",
            register: "neutro",
            whenToUse: "Antes de correr ou treinar com o clube",
          },
        ],
        culturalTip:
          "Em França, além do futebol («le foot»), o râguebi («le rugby»), o ténis (Roland-Garros) e o ciclismo (Tour de France) geram imensa conversa social no trabalho às segundas-feiras! Para encorajar a equipa grita-se «Allez les Bleus !».",
        situations: [
          {
            id: "fr-spo-1",
            situationPt: "Entras num café onde está a dar um jogo e perguntas quanto está o marcador.",
            register: "informal",
            correct: "Salut, c'est combien le score pour l'instant ?",
            options: [
              "Salut, c'est combien le score pour l'instant ?",
              "Quelle est la pointure de l'arbitre ?",
              "Le stade passe au pressing aujourd'hui ?",
              "Avez-vous une franchise pour ce match nul ?",
            ],
            explanationPt: "«C'est combien le score ?» (ou «Il y a combien ?») é a pergunta mais natural entre adeptos.",
          },
          {
            id: "fr-spo-2",
            situationPt: "Queres contar que o jogo acabou empatado sem vencedor.",
            register: "neutro",
            correct: "C'était très serré, ils ont fini sur un match nul.",
            options: [
              "C'était très serré, ils ont fini sur un match nul.",
              "L'entraîneur a eu une averse à la douane.",
              "Le terrain roule au sans-plomb.",
              "L'arbitre est sous un abri en coton.",
            ],
            explanationPt: "«Un match nul» designa qualquer empate desportivo.",
          },
          {
            id: "fr-spo-3",
            situationPt: "Convidaram-te para jogar e lembras o grupo de fazer aquecimento antes.",
            register: "informal",
            correct: "On prend cinq minutes pour bien s'échauffer avant le match !",
            options: [
              "On prend cinq minutes pour bien s'échauffer avant le match !",
              "On dépose l'équipe dans la cabine d'essayage !",
              "Mettons de la crème solaire sur le score !",
              "Payons le péage au supporter !",
            ],
            explanationPt: "«S'échauffer» significa aquecer os músculos antes do esforço físico.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Salut Lucas ! On cherche un joueur pour notre match sur le terrain couvert demain soir.",
            pt: "Olá Lucas! Estamos à procura de um jogador para o nosso jogo no campo coberto amanhã à noite.",
          },
          {
            speaker: "Lucas",
            text: "Carrément, avec plaisir ! Vous jouez à quelle heure ?",
            pt: "Sem dúvida, com todo o gosto! Jogam a que horas?",
          },
          {
            speaker: "Tu",
            text: "À dix-neuf heures, mais viens un peu en avance pour t'échauffer avec l'équipe.",
            pt: "Às dezanove horas, mas vem um pouco mais cedo para aqueceres com a equipa.",
          },
          {
            speaker: "Lucas",
            text: "Ça marche ! La dernière fois qu'on a joué, ça avait fini en match nul !",
            pt: "Combinado! Da última vez que jogámos, tinha acabado empatado!",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "しあい",
          "スタジアム",
          "てん",
          "ひきわけ",
          "チーム",
          "コーチ",
          "運動",
          "コート",
          "おうえん",
          "せんしゅ",
        ],
        phrases: [
          {
            text: "今|、|何たい何|ですか|。|どの|チーム|を|おうえん|して|います|か|。",
            pt: "Quanto está agora o resultado? Que equipa estás a apoiar?",
            romaji: "Ima, nan tai nan desu ka. Dono chiimu o ouen shite imasu ka.",
            register: "formal",
            whenToUse: "Para dizer resultados em japonês usa-se «対» (たい): «二たい一» = 2 a 1!",
          },
          {
            text: "きのう|の|サッカー|の|しあい|は|二たい二|の|ひきわけ|でした|。",
            pt: "O jogo de futebol de ontem terminou num empate dois a dois.",
            romaji: "Kinou no sakkaa no shiai wa ni tai ni no hikiwake deshita.",
            register: "neutro",
            whenToUse: "Ao conversar com colegas sobre a J-League, futebol europeu ou basebol",
          },
          {
            text: "今週末|、|スタジアム|へ|しあい|を|見に|行きませんか|。",
            pt: "Este fim-de-semana, queres ir ao estádio ver o jogo?",
            romaji: "Konshuumatsu, sutajiamu e shiai o mi ni ikimasen ka.",
            register: "formal",
            whenToUse: "Ir ver futebol (J-League) ou basebol (NPB) no Japão é uma experiência festiva e muito segura!",
          },
          {
            text: "フットサル|の|コート|を|予約|した|ので|、|いっしょに|やりませんか|。",
            pt: "Reservei um campo de futsal, queres jogar connosco?",
            romaji: "Futtosaru no kooto o yoyaku shita node, issho ni yarimasen ka.",
            register: "formal",
            whenToUse: "O futsal («フットサル») ao fim do trabalho é super popular nas cidades japonesas!",
          },
          {
            text: "けが|を|しない|ように|、|まず|少し|運動|して|あたためましょう|。",
            pt: "Para não nos lesionarmos, vamos primeiro aquecer um pouco.",
            romaji: "Kega o shinai you ni, mazu sukoshi undou shite atatamemashou.",
            register: "neutro",
            whenToUse: "Antes de começar uma partida ou corrida",
          },
        ],
        culturalTip:
          "Nos estádios japoneses («スタジアム»), as bancadas atrás das balizas são exclusivas para adeptos organizados da equipa da casa ou visitante (não uses a camisola adversária nesse sector!), e no fim muitos adeptos recolhem o próprio lixo num saco!",
        situations: [
          {
            id: "ja-spo-1",
            situationPt: "Queres convidar um colega para jogar futsal num campo que reservaste.",
            register: "formal",
            correct: "フットサルの コートを 予約したので、いっしょに やりませんか。",
            options: [
              "フットサルの コートを 予約したので、いっしょに やりませんか。",
              "スタジアムを クリーニングで おとせますか。",
              "せんしゅの しょうひきげんは 明日です。",
              "ひきわけを まんたんに してください。",
            ],
            explanationPt: "«コートを予約した» (reservei o campo) + «いっしょにやりませんか» é o convite perfeito.",
          },
          {
            id: "ja-spo-2",
            situationPt: "Perguntam-te quem ganhou o jogo de ontem, mas acabou empatado.",
            register: "neutro",
            correct: "いい しあいでしたが、一たい一の ひきわけでした。",
            options: [
              "いい しあいでしたが、一たい一の ひきわけでした。",
              "チームが 少し きつい サイズでした。",
              "おうえんは ひなんじょに あります。",
              "コーチに 日焼け止めを かしました。",
            ],
            explanationPt: "«ひきわけ» significa empate, e «一たい一» lê-se «ichi tai ichi» (1–1).",
          },
          {
            id: "ja-spo-3",
            situationPt: "Queres perguntar a um amigo japonês qual é o clube que ele apoia.",
            register: "neutro",
            correct: "どの チームを おうえんして いますか。",
            options: [
              "どの チームを おうえんして いますか。",
              "どの 駐車場を しちゃくして いますか。",
              "スタジアムは 蒸し暑いですか。",
              "てんを 二枚 つつんで ください。",
            ],
            explanationPt: "«おうえんする» (apoiar / torcer por) usa-se tanto para equipas como para encorajar amigos!",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "土曜日|に|スタジアム|で|サッカー|の|しあい|が|あります|ね|！",
            pt: "No sábado há jogo de futebol no estádio, não é!",
            romaji: "Doyoubi ni sutajiamu de sakkaa no shiai ga arimasu ne!",
          },
          {
            speaker: "たかし",
            text: "そう|です|！|私|の|すきな|せんしゅ|も|出る|から|、|おうえん|に|行きます|。",
            pt: "Exacto! O meu jogador favorito também vai jogar, por isso vou lá apoiar.",
            romaji: "Sou desu! Watashi no suki na senshu mo deru kara, ouen ni ikimasu.",
          },
          {
            speaker: "Tu",
            text: "たのしみ|です|ね|！|まえ|の|しあい|は|ひきわけ|でした|よね|。",
            pt: "Que entusiasmo! O jogo anterior ficou empatado, não foi?",
            romaji: "Tanoshimi desu ne! Mae no shiai wa hikiwake deshita yo ne.",
          },
          {
            speaker: "たかし",
            text: "はい|、|二たい二|でした|！|今度|は|チケット|が|二枚|ある|ので|、|いっしょに|行きませんか|。",
            pt: "Sim, ficou dois a dois! Desta vez tenho dois bilhetes, queres ir comigo?",
            romaji: "Hai, ni tai ni deshita! Kondo wa chiketto ga nimai aru node, issho ni ikimasen ka.",
          },
        ],
      },
    },
  },
  {
    id: "negociacao",
    emoji: "🤝",
    title: "Negociação, Orçamentos & Reclamações",
    subtitle: "Pedir orçamento por escrito, negociar condições, contestar facturas e garantia",
    tag: "Trabalho",
    color: "var(--color-lilac)",
    softColor: "var(--color-lilac-soft)",
    relatedLevels: [25, 47, 52],
    byLang: {
      en: {
        vocabKeys: [
          "quote",
          "invoice",
          "overcharge",
          "discount",
          "terms",
          "agreement",
          "compromise",
          "dispute",
          "customer support",
          "in writing",
        ],
        phrases: [
          {
            text: "Could you send us a detailed quote in writing before we approve the work?",
            pt: "Poderia enviar-nos um orçamento detalhado por escrito antes de aprovarmos o trabalho?",
            register: "formal",
            whenToUse: "Ao contratar serviços, reparações, freelancers ou fornecedores",
          },
          {
            text: "I noticed an overcharge on this invoice — it doesn't match the agreed quote.",
            pt: "Reparei numa cobrança a mais nesta factura — não coincide com o orçamento acordado.",
            register: "formal",
            whenToUse: "Para contestar educadamente um valor errado numa factura",
          },
          {
            text: "If we commit to a yearly agreement, would there be room for a ten percent discount?",
            pt: "Se nos comprometermos com um contrato anual, haveria margem para dez por cento de desconto?",
            register: "formal",
            whenToUse: "Fórmula diplomática inglesa para negociar preços comerciais sem soar agressivo",
          },
          {
            text: "Let's find a fair compromise on the delivery terms so it works for both sides.",
            pt: "Vamos encontrar um meio-termo justo nas condições de entrega para funcionar para ambos os lados.",
            register: "neutro",
            whenToUse: "Atenção ao falso amigo: «compromise» em inglês é acordo/concessão mútua, não 'compromisso' («commitment/appointment»)!",
          },
          {
            text: "I'd like to contact customer support to dispute this unexpected charge.",
            pt: "Gostaria de contactar o apoio ao cliente para contestar esta cobrança inesperada.",
            register: "formal",
            whenToUse: "Em telecomunicações, assinaturas digitais ou serviços bancários",
          },
        ],
        culturalTip:
          "Falso amigo crucial em negociações em inglês: «compromise» significa chegar a um meio-termo cedendo de parte a parte — para dizer «tenho um compromisso», usa «I have an appointment» ou «a commitment»!",
        situations: [
          {
            id: "en-neg-1",
            situationPt: "Antes de avançares com uma reparação em casa, queres o orçamento confirmado por e-mail.",
            register: "formal",
            correct: "Could you send me the quote in writing by email, please?",
            options: [
              "Could you send me the quote in writing by email, please?",
              "Could you warm up the invoice on the pitch?",
              "Is this overcharge waterproof in the shade?",
              "Let's try on customer support in the fitting room.",
            ],
            explanationPt: "«A quote» (ou «quotation») é o orçamento prévio; «in writing» garante prova escrita.",
          },
          {
            id: "en-neg-2",
            situationPt: "A factura final veio mais cara do que o valor combinado inicialmente.",
            register: "formal",
            correct: "Excuse me, there seems to be an overcharge on my invoice.",
            options: [
              "Excuse me, there seems to be an overcharge on my invoice.",
              "There seems to be a thunderstorm in my recipe.",
              "My agreement ended in a nil-nil draw.",
              "Does this dispute come in pure cotton?",
            ],
            explanationPt: "«There seems to be an overcharge…» é firme, profissional e muito eficaz.",
          },
          {
            id: "en-neg-3",
            situationPt: "As duas equipas têm prazos diferentes e queres propor uma solução intermédia.",
            register: "neutro",
            correct: "Can we reach a reasonable compromise on the terms?",
            options: [
              "Can we reach a reasonable compromise on the terms?",
              "Can we park the discount at the roundabout?",
              "Have you got a flat tyre on your invoice?",
              "Nothing to declare at customer support.",
            ],
            explanationPt: "«Reach a compromise» significa chegar a um consenso equilibrado.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Hello! Thank you for sending the quote, though the total is slightly above our budget.",
            pt: "Olá! Obrigado por enviar o orçamento, embora o total esteja ligeiramente acima do nosso orçamento.",
          },
          {
            speaker: "Supplier",
            text: "I understand. Which terms would help us reach an agreement?",
            pt: "Compreendo. Que condições nos ajudariam a chegar a um acordo?",
          },
          {
            speaker: "Tu",
            text: "If we sign for twelve months, could we agree on a ten percent discount as a compromise?",
            pt: "Se assinarmos por doze meses, poderíamos acordar dez por cento de desconto como meio-termo?",
          },
          {
            speaker: "Supplier",
            text: "That works for us — I'll confirm the updated quote and invoice schedule in writing today.",
            pt: "Funciona para nós — confirmo hoje por escrito o orçamento actualizado e o calendário de facturação.",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "devis",
          "facture",
          "surfacturation",
          "remise",
          "conditions",
          "accord",
          "compromis",
          "réclamation",
          "service client",
          "par écrit",
        ],
        phrases: [
          {
            text: "Pourriez-vous m'envoyer un devis détaillé par écrit avant le début des travaux ?",
            pt: "Poderia enviar-me um orçamento detalhado por escrito antes do início dos trabalhos?",
            register: "formal",
            whenToUse: "Em França qualquer reparação ou serviço acima de 150 € exige «un devis» prévio assinado!",
          },
          {
            text: "Bonjour, je constate une erreur de surfacturation sur ma dernière facture.",
            pt: "Bom dia, verifico um erro de cobrança excessiva na minha última factura.",
            register: "formal",
            whenToUse: "Ao ligar ou escrever ao «service client» de operadoras, energia ou oficinas",
          },
          {
            text: "Si nous signons un accord annuel, pourriez-vous nous accorder une remise commerciale ?",
            pt: "Se assinarmos um acordo anual, poderiam conceder-nos um desconto comercial?",
            register: "formal",
            whenToUse: "Em negociações B2Busa-se «une remise» (desconto comercial) em vez de «soldes» (saldos de loja)",
          },
          {
            text: "Essayons de trouver un bon compromis sur les conditions de livraison.",
            pt: "Tentemos encontrar um bom meio-termo nas condições de entrega.",
            register: "neutro",
            whenToUse: "Ao alinhar prazos ou responsabilidades num projecto",
          },
          {
            text: "Je souhaite déposer une réclamation auprès du service client avec mon numéro de dossier.",
            pt: "Desejo apresentar uma reclamação junto do apoio ao cliente com o meu número de processo.",
            register: "formal",
            whenToUse: "Para formalizar um pedido de reembolso ou correcção contratual",
          },
        ],
        culturalTip:
          "Distinção muito útil em francês: «un devis» é o orçamento ANTES de aceitares o serviço; «une facture» é a factura a pagar DEPOIS; e no restaurante pede-se sempre «l'addition»!",
        situations: [
          {
            id: "fr-neg-1",
            situationPt: "Precisas de um orçamento assinado por escrito antes de autorizar uma reparação.",
            register: "formal",
            correct: "Bonjour, pourriez-vous m'envoyer le devis par écrit par e-mail ?",
            options: [
              "Bonjour, pourriez-vous m'envoyer le devis par écrit par e-mail ?",
              "Pourriez-vous échauffer ma facture sur le terrain ?",
              "Ce compromis est en pointure quarante ?",
              "J'ai une averse dans le service client.",
            ],
            explanationPt: "«Un devis par écrit» protege legalmente o consumidor antes de qualquer cobrança.",
          },
          {
            id: "fr-neg-2",
            situationPt: "Cobraram-te um serviço duplicado na factura mensal e queres apresentar reclamação.",
            register: "formal",
            correct: "Je contacte le service client pour faire une réclamation sur cette facture.",
            options: [
              "Je contacte le service client pour faire une réclamation sur cette facture.",
              "Je dépose ma remise au pressing pour une tache.",
              "L'accord a fini sur un match nul au stade.",
              "Où est le rond-point de la surfacturation ?",
            ],
            explanationPt: "«Faire / déposer une réclamation» junto do «service client» é a fórmula oficial.",
          },
          {
            id: "fr-neg-3",
            situationPt: "Queres negociar um desconto comercial caso encomendes maior quantidade.",
            register: "formal",
            correct: "Serait-il possible d'obtenir une remise sur ces conditions ?",
            options: [
              "Serait-il possible d'obtenir une remise sur ces conditions ?",
              "Ce devis est-il glissant sous l'orage ?",
              "Puis-je emprunter un pneu crevé par écrit ?",
              "L'arbitre a signé la canicule.",
            ],
            explanationPt: "«Obtenir / accorder une remise» é a expressão certa para negociar preço profissionalmente.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Bonjour ! J'ai bien reçu votre devis, mais le montant dépasse un peu notre budget.",
            pt: "Bom dia! Recebi o vosso orçamento, mas o montante ultrapassa um pouco o nosso orçamento.",
          },
          {
            speaker: "Fournisseur",
            text: "Bonjour ! Quelles conditions vous permettraient d'arriver à un accord ?",
            pt: "Bom dia! Que condições vos permitiriam chegar a um acordo?",
          },
          {
            speaker: "Tu",
            text: "Avec une remise de dix pour cent, nous pouvons valider le devis dès aujourd'hui.",
            pt: "Com um desconto de dez por cento, podemos validar o orçamento já hoje.",
          },
          {
            speaker: "Fournisseur",
            text: "C'est un bon compromis — je vous renvoie l'accord mis à jour par écrit tout de suite !",
            pt: "É um bom meio-termo — reenvio-lhe já o acordo actualizado por escrito!",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "みつもり",
          "せいきゅうしょ",
          "わりびき",
          "じょうけん",
          "けいやく",
          "そうだん",
          "かくにん",
          "ほしょう",
          "サポート",
          "しょめん",
        ],
        phrases: [
          {
            text: "けいやく|の|まえ|に|、|みつもり|を|しょめん|で|いただけますか|。",
            pt: "Antes do contrato, poderia enviar-nos o orçamento por escrito?",
            romaji: "Keiyaku no mae ni, mitsumori o shomen de itadakemasu ka.",
            register: "formal",
            whenToUse: "«見積もり» (みつもり) é o orçamento; «書面で» (しょめんで) significa por escrito / documento!",
          },
          {
            text: "すみません|、|せいきゅうしょ|の|きんがく|を|もう|一度|かくにん|して|もらえますか|。",
            pt: "Com licença, poderia confirmar mais uma vez o valor da factura?",
            romaji: "Sumimasen, seikyuusho no kingaku o mou ichido kakunin shite moraemasu ka.",
            register: "formal",
            whenToUse: "No Japão, pedir para «confirmar» («かくにんしてもらえますか») resolve erros de factura sem confronto!",
          },
          {
            text: "じょうけん|と|わりびき|に|ついて|、|少し|そうだん|しても|いい|ですか|。",
            pt: "Posso conversar consigo um pouco sobre as condições e um possível desconto?",
            romaji: "Jouken to waribiki ni tsuite, sukoshi soudan shite mo ii desu ka.",
            register: "formal",
            whenToUse: "Em negócios no Japão usa-se «そうだん» (consultar/alinhar em conjunto) em vez de exigir desconto directo!",
          },
          {
            text: "この|せいひん|には|一年間|の|ほしょう|が|ついて|います|か|。",
            pt: "Este produto inclui garantia de um ano?",
            romaji: "Kono seihin ni wa ichinenkan no hoshou ga tsuite imasu ka.",
            register: "formal",
            whenToUse: "Ao comprar electrónica ou assinar serviços técnicos",
          },
          {
            text: "サポート|に|れんらく|して|、|メール|で|かくにん|を|おくります|。",
            pt: "Vou contactar o suporte e enviar a confirmação por e-mail.",
            romaji: "Sapooto ni renraku shite, meeru de kakunin o okurimasu.",
            register: "neutro",
            whenToUse: "No acompanhamento de um pedido de assistência ou contrato",
          },
        ],
        culturalTip:
          "Na cultura japonesa de negócios, apontar um erro frontalmente cria desconforto: em vez de dizer «cobraram a mais!», pergunta «すみません、せいきゅうしょのきんがくをかくにんしてもらえますか» ('poderia confirmar o valor da factura?') — a correcção é imediata e super cortês!",
        situations: [
          {
            id: "ja-neg-1",
            situationPt: "Queres pedir um orçamento por escrito antes de fechar um contrato.",
            register: "formal",
            correct: "まず、みつもりしょを メールか しょめんで いただけますか。",
            options: [
              "まず、みつもりしょを メールか しょめんで いただけますか。",
              "まず、スタジアムの ひきわけを いただけますか。",
              "せいきゅうしょを しちゃくしても いいですか。",
              "けいやくを レギュラー まんたんで おねがいします。",
            ],
            explanationPt: "«みつもり» / «みつもりしょ» (orçamento) + «しょめんでいただけますか» é o padrão profissional.",
          },
          {
            id: "ja-neg-2",
            situationPt: "O valor na factura parece diferente do acordado e queres pedir verificação com tacto japonês.",
            register: "formal",
            correct: "すみません、せいきゅうしょの きんがくを かくにんして もらえますか。",
            options: [
              "すみません、せいきゅうしょの きんがくを かくにんして もらえますか。",
              "この ほしょうは 蒸し暑いですか。",
              "しょめんの すそを おなおしして ください。",
              "サポートは ひなんじょに 止まって います。",
            ],
            explanationPt: "Pedir «かくにん» (confirmação) permite corrigir qualquer erro mantendo a harmonia.",
          },
          {
            id: "ja-neg-3",
            situationPt: "Queres negociar diplomaticamente as condições de um projecto anual.",
            register: "formal",
            correct: "けいやくの じょうけんに ついて、少し そうだんさせて ください。",
            options: [
              "けいやくの じょうけんに ついて、少し そうだんさせて ください。",
              "コートを 二たい二で わりびきして ください。",
              "日焼け止めに サインを かします。",
              "台風を サポートに つつみます。",
            ],
            explanationPt: "«そうだんさせてください» ('permita-nos consultar/conversar consigo') abre espaço à negociação.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "みつもり|を|ありがとうございます|。|じょうけん|に|ついて|少し|そうだん|しても|いい|ですか|。",
            pt: "Muito obrigado pelo orçamento. Posso alinhar consigo alguns detalhes sobre as condições?",
            romaji: "Mitsumori o arigatou gozaimasu. Jouken ni tsuite sukoshi soudan shite mo ii desu ka.",
          },
          {
            speaker: "担当者",
            text: "はい|、|もちろん|です|。|どの|てん|でしょうか|。",
            pt: "Sim, com certeza. Sobre que ponto seria?",
            romaji: "Hai, mochiron desu. Dono ten deshou ka.",
          },
          {
            speaker: "Tu",
            text: "一年|けいやく|に|する|ばあい|、|少し|わりびき|は|できますか|。",
            pt: "No caso de fazermos um contrato de um ano, seria possível um pequeno desconto?",
            romaji: "Ichinen keiyaku ni suru baai, sukoshi waribiki wa dekimasu ka.",
          },
          {
            speaker: "担当者",
            text: "かしこまりました|！|新しい|みつもり|を|しょめん|で|すぐ|おくります|。",
            pt: "Com certeza! Vou enviar já o novo orçamento por escrito.",
            romaji: "Kashikomarimashita! Atarashii mitsumori o shomen de sugu okurimasu.",
          },
        ],
      },
    },
  },
  {
    id: "eventos",
    emoji: "🎉",
    title: "Festas, Anfitriões, Presentes & Etiqueta",
    subtitle: "Jantares em casa, casamentos, lembranças, brindes e cortesia como convidado",
    tag: "Social",
    color: "var(--color-coral)",
    softColor: "var(--color-coral-soft)",
    relatedLevels: [22, 39, 54],
    byLang: {
      en: {
        vocabKeys: [
          "host",
          "housewarming",
          "gift",
          "toast",
          "congratulations",
          "dress code",
          "wrap",
          "homemade",
          "hospitality",
          "rsvp",
        ],
        phrases: [
          {
            text: "Thank you so much for having us — we brought a small gift for your housewarming!",
            pt: "Muito obrigado por nos receberem — trouxemos uma pequena lembrança para a inauguração da casa!",
            register: "neutro",
            whenToUse: "Ao chegar a casa dos anfitriões («Thank you for having me/us» é a frase de ouro!)",
          },
          {
            text: "Could you gift-wrap this box and remove the price tag, please?",
            pt: "Poderia embrulhar esta caixa para presente e retirar a etiqueta do preço, por favor?",
            register: "formal",
            whenToUse: "Na loja ao comprar um presente de aniversário ou casamento",
          },
          {
            text: "Let's make a toast — congratulations on your wedding and new chapter!",
            pt: "Vamos fazer um brinde — parabéns pelo vosso casamento e por esta nova etapa!",
            register: "neutro",
            whenToUse: "Num jantar comemorativo, casamento ou festa de promoção",
          },
          {
            text: "By the way, is there a dress code for Saturday's dinner, and did you RSVP yet?",
            pt: "Já agora, há código de vestuário para o jantar de sábado, e já confirmaste presença?",
            register: "informal",
            whenToUse: "Em inglês «RSVP» usa-se até como verbo («Please RSVP by Friday» = confirma presença até sexta)!",
          },
          {
            text: "Everything was delicious, especially the homemade dessert — thank you for your hospitality!",
            pt: "Estava tudo delicioso, sobretudo a sobremesa caseira — obrigado pela vossa hospitalidade!",
            register: "formal",
            whenToUse: "Ao despedir-te dos anfitriões ou na mensagem de agradecimento no dia seguinte",
          },
        ],
        culturalTip:
          "Curiosidade: «RSVP» nos convites em inglês vem do francês «Répondez s'il vous plaît»! E quando és recebido em casa de alguém, evita perguntar «Can I enter?» — diz «Thanks for having me!» à chegada e à saída.",
        situations: [
          {
            id: "en-evt-1",
            situationPt: "Compraste uma lembrança numa loja e queres pedir para embrulharem para oferta.",
            register: "formal",
            correct: "Could you wrap this as a gift, please?",
            options: [
              "Could you wrap this as a gift, please?",
              "Could you dispute this toast at the toll?",
              "Is this housewarming slippery on the pitch?",
              "Does the host come with full insurance?",
            ],
            explanationPt: "«Wrap as a gift» / «gift-wrap» pede o embrulho de presente sem mostrar o preço.",
          },
          {
            id: "en-evt-2",
            situationPt: "Foste jantar a casa de amigos pela primeira vez na casa nova deles e queres agradecer à saída.",
            register: "neutro",
            correct: "Thank you so much for your hospitality — your new home is lovely!",
            options: [
              "Thank you so much for your hospitality — your new home is lovely!",
              "There is an overcharge on your homemade dessert!",
              "Please send me a quote for the dress code!",
              "Your living room ended in a draw!",
            ],
            explanationPt: "Elogiar a casa e agradecer a «hospitality» («Thanks for having us!») é etiqueta essencial.",
          },
          {
            id: "en-evt-3",
            situationPt: "Recebeste um convite formal e queres saber que tipo de roupa levar.",
            register: "neutro",
            correct: "Is there a specific dress code for the reception?",
            options: [
              "Is there a specific dress code for the reception?",
              "Is there a petrol station inside the gift?",
              "Did you warm up the congratulations?",
              "Where is the shelter for the RSVP?",
            ],
            explanationPt: "Termos comuns de «dress code»: «casual», «smart casual», «cocktail» e «black tie».",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Hi Clara! Congratulations on the new flat — thanks for inviting us to your housewarming!",
            pt: "Olá Clara! Parabéns pelo novo apartamento — obrigado por nos convidares para a inauguração da casa!",
          },
          {
            speaker: "Host",
            text: "So glad you could make it! Come on in — did you find parking easily?",
            pt: "Ainda bem que puderam vir! Entrem — encontraram estacionamento facilmente?",
          },
          {
            speaker: "Tu",
            text: "Yes, right around the corner! Here's a small gift and a homemade cake for everyone.",
            pt: "Sim, logo ao virar da esquina! Aqui está uma pequena lembrança e um bolo caseiro para todos.",
          },
          {
            speaker: "Host",
            text: "How thoughtful, thank you! Grab a glass — we're about to make a toast!",
            pt: "Que simpático, obrigada! Peguem num copo — estamos prestes a fazer um brinde!",
          },
        ],
      },
      fr: {
        vocabKeys: [
          "hôte",
          "pendaison de crémaillère",
          "cadeau",
          "porter un toast",
          "félicitations",
          "tenue",
          "emballer",
          "fait maison",
          "accueil",
          "confirmer",
        ],
        phrases: [
          {
            text: "Merci infiniment pour votre accueil — voici un petit cadeau pour la pendaison de crémaillère !",
            pt: "Muito obrigado pela vossa recepção — aqui está uma pequena lembrança para a inauguração da casa!",
            register: "formal",
            whenToUse: "Expressão idiomática francesa deliciosa: «pendaison de crémaillère» é a festa de casa nova!",
          },
          {
            text: "Bonjour, c'est pour offrir — pourriez-vous l'emballer en paquet cadeau ?",
            pt: "Bom dia, é para oferecer — poderia embrulhar como presente?",
            register: "formal",
            whenToUse: "«C'est pour offrir» ('é para oferecer') é a frase mágica em todas as lojas francesas!",
          },
          {
            text: "Toutes mes félicitations ! Je voudrais porter un toast aux mariés : santé !",
            pt: "Muitos parabéns! Gostaria de fazer um brinde aos noivos: saúde!",
            register: "formal",
            whenToUse: "Ao brindar em França, olha sempre cada pessoa nos olhos ao dizer «Santé !» ou «Tchin-tchin !»",
          },
          {
            text: "Quelle tenue est prévue samedi soir, et as-tu pensé à confirmer ta présence ?",
            pt: "Que código de vestuário está previsto para sábado à noite, e lembraste-te de confirmar presença?",
            register: "informal",
            whenToUse: "«Tenue correcte exigée» ou «tenue de soirée» aparece frequentemente em convites",
          },
          {
            text: "Ce gâteau est fait maison ? Il est délicieux, merci à nos hôtes !",
            pt: "Este bolo é caseiro? Está delicioso, obrigado aos nossos anfitriões!",
            register: "neutro",
            whenToUse: "Atenção: «hôte» em francês significa tanto o anfitrião que recebe como o hóspede recebido!",
          },
        ],
        culturalTip:
          "Etiqueta francesa em jantares em casa («dîner chez des amis»): nunca chegues antes da hora marcada — o famoso «quart d'heure de politesse» significa chegar 10 a 15 minutos DEPOIS da hora combinada para dar tempo ao anfitrião, levando flores, vinho ou chocolates!",
        situations: [
          {
            id: "fr-evt-1",
            situationPt: "Estás na caixa de uma livraria em França e o livro é um presente de aniversário.",
            register: "formal",
            correct: "Bonjour, c'est pour offrir — pouvez-vous faire un paquet cadeau ?",
            options: [
              "Bonjour, c'est pour offrir — pouvez-vous faire un paquet cadeau ?",
              "Bonjour, pouvez-vous envoyer un devis pour ce toast ?",
              "Cette tenue a un pneu crevé au stade ?",
              "Je dépose une réclamation sur le gâteau fait maison.",
            ],
            explanationPt: "«C'est pour offrir» avisa logo o lojista para esconder o preço e embrulhar («emballer»).",
          },
          {
            id: "fr-evt-2",
            situationPt: "Amigos mudaram-se para um apartamento novo e convidaram-te para a festa de inauguração.",
            register: "neutro",
            correct: "Félicitations pour l'appartement ! Merci de m'inviter à la pendaison de crémaillère !",
            options: [
              "Félicitations pour l'appartement ! Merci de m'inviter à la pendaison de crémaillère !",
              "Voici ma surfacturation pour votre service client !",
              "Quelle est la limitation de vitesse dans le salon ?",
              "Le cadeau est très glissant sous l'averse !",
            ],
            explanationPt: "«La pendaison de crémaillère» é o nome tradicional da festa de inauguração de casa.",
          },
          {
            id: "fr-evt-3",
            situationPt: "Terminou um óptimo jantar em casa de colegas franceses e queres agradecer ao sair.",
            register: "formal",
            correct: "Merci beaucoup pour votre accueil chaleureux, tout était délicieux !",
            options: [
              "Merci beaucoup pour votre accueil chaleureux, tout était délicieux !",
              "Merci d'avoir essayé ma pointure au pressing !",
              "Nous avons fait match nul sur le dessert !",
              "Puis-je payer le péage en sortant ?",
            ],
            explanationPt: "«Merci pour votre accueil» é a fórmula mais elegante para agradecer a quem te recebe.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "Bonsoir ! Merci pour votre accueil et félicitations pour ce nouvel appartement !",
            pt: "Boa noite! Obrigado por nos receberem e parabéns por este novo apartamento!",
          },
          {
            speaker: "Hôte",
            text: "Bienvenue à notre pendaison de crémaillère ! Entrez, mettez-vous à l'aise !",
            pt: "Bem-vindos à inauguração da nossa casa! Entrem, fiquem à vontade!",
          },
          {
            speaker: "Tu",
            text: "Voici un petit cadeau et une tarte faite maison pour le dessert.",
            pt: "Aqui está uma pequena lembrança e uma tarte caseira para a sobremesa.",
          },
          {
            speaker: "Hôte",
            text: "Oh, il ne fallait pas, merci ! Prenons un verre pour porter un toast : santé !",
            pt: "Oh, não era preciso, obrigado! Peguemos num copo para fazer um brinde: saúde!",
          },
        ],
      },
      ja: {
        vocabKeys: [
          "おみやげ",
          "おいわい",
          "かんぱい",
          "おめでとうございます",
          "おじゃまします",
          "てみやげ",
          "つつむ",
          "てづくり",
          "しょうたい",
          "おれい",
        ],
        phrases: [
          {
            text: "ごけっこん|、|ほんとうに|おめでとうございます|！",
            pt: "Muitos parabéns pelo vosso casamento!",
            romaji: "Gokekkon, hontou ni omedetou gozaimasu!",
            register: "formal",
            whenToUse: "Para casamentos, promoções, nascimentos ou formaturas («おめでとうございます»)",
          },
          {
            text: "今日|は|しょうたい|して|くれて|ありがとう|。|おじゃまします|！",
            pt: "Obrigado pelo convite de hoje. Com licença por entrar na vossa casa!",
            romaji: "Kyou wa shoutai shite kurete arigatou. Ojama shimasu!",
            register: "neutro",
            whenToUse: "Diz SEMPRE «おじゃまします» ao cruzar a entrada («玄関») de casa de alguém e tira os sapatos!",
          },
          {
            text: "つまらない|もの|です|が|、|てみやげ|に|おかし|を|もってきました|。",
            pt: "É apenas uma lembrança modesta, mas trouxe uns doces para partilharmos.",
            romaji: "Tsumaranai mono desu ga, temiyage ni okashi o motte kimashita.",
            register: "formal",
            whenToUse: "Ao visitar uma casa japonesa leva-se sempre «手土産» (てみやげ — doces ou fruta)!",
          },
          {
            text: "プレゼント|よう|に|つつんで|もらえますか|。",
            pt: "Poderia embrulhar para presente, por favor?",
            romaji: "Purezento you ni tsutsunde moraemasu ka.",
            register: "formal",
            whenToUse: "A arte japonesa de embrulhar presentes nas lojas é impecável e geralmente gratuita!",
          },
          {
            text: "みなさん|、|グラス|を|もって|ください|。|かんぱい|！",
            pt: "Pessoal, peguem todos no vosso copo, por favor. Saúde!",
            romaji: "Minasan, gurasu o motte kudasai. Kanpai!",
            register: "neutro",
            whenToUse: "No Japão ninguém bebe o primeiro gole antes de todos terem bebida e dizerem «乾杯！» (かんぱい)!",
          },
        ],
        culturalTip:
          "Três regras de ouro em casas e festas no Japão: 1) diz «おじゃまします» ao entrar e alinha os sapatos virados para a porta; 2) espera pelo «かんぱい！» colectivo antes de beber; 3) não abras um presente à frente de quem o deu a menos que te peçam!",
        situations: [
          {
            id: "ja-evt-1",
            situationPt: "Foste convidado a entrar na casa de um amigo japonês e acabas de tirar os sapatos à entrada.",
            register: "formal",
            correct: "おじゃまします！てみやげに おかしを どうぞ。",
            options: [
              "おじゃまします！てみやげに おかしを どうぞ。",
              "ただいま！みつもりしょを どうぞ。",
              "せいきゅうしょで かんぱいしましょう！",
              "ひなんじょを プレゼントに つつんで ください。",
            ],
            explanationPt: "«おじゃまします» ('desculpe incomodar') é obrigatório ao entrar na casa ou escritório de outra pessoa.",
          },
          {
            id: "ja-evt-2",
            situationPt: "Compraste uma caixa de chá numa loja para oferecer como lembrança e queres embrulho de oferta.",
            register: "formal",
            correct: "すみません、プレゼントように つつんで もらえますか。",
            options: [
              "すみません、プレゼントように つつんで もらえますか。",
              "すみません、おいわいを まんたんに してください。",
              "この おれいは 少し きつい サイズです。",
              "てづくりは 二たい二の ひきわけでした。",
            ],
            explanationPt: "«プレゼントようにつつんでもらえますか» pede o embrulho especial de oferta.",
          },
          {
            id: "ja-evt-3",
            situationPt: "Todos à mesa já têm copo cheio no início do jantar de celebração.",
            register: "neutro",
            correct: "おめでとうございます！それでは、かんぱい！",
            options: [
              "おめでとうございます！それでは、かんぱい！",
              "ごめんなさい！それでは、クリーニング！",
              "台風ですが、しちゃくしましょう！",
              "しょめんで おかえりなさい！",
            ],
            explanationPt: "«かんぱい！» (literalmente 'copo seco' = saúde!) dá início oficial a qualquer jantar festivo.",
          },
        ],
        miniDialogue: [
          {
            speaker: "Tu",
            text: "こんにちは|！|今日|は|しょうたい|ありがとうございます|。|おじゃまします|！",
            pt: "Olá! Muito obrigado pelo convite de hoje. Com licença!",
            romaji: "Konnichiwa! Kyou wa shoutai arigatou gozaimasu. Ojama shimasu!",
          },
          {
            speaker: "ゆみ",
            text: "ようこそ|！|くつ|は|そこ|に|おいて|、|どうぞ|中|へ|入って|ください|。",
            pt: "Bem-vindo! Deixe os sapatos aí e faça favor de entrar.",
            romaji: "Youkoso! Kutsu wa soko ni oite, douzo naka e haitte kudasai.",
          },
          {
            speaker: "Tu",
            text: "新しい|家|の|おいわい|に|、|てづくり|の|ケーキ|と|おみやげ|を|もってきました|。",
            pt: "Para celebrar a casa nova, trouxe um bolo caseiro e uma lembrança.",
            romaji: "Atarashii ie no oiwai ni, tedzukuri no keeki to omiyage o motte kimashita.",
          },
          {
            speaker: "ゆみ",
            text: "わあ|、|うれしい|です|、|おれい|を|言います|！|さあ|、|みんな|で|かんぱい|しましょう|！",
            pt: "Uau, fico tão feliz, muito obrigada! Vamos lá brindar todos juntos!",
            romaji: "Waa, ureshii desu, orei o iimasu! Saa, minna de kanpai shimashou!",
          },
        ],
      },
    },
  },
];

/* ---------------- Mini-Diálogos Complementares (Pacotes 1–8) ---------------- */

const PACK_FALLBACK_DIALOGUES: Record<string, Record<LangCode, DialogueLine[]>> = {
  aeroporto: {
    en: [
      {
        speaker: "Officer",
        text: "Good morning. Passport and boarding pass, please.",
        pt: "Bom dia. Passaporte e cartão de embarque, por favor.",
      },
      {
        speaker: "Tu",
        text: "Here you go. I have a short layover before my connecting flight.",
        pt: "Aqui tem. Tenho uma escala curta antes do meu voo de ligação.",
      },
      {
        speaker: "Officer",
        text: "How long are you staying, and do you have anything to declare at customs?",
        pt: "Quanto tempo vai ficar e tem algo a declarar na alfândega?",
      },
      {
        speaker: "Tu",
        text: "Ten days on holiday, and nothing to declare, thank you.",
        pt: "Dez dias de férias e nada a declarar, obrigado.",
      },
    ],
    fr: [
      {
        speaker: "Agent",
        text: "Bonjour ! Passeport et carte d'embarquement, s'il vous plaît.",
        pt: "Bom dia! Passaporte e cartão de embarque, por favor.",
      },
      {
        speaker: "Tu",
        text: "Bonjour, voici mes documents. Ce sac passe bien en bagage cabine ?",
        pt: "Bom dia, aqui estão os meus documentos. Este saco passa como bagagem de mão?",
      },
      {
        speaker: "Agent",
        text: "Oui, sans problème. Vous avez une escale à Paris ?",
        pt: "Sim, sem problema. Tem uma escala em Paris?",
      },
      {
        speaker: "Tu",
        text: "Oui, une correspondance courte, et je n'ai rien à déclarer à la douane.",
        pt: "Sim, uma ligação curta, e não tenho nada a declarar na alfândega.",
      },
    ],
    ja: [
      {
        speaker: "係員",
        text: "こんにちは。パスポートと とうじょうけんを おねがいします。",
        pt: "Olá. O passaporte e o cartão de embarque, por favor.",
        romaji: "Konnichiwa. Pasupooto to toujouken o onegaishimasu.",
      },
      {
        speaker: "Tu",
        text: "はい、こちらです。東京で のりつぎが あります。",
        pt: "Sim, aqui estão. Tenho um voo de ligação em Tóquio.",
        romaji: "Hai, kochira desu. Toukyou de noritsugi ga arimasu.",
      },
      {
        speaker: "係員",
        text: "日本には 何日間 いますか。しんこくする ものは ありますか。",
        pt: "Quantos dias vai ficar no Japão? Tem algo a declarar?",
        romaji: "Nihon ni wa nannichikan imasu ka. Shinkoku suru mono wa arimasu ka.",
      },
      {
        speaker: "Tu",
        text: "十日間です。しんこくする ものは ありません。",
        pt: "Dez dias. Não tenho nada a declarar.",
        romaji: "Tookakan desu. Shinkoku suru mono wa arimasen.",
      },
    ],
  },
  financas: {
    en: [
      {
        speaker: "Tu",
        text: "Hello, I'd like to open a current account. What documents do I need?",
        pt: "Olá, gostaria de abrir uma conta à ordem. De que documentos preciso?",
      },
      {
        speaker: "Clerk",
        text: "Just your passport and proof of address.",
        pt: "Apenas o seu passaporte e um comprovativo de morada.",
      },
      {
        speaker: "Tu",
        text: "Great! Is there a monthly fee or a charge for a bank transfer?",
        pt: "Óptimo! Há alguma comissão mensal ou taxa por transferência bancária?",
      },
      {
        speaker: "Clerk",
        text: "No monthly fee, and your contactless card arrives in three days.",
        pt: "Sem comissão mensal, e o seu cartão sem contacto chega em três dias.",
      },
    ],
    fr: [
      {
        speaker: "Tu",
        text: "Bonjour, je souhaiterais ouvrir un compte bancaire, s'il vous plaît.",
        pt: "Bom dia, gostaria de abrir uma conta bancária, por favor.",
      },
      {
        speaker: "Conseiller",
        text: "Bien sûr ! Avez-vous votre passeport et un justificatif de domicile ?",
        pt: "Claro! Tem o seu passaporte e um comprovativo de morada?",
      },
      {
        speaker: "Tu",
        text: "Oui, voici. Est-ce qu'il y a des frais bancaires pour un virement ?",
        pt: "Sim, aqui estão. Existem comissões bancárias para uma transferência?",
      },
      {
        speaker: "Conseiller",
        text: "Non, les virements en ligne et le paiement sans contact sont gratuits.",
        pt: "Não, as transferências online e o pagamento por aproximação são gratuitos.",
      },
    ],
    ja: [
      {
        speaker: "Tu",
        text: "すみません、ここで りょうがえは できますか。",
        pt: "Com licença, posso fazer câmbio de moeda aqui?",
        romaji: "Sumimasen, koko de ryougae wa dekimasu ka.",
      },
      {
        speaker: "銀行員",
        text: "はい、できますよ。てすうりょうは 三百円です。",
        pt: "Sim, pode. A comissão é de trezentos ienes.",
        romaji: "Hai, dekimasu yo. Tesuuryou wa sanbyaku-en desu.",
      },
      {
        speaker: "Tu",
        text: "分かりました。あと、やちんの ふりこみも おねがいできますか。",
        pt: "Compreendi. Além disso, também posso fazer a transferência da renda?",
        romaji: "Wakarimashita. Ato, yachin no furikomi mo onegai dekimasu ka.",
      },
      {
        speaker: "銀行員",
        text: "もちろん、となりの きかいで ふりこみできます。",
        pt: "Com certeza, pode fazer a transferência na máquina ao lado.",
        romaji: "Mochiron, tonari no kikai de furikomi dekimasu.",
      },
    ],
  },
  remoto: {
    en: [
      {
        speaker: "Tu",
        text: "Morning everyone! Let me share my screen so we can review the project.",
        pt: "Bom dia a todos! Deixem-me partilhar o ecrã para revermos o projecto.",
      },
      {
        speaker: "Alex",
        text: "We can see your slides, thanks! Wait — Sam, I think you're on mute.",
        pt: "Já vemos os slides, obrigado! Espera — Sam, acho que estás com o microfone desligado.",
      },
      {
        speaker: "Tu",
        text: "Are we still on track for Friday's deadline?",
        pt: "Continuamos dentro do previsto para o prazo de sexta-feira?",
      },
      {
        speaker: "Alex",
        text: "Yes! I'll follow up by email right after the meeting.",
        pt: "Sim! Dou seguimento por e-mail logo a seguir à reunião.",
      },
    ],
    fr: [
      {
        speaker: "Tu",
        text: "Bonjour à tous ! On fait le point sur le projet de la semaine ?",
        pt: "Bom dia a todos! Fazemos o ponto de situação sobre o projecto da semana?",
      },
      {
        speaker: "Lucas",
        text: "Oui ! Pardon Claire, je crois que tu as le micro coupé.",
        pt: "Sim! Desculpa Claire, acho que tens o microfone desligado.",
      },
      {
        speaker: "Tu",
        text: "Je vais partager mon écran pour vérifier la prochaine échéance.",
        pt: "Vou partilhar o meu ecrã para verificarmos o próximo prazo.",
      },
      {
        speaker: "Lucas",
        text: "Parfait, on voit très bien ton écran !",
        pt: "Perfeito, vê-se muito bem o teu ecrã!",
      },
    ],
    ja: [
      {
        speaker: "Tu",
        text: "おはようございます。いま がめんを きょうゆうしますね。",
        pt: "Bom dia. Vou partilhar o ecrã agora.",
        romaji: "Ohayou gozaimasu. Ima gamen o kyouyuu shimasu ne.",
      },
      {
        speaker: "田中",
        text: "はい、がめんが 見えます！あ、佐藤さん、ミュートに なっていますよ。",
        pt: "Sim, vemos o ecrã! Ah, Sato-san, está com o microfone desligado.",
        romaji: "Hai, gamen ga miemasu! A, Satou-san, myuuto ni natte imasu yo.",
      },
      {
        speaker: "Tu",
        text: "この レポートの しめきりは 金曜日で だいじょうぶですか。",
        pt: "O prazo deste relatório continua bem para sexta-feira?",
        romaji: "Kono repooto no shimekiri wa kinyoubi de daijoubu desu ka.",
      },
      {
        speaker: "田中",
        text: "はい、問題ありません。本日も おつかれさまでした！",
        pt: "Sim, sem problema. Bom trabalho hoje também!",
        romaji: "Hai, mondai arimasen. Honjitsu mo otsukaresama deshita!",
      },
    ],
  },
  digital: {
    en: [
      {
        speaker: "Tu",
        text: "Excuse me, what's the wi-fi password here?",
        pt: "Com licença, qual é a palavra-passe do wi-fi aqui?",
      },
      {
        speaker: "Barista",
        text: "It's printed on your receipt, all lowercase!",
        pt: "Está impressa no seu talão, tudo em minúsculas!",
      },
      {
        speaker: "Tu",
        text: "Thanks! Also, my phone is about to die — is there a socket for my charger?",
        pt: "Obrigado! Além disso, o meu telemóvel está quase sem bateria — há tomada para o carregador?",
      },
      {
        speaker: "Barista",
        text: "Sure, right under the window table. Let me know if you can't log in.",
        pt: "Claro, mesmo debaixo da mesa da janela. Diga se não conseguir iniciar sessão.",
      },
    ],
    fr: [
      {
        speaker: "Tu",
        text: "Excusez-moi, quel est le mot de passe du wi-fi, s'il vous plaît ?",
        pt: "Com licença, qual é a palavra-passe do wi-fi, por favor?",
      },
      {
        speaker: "Serveur",
        text: "Il est écrit sur le ticket de caisse, juste en bas.",
        pt: "Está escrito no talão de caixa, mesmo em baixo.",
      },
      {
        speaker: "Tu",
        text: "Merci ! Mon téléphone n'a presque plus de batterie, j'ai mon chargeur.",
        pt: "Obrigado! O meu telemóvel está quase sem bateria, trouxe o meu carregador.",
      },
      {
        speaker: "Serveur",
        text: "Il y a une prise près du mur — l'autre est en panne aujourd'hui.",
        pt: "Há uma tomada junto à parede — a outra está avariada hoje.",
      },
    ],
    ja: [
      {
        speaker: "Tu",
        text: "すみません、Wi-Fiの パスワードを おしえてください。",
        pt: "Com licença, pode dizer-me a palavra-passe do Wi-Fi?",
        romaji: "Sumimasen, Wi-Fi no pasuwaado o oshiete kudasai.",
      },
      {
        speaker: "店員",
        text: "レシートの 下に 書いて ありますよ。",
        pt: "Está escrita na parte de baixo do talão.",
        romaji: "Reshiito no shita ni kaite arimasu yo.",
      },
      {
        speaker: "Tu",
        text: "ありがとうございます！スマホの じゅうでんきを つかっても いいですか。",
        pt: "Muito obrigado! Posso usar o carregador do telemóvel?",
        romaji: "Arigatou gozaimasu! Sumaho no juudenki o tsukatte mo ii desu ka.",
      },
      {
        speaker: "店員",
        text: "もちろん、まどの せきを どうぞ！",
        pt: "Claro, fique à vontade no lugar junto à janela!",
        romaji: "Mochiron, mado no seki o douzo!",
      },
    ],
  },
  saude: {
    en: [
      {
        speaker: "Tu",
        text: "Hello, can I buy this medicine over the counter, or do I need a prescription?",
        pt: "Olá, posso comprar este medicamento sem receita ou preciso de receita médica?",
      },
      {
        speaker: "Pharmacist",
        text: "You can get it over the counter. Are you allergic to any medication?",
        pt: "Pode comprá-lo sem receita. É alérgico a algum medicamento?",
      },
      {
        speaker: "Tu",
        text: "Yes, I'm allergic to penicillin, and I have a mild throat pain.",
        pt: "Sim, sou alérgico à penicilina e tenho uma ligeira dor de garganta.",
      },
      {
        speaker: "Pharmacist",
        text: "These lozenges are completely safe — take one after meals and get some rest.",
        pt: "Estas pastilhas são totalmente seguras — tome uma após as refeições e descanse.",
      },
    ],
    fr: [
      {
        speaker: "Tu",
        text: "Bonjour, faut-il une ordonnance pour ce médicament contre le mal de gorge ?",
        pt: "Bom dia, é preciso receita médica para este medicamento para a dor de garganta?",
      },
      {
        speaker: "Pharmacien",
        text: "Non, pas besoin d'ordonnance. Êtes-vous allergique à quelque chose ?",
        pt: "Não, não precisa de receita. É alérgico a alguma coisa?",
      },
      {
        speaker: "Tu",
        text: "Oui, je suis allergique à la pénicilline.",
        pt: "Sim, sou alérgico à penicilina.",
      },
      {
        speaker: "Pharmacien",
        text: "Très bien, prenez ce sirop matin et soir pendant quatre jours.",
        pt: "Muito bem, tome este xarope de manhã e à noite durante quatro dias.",
      },
    ],
    ja: [
      {
        speaker: "Tu",
        text: "こんにちは。病院の しょほうせんが あります。",
        pt: "Bom dia. Tenho uma receita médica do hospital.",
        romaji: "Konnichiwa. Byouin no shohousen ga arimasu.",
      },
      {
        speaker: "薬剤師",
        text: "ありがとうございます。薬の アレルギーは ありますか。",
        pt: "Muito obrigado. Tem alergia a algum medicamento?",
        romaji: "Arigatou gozaimasu. Kusuri no arerugii wa arimasu ka.",
      },
      {
        speaker: "Tu",
        text: "いいえ、ありません。いつ のめば いいですか。",
        pt: "Não, não tenho. Quando devo tomá-lo?",
        romaji: "Iie, arimasen. Itsu nomeba ii desu ka.",
      },
      {
        speaker: "薬剤師",
        text: "ごはんの あとに のんで、今日は ゆっくり 休んでくださいね。",
        pt: "Tome depois das refeições e hoje descanse com calma.",
        romaji: "Gohan no ato ni nonde, kyou wa yukkuri yasunde kudasai ne.",
      },
    ],
  },
  estudos: {
    en: [
      {
        speaker: "Tu",
        text: "Professor, could I ask a quick question after the lecture?",
        pt: "Professor, podia fazer uma pergunta rápida depois da aula?",
      },
      {
        speaker: "Professor",
        text: "Of course! Is it about the final assignment?",
        pt: "Claro! É sobre o trabalho final?",
      },
      {
        speaker: "Tu",
        text: "Yes, I want to confirm the deadline, and I'm also applying for a scholarship.",
        pt: "Sim, quero confirmar o prazo-limite, e também me estou a candidatar a uma bolsa.",
      },
      {
        speaker: "Professor",
        text: "The deadline is next Friday — send me your draft and I'll write a reference!",
        pt: "O prazo é na próxima sexta — envia-me o rascunho e escrevo-te uma carta de recomendação!",
      },
    ],
    fr: [
      {
        speaker: "Tu",
        text: "Bonjour Madame, j'ai une question sur la date de mon exposé.",
        pt: "Bom dia Professora, tenho uma dúvida sobre a data da minha apresentação.",
      },
      {
        speaker: "Professeure",
        text: "Oui, bien sûr ! Votre exposé est prévu mardi prochain.",
        pt: "Sim, claro! A sua apresentação está marcada para a próxima terça-feira.",
      },
      {
        speaker: "Tu",
        text: "Parfait. Je prépare aussi mon dossier pour une bourse et un stage d'été.",
        pt: "Perfeito. Também estou a preparar a candidatura a uma bolsa e a um estágio de verão.",
      },
      {
        speaker: "Professeure",
        text: "Excellente initiative, envoyez-moi votre lettre de motivation avant l'échéance !",
        pt: "Excelente iniciativa, envie-me a sua carta de motivação antes do prazo!",
      },
    ],
    ja: [
      {
        speaker: "Tu",
        text: "先生、レポートの しめきりについて しつもんしても いいですか。",
        pt: "Professor, posso fazer uma pergunta sobre o prazo do relatório?",
        romaji: "Sensei, repooto no shimekiri ni tsuite shitsumon shite mo ii desu ka.",
      },
      {
        speaker: "先生",
        text: "もちろん、どうぞ。しめきりは 来週の 金曜日ですよ。",
        pt: "Claro, diga. O prazo é na sexta-feira da próxima semana.",
        romaji: "Mochiron, douzo. Shimekiri wa raishuu no kinyoubi desu yo.",
      },
      {
        speaker: "Tu",
        text: "ありがとうございます。大学の しょうがくきんにも おうぼしたいです。",
        pt: "Muito obrigado. Também me quero candidatar à bolsa da universidade.",
        romaji: "Arigatou gozaimasu. Daigaku no shougakukin ni mo oubo shitai desu.",
      },
      {
        speaker: "先生",
        text: "いいですね！いっしょに しょるいを かくにんしましょう。",
        pt: "Óptima ideia! Vamos rever os documentos juntos.",
        romaji: "Ii desu ne! Issho ni shorui o kakunin shimashou.",
      },
    ],
  },
  servicos: {
    en: [
      {
        speaker: "Tu",
        text: "Hello, my parcel arrived today, and I'm afraid the screen is faulty.",
        pt: "Olá, a minha encomenda chegou hoje e receio que o ecrã venha com defeito.",
      },
      {
        speaker: "Support",
        text: "I'm sorry about that! Do you have the receipt or tracking number?",
        pt: "Peço desculpa por isso! Tem o talão ou o número de rastreio?",
      },
      {
        speaker: "Tu",
        text: "Yes, here is the receipt. Could I request a full refund, please?",
        pt: "Sim, aqui está o recibo. Podia pedir o reembolso total, por favor?",
      },
      {
        speaker: "Support",
        text: "Done! The refund will reach your account within three working days.",
        pt: "Feito! O reembolso chegará à sua conta no prazo de três dias úteis.",
      },
    ],
    fr: [
      {
        speaker: "Tu",
        text: "Bonjour, j'ai reçu ce colis hier mais l'appareil est en panne.",
        pt: "Bom dia, recebi esta encomenda ontem mas o aparelho está avariado.",
      },
      {
        speaker: "Service Client",
        text: "Désolé pour ce problème. Avez-vous gardé le ticket de caisse ou la facture ?",
        pt: "Lamentamos o incómodo. Guardou o talão de caixa ou a factura?",
      },
      {
        speaker: "Tu",
        text: "Oui, voici la facture. Je souhaiterais un remboursement, s'il vous plaît.",
        pt: "Sim, aqui está a factura. Gostaria de pedir o reembolso, por favor.",
      },
      {
        speaker: "Service Client",
        text: "C'est noté, nous effectuons le remboursement sur votre carte aujourd'hui.",
        pt: "Registado, fazemos hoje mesmo o reembolso para o seu cartão.",
      },
    ],
    ja: [
      {
        speaker: "Tu",
        text: "すみません、きのう 買った イヤホンが うごきません。",
        pt: "Com licença, os auriculares que comprei ontem não funcionam.",
        romaji: "Sumimasen, kinou katta iyahon ga ugokimasen.",
      },
      {
        speaker: "店員",
        text: "もうしわけ ありません。レシートは ありますか。",
        pt: "Pedimos imensa desculpa. Tem o talão consigo?",
        romaji: "Moushiwake arimasen. Reshiito wa arimasu ka.",
      },
      {
        speaker: "Tu",
        text: "はい、こちらです。新しい ものと こうかんして もらえますか。",
        pt: "Sim, aqui está. Poderia trocar por uns novos?",
        romaji: "Hai, kochira desu. Atarashii mono to koukan shite moraemasu ka.",
      },
      {
        speaker: "店員",
        text: "はい、すぐ 新しい ものを ごよういします！",
        pt: "Sim, vou preparar já uns novos para si!",
        romaji: "Hai, sugu atarashii mono o goyoui shimasu!",
      },
    ],
  },
  "falsos-amigos": {
    en: [
      {
        speaker: "Liam",
        text: "So you're moving next month? Are you excited?",
        pt: "Então vais mudar-te no próximo mês? Estás entusiasmado?",
      },
      {
        speaker: "Tu",
        text: "Actually, I currently work remotely, and I intend to move in September!",
        pt: "Na verdade, actualmente trabalho remotamente e pretendo mudar-me em Setembro!",
      },
      {
        speaker: "Liam",
        text: "Waiting until September sounds like a very sensible choice.",
        pt: "Esperar até Setembro parece uma escolha muito sensata.",
      },
      {
        speaker: "Tu",
        text: "True! I didn't realize how fast leases go until I visited the library.",
        pt: "Verdade! Não me tinha dado conta de quão depressa voam as casas até ir à biblioteca.",
      },
    ],
    fr: [
      {
        speaker: "Camille",
        text: "Tu m'entends bien ? Il y a beaucoup de bruit dans la rue !",
        pt: "Estás a ouvir-me bem? Há imenso barulho na rua!",
      },
      {
        speaker: "Tu",
        text: "Je t'entends très bien et je comprends tout, donc pas de souci !",
        pt: "Ouço-te muito bem e entendo tudo, portanto sem problema!",
      },
      {
        speaker: "Camille",
        text: "Super ! Tu peux m'attendre devant la librairie du coin ?",
        pt: "Óptimo! Podes esperar por mim em frente à livraria da esquina?",
      },
      {
        speaker: "Tu",
        text: "Il pleut un peu, et pourtant j'arrive dans deux minutes !",
        pt: "Chove um pouco e, no entanto, chego em dois minutos!",
      },
    ],
    ja: [
      {
        speaker: "店員",
        text: "おべんとうを あたためますか。ふくろは ごりようですか。",
        pt: "Quer que aqueça a marmita? Precisa de saco?",
        romaji: "Obentou o atatamemasu ka. Fukuro wa goriyou desu ka.",
      },
      {
        speaker: "Tu",
        text: "あたためて ください。ふくろは だいじょうぶです！",
        pt: "Aqueça, por favor. Saco não é preciso, obrigado!",
        romaji: "Atatamete kudasai. Fukuro wa daijoubu desu!",
      },
      {
        speaker: "店員",
        text: "かしこまりました。おつかれさまです、どうぞ！",
        pt: "Com certeza. Aqui tem, bom descanso após o trabalho!",
        romaji: "Kashikomarimashita. Otsukaresama desu, douzo!",
      },
      {
        speaker: "Tu",
        text: "あ、すみません、ありがとうございます！",
        pt: "Ah, desculpe o incómodo e muito obrigado!",
        romaji: "A, sumimasen, arigatou gozaimasu!",
      },
    ],
  },
};

/** Devolve o mini-diálogo realista (4 falas, 2 interlocutores) de qualquer pacote de contexto. */
export function getPackDialogue(pack: ContextPack, lang: LangCode): DialogueLine[] {
  return pack.byLang[lang].miniDialogue ?? PACK_FALLBACK_DIALOGUES[pack.id]?.[lang] ?? [];
}

/* ---------------- Pesquisa, Progresso e Recomendação de Contextos ---------------- */

export interface MatchedContextPhrase {
  pack: ContextPack;
  phrase: PocketPhrase;
}

function foldAccents(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ptStem(folded: string): string | null {
  if (folded.length < 6 || folded.includes(" ")) return null;
  const stemmed = folded.replace(/(coes|cao|mente|idade|aria|ario|ada|ado|ida|ido|osa|oso|ica|ico|ia|io|ar|er|ir|as|os|es|a|o)$/, "");
  return stemmed.length >= 5 && stemmed !== folded ? stemmed : null;
}

function matchesQuery(haystack: string, q: string, qStem: string | null): boolean {
  const h = foldAccents(haystack);
  return h.includes(q) || (qStem !== null && h.includes(qStem));
}

/** Pesquisa instantânea em pacotes de contextos, frases prontas e vocabulário associado. */
export function searchContexts(
  lang: LangCode,
  query: string,
  tagFilter?: string | null,
): { packs: ContextPack[]; matchingPhrases: MatchedContextPhrase[] } {
  const tagPool = !tagFilter || tagFilter === "Todos" ? CONTEXT_PACKS : CONTEXT_PACKS.filter((p) => p.tag === tagFilter);
  const q = foldAccents(query.trim());
  if (!q) return { packs: tagPool, matchingPhrases: [] };
  const qStem = ptStem(q);

  const dict = CONTENT[lang].dictionary;
  const packs: ContextPack[] = [];
  const matchingPhrases: MatchedContextPhrase[] = [];

  for (const pack of tagPool) {
    const loc = pack.byLang[lang];
    let packHit = matchesQuery(`${pack.title} ${pack.subtitle} ${pack.tag} ${loc.culturalTip}`, q, qStem);

    if (!packHit) {
      for (const vk of loc.vocabKeys) {
        const entry = dict[vk.toLowerCase()];
        if (matchesQuery(`${vk} ${entry?.pt ?? ""} ${entry?.romaji ?? ""} ${entry?.reading ?? ""} ${entry?.note ?? ""}`, q, qStem)) {
          packHit = true;
          break;
        }
      }
    }

    for (const ph of loc.phrases) {
      if (matchesQuery(`${ph.text} ${ph.pt} ${ph.romaji ?? ""} ${ph.whenToUse}`, q, qStem)) {
        packHit = true;
        if (matchingPhrases.length < 12) {
          matchingPhrases.push({ pack, phrase: ph });
        }
      }
    }

    if (!packHit) {
      for (const sit of loc.situations) {
        if (matchesQuery(`${sit.situationPt} ${sit.correct} ${sit.explanationPt}`, q, qStem)) {
          packHit = true;
          break;
        }
      }
    }

    if (!packHit) {
      for (const dl of getPackDialogue(pack, lang)) {
        if (matchesQuery(`${dl.text} ${dl.pt} ${dl.romaji ?? ""}`, q, qStem)) {
          packHit = true;
          break;
        }
      }
    }

    if (packHit) packs.push(pack);
  }

  return { packs, matchingPhrases };
}

/* ---------------- Redes Temáticas de Vocabulário Transversal ---------------- */

export interface VocabNetwork {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  tip: string;
  softColor: string;
  keys: Record<LangCode, string[]>;
}

export const VOCAB_NETWORKS: VocabNetwork[] = [
  {
    id: "conectores",
    emoji: "🧭",
    title: "Conectores & Fluência Natural",
    subtitle: "Palavras-ponte para ligar ideias sem pausas nem hesitações",
    tip: "Dominar 8 a 10 conectores faz qualquer resposta soar imediatamente mais madura e natural (nível B1–B2).",
    softColor: "var(--color-lilac-soft)",
    keys: {
      en: ["actually", "by the way", "however", "eventually", "meanwhile", "as soon as", "currently", "especially", "otherwise", "therefore"],
      fr: ["en fait", "du coup", "au fait", "pourtant", "dès que", "cependant", "actuellement", "surtout", "sinon", "donc"],
      ja: ["ところで", "じつは", "これから", "さっき", "そろそろ", "でも", "だから", "それから", "もちろん", "たしかに"],
    },
  },
  {
    id: "armadilhas",
    emoji: "⚠️",
    title: "Falsos Amigos & Armadilhas Lusófonas",
    subtitle: "Palavras enganadoras que parecem português mas dizem outra coisa",
    tip: "Rever este grupo evita os mal-entendidos mais clássicos de quem fala português!",
    softColor: "var(--color-yellow-soft)",
    keys: {
      en: ["actually", "currently", "pretend", "intend", "realize", "sensible", "sensitive", "library", "customs", "eventually"],
      fr: ["attendre", "entendre", "pourtant", "assister", "actuellement", "librairie", "bibliothèque", "serviette", "complet", "dossier"],
      ja: ["だいじょうぶ", "すみません", "おつかれさまです", "よろしく", "おせわになります", "ベビーカー", "フロント", "サイン", "コンビニ", "マンション"],
    },
  },
  {
    id: "cortesia-pedidos",
    emoji: "🤝",
    title: "Pedidos Corteses & Registo Formal",
    subtitle: "Fórmulas educadas para atendimento, trabalho, e-mails e serviços",
    tip: "Trocar o imperativo directo por estas fórmulas abre portas em qualquer serviço, hotel ou empresa.",
    softColor: "var(--color-teal-soft)",
    keys: {
      en: ["would you mind", "could", "excuse me", "in advance", "request", "appointment", "follow up", "bother", "reference", "confirm"],
      fr: ["je souhaiterais", "excusez-moi", "auriez-vous", "pourriez-vous", "pourrais-je", "s'il vous plaît", "volontiers", "en avance", "rendez-vous", "remboursement"],
      ja: ["おねがいします", "すみません", "いただけますか", "もらえますか", "おもちですか", "かしこまりました", "もうしわけ", "おまちください", "ごせいちょう", "ありがとうございます"],
    },
  },
  {
    id: "tempo-prazos",
    emoji: "⏱",
    title: "Tempo, Prazos & Frequência",
    subtitle: "Expressões essenciais para combinar horários, entregas e validades",
    tip: "Indispensáveis em viagens, reuniões de trabalho, consultas médicas e compras.",
    softColor: "var(--color-coral-soft)",
    keys: {
      en: ["deadline", "in advance", "as soon as", "meanwhile", "delay", "rush hour", "expiry date", "currently", "anytime", "ago"],
      fr: ["échéance", "en avance", "dès que", "retard", "heure de pointe", "date de péremption", "actuellement", "mensuel", "jusqu'à", "prochaine"],
      ja: ["しめきり", "予定", "今週末", "来月", "明日", "さっき", "これから", "そろそろ", "しょうみきげん", "時間"],
    },
  },
  {
    id: "reaccoes",
    emoji: "💬",
    title: "Reacções Rápidas do Dia-a-dia",
    subtitle: "Respostas curtas e idiomáticas para manter qualquer conversa viva",
    tip: "Os falantes nativos usam estas expressões dezenas de vezes por dia para mostrar escuta activa.",
    softColor: "var(--color-good-soft)",
    keys: {
      en: ["makes sense", "sounds good", "no worries", "rain check", "catch up", "of course", "excited", "swamped", "safe", "calm"],
      fr: ["ça marche", "pas de souci", "bien sûr", "volontiers", "prendre un verre", "on se tient au courant", "remettre ça", "dommage", "super", "parfait"],
      ja: ["なるほど", "たしかに", "もちろん", "大丈夫", "ひさしぶり", "たのしみ", "問題", "分かりました", "いいですね", "きをつけて"],
    },
  },
  {
    id: "opinioes-argumentos",
    emoji: "💡",
    title: "Opiniões, Matizes & Argumentação",
    subtitle: "Dar o teu ponto de vista, concordar parcialmente e equilibrar prós e contras",
    tip: "Suavizar uma discordância com «fair point / à mon avis / たしかに» torna qualquer debate profissional ou amigável muito mais natural.",
    softColor: "var(--color-lilac-soft)",
    keys: {
      en: ["in my view", "fair point", "to be honest", "it depends", "on the other hand", "agree", "disagree", "convinced", "perspective", "doubt"],
      fr: ["à mon avis", "tout à fait", "ça dépend", "en revanche", "franchement", "d'accord", "convaincu", "point de vue", "nuance", "doute"],
      ja: ["とおもいます", "たしかに", "じつは", "ばあい", "さんせい", "はんたい", "いけん", "りゆう", "もちろん", "たぶん"],
    },
  },
  {
    id: "quantidades-medidas",
    emoji: "📏",
    title: "Quantidades, Preços & Proporções",
    subtitle: "Aproximar valores, falar de metades, gratuitidade, excesso ou suficiência",
    tip: "Essencial em compras, orçamentos, receitas, alugueres e viagens para negociar ou estimar sem bloqueios.",
    softColor: "var(--color-teal-soft)",
    keys: {
      en: ["roughly", "plenty of", "affordable", "half", "extra", "free of charge", "enough", "shortage", "average", "included"],
      fr: ["environ", "moitié", "abordable", "gratuit", "supplémentaire", "suffisant", "compris", "moyenne", "presque", "davantage"],
      ja: ["だいたい", "半分", "無料", "ぜんぶ", "たりる", "あまり", "すこし", "ちょうど", "わりびき", "おおい"],
    },
  },
  {
    id: "emocoes-estados",
    emoji: "❤️",
    title: "Emoções, Energia & Estados de Espírito",
    subtitle: "Ir além do «bem/mal» para exprimir alívio, entusiasmo, cansaço ou saudade",
    tip: "Vocabulário emocional preciso aproxima imenso nas amizades, consultas médicas e conversas do quotidiano.",
    softColor: "var(--color-coral-soft)",
    keys: {
      en: ["relieved", "exhausted", "overwhelmed", "grateful", "homesick", "thrilled", "anxious", "proud", "relaxed", "curious"],
      fr: ["soulagé", "épuisé", "débordé", "reconnaissant", "nostalgique", "ravi", "inquiet", "fier", "détendu", "curieux"],
      ja: ["ほっとする", "つかれる", "あんしん", "しんぱい", "なつかしい", "うれしい", "きんちょう", "たのしみ", "げんき", "びっくり"],
    },
  },
];

/* ---------------- Pares Confusos & Nuances de Vocabulário ---------------- */

export interface ConfusablePair {
  id: string;
  wordA: string;
  wordB: string;
  summaryPt: string;
  tipPt: string;
  quizPromptPt: string;
  quizSentence: string;
  quizAnswer: string;
  quizDistractor: string;
}

export const CONFUSABLE_PAIRS: Record<LangCode, ConfusablePair[]> = {
  en: [
    {
      id: "en-pair-borrow-lend",
      wordA: "borrow",
      wordB: "lend",
      summaryPt: "pedir emprestado (receber) vs. emprestar (dar)",
      tipPt: "Usa «borrow» quando recebes algo temporariamente (borrow from) e «lend» quando dás algo emprestado (lend to).",
      quizPromptPt: "Queres pedir uma caneta emprestada a um colega por um minuto.",
      quizSentence: "Could I ＿＿＿ your pen for a minute?",
      quizAnswer: "borrow",
      quizDistractor: "lend",
    },
    {
      id: "en-pair-receipt-recipe",
      wordA: "receipt",
      wordB: "recipe",
      summaryPt: "talão/recibo de compra vs. receita de cozinha",
      tipPt: "«Receipt» (o 'p' é mudo: ri-sít) é o comprovativo da loja; «recipe» (ré-si-pi) é a receita culinária!",
      quizPromptPt: "Precisas de guardar o talão da compra caso queiras trocar o casaco.",
      quizSentence: "Keep the ＿＿＿ in case you want to exchange the jacket.",
      quizAnswer: "receipt",
      quizDistractor: "recipe",
    },
    {
      id: "en-pair-sensible-sensitive",
      wordA: "sensible",
      wordB: "sensitive",
      summaryPt: "sensato/prudente vs. sensível",
      tipPt: "Falso amigo clássico: «sensible» significa prudente/ajuizado; «sensitive» significa sensível (pele, dentes ou emoções).",
      quizPromptPt: "Queres elogiar uma escolha prudente ao contratar seguro completo no aluguer do carro.",
      quizSentence: "Adding full insurance on the rental car was a very ＿＿＿ decision.",
      quizAnswer: "sensible",
      quizDistractor: "sensitive",
    },
    {
      id: "en-pair-remind-remember",
      wordA: "remind",
      wordB: "remember",
      summaryPt: "fazer lembrar alguém vs. lembrar-se sozinho",
      tipPt: "Tu «remember» um facto por ti próprio, mas outra pessoa ou um alarme «reminds you» (avisa-te / faz-te lembrar).",
      quizPromptPt: "Pedes a um colega que te avise da reunião das três horas.",
      quizSentence: "Could you ＿＿＿ me about the three o'clock meeting?",
      quizAnswer: "remind",
      quizDistractor: "remember",
    },
    {
      id: "en-pair-fun-funny",
      wordA: "fun",
      wordB: "funny",
      summaryPt: "divertido/agradável vs. cómico/que faz rir",
      tipPt: "Um passeio ou jogo é «fun» (dá gosto); uma piada é «funny» (faz rir — ou pode até significar 'esquisito'!).",
      quizPromptPt: "Queres dizer que o jogo de futebol de ontem no parque foi muito divertido.",
      quizSentence: "Playing football in the park yesterday was really ＿＿＿!",
      quizAnswer: "fun",
      quizDistractor: "funny",
    },
    {
      id: "en-pair-fee-tax",
      wordA: "fee",
      wordB: "tax",
      summaryPt: "taxa/comissão de serviço vs. imposto do Estado",
      tipPt: "Bancos, entregas e universidades cobram «a fee»; governos cobram «tax» (como o IVA/VAT).",
      quizPromptPt: "Perguntas no banco se a conta tem comissão mensal de manutenção.",
      quizSentence: "Does this bank account charge a monthly ＿＿＿?",
      quizAnswer: "fee",
      quizDistractor: "tax",
    },
    {
      id: "en-pair-miss-lose",
      wordA: "miss",
      wordB: "lose",
      summaryPt: "perder transporte/sentir falta vs. perder objecto/jogo",
      tipPt: "Em inglês «miss» usa-se para comboios, voos, prazos e saudades; «lose» usa-se para chaves, carteira ou jogos.",
      quizPromptPt: "Se não correrem até à plataforma, vão perder o último comboio.",
      quizSentence: "Hurry up, or we'll ＿＿＿ the last train home!",
      quizAnswer: "miss",
      quizDistractor: "lose",
    },
    {
      id: "en-pair-customs-costume",
      wordA: "customs",
      wordB: "costume",
      summaryPt: "alfândega vs. fantasia/traje",
      tipPt: "No aeroporto passas por «customs» (sempre com -s final); «costume» é traje de espectáculo ou Carnaval.",
      quizPromptPt: "Acabaste de aterrar num voo internacional sem mercadorias sujeitas a imposto.",
      quizSentence: "We have nothing to declare at ＿＿＿.",
      quizAnswer: "customs",
      quizDistractor: "costume",
    },
  ],
  fr: [
    {
      id: "fr-pair-attendre-entendre",
      wordA: "attendre",
      wordB: "entendre",
      summaryPt: "esperar vs. ouvir",
      tipPt: "Falso amigo muito frequente: «attendre» é esperar (não 'atender'!); «entendre» é ouvir (e 'entender' é «comprendre»!).",
      quizPromptPt: "Há barulho na linha durante a chamada e perguntas se te conseguem ouvir bem.",
      quizSentence: "Allô, il y a du bruit — est-ce que vous pouvez bien m'＿＿＿ ?",
      quizAnswer: "entendre",
      quizDistractor: "attendre",
    },
    {
      id: "fr-pair-librairie-bibliotheque",
      wordA: "librairie",
      wordB: "bibliothèque",
      summaryPt: "livraria (loja) vs. biblioteca pública",
      tipPt: "Compras livros numa «librairie»; requisitas livros ou estudas gratuitamente numa «bibliothèque».",
      quizPromptPt: "Compraste um romance novo numa pequena livraria do bairro.",
      quizSentence: "J'ai acheté ce roman dans une petite ＿＿＿ du quartier.",
      quizAnswer: "librairie",
      quizDistractor: "bibliothèque",
    },
    {
      id: "fr-pair-savoir-connaitre",
      wordA: "savoir",
      wordB: "connaître",
      summaryPt: "saber facto/verbo vs. conhecer pessoa/lugar",
      tipPt: "«Savoir» usa-se antes de verbos ou frases (savoir conduire, savoir où); «connaître» usa-se apenas antes de substantivos (pessoas, cidades).",
      quizPromptPt: "Queres dizer que gostam de conhecer os pequenos bairros de Lyon.",
      quizSentence: "Nous aimons ＿＿＿ les petits quartiers de Lyon.",
      quizAnswer: "connaître",
      quizDistractor: "savoir",
    },
    {
      id: "fr-pair-preter-emprunter",
      wordA: "prêter",
      wordB: "emprunter",
      summaryPt: "emprestar (dar) vs. pedir emprestado",
      tipPt: "«Prêter» é emprestar algo teu a alguém; «emprunter» é pedir emprestado (ou seguir uma estrada/via!).",
      quizPromptPt: "Começa um aguaceiro e pedes um guarda-chuva emprestado a um colega.",
      quizSentence: "Il pleut fort, est-ce que je peux t'＿＿＿ un parapluie ?",
      quizAnswer: "emprunter",
      quizDistractor: "prêter",
    },
    {
      id: "fr-pair-taille-pointure",
      wordA: "taille",
      wordB: "pointure",
      summaryPt: "tamanho de roupa vs. número de calçado",
      tipPt: "Para casacos e calças pede-se «la taille» (S, M, 40); para sapatos e ténis pede-se «la pointure» (39, 42)!",
      quizPromptPt: "Estás numa sapataria e o empregado pergunta qual é o teu número de calçado.",
      quizSentence: "Excusez-moi, quelle est votre ＿＿＿ pour ces chaussures ?",
      quizAnswer: "pointure",
      quizDistractor: "taille",
    },
    {
      id: "fr-pair-amener-apporter",
      wordA: "amener",
      wordB: "apporter",
      summaryPt: "levar pessoa/animal vs. levar objecto na mão",
      tipPt: "Leva-se na mão («porter» → «apporter un gâteau») o que se carrega; leva-se consigo («mener» → «amener un ami») quem caminha.",
      quizPromptPt: "Foste convidado para jantar e perguntas o que podes levar para a sobremesa.",
      quizSentence: "Merci pour l'invitation ! Qu'est-ce que je peux ＿＿＿ pour le dessert ?",
      quizAnswer: "apporter",
      quizDistractor: "amener",
    },
    {
      id: "fr-pair-addition-facture",
      wordA: "addition",
      wordB: "facture",
      summaryPt: "conta do restaurante vs. factura de serviço/obra",
      tipPt: "No café ou bistrô pede-se sempre «l'addition»; «la facture» usa-se para electricidade, oficina, contratos ou contabilidade.",
      quizPromptPt: "Terminaste o almoço num restaurante e queres pedir a conta.",
      quizSentence: "Excusez-moi, pourriez-vous nous apporter l'＿＿＿, s'il vous plaît ?",
      quizAnswer: "addition",
      quizDistractor: "facture",
    },
    {
      id: "fr-pair-dossier-fichier",
      wordA: "dossier",
      wordB: "fichier",
      summaryPt: "processo/pasta vs. ficheiro informático",
      tipPt: "Na administração ou computador, «un dossier» é a pasta/processo; «un fichier» é o ficheiro individual (PDF, imagem).",
      quizPromptPt: "Queres dizer que envias o ficheiro PDF do orçamento em anexo.",
      quizSentence: "Je vous envoie le ＿＿＿ PDF du devis par e-mail.",
      quizAnswer: "fichier",
      quizDistractor: "dossier",
    },
  ],
  ja: [
    {
      id: "ja-pair-sumimasen-gomennasai",
      wordA: "すみません",
      wordB: "ごめんなさい",
      summaryPt: "com licença / desculpe formal vs. desculpa pessoal",
      tipPt: "«すみません» serve para chamar um funcionário, pedir passagem, agradecer um incómodo ou pedir desculpa pública; «ごめんなさい» usa-se com amigos/família.",
      quizPromptPt: "Queres chamar educadamente o empregado num restaurante para fazer o pedido.",
      quizSentence: "＿＿＿、ちゅうもんを おねがいします。",
      quizAnswer: "すみません",
      quizDistractor: "ごめんなさい",
    },
    {
      id: "ja-pair-wakarimasu-shitteimasu",
      wordA: "わかります",
      wordB: "しっています",
      summaryPt: "compreender/dominar vs. ter conhecimento/conhecer",
      tipPt: "«わかります» é compreender uma explicação ou língua; «しっています» (知っています) é conhecer um lugar, pessoa ou informação.",
      quizPromptPt: "Queres dizer que conheces aquele restaurante perto da estação.",
      quizSentence: "駅の 近くの あの レストランを ＿＿＿。",
      quizAnswer: "しっています",
      quizDistractor: "わかります",
    },
    {
      id: "ja-pair-shoumi-shouhi",
      wordA: "しょうみきげん",
      wordB: "しょうひきげん",
      summaryPt: "consumir de preferência antes vs. data-limite de segurança",
      tipPt: "«賞味期限» (しょうみきげん) indica qualidade ideal; «消費期限» (しょうひきげん) é o limite estrito de segurança alimentar em frescos!",
      quizPromptPt: "Compras uma marmita fresca e vês a data-limite estrita até hoje à noite.",
      quizSentence: "この おべんとうの ＿＿＿は 今日の 夜までです。",
      quizAnswer: "しょうひきげん",
      quizDistractor: "しょうみきげん",
    },
    {
      id: "ja-pair-kitsui-yurui",
      wordA: "きつい",
      wordB: "ゆるい",
      summaryPt: "apertado vs. largo (roupa e sapatos)",
      tipPt: "No provador ou sapataria, «きつい» indica que a peça aperta; «ゆるい» indica que está larga ou folgada.",
      quizPromptPt: "Os sapatos estão apertados e precisas de um tamanho acima.",
      quizSentence: "この くつは 少し ＿＿＿ので、大きい サイズは ありますか。",
      quizAnswer: "きつい",
      quizDistractor: "ゆるい",
    },
    {
      id: "ja-pair-omiyage-temiyage",
      wordA: "おみやげ",
      wordB: "てみやげ",
      summaryPt: "lembrança de viagem vs. presente ao visitar casa",
      tipPt: "«おみやげ» traz-se de uma viagem para colegas e amigos; «てみやげ» (手土産) são doces/fruta que levas ao visitar a casa de alguém.",
      quizPromptPt: "Foste convidado a casa de um anfitrião japonês e levas uma caixa de doces.",
      quizSentence: "つまらない ものですが、＿＿＿に おかしを もってきました。",
      quizAnswer: "てみやげ",
      quizDistractor: "おみやげ",
    },
    {
      id: "ja-pair-karimasu-kashimasu",
      wordA: "かります",
      wordB: "かします",
      summaryPt: "pedir emprestado/alugar vs. emprestar",
      tipPt: "«借ります» (かります) é pedir emprestado ou alugar um carro/livro; «貸します» (かします) é emprestar algo teu a alguém.",
      quizPromptPt: "Vais alugar um carro perto do aeroporto durante três dias.",
      quizSentence: "空港の 近くで 三日間 レンタカーを ＿＿＿。",
      quizAnswer: "かります",
      quizDistractor: "かします",
    },
    {
      id: "ja-pair-anshin-shinpai",
      wordA: "あんしん",
      wordB: "しんぱい",
      summaryPt: "tranquilidade/alívio vs. preocupação",
      tipPt: "«あんしん» expressa alívio quando tudo corre bem; «しんぱい» expressa preocupação («しんぱいしないで» = não te preocupes).",
      quizPromptPt: "Soubeste que todos chegaram bem a casa depois do tufão e sentiste alívio.",
      quizSentence: "みんな 元気だと 聞いて、ほんとうに ＿＿＿しました。",
      quizAnswer: "あんしん",
      quizDistractor: "しんぱい",
    },
    {
      id: "ja-pair-tadaima-okaeri",
      wordA: "ただいま",
      wordB: "おかえりなさい",
      summaryPt: "cheguei a casa vs. bem-vindo de volta",
      tipPt: "Quem chega a casa diz «ただいま»; quem já está em casa acolhe dizendo «おかえりなさい»!",
      quizPromptPt: "Estás em casa e alguém da família abre a porta dizendo «ただいま!».",
      quizSentence: "あ、＿＿＿！外は 寒かったでしょう。",
      quizAnswer: "おかえりなさい",
      quizDistractor: "ただいま",
    },
  ],
};

export interface ContextPackProgress {
  savedCount: number;
  totalCount: number;
  situationsDone: boolean;
  vocabDone: boolean;
  convDone: boolean;
  mastered: boolean;
}

/** Calcula o domínio de um pacote de contexto (palavras guardadas + situações + treino de vocabulário + conversa). */
export function contextPackProgress(
  pack: ContextPack,
  lang: LangCode,
  srs: Record<string, Card> = {},
  xpEvents: { lang?: LangCode; type?: string; reason?: string }[] = [],
): ContextPackProgress {
  const keys = pack.byLang[lang].vocabKeys;
  const savedCount = keys.filter((k) => !!srs[`w:${k.toLowerCase()}`]).length;
  const totalCount = keys.length;
  const situationsDone = xpEvents.some(
    (ev) =>
      (!ev.lang || ev.lang === lang) &&
      (ev.type === `context-sit:${pack.id}` || ev.reason === `context:${lang}:${pack.id}`),
  );
  const vocabDone = xpEvents.some(
    (ev) =>
      (!ev.lang || ev.lang === lang) &&
      (ev.type === `context-vocab:${pack.id}` || ev.reason === `ctx-vocab:${lang}:${pack.id}`),
  );
  const convDone = xpEvents.some(
    (ev) => (!ev.lang || ev.lang === lang) && ev.type === `context-conv:${pack.id}`,
  );
  const mastered = situationsDone && vocabDone && savedCount >= Math.ceil(totalCount * 0.75);
  return { savedCount, totalCount, situationsDone, vocabDone, convDone, mastered };
}

/** Estatísticas globais dos pacotes de contexto para o idioma activo. */
export function globalContextStats(
  lang: LangCode,
  srs: Record<string, Card> = {},
  xpEvents: { lang?: LangCode; type?: string; reason?: string }[] = [],
): {
  totalPacks: number;
  masteredPacks: number;
  exploredPacks: number;
  savedContextWords: number;
  totalContextWords: number;
} {
  let masteredPacks = 0;
  let exploredPacks = 0;
  const uniqueKeys = new Set<string>();
  for (const pack of CONTEXT_PACKS) {
    const prog = contextPackProgress(pack, lang, srs, xpEvents);
    if (prog.mastered) masteredPacks++;
    if (prog.savedCount > 0 || prog.situationsDone || prog.vocabDone || prog.convDone) exploredPacks++;
    for (const k of pack.byLang[lang].vocabKeys) uniqueKeys.add(k.toLowerCase());
  }
  let savedContextWords = 0;
  for (const k of uniqueKeys) {
    if (srs[`w:${k}`]) savedContextWords++;
  }
  return {
    totalPacks: CONTEXT_PACKS.length,
    masteredPacks,
    exploredPacks,
    savedContextWords,
    totalContextWords: uniqueKeys.size,
  };
}

const INTEREST_TO_PACKS: { match: string[]; packIds: string[]; label: string }[] = [
  {
    match: ["viagens", "travel", "turismo", "ferias", "hotel", "carro", "conducao"],
    packIds: ["aeroporto", "hotel", "transportes", "conducao", "clima", "emergencia", "restaurante"],
    label: "o teu interesse em viagens",
  },
  {
    match: ["trabalho", "carreira", "work", "negocios"],
    packIds: ["carreira", "remoto", "negociacao", "financas", "burocracia"],
    label: "o teu foco profissional",
  },
  {
    match: ["futebol", "jogos", "estadio", "equipa"],
    packIds: ["desporto", "bem-estar", "social"],
    label: "a tua paixão por futebol e desporto",
  },
  {
    match: ["estudos", "universidade", "study", "exames"],
    packIds: ["estudos", "habitacao", "burocracia", "falsos-amigos"],
    label: "os teus objectivos académicos",
  },
  {
    match: ["comida", "cultura", "gastronomia", "food", "culture", "cinema", "musica", "festas"],
    packIds: ["restaurante", "cultura", "eventos", "supermercado", "social", "falsos-amigos"],
    label: "o teu gosto por cultura e gastronomia",
  },
  {
    match: ["desporto", "saude", "bem-estar", "fitness", "ginasio"],
    packIds: ["bem-estar", "desporto", "saude", "clima", "supermercado"],
    label: "o teu foco em saúde e bem-estar",
  },
  {
    match: ["familia", "filhos", "criancas", "animais"],
    packIds: ["familia", "eventos", "supermercado", "saude", "habitacao"],
    label: "a tua rotina familiar",
  },
  {
    match: ["amigos", "social", "conversa", "dia-a-dia", "daily", "compras", "roupa"],
    packIds: ["social", "eventos", "vestuario", "supermercado", "habitacao", "servicos", "familia"],
    label: "conversas naturais do dia-a-dia",
  },
  {
    match: ["natureza", "clima", "trilhos", "montanha", "praia"],
    packIds: ["clima", "conducao", "transportes", "emergencia"],
    label: "o teu gosto por natureza e ar livre",
  },
  {
    match: ["tecnologia", "tech", "digital"],
    packIds: ["digital", "remoto", "negociacao", "servicos"],
    label: "o teu interesse digital",
  },
];

/** Sugere o próximo melhor pacote de contexto com base nos interesses e progresso do utilizador. */
export function recommendedContextPack(
  lang: LangCode,
  interests: string[] = [],
  srs: Record<string, Card> = {},
  xpEvents: { lang?: LangCode; type?: string; reason?: string }[] = [],
): { pack: ContextPack; reason: string } {
  const foldedInterests = interests.map(foldAccents);

  for (const rule of INTEREST_TO_PACKS) {
    if (foldedInterests.some((it) => rule.match.some((m) => it.includes(m)))) {
      for (const pid of rule.packIds) {
        const pack = CONTEXT_PACKS.find((p) => p.id === pid);
        if (pack && !contextPackProgress(pack, lang, srs, xpEvents).mastered) {
          return { pack, reason: `Recomendado para ${rule.label}` };
        }
      }
    }
  }

  // Caso não haja interesses definidos ou já estejam dominados, escolhe o primeiro pacote por dominar com menos palavras guardadas
  const unmastered = CONTEXT_PACKS.map((pack) => ({
    pack,
    prog: contextPackProgress(pack, lang, srs, xpEvents),
  })).filter((x) => !x.prog.mastered);

  if (unmastered.length > 0) {
    unmastered.sort((a, b) => a.prog.savedCount - b.prog.savedCount);
    const pick = unmastered[0];
    return {
      pack: pick.pack,
      reason:
        pick.prog.savedCount > 0
          ? `Já guardaste ${pick.prog.savedCount}/${pick.prog.totalCount} palavras — completa este cenário!`
          : "Cenário prático essencial para ganhares vocabulário útil hoje",
    };
  }

  return { pack: CONTEXT_PACKS[0], reason: "Revê frases e diálogos para manter a fluência afiada" };
}

/* ---------------- Ligações de Contexto, Colocações & Palavra do Dia ---------------- */

export interface WordContextSentence {
  text: string;
  pt: string;
  romaji?: string;
  sourceLabel: string;
}

export interface WordConfusableLink {
  otherKey: string;
  otherPt: string;
  summaryPt: string;
  tipPt: string;
}

export interface WordContextInfo {
  packs: ContextPack[];
  networks: VocabNetwork[];
  extraSentences: WordContextSentence[];
  relatedWords: { key: string; pt: string }[];
  /** Expressões fixas ou palavras compostas que contêm esta palavra. */
  collocations: { key: string; pt: string }[];
  /** Pares frequentemente confundidos por falantes de português. */
  confusableWith: WordConfusableLink[];
}

interface UnitWordHit {
  text: string;
  pt: string;
  romaji?: string;
  sourceLabel: string;
  coVocab: string[];
}

const UNIT_WORD_CACHE: Partial<Record<LangCode, Map<string, UnitWordHit[]>>> = {};

function getUnitWordIndex(lang: LangCode): Map<string, UnitWordHit[]> {
  if (UNIT_WORD_CACHE[lang]) return UNIT_WORD_CACHE[lang]!;
  const map = new Map<string, UnitWordHit[]>();
  const { dictionary, units } = CONTENT[lang];

  for (const u of units) {
    const label = `Etapa ${u.level} · ${u.title}`;
    for (const line of u.dialogue) {
      const seenInLine = new Set<string>();
      for (const tok of tokenize(line.text, lang, dictionary)) {
        if (tok.isPunct || !tok.key || seenInLine.has(tok.key)) continue;
        seenInLine.add(tok.key);
        let arr = map.get(tok.key);
        if (!arr) {
          arr = [];
          map.set(tok.key, arr);
        }
        if (arr.length < 3) {
          arr.push({
            text: line.text,
            pt: line.pt,
            romaji: line.romaji,
            sourceLabel: label,
            coVocab: u.vocab,
          });
        }
      }
    }
  }

  UNIT_WORD_CACHE[lang] = map;
  return map;
}

/**
 * Enriquece qualquer palavra do dicionário com:
 *  - pacotes de contexto onde é usada;
 *  - frases reais extraídas de contextos e diálogos das 54 unidades;
 *  - colocações / expressões multipalavra formadas com ela;
 *  - palavras companheiras do mesmo cenário para aprendizagem em rede semântica.
 */
export function wordContextInfo(lang: LangCode, rawKey: string): WordContextInfo {
  const key = rawKey.toLowerCase().trim();
  const dict = CONTENT[lang].dictionary;
  const entry = dict[key];
  if (!key || !entry) {
    return { packs: [], networks: [], extraSentences: [], relatedWords: [], collocations: [], confusableWith: [] };
  }

  const primaryClean = entry.example ? plainText(entry.example.text, lang).toLowerCase() : "";
  const seenSentences = new Set<string>(primaryClean ? [primaryClean] : []);
  const extraSentences: WordContextSentence[] = [];
  const packs: ContextPack[] = [];
  const relatedKeys: string[] = [];

  for (const pack of CONTEXT_PACKS) {
    const loc = pack.byLang[lang];
    const loweredVocab = loc.vocabKeys.map((v) => v.toLowerCase());
    const inVocab = loweredVocab.includes(key);
    let foundInPack = inVocab;

    for (const ph of loc.phrases) {
      if (tryMaskSentence(ph.text, key, lang)) {
        foundInPack = true;
        const clean = plainText(ph.text, lang).toLowerCase();
        if (!seenSentences.has(clean) && extraSentences.length < 3) {
          seenSentences.add(clean);
          extraSentences.push({
            text: ph.text,
            pt: ph.pt,
            romaji: ph.romaji,
            sourceLabel: `${pack.emoji} ${pack.title}`,
          });
        }
      }
    }

    for (const dl of getPackDialogue(pack, lang)) {
      if (tryMaskSentence(dl.text, key, lang)) {
        foundInPack = true;
        const clean = plainText(dl.text, lang).toLowerCase();
        if (!seenSentences.has(clean) && extraSentences.length < 3) {
          seenSentences.add(clean);
          extraSentences.push({
            text: dl.text,
            pt: dl.pt,
            romaji: dl.romaji,
            sourceLabel: `${pack.emoji} ${pack.title}`,
          });
        }
      }
    }

    if (foundInPack) {
      packs.push(pack);
      for (const vk of loweredVocab) {
        if (vk !== key && dict[vk] && !relatedKeys.includes(vk)) relatedKeys.push(vk);
      }
    }
  }

  const unitHits = getUnitWordIndex(lang).get(key) ?? [];
  for (const hit of unitHits) {
    const clean = plainText(hit.text, lang).toLowerCase();
    if (!seenSentences.has(clean) && extraSentences.length < 3) {
      seenSentences.add(clean);
      extraSentences.push({
        text: hit.text,
        pt: hit.pt,
        romaji: hit.romaji,
        sourceLabel: hit.sourceLabel,
      });
    }
    for (const vk of hit.coVocab) {
      const lk = vk.toLowerCase();
      if (lk !== key && dict[lk] && !relatedKeys.includes(lk) && relatedKeys.length < 6) {
        relatedKeys.push(lk);
      }
    }
  }

  // Descobre expressões multipalavra ou compostos onde a palavra entra (ex.: "card" -> "boarding pass / key card / loyalty card")
  const collocations: { key: string; pt: string }[] = [];
  const baseTarget = entry.lemma ? entry.lemma.toLowerCase() : key;
  if (lang === "ja") {
    const minLen = /[\u4e00-\u9faf]/.test(key) ? 1 : 2;
    if (key.length >= minLen) {
      for (const [ck, ce] of Object.entries(dict)) {
        if (ck !== key && ck.length > key.length && (ck.includes(key) || (baseTarget.length >= minLen && ck.includes(baseTarget)))) {
          collocations.push({ key: ck, pt: ce.pt });
          if (collocations.length >= 5) break;
        }
      }
    }
  } else if (!key.includes(" ")) {
    const wordRe = new RegExp(`(^|[^\\p{L}])(${escapeRegExp(key)}|${escapeRegExp(baseTarget)})(?=[^\\p{L}]|$)`, "iu");
    for (const [ck, ce] of Object.entries(dict)) {
      if (ck !== key && (ck.includes(" ") || ck.includes("-")) && wordRe.test(ck)) {
        collocations.push({ key: ck, pt: ce.pt });
        if (collocations.length >= 5) break;
      }
    }
  }

  const networks = VOCAB_NETWORKS.filter((net) =>
    net.keys[lang].some((nk) => nk.toLowerCase() === key || nk.toLowerCase() === baseTarget),
  );

  const confusableWith: WordConfusableLink[] = [];
  for (const pair of CONFUSABLE_PAIRS[lang]) {
    if (pair.wordA === key || pair.wordA === baseTarget) {
      const otherEntry = dict[pair.wordB];
      if (otherEntry) {
        confusableWith.push({
          otherKey: pair.wordB,
          otherPt: otherEntry.pt,
          summaryPt: pair.summaryPt,
          tipPt: pair.tipPt,
        });
      }
    } else if (pair.wordB === key || pair.wordB === baseTarget) {
      const otherEntry = dict[pair.wordA];
      if (otherEntry) {
        confusableWith.push({
          otherKey: pair.wordA,
          otherPt: otherEntry.pt,
          summaryPt: pair.summaryPt,
          tipPt: pair.tipPt,
        });
      }
    }
  }

  const relatedWords = relatedKeys.slice(0, 6).map((rk) => ({ key: rk, pt: dict[rk].pt }));
  return { packs, networks, extraSentences, relatedWords, collocations, confusableWith };
}

/** Escolhe deterministicamente a Expressão / Palavra do Dia em contexto real (priorizando itens com exemplo ainda por guardar). */
export function wordOfTheDay(
  lang: LangCode,
  srs: Record<string, Card> = {},
  dayStr = "2026-01-01",
): { key: string; entry: DictEntry; pack: ContextPack; saved: boolean } {
  const dict = CONTENT[lang].dictionary;
  const pool: { key: string; entry: DictEntry; pack: ContextPack; saved: boolean }[] = [];
  const seen = new Set<string>();

  for (const pack of CONTEXT_PACKS) {
    for (const rawKey of pack.byLang[lang].vocabKeys) {
      const key = rawKey.toLowerCase();
      if (seen.has(key)) continue;
      const entry = dict[key];
      if (!entry || !entry.example) continue;
      seen.add(key);
      pool.push({ key, entry, pack, saved: !!srs[`w:${key}`] });
    }
  }

  const unsaved = pool.filter((x) => !x.saved);
  const activePool = unsaved.length > 0 ? unsaved : pool;
  let hash = 0;
  const tag = `${dayStr}:${lang}`;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return activePool[hash % activePool.length];
}

/* ---------------- Pesquisador do Dicionário Vivo ---------------- */

export interface DictSearchItem {
  key: string;
  entry: DictEntry;
  saved: boolean;
  strong: boolean;
}

export function searchDictionary(
  lang: LangCode,
  query: string,
  opts: {
    pos?: PartOfSpeech | "all";
    onlyNotes?: boolean;
    srsFilter?: "all" | "saved" | "unsaved" | "weak" | "strong";
    packId?: string | "all";
    networkId?: string | "all";
    limit?: number;
  },
  srs: Record<string, Card> = {},
): { items: DictSearchItem[]; total: number } {
  const dict = CONTENT[lang].dictionary;
  const q = foldAccents(query.trim());
  const pos = opts.pos ?? "all";
  const srsFilter = opts.srsFilter ?? "all";
  const packFilter =
    opts.packId && opts.packId !== "all" ? CONTEXT_PACKS.find((p) => p.id === opts.packId) : undefined;
  const netFilter =
    opts.networkId && opts.networkId !== "all" ? VOCAB_NETWORKS.find((n) => n.id === opts.networkId) : undefined;
  const allowedPackKeys = packFilter
    ? new Set(packFilter.byLang[lang].vocabKeys.map((k) => k.toLowerCase()))
    : null;
  const allowedNetKeys = netFilter
    ? new Set(netFilter.keys[lang].map((k) => k.toLowerCase()))
    : null;
  const matched: DictSearchItem[] = [];

  for (const [key, entry] of Object.entries(dict)) {
    if (allowedPackKeys && !allowedPackKeys.has(key)) continue;
    if (allowedNetKeys && !allowedNetKeys.has(key)) continue;
    if (pos !== "all" && entry.pos !== pos) continue;
    if (opts.onlyNotes && !entry.note) continue;

    const card = srs[`w:${key}`];
    const saved = !!card;
    const strong = saved && isStrong(card);

    if (srsFilter === "saved" && !saved) continue;
    if (srsFilter === "unsaved" && saved) continue;
    if (srsFilter === "weak" && (!saved || strong)) continue;
    if (srsFilter === "strong" && !strong) continue;

    if (q) {
      const hay = foldAccents(
        [key, entry.lemma, entry.pt, entry.romaji ?? "", entry.reading ?? "", entry.pron ?? "", entry.note ?? ""].join(" "),
      );
      if (!hay.includes(q)) continue;
    }

    matched.push({ key, entry, saved, strong });
  }

  // Ordena: correspondência exacta/prefixo primeiro, depois entradas com exemplo/nota
  if (q) {
    matched.sort((a, b) => {
      const ak = foldAccents(a.key);
      const bk = foldAccents(b.key);
      const aExact = ak === q ? 0 : ak.startsWith(q) ? 1 : foldAccents(a.entry.pt).startsWith(q) ? 2 : 3;
      const bExact = bk === q ? 0 : bk.startsWith(q) ? 1 : foldAccents(b.entry.pt).startsWith(q) ? 2 : 3;
      return aExact - bExact;
    });
  } else {
    matched.sort((a, b) => {
      const aScore = (a.entry.note ? 2 : 0) + (a.entry.example ? 1 : 0);
      const bScore = (b.entry.note ? 2 : 0) + (b.entry.example ? 1 : 0);
      return bScore - aScore;
    });
  }

  const limit = opts.limit ?? 80;
  return { items: matched.slice(0, limit), total: matched.length };
}

/* ---------------- Gerador de Treino de Vocabulário em Contexto ---------------- */

export type VocabDrillMode = "cloze" | "recall" | "listen" | "write" | "pairs" | "mixed";
export type VocabQuestionType = "cloze" | "recall" | "listen" | "write" | "pairs";

export interface ContextualVocabQuestion {
  id: string;
  questionType: VocabQuestionType;
  wordKey: string;
  surfaceAnswer: string;
  maskedSentence: string;
  fullSentence: string;
  ptSentence: string;
  ptWord: string;
  pos: PartOfSpeech;
  reading?: string;
  romaji?: string;
  note?: string;
  sourceLabel?: string;
  contrastTip?: string;
  options: string[];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tryMaskSentence(sentence: string, target: string, lang: LangCode): { masked: string; surface: string } | null {
  const clean = plainText(sentence, lang);
  if (lang === "ja") {
    if (!clean.includes(target)) return null;
    return { masked: clean.replace(target, "＿＿＿"), surface: target };
  }
  const re = new RegExp(`(^|[^\\p{L}])(${escapeRegExp(target)})(?=[^\\p{L}]|$)`, "iu");
  const m = clean.match(re);
  if (!m) return null;
  const surface = m[2];
  const idx = (m.index ?? 0) + m[1].length;
  const masked = clean.slice(0, idx) + "＿＿＿" + clean.slice(idx + surface.length);
  return { masked, surface };
}

/** Avalia uma resposta escrita pelo aluno no modo «Escrever» (aceita acentos aproximados e, em japonês, kana/kanji/romaji). */
export function evaluateTypedVocabAnswer(
  rawInput: string,
  q: ContextualVocabQuestion,
  lang: LangCode,
): { ok: boolean; accentNote?: boolean } {
  const trimmed = rawInput.trim();
  if (!trimmed) return { ok: false };
  const dict = CONTENT[lang].dictionary;
  const entry = dict[q.wordKey];

  const accepted = [q.surfaceAnswer, q.wordKey];
  if (lang === "ja") {
    if (entry?.reading) accepted.push(entry.reading);
    if (entry?.romaji) accepted.push(entry.romaji);
    if (q.romaji) accepted.push(q.romaji);
  }

  const uExact = normalizeAnswer(trimmed, lang, false);
  const uFolded = normalizeAnswer(trimmed, lang, true);

  for (const cand of accepted) {
    if (!cand) continue;
    if (normalizeAnswer(cand, lang, false) === uExact) return { ok: true };
  }
  for (const cand of accepted) {
    if (!cand) continue;
    if (normalizeAnswer(cand, lang, true) === uFolded) {
      return { ok: true, accentNote: lang !== "ja" };
    }
  }
  return { ok: false };
}

export function buildContextualVocabDrill(
  lang: LangCode,
  srs: Record<string, Card> = {},
  maxLevel = 9,
  opts: {
    packId?: string;
    networkId?: string;
    onlyWeak?: boolean;
    count?: number;
    seed?: number;
    mode?: VocabDrillMode;
  } = {},
): ContextualVocabQuestion[] {
  const count = opts.count ?? 6;
  const seed = Math.max(0, Math.floor(opts.seed ?? 0));
  const mode: VocabDrillMode = opts.mode ?? "cloze";
  const { dictionary, units } = CONTENT[lang];

  // Modo dedicado «Nuances / Pares confusos»: contrasta directamente pares que confundem lusófonos
  if (mode === "pairs") {
    const pairs = [...CONFUSABLE_PAIRS[lang]];
    if (seed > 0 && pairs.length > 1) {
      const offset = (seed * 3) % pairs.length;
      pairs.push(...pairs.splice(0, offset));
    }
    const allEntries = Object.entries(dictionary).filter(([k]) => k.length >= (lang === "ja" ? 1 : 2));
    const pairOut: ContextualVocabQuestion[] = [];
    for (let i = 0; i < pairs.length && pairOut.length < count; i++) {
      const pr = pairs[i];
      const answerKey = pr.quizAnswer.toLowerCase();
      const entry = dictionary[answerKey] ?? dictionary[pr.wordA];
      if (!entry) continue;
      const samePosPool = allEntries
        .filter(([k, e]) => k !== answerKey && k !== pr.quizDistractor.toLowerCase() && e.pos === entry.pos && e.pt !== entry.pt)
        .map(([k]) => k);
      const extraDistractors: string[] = [];
      for (let d = 0; d < samePosPool.length && extraDistractors.length < 2; d++) {
        const pick = samePosPool[(i * 7 + d * 11 + seed * 13) % samePosPool.length];
        if (pick && !extraDistractors.includes(pick)) extraDistractors.push(pick);
      }
      const options = [pr.quizAnswer, pr.quizDistractor, ...extraDistractors].sort((a, b) => a.localeCompare(b));
      pairOut.push({
        id: `ctx-pair-${lang}-${pr.id}-${seed}`,
        questionType: "pairs",
        wordKey: answerKey,
        surfaceAnswer: pr.quizAnswer,
        maskedSentence: pr.quizSentence,
        fullSentence: pr.quizSentence.replace("＿＿＿", pr.quizAnswer),
        ptSentence: pr.quizPromptPt,
        ptWord: `${pr.wordA} vs. ${pr.wordB} (${pr.summaryPt})`,
        pos: entry.pos,
        reading: entry.reading ?? entry.romaji,
        romaji: entry.romaji,
        note: pr.tipPt,
        sourceLabel: `⚖️ Nuance · ${pr.wordA} ↔ ${pr.wordB}`,
        contrastTip: pr.tipPt,
        options,
      });
    }
    return pairOut;
  }

  const activePack = opts.packId ? CONTEXT_PACKS.find((p) => p.id === opts.packId) : undefined;
  const activeNetwork = opts.networkId ? VOCAB_NETWORKS.find((n) => n.id === opts.networkId) : undefined;
  const relatedSet = new Set(activePack?.relatedLevels ?? []);
  const sourceUnits = units.filter((u) => u.level <= Math.max(3, maxLevel) || relatedSet.has(u.level));

  // Mapa auxiliar de frases de diálogo/contexto onde cada chave aparece
  const dialogueByKey = new Map<string, { text: string; pt: string; sourceLabel: string }>();
  if (activePack) {
    const label = `${activePack.emoji} ${activePack.title}`;
    const packLines = [...activePack.byLang[lang].phrases, ...getPackDialogue(activePack, lang)];
    for (const ph of packLines) {
      for (const vk of activePack.byLang[lang].vocabKeys) {
        const k = vk.toLowerCase();
        if (!dialogueByKey.has(k) && tryMaskSentence(ph.text, k, lang)) {
          dialogueByKey.set(k, { text: ph.text, pt: ph.pt, sourceLabel: label });
        }
      }
    }
  } else {
    for (const p of CONTEXT_PACKS) {
      const label = `${p.emoji} ${p.title}`;
      const packLines = [...p.byLang[lang].phrases, ...getPackDialogue(p, lang)];
      for (const ph of packLines) {
        for (const vk of p.byLang[lang].vocabKeys) {
          const k = vk.toLowerCase();
          if (!dialogueByKey.has(k) && tryMaskSentence(ph.text, k, lang)) {
            dialogueByKey.set(k, { text: ph.text, pt: ph.pt, sourceLabel: label });
          }
        }
      }
    }
  }
  for (const u of [...sourceUnits, ...units]) {
    const label = `${u.emoji} Nível ${u.level} · ${u.title}`;
    for (const line of u.dialogue) {
      for (const tok of tokenize(line.text, lang, dictionary)) {
        if (!tok.isPunct && tok.key && !dialogueByKey.has(tok.key)) {
          dialogueByKey.set(tok.key, { text: line.text, pt: line.pt, sourceLabel: label });
        }
      }
    }
  }

  let candidateKeys: string[] = [];
  if (activePack) {
    candidateKeys = [...activePack.byLang[lang].vocabKeys.map((k) => k.toLowerCase())];
  } else if (activeNetwork) {
    candidateKeys = [...activeNetwork.keys[lang].map((k) => k.toLowerCase())];
  } else if (opts.onlyWeak) {
    candidateKeys = Object.entries(srs)
      .filter(([k, c]) => k.startsWith("w:") && !isStrong(c))
      .map(([k]) => k.slice(2))
      .filter((k) => !!dictionary[k]);
  }

  if (!activePack && !activeNetwork && candidateKeys.length < count * 2) {
    const weakKeys = Object.entries(srs)
      .filter(([k, c]) => k.startsWith("w:") && !isStrong(c))
      .map(([k]) => k.slice(2));
    const unitVocab = sourceUnits.slice(-6).flatMap((u) => u.vocab);
    const contextVocab = CONTEXT_PACKS.flatMap((p) => p.byLang[lang].vocabKeys.map((k) => k.toLowerCase()));
    const exampleRich = Object.entries(dictionary)
      .filter(([, e]) => !!e.example)
      .map(([k]) => k);
    for (const k of [...weakKeys, ...unitVocab, ...contextVocab, ...exampleRich]) {
      if (dictionary[k] && !candidateKeys.includes(k)) candidateKeys.push(k);
      if (candidateKeys.length >= count * 6) break;
    }
  }

  // Roda deterministicamente a lista de candidatos em rondas sucessivas ("Nova ronda")
  if (seed > 0 && candidateKeys.length > 1) {
    const step = ((seed * 3) % (candidateKeys.length - 1)) + 1;
    const rotated: string[] = [];
    const offset = (seed * 5) % candidateKeys.length;
    const used = new Set<number>();
    for (let j = 0; j < candidateKeys.length; j++) {
      let idx = (offset + j * step) % candidateKeys.length;
      while (used.has(idx)) idx = (idx + 1) % candidateKeys.length;
      used.add(idx);
      rotated.push(candidateKeys[idx]);
    }
    candidateKeys = rotated;
  }

  const allEntries = Object.entries(dictionary).filter(([k]) => k.length >= (lang === "ja" ? 1 : 2));
  const mixedRotation: VocabQuestionType[] = ["cloze", "recall", "listen"];
  const out: ContextualVocabQuestion[] = [];

  for (let i = 0; i < candidateKeys.length && out.length < count; i++) {
    const key = candidateKeys[i];
    const entry = dictionary[key];
    if (!entry) continue;

    const primarySource = entry.example;
    const altSource = dialogueByKey.get(key);
    const source = seed % 2 === 1 && altSource ? altSource : (primarySource ?? altSource);
    if (!source) continue;

    const maskAttempt =
      tryMaskSentence(source.text, key, lang) ??
      (entry.lemma && entry.lemma.toLowerCase() !== key ? tryMaskSentence(source.text, entry.lemma, lang) : null) ??
      (primarySource && source !== primarySource ? tryMaskSentence(primarySource.text, key, lang) : null);
    if (!maskAttempt) continue;
    const effectiveSource =
      primarySource && source !== primarySource && !tryMaskSentence(source.text, key, lang) ? primarySource : source;

    const samePosPool = allEntries
      .filter(([k, e]) => k !== key && e.pos === entry.pos && e.pt !== entry.pt)
      .map(([k]) => k);
    const fallbackPool = allEntries.filter(([k, e]) => k !== key && e.pt !== entry.pt).map(([k]) => k);
    const pool = samePosPool.length >= 3 ? samePosPool : fallbackPool;

    const distractors: string[] = [];
    for (let d = 0; d < pool.length && distractors.length < 3; d++) {
      const pick = pool[(i * 7 + d * 13 + seed * 17) % pool.length];
      if (pick && pick.toLowerCase() !== maskAttempt.surface.toLowerCase() && !distractors.includes(pick)) {
        distractors.push(pick);
      }
    }
    if (distractors.length < 3) continue;

    const questionType: VocabQuestionType =
      mode === "mixed" ? mixedRotation[(out.length + seed) % mixedRotation.length] : mode;

    const options = [maskAttempt.surface, ...distractors].sort((a, b) => a.localeCompare(b));
    const sourceLabel =
      altSource?.sourceLabel ??
      (activePack ? `${activePack.emoji} ${activePack.title}` : activeNetwork ? `${activeNetwork.emoji} ${activeNetwork.title}` : undefined);
    out.push({
      id: `ctx-vocab-${lang}-${key}-${seed}-${i}`,
      questionType,
      wordKey: key,
      surfaceAnswer: maskAttempt.surface,
      maskedSentence: maskAttempt.masked,
      fullSentence: plainText(effectiveSource.text, lang),
      ptSentence: effectiveSource.pt,
      ptWord: entry.pt,
      pos: entry.pos,
      reading: entry.reading ?? entry.romaji,
      romaji: entry.romaji,
      note: entry.note,
      sourceLabel,
      options,
    });
  }

  return out;
}

/* ---------------- Simulação de Contextos com o Tutor (Roleplay Guiado/Livre/Desafio) ---------------- */

function buildStepFromExchange(
  tutorLine: { text: string; pt: string; romaji?: string },
  userLine: { text: string; pt: string; romaji?: string },
  lang: LangCode,
  extraExpected: string[] = [],
): ConversationStep {
  const dict = CONTENT[lang].dictionary;
  const model = plainText(userLine.text, lang);
  const modelRomaji =
    userLine.romaji ??
    (lang === "ja"
      ? tokenize(userLine.text, "ja", dict)
          .filter((t) => !t.isPunct)
          .map((t) => t.entry?.romaji ?? t.text)
          .join(" ")
      : undefined);

  const expectedSet = new Set<string>([model]);
  for (const ex of extraExpected) {
    const clean = plainText(ex, lang).trim();
    if (clean) expectedSet.add(clean);
  }
  if (lang === "ja" && modelRomaji) {
    expectedSet.add(modelRomaji);
  } else {
    // Versão curta sem pontuação final ou apenas primeira frase se houver 2 frases
    const firstClause = model.split(/(?<=[.!?])\s+/)[0]?.trim();
    if (firstClause && firstClause !== model && firstClause.length >= 8) {
      expectedSet.add(firstClause);
    }
  }
  // Garante pelo menos 2 variantes aceites
  if (expectedSet.size < 2) {
    expectedSet.add(model.replace(/[.!?]+$/, ""));
  }

  // Extrai palavras-chave contidas em model
  const toks = tokenize(userLine.text, lang, dict).filter((t) => !t.isPunct && t.text.trim().length > 0);
  const contentToks = toks.filter(
    (t) => t.entry && ["noun", "verb", "adj", "adv", "expr"].includes(t.entry.pos),
  );
  const chosenToks = (contentToks.length > 0 ? contentToks : toks).slice(0, 2);
  const keywords = chosenToks
    .map((t) => plainText(t.text, lang).toLowerCase())
    .filter((kw) => normalizeAnswer(model, lang, true).includes(normalizeAnswer(kw, lang, true)));
  if (keywords.length === 0) {
    const fallbackKw = normalizeAnswer(model, lang, true).split(" ")[0] || model.slice(0, 2).toLowerCase();
    keywords.push(fallbackKw);
  }

  const starter =
    lang === "ja"
      ? toks
          .slice(0, Math.min(2, toks.length))
          .map((t) => t.text)
          .join("")
      : model.split(" ").slice(0, 3).join(" ");

  return {
    tutor: tutorLine.text,
    tutor_pt: tutorLine.pt,
    tutor_romaji: tutorLine.romaji,
    expected: Array.from(expectedSet),
    keywords,
    hint: `Expressa em contexto: «${userLine.pt}»`,
    starter,
    model,
    model_pt: userLine.pt,
    model_romaji: modelRomaji,
  };
}

/** Converte qualquer ContextPack numa unidade conversacional completa para o Tutor (Guiado, Livre e Desafio). */
export function contextPackToUnit(pack: ContextPack, lang: LangCode): Unit {
  const data = pack.byLang[lang];
  const dlg = getPackDialogue(pack, lang);

  const openerByLang: Record<LangCode, { text: string; pt: string; romaji?: string }> = {
    en: { text: "Hello! Welcome — how can I help you today?", pt: "Olá! Bem-vindo — como posso ajudá-lo hoje?" },
    fr: { text: "Bonjour ! Bienvenue, comment puis-je vous aider ?", pt: "Bom dia! Bem-vindo, como posso ajudá-lo?" },
    ja: {
      text: "こんにちは|！|今日|は|どう|しました|か|。",
      pt: "Olá! Em que posso ajudar hoje?",
      romaji: "Konnichiwa! Kyou wa dou shimashita ka.",
    },
  };

  const followUpByLang: Record<LangCode, (sitPt: string) => { text: string; pt: string; romaji?: string }> = {
    en: (sitPt) => ({
      text: "Got it! Anything else you'd like to ask or confirm?",
      pt: `Entendido! (${sitPt})`,
    }),
    fr: (sitPt) => ({
      text: "Très bien ! Avez-vous une autre question ou demande ?",
      pt: `Muito bem! (${sitPt})`,
    }),
    ja: (sitPt) => ({
      text: "分かりました|！|ほか|に|しつもん|は|あります|か|。",
      pt: `Compreendido! (${sitPt})`,
      romaji: "Wakarimashita! Hoka ni shitsumon wa arimasu ka.",
    }),
  };

  const closingByLang: Record<LangCode, { text: string; pt: string }> = {
    en: { text: "All sorted — have a wonderful day!", pt: "Tudo resolvido — tenha um excelente dia!" },
    fr: { text: "C'est tout bon — je vous souhaite une très bonne journée !", pt: "Está tudo tratado — desejo-lhe um óptimo dia!" },
    ja: { text: "かしこまりました。ありがとうございます、どうぞよろしくおねがいします！", pt: "Com certeza. Muito obrigado, tudo tratado!" },
  };

  const exchanges: { tutor: { text: string; pt: string; romaji?: string }; user: { text: string; pt: string; romaji?: string } }[] = [];

  if (dlg.length >= 4) {
    if (dlg[0].speaker !== "Tu" && dlg[1].speaker === "Tu") {
      exchanges.push({ tutor: dlg[0], user: dlg[1] });
      if (dlg[2].speaker !== "Tu" && dlg[3].speaker === "Tu") {
        exchanges.push({ tutor: dlg[2], user: dlg[3] });
      }
    } else if (dlg[0].speaker === "Tu" && dlg[1].speaker !== "Tu" && dlg[2].speaker === "Tu") {
      exchanges.push({ tutor: openerByLang[lang], user: dlg[0] });
      exchanges.push({ tutor: dlg[1], user: dlg[2] });
    }
  }

  // Completa até 3 turnos usando frases prontas do pacote para um roleplay rico
  const usedTexts = new Set(exchanges.map((e) => plainText(e.user.text, lang)));
  for (const ph of data.phrases) {
    if (exchanges.length >= 3) break;
    const clean = plainText(ph.text, lang);
    if (usedTexts.has(clean)) continue;
    usedTexts.add(clean);
    exchanges.push({
      tutor: followUpByLang[lang](ph.whenToUse),
      user: { text: ph.text, pt: ph.pt, romaji: ph.romaji },
    });
  }

  const steps = exchanges.slice(0, 3).map((ex, idx) => {
    const sitVariant = data.situations[idx]?.correct;
    return buildStepFromExchange(ex.tutor, ex.user, lang, sitVariant ? [sitVariant] : []);
  });

  const takeaways = data.phrases.slice(0, 2).map((p) => ({
    text: plainText(p.text, lang),
    pt: p.pt,
  }));

  return {
    id: `ctx-${lang}-${pack.id}`,
    lang,
    level: pack.relatedLevels[0] ?? 1,
    title: pack.title,
    titleTarget: plainText(data.phrases[0]?.text ?? pack.title, lang),
    category: pack.tag,
    emoji: pack.emoji,
    objective: pack.subtitle,
    dialogue: dlg,
    patterns: [],
    vocab: data.vocabKeys.map((k) => k.toLowerCase()),
    build: [],
    conversation: {
      goal: `${pack.emoji} ${pack.title} — ${pack.subtitle}`,
      steps,
      closing: closingByLang[lang].text,
      closing_pt: closingByLang[lang].pt,
      takeaways,
    },
  };
}

/** Resolve um ID de unidade sintética de contexto (`ctx-<lang>-<packId>`). */
export function getContextTutorUnit(unitId: string): Unit | undefined {
  if (!unitId.startsWith("ctx-")) return undefined;
  const parts = unitId.split("-");
  if (parts.length < 3) return undefined;
  const lang = parts[1] as LangCode;
  if (lang !== "en" && lang !== "fr" && lang !== "ja") return undefined;
  const packId = parts.slice(2).join("-");
  const pack = CONTEXT_PACKS.find((p) => p.id === packId);
  return pack ? contextPackToUnit(pack, lang) : undefined;
}

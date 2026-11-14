/**
 * Motor de Contextos Práticos, Kit de Bolso, Explorador de Dicionário
 * e Treino de Vocabulário em Contexto.
 */
import { CONTENT } from "@/content";
import type { Card } from "./fsrs";
import { isStrong } from "./fsrs";
import { plainText, tokenize } from "./tokenize";
import type { DictEntry, LangCode, PartOfSpeech } from "./types";

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
        vocabKeys: ["boarding pass", "customs", "layover", "carry-on", "passport", "flight", "luggage", "gate"],
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
        vocabKeys: ["carte d'embarquement", "douane", "escale", "bagage cabine", "passeport", "vol", "valise", "billet"],
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
        vocabKeys: ["パスポート", "にゅうこく", "とうじょうけん", "のりつぎ", "日本", "時間", "行く", "見る"],
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
        vocabKeys: ["exchange rate", "bank transfer", "fee", "contactless", "card", "cash", "account", "price"],
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
        vocabKeys: ["virement", "taux de change", "frais bancaires", "sans contact", "carte", "espèces", "compte", "prix"],
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
        vocabKeys: ["ふりこみ", "てすうりょう", "りょうがえ", "キャッシュレス", "キャッシュレス", "円", "買う", "高い"].filter(
          (v, i, a) => a.indexOf(v) === i,
        ),
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
        vocabKeys: ["on mute", "share my screen", "deadline", "follow up", "attend", "meeting", "team", "project"],
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
        vocabKeys: ["micro coupé", "partager mon écran", "échéance", "faire le point", "assister", "réunion", "équipe", "travail"],
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
        vocabKeys: ["がめん", "ミュート", "しめきり", "おつかれさまです", "会社", "時間", "話す", "見る"],
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
        vocabKeys: ["password", "log in", "charger", "wi-fi", "phone", "app", "update", "help"],
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
        vocabKeys: ["mot de passe", "chargeur", "en panne", "téléphone", "internet", "article", "problème", "aide"],
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
        vocabKeys: ["パスワード", "ログイン", "じゅうでんき", "ネット", "電話", "新しい", "見る", "聞く"],
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
        vocabKeys: ["prescription", "allergic", "workout", "pharmacy", "doctor", "pain", "medicine", "healthy"],
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
        vocabKeys: ["ordonnance", "allergique", "entraînement", "pharmacie", "médecin", "médicament", "mal", "sport"],
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
        vocabKeys: ["しょほうせん", "アレルギー", "トレーニング", "病院", "薬", "痛い", "元気", "休む"],
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
        vocabKeys: ["scholarship", "lecture", "assignment", "deadline", "attend", "study", "university", "question"],
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
        vocabKeys: ["bourse", "exposé", "stage", "échéance", "assister", "article", "université", "question"],
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
        vocabKeys: ["しょうがくきん", "レポート", "しめきり", "学生", "先生", "本", "読む", "書く"],
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
        vocabKeys: ["refund", "receipt", "tracking number", "fee", "order", "delivery", "contract", "sign"],
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
        vocabKeys: ["remboursement", "colis", "justificatif", "frais bancaires", "article", "contrat", "problème", "carte"],
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
        vocabKeys: ["へんきん", "こうかん", "けいやく", "だいじょうぶ", "店", "買う", "新しい", "見る"],
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
        vocabKeys: ["actually", "pretend", "attend", "sensible", "eventually", "turns out", "long story short", "in the end"],
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
        vocabKeys: ["attendre", "entendre", "pourtant", "assister", "l'actualité", "stage", "d'après", "presque"],
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
        vocabKeys: ["だいじょうぶ", "おつかれさまです", "そうです", "すごく", "今", "行く", "来る", "見る"],
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
];

/* ---------------- Pesquisador do Dicionário Vivo ---------------- */

export interface DictSearchItem {
  key: string;
  entry: DictEntry;
  saved: boolean;
  strong: boolean;
}

function foldAccents(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function searchDictionary(
  lang: LangCode,
  query: string,
  opts: {
    pos?: PartOfSpeech | "all";
    onlyNotes?: boolean;
    srsFilter?: "all" | "saved" | "unsaved" | "weak" | "strong";
    limit?: number;
  },
  srs: Record<string, Card> = {},
): { items: DictSearchItem[]; total: number } {
  const dict = CONTENT[lang].dictionary;
  const q = foldAccents(query.trim());
  const pos = opts.pos ?? "all";
  const srsFilter = opts.srsFilter ?? "all";
  const matched: DictSearchItem[] = [];

  for (const [key, entry] of Object.entries(dict)) {
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

export interface ContextualVocabQuestion {
  id: string;
  wordKey: string;
  surfaceAnswer: string;
  maskedSentence: string;
  fullSentence: string;
  ptSentence: string;
  ptWord: string;
  pos: PartOfSpeech;
  reading?: string;
  note?: string;
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

export function buildContextualVocabDrill(
  lang: LangCode,
  srs: Record<string, Card> = {},
  maxLevel = 9,
  opts: { packId?: string; onlyWeak?: boolean; count?: number } = {},
): ContextualVocabQuestion[] {
  const count = opts.count ?? 6;
  const { dictionary, units } = CONTENT[lang];
  const activePack = opts.packId ? CONTEXT_PACKS.find((p) => p.id === opts.packId) : undefined;
  const relatedSet = new Set(activePack?.relatedLevels ?? []);
  const sourceUnits = units.filter((u) => u.level <= Math.max(3, maxLevel) || relatedSet.has(u.level));

  // Mapa auxiliar de frases de diálogo onde cada chave aparece
  const dialogueByKey = new Map<string, { text: string; pt: string }>();
  if (activePack) {
    for (const ph of activePack.byLang[lang].phrases) {
      for (const vk of activePack.byLang[lang].vocabKeys) {
        const k = vk.toLowerCase();
        if (!dialogueByKey.has(k) && tryMaskSentence(ph.text, k, lang)) {
          dialogueByKey.set(k, { text: ph.text, pt: ph.pt });
        }
      }
    }
  }
  for (const u of sourceUnits) {
    for (const line of u.dialogue) {
      for (const tok of tokenize(line.text, lang, dictionary)) {
        if (!tok.isPunct && tok.key && !dialogueByKey.has(tok.key)) {
          dialogueByKey.set(tok.key, { text: line.text, pt: line.pt });
        }
      }
    }
  }

  let candidateKeys: string[] = [];
  if (activePack) {
    candidateKeys = [...activePack.byLang[lang].vocabKeys.map((k) => k.toLowerCase())];
  } else if (opts.onlyWeak) {
    candidateKeys = Object.entries(srs)
      .filter(([k, c]) => k.startsWith("w:") && !isStrong(c))
      .map(([k]) => k.slice(2))
      .filter((k) => !!dictionary[k]);
  }

  if (!activePack && candidateKeys.length < count * 2) {
    const weakKeys = Object.entries(srs)
      .filter(([k, c]) => k.startsWith("w:") && !isStrong(c))
      .map(([k]) => k.slice(2));
    const unitVocab = sourceUnits.slice(-6).flatMap((u) => u.vocab);
    const exampleRich = Object.entries(dictionary)
      .filter(([, e]) => !!e.example)
      .map(([k]) => k);
    for (const k of [...weakKeys, ...unitVocab, ...exampleRich]) {
      if (dictionary[k] && !candidateKeys.includes(k)) candidateKeys.push(k);
      if (candidateKeys.length >= count * 4) break;
    }
  }

  const allEntries = Object.entries(dictionary).filter(([k]) => k.length >= (lang === "ja" ? 1 : 2));
  const out: ContextualVocabQuestion[] = [];

  for (let i = 0; i < candidateKeys.length && out.length < count; i++) {
    const key = candidateKeys[i];
    const entry = dictionary[key];
    if (!entry) continue;

    const source = entry.example ?? dialogueByKey.get(key);
    if (!source) continue;

    const maskAttempt =
      tryMaskSentence(source.text, key, lang) ??
      (entry.lemma && entry.lemma.toLowerCase() !== key ? tryMaskSentence(source.text, entry.lemma, lang) : null);
    if (!maskAttempt) continue;

    const samePosPool = allEntries
      .filter(([k, e]) => k !== key && e.pos === entry.pos && e.pt !== entry.pt)
      .map(([k]) => k);
    const fallbackPool = allEntries.filter(([k, e]) => k !== key && e.pt !== entry.pt).map(([k]) => k);
    const pool = samePosPool.length >= 3 ? samePosPool : fallbackPool;

    const distractors: string[] = [];
    for (let d = 0; d < pool.length && distractors.length < 3; d++) {
      const pick = pool[(i * 7 + d * 13) % pool.length];
      if (pick && pick.toLowerCase() !== maskAttempt.surface.toLowerCase() && !distractors.includes(pick)) {
        distractors.push(pick);
      }
    }
    if (distractors.length < 3) continue;

    const options = [maskAttempt.surface, ...distractors].sort((a, b) => a.localeCompare(b));
    out.push({
      id: `ctx-vocab-${lang}-${key}-${i}`,
      wordKey: key,
      surfaceAnswer: maskAttempt.surface,
      maskedSentence: maskAttempt.masked,
      fullSentence: plainText(source.text, lang),
      ptSentence: source.pt,
      ptWord: entry.pt,
      pos: entry.pos,
      reading: entry.reading ?? entry.romaji,
      note: entry.note,
      options,
    });
  }

  return out;
}

/**
 * Motor de Contextos Práticos, Kit de Bolso, Explorador de Dicionário
 * e Treino de Vocabulário em Contexto.
 */
import { CONTENT } from "@/content";
import type { Card } from "./fsrs";
import { isStrong } from "./fsrs";
import { plainText, tokenize } from "./tokenize";
import type { DialogueLine, DictEntry, LangCode, PartOfSpeech } from "./types";

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
        vocabKeys: ["return ticket", "top up", "fare", "rush hour", "platform", "delay", "commute", "in advance"],
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
        vocabKeys: ["quai", "aller-retour", "recharger", "correspondance", "retard", "grève", "heure de pointe", "en avance"],
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
        vocabKeys: ["emergency", "lost property", "police report", "embassy", "wallet", "stolen", "insurance", "passport"],
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
        vocabKeys: ["catch up", "rain check", "no worries", "friendly", "sympathetic", "appointment", "in advance", "actually"],
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

export interface ContextPackProgress {
  savedCount: number;
  totalCount: number;
  situationsDone: boolean;
  vocabDone: boolean;
  mastered: boolean;
}

/** Calcula o domínio de um pacote de contexto (palavras guardadas + situações + treino de vocabulário). */
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
  const mastered = situationsDone && vocabDone && savedCount >= Math.ceil(totalCount * 0.75);
  return { savedCount, totalCount, situationsDone, vocabDone, mastered };
}

const INTEREST_TO_PACKS: { match: string[]; packIds: string[]; label: string }[] = [
  { match: ["viagens", "travel", "turismo", "ferias"], packIds: ["aeroporto", "transportes", "emergencia", "restaurante"], label: "o teu interesse em viagens" },
  { match: ["trabalho", "carreira", "work", "negocios"], packIds: ["carreira", "remoto", "financas"], label: "o teu foco profissional" },
  { match: ["estudos", "universidade", "study", "exames"], packIds: ["estudos", "habitacao", "falsos-amigos"], label: "os teus objectivos académicos" },
  { match: ["comida", "cultura", "gastronomia", "food", "culture"], packIds: ["restaurante", "social", "falsos-amigos"], label: "o teu gosto por cultura e gastronomia" },
  { match: ["amigos", "social", "conversa", "dia-a-dia", "daily"], packIds: ["social", "habitacao", "servicos"], label: "conversas naturais do dia-a-dia" },
  { match: ["tecnologia", "tech", "digital"], packIds: ["digital", "remoto"], label: "o teu interesse digital" },
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

/* ---------------- Ligações de Contexto & Exemplos Reais por Palavra ---------------- */

export interface WordContextSentence {
  text: string;
  pt: string;
  romaji?: string;
  sourceLabel: string;
}

export interface WordContextInfo {
  packs: ContextPack[];
  extraSentences: WordContextSentence[];
  relatedWords: { key: string; pt: string }[];
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
 *  - frases reais extraídas de contextos e diálogos das 54 unidades (cobrindo entradas sem `entry.example`);
 *  - palavras companheiras do mesmo cenário para aprendizagem em rede semântica.
 */
export function wordContextInfo(lang: LangCode, rawKey: string): WordContextInfo {
  const key = rawKey.toLowerCase().trim();
  const dict = CONTENT[lang].dictionary;
  const entry = dict[key];
  if (!key || !entry) return { packs: [], extraSentences: [], relatedWords: [] };

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

  const relatedWords = relatedKeys.slice(0, 6).map((rk) => ({ key: rk, pt: dict[rk].pt }));
  return { packs, extraSentences, relatedWords };
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
  const allowedPackKeys = packFilter
    ? new Set(packFilter.byLang[lang].vocabKeys.map((k) => k.toLowerCase()))
    : null;
  const matched: DictSearchItem[] = [];

  for (const [key, entry] of Object.entries(dict)) {
    if (allowedPackKeys && !allowedPackKeys.has(key)) continue;
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

export type VocabDrillMode = "cloze" | "recall" | "mixed";

export interface ContextualVocabQuestion {
  id: string;
  questionType: "cloze" | "recall";
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
  opts: { packId?: string; onlyWeak?: boolean; count?: number; seed?: number; mode?: VocabDrillMode } = {},
): ContextualVocabQuestion[] {
  const count = opts.count ?? 6;
  const seed = Math.max(0, Math.floor(opts.seed ?? 0));
  const mode: VocabDrillMode = opts.mode ?? "cloze";
  const { dictionary, units } = CONTENT[lang];
  const activePack = opts.packId ? CONTEXT_PACKS.find((p) => p.id === opts.packId) : undefined;
  const relatedSet = new Set(activePack?.relatedLevels ?? []);
  const sourceUnits = units.filter((u) => u.level <= Math.max(3, maxLevel) || relatedSet.has(u.level));

  // Mapa auxiliar de frases de diálogo onde cada chave aparece
  const dialogueByKey = new Map<string, { text: string; pt: string }>();
  if (activePack) {
    const packLines = [...activePack.byLang[lang].phrases, ...getPackDialogue(activePack, lang)];
    for (const ph of packLines) {
      for (const vk of activePack.byLang[lang].vocabKeys) {
        const k = vk.toLowerCase();
        if (!dialogueByKey.has(k) && tryMaskSentence(ph.text, k, lang)) {
          dialogueByKey.set(k, { text: ph.text, pt: ph.pt });
        }
      }
    }
  }
  for (const u of [...sourceUnits, ...units]) {
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
  const out: ContextualVocabQuestion[] = [];

  for (let i = 0; i < candidateKeys.length && out.length < count; i++) {
    const key = candidateKeys[i];
    const entry = dictionary[key];
    if (!entry) continue;

    // Em rondas pares/ímpares alterna entre frase do diálogo/contexto e frase de exemplo quando ambas existem
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

    const questionType: "cloze" | "recall" =
      mode === "mixed" ? ((out.length + seed) % 2 === 0 ? "cloze" : "recall") : mode;

    const options = [maskAttempt.surface, ...distractors].sort((a, b) => a.localeCompare(b));
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
      note: entry.note,
      options,
    });
  }

  return out;
}

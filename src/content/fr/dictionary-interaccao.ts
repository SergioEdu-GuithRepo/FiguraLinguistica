/**
 * Dicionário adicional da Etapa 3 — Interacção (níveis 19–27).
 * Só chaves que ainda não existem em dictionary.ts nem em dictionary-rotina.ts.
 */
import type { Dictionary } from "@/lib/types";

const AIDER = "aider — j'aide, tu aides, il/elle aide, nous aidons, vous aidez";
const POUVOIR = "pouvoir — je peux, tu peux, il/elle peut, vous pouvez; condicional: je pourrais, vous pourriez";
const DERANGER = "déranger — je dérange, tu déranges, ça dérange, vous dérangez";
const PORTER = "porter — je porte, tu portes, il/elle porte, nous portons, vous portez";
const OUVRIR = "ouvrir — j'ouvre, tu ouvres, il/elle ouvre, nous ouvrons, vous ouvrez; particípio: ouvert";
const FERMER = "fermer — je ferme, tu fermes, il/elle ferme, nous fermons, vous fermez; particípio: fermé";
const ATTENDRE = "attendre — j'attends, tu attends, il/elle attend, nous attendons, vous attendez";
const PREFERER = "préférer — je préfère, tu préfères, il/elle préfère, nous préférons, vous préférez";
const FAIRE = "faire — je fais, tu fais, il/elle fait, nous faisons, vous faites, ils/elles font";
const VOULOIR = "vouloir — je veux, tu veux, il/elle veut, nous voulons, vous voulez, ils/elles veulent";
const ECHANGER = "échanger — j'échange, tu échanges, il/elle échange, nous échangeons, vous échangez";
const ESSAYER = "essayer — j'essaie, tu essaies, il/elle essaie, nous essayons, vous essayez";
const PENSER = "penser — je pense, tu penses, il/elle pense, nous pensons, vous pensez";
const TROUVER = "trouver — je trouve, tu trouves, il/elle trouve, nous trouvons, vous trouvez";
const DEPENDRE = "dépendre — il/elle/ça dépend, ils/elles dépendent";
const COMMANDER = "commander — je commande, tu commandes, vous commandez; passé composé: j'ai commandé; plus-que-parfait: j'avais commandé";
const CHANGER = "changer — je change, tu changes, il/elle change, nous changeons, vous changez";
const APPORTER = "apporter — j'apporte, tu apportes, il/elle apporte, vous apportez";
const MANQUER = "manquer — il manque (falta / faltam)";
const DEVOIR = "devoir — je dois, tu dois, il/elle doit, nous devons, vous devez, ils/elles doivent";
const FINIR = "finir — je finis, tu finis, il/elle finit, nous finissons, vous finissez; passé composé: j'ai fini";
const DINER = "dîner — je dîne, tu dînes, il/elle dîne, nous dînons, vous dînez";
const REPORTER = "reporter — je reporte, tu reportes, on reporte, vous reportez";
const RATER = "rater — je rate, tu rates, il/elle rate; passé composé: j'ai raté";
const PARTIR = "partir — je pars, tu pars, il/elle part, nous partons, vous partez; passé composé: je suis parti(e)";
const CHERCHER = "chercher — je cherche, tu cherches, il/elle cherche, nous cherchons, vous cherchez";
const ECOUTER = "écouter — j'écoute, tu écoutes, il/elle écoute, nous écoutons, vous écoutez";
const CONNAITRE = "connaître — je connais, tu connais, il/elle connaît, nous connaissons, vous connaissez";
const AMENER = "amener — j'amène, tu amènes, il/elle/ça amène, vous amenez";
const RESTER = "rester — je reste, tu restes, il/elle reste, nous restons, vous restez";

export const dictionary: Dictionary = {
  // ── 19 · Pedir um favor ──
  "m'aider": { lemma: "aider", pos: "verb", pt: "ajudar-me", pron: "médê", conj: AIDER, note: "me + aider = m'aider (elisão antes de vogal)." },
  "s'il te plaît": { lemma: "s'il te plaît", pos: "expr", pt: "por favor (informal)", pron: "sil të plé", note: "Com amigos e família (tu). Formal: s'il vous plaît." },
  minute: { lemma: "minute", pos: "noun", pt: "minuto", pron: "minüt", gender: "f", note: "Feminino em francês: une minute." },
  "qu'il": { lemma: "que + il", pos: "pron", pt: "que ele / que (impessoal)", pron: "kil" },
  "qu'est-ce qu'il y a": { lemma: "qu'est-ce qu'il y a", pos: "expr", pt: "o que há? / o que se passa?", pron: "késkiliá" },
  valise: { lemma: "valise", pos: "noun", pt: "mala de viagem", pron: "valíz", gender: "f" },
  lourde: { lemma: "lourd", pos: "adj", pt: "pesada", pron: "lurd", note: "Masculino: lourd (lur — o d não se ouve)." },
  dérange: { lemma: "déranger", pos: "verb", pt: "incomoda", pron: "dêrãj", conj: DERANGER },
  "ça te dérange": { lemma: "déranger", pos: "expr", pt: "importas-te / incomoda-te", pron: "sa të dêrãj", note: "Ça te dérange de + infinitivo = importas-te de…?" },
  porter: { lemma: "porter", pos: "verb", pt: "levar / carregar (também: vestir)", pron: "portê", conj: PORTER },
  problème: { lemma: "problème", pos: "noun", pt: "problema", pron: "problém", gender: "m", note: "Masculino como em português: un problème." },
  "pas de problème": { lemma: "pas de problème", pos: "expr", pt: "sem problema / não há problema", pron: "pá dë problém" },
  attends: { lemma: "attendre", pos: "verb", pt: "espera / espero", pron: "atã", conj: ATTENDRE, note: "Falso amigo: attendre = esperar (não «atender»)." },
  "m'attendre": { lemma: "attendre", pos: "verb", pt: "esperar por mim", pron: "matãdr", conj: ATTENDRE },
  porte: { lemma: "porte", pos: "noun", pt: "porta", pron: "pórt", gender: "f" },
  fermée: { lemma: "fermé", pos: "adj", pt: "fechada", pron: "férmê", note: "Masculino: fermé (pronuncia-se igual)." },
  fermer: { lemma: "fermer", pos: "verb", pt: "fechar", pron: "férmê", conj: FERMER },
  ouvrir: { lemma: "ouvrir", pos: "verb", pt: "abrir", pron: "uvrír", conj: OUVRIR },
  fenêtre: { lemma: "fenêtre", pos: "noun", pt: "janela", pron: "fënétr", gender: "f" },
  monsieur: { lemma: "monsieur", pos: "noun", pt: "senhor / cavalheiro", pron: "mëssiö", gender: "m", note: "Atenção à pronúncia irregular: «mëssiö» (o r final não se pronuncia)." },
  "pourriez-vous": { lemma: "pouvoir", pos: "verb", pt: "poderia / poderiam? (muito educado)", pron: "puriê-vu", conj: POUVOIR, note: "Condicional de pouvoir — mais delicado do que pouvez-vous." },
  répéter: { lemma: "répéter", pos: "verb", pt: "repetir", pron: "rêpêtê", conj: "répéter — je répète, tu répètes, vous répétez" },
  lentement: { lemma: "lentement", pos: "adv", pt: "devagar / lentamente", pron: "lãtëmã" },
  prêter: { lemma: "prêter", pos: "verb", pt: "emprestar", pron: "prétê", conj: "prêter — je prête, tu prêtes, vous prêtez" },
  stylo: { lemma: "stylo", pos: "noun", pt: "caneta", pron: "stilô", gender: "m" },
  garder: { lemma: "garder", pos: "verb", pt: "guardar / tomar conta de", pron: "gardê", conj: "garder — je garde, tu gardes, vous gardez" },
  gentil: { lemma: "gentil", pos: "adj", pt: "simpático / amável", pron: "jãtí", note: "O l final não se pronuncia no masculino; feminino: gentille (jãtíi)." },
  rien: { lemma: "rien", pos: "pron", pt: "nada", pron: "riã" },
  "de rien": { lemma: "de rien", pos: "expr", pt: "de nada", pron: "dë riã" },
  "on y va": { lemma: "aller", pos: "expr", pt: "vamos lá / vamo-nos embora", pron: "õ ni va", note: "Com liaison obrigatória: on‿y va (õnivá)." },
  oh: { lemma: "oh", pos: "interj", pt: "oh / ui", pron: "ô" },
  "oh là là": { lemma: "oh là là", pos: "expr", pt: "ui! / ora essa! (surpresa)", pron: "ô la la" },
  arrivées: { lemma: "arriver", pos: "verb", pt: "chegadas (on est arrivées = chegámos)", pron: "arivê" },

  // ── 20 · Comparar opções ──
  veste: { lemma: "veste", pos: "noun", pt: "casaco (curto / blazer)", pron: "vést", gender: "f" },
  vestes: { lemma: "veste", pos: "noun", pt: "casacos", pron: "vést", gender: "f" },
  lequel: { lemma: "lequel", pos: "pron", pt: "qual (deles — masc.)", pron: "lëkél", note: "Substitui um nome masculino singular já conhecido." },
  laquelle: { lemma: "lequel", pos: "pron", pt: "qual (delas — fem.)", pron: "lakél", note: "Substitui um nome feminino singular já conhecido." },
  préfère: { lemma: "préférer", pos: "verb", pt: "prefiro / prefere", pron: "prêfér", conj: PREFERER },
  "préfères-tu": { lemma: "préférer", pos: "verb", pt: "preferes (tu)?", pron: "prêfér-tü", conj: PREFERER },
  préfères: { lemma: "préférer", pos: "verb", pt: "preferes", pron: "prêfér", conj: PREFERER },
  bleue: { lemma: "bleu", pos: "adj", pt: "azul (fem.)", pron: "blö", note: "Masculino: bleu (pronuncia-se igual)." },
  noire: { lemma: "noir", pos: "adj", pt: "preta", pron: "nuar", note: "Masculino: noir (pronuncia-se igual)." },
  jolie: { lemma: "joli", pos: "adj", pt: "bonita / gira", pron: "jolí" },
  moins: { lemma: "moins", pos: "adv", pt: "menos (moins … que = menos … do que)", pron: "muã" },
  chère: { lemma: "cher", pos: "adj", pt: "cara", pron: "chér", note: "Masculino: cher (pronuncia-se igual)." },
  vrai: { lemma: "vrai", pos: "adj", pt: "verdade / verdadeiro (c'est vrai = é verdade)", pron: "vré" },
  qualité: { lemma: "qualité", pos: "noun", pt: "qualidade", pron: "kalitê", gender: "f" },
  meilleur: { lemma: "meilleur", pos: "adj", pt: "melhor (masc.)", pron: "méiör", note: "Comparativo de bon: nunca se diz «plus bon»!" },
  meilleure: { lemma: "meilleur", pos: "adj", pt: "melhor (fem.)", pron: "méiör" },
  chaude: { lemma: "chaud", pos: "adj", pt: "quente (fem.)", pron: "chôd", note: "Masculino: chaud (chô — o d não se ouve)." },
  "l'autre": { lemma: "autre", pos: "pron", pt: "o outro / a outra", pron: "lôtr" },
  confortable: { lemma: "confortable", pos: "adj", pt: "confortável", pron: "kõfortábl" },
  pratique: { lemma: "pratique", pos: "adj", pt: "prático / prática", pron: "pratík" },
  légère: { lemma: "léger", pos: "adj", pt: "leve (fem.)", pron: "lêjér", note: "Masculino: léger (lêjê)." },
  couleur: { lemma: "couleur", pos: "noun", pt: "cor", pron: "kulör", gender: "f", note: "Feminino como em português: la couleur." },
  pourquoi: { lemma: "pourquoi", pos: "adv", pt: "porquê / por que razão", pron: "purkuá" },
  entre: { lemma: "entre", pos: "prep", pt: "entre", pron: "ãtr" },
  sacs: { lemma: "sac", pos: "noun", pt: "malas / sacos", pron: "sak", gender: "m" },

  // ── 21 · No mercado e trocas ──
  chemise: { lemma: "chemise", pos: "noun", pt: "camisa", pron: "chëmíz", gender: "f" },
  chemises: { lemma: "chemise", pos: "noun", pt: "camisas", pron: "chëmíz", gender: "f" },
  quarante: { lemma: "quarante", pos: "num", pt: "quarenta", pron: "karãt" },
  faites: { lemma: "faire", pos: "verb", pt: "faz / fazem (vous)", pron: "fét", conj: FAIRE, note: "Forma irregular com vous: vous faites (nunca «vous faisez»)." },
  remise: { lemma: "remise", pos: "noun", pt: "desconto / abatimento", pron: "rëmíz", gender: "f", note: "faire une remise (ou une réduction) = fazer um desconto." },
  si: { lemma: "si", pos: "conj", pt: "se (condição); também «sim» (para contrariar pergunta negativa)", pron: "sí" },
  chacune: { lemma: "chacun", pos: "pron", pt: "cada uma", pron: "chakün", note: "Masculino: chacun (chakã)." },
  taille: { lemma: "taille", pos: "noun", pt: "tamanho (de roupa)", pron: "tái", gender: "f", note: "Para sapatos usa-se la pointure." },
  "l'échanger": { lemma: "échanger", pos: "verb", pt: "trocá-lo / trocá-la", pron: "lêchãjê", conj: ECHANGER },
  échanger: { lemma: "échanger", pos: "verb", pt: "trocar (uma compra por outra)", pron: "êchãjê", conj: ECHANGER },
  reçu: { lemma: "reçu", pos: "noun", pt: "talão / recibo", pron: "rëssü", gender: "m", note: "Nas lojas também se diz muito le ticket de caisse." },
  voulez: { lemma: "vouloir", pos: "verb", pt: "quer / querem (vous)", pron: "vulê", conj: VOULOIR },
  moyenne: { lemma: "moyen", pos: "adj", pt: "média", pron: "muaién", note: "Masculino: moyen (muaiã)." },
  "payer par carte": { lemma: "payer par carte", pos: "expr", pt: "pagar com cartão", pron: "pêiê par kart" },
  sans: { lemma: "sans", pos: "prep", pt: "sem", pron: "sã" },
  contact: { lemma: "contact", pos: "noun", pt: "contacto", pron: "kõtákt", gender: "m" },
  "sans contact": { lemma: "sans contact", pos: "expr", pt: "contactless (sem contacto)", pron: "sã kõtákt" },
  votre: { lemma: "votre", pos: "det", pt: "o seu / a sua / o vosso", pron: "vótr" },
  long: { lemma: "long", pos: "adj", pt: "comprido / longo", pron: "lõ", note: "Feminino: longue (lõg)." },
  serré: { lemma: "serré", pos: "adj", pt: "apertado / justo", pron: "sérê" },
  essayer: { lemma: "essayer", pos: "verb", pt: "experimentar (roupa) / tentar", pron: "éssêiê", conj: ESSAYER },
  pantalon: { lemma: "pantalon", pos: "noun", pt: "calças", pron: "pãtalõ", gender: "m", note: "Singular em francês: un pantalon = umas calças." },
  espèces: { lemma: "espèce", pos: "noun", pt: "dinheiro vivo / numerário (en espèces)", pron: "éspés", gender: "f" },
  "en espèces": { lemma: "en espèces", pos: "expr", pt: "em dinheiro (numerário)", pron: "ãnéspés" },
  ici: { lemma: "ici", pos: "adv", pt: "aqui", pron: "issí" },
  belle: { lemma: "beau", pos: "adj", pt: "bela / bonita", pron: "bél", note: "Masculino: beau (bô)." },
  petite: { lemma: "petit", pos: "adj", pt: "pequena", pron: "pëtít" },

  // ── 22 · Dar a minha opinião ──
  pense: { lemma: "penser", pos: "verb", pt: "penso / acho", pron: "pãs", conj: PENSER },
  penses: { lemma: "penser", pos: "verb", pt: "pensas / achas", pron: "pãs", conj: PENSER, note: "penser de = achar de (opinião): qu'est-ce que tu penses de…?" },
  "je pense que": { lemma: "penser", pos: "expr", pt: "acho que / penso que", pron: "jë pãs kë" },
  nouveau: { lemma: "nouveau", pos: "adj", pt: "novo", pron: "nuvô", note: "Feminino: nouvelle (nuvél)." },
  bruyant: { lemma: "bruyant", pos: "adj", pt: "barulhento", pron: "brüiã", note: "Vem de bruit (barulho). Feminino: bruyante." },
  "je suis d'accord": { lemma: "être d'accord", pos: "expr", pt: "estou de acordo / concordo", pron: "jë süí dakór", note: "Usa-se sempre com être: je suis d'accord, tu es d'accord." },
  avis: { lemma: "avis", pos: "noun", pt: "opinião", pron: "aví", gender: "m", note: "Falso amigo: avis = opinião; «aviso» diz-se avertissement ou panneau." },
  "à mon avis": { lemma: "à mon avis", pos: "expr", pt: "na minha opinião", pron: "a mõnaví" },
  service: { lemma: "service", pos: "noun", pt: "serviço / atendimento", pron: "sérvís", gender: "m" },
  lent: { lemma: "lent", pos: "adj", pt: "lento", pron: "lã", note: "Feminino: lente (lãt)." },
  dépend: { lemma: "dépendre", pos: "verb", pt: "depende", pron: "dêpã", conj: DEPENDRE },
  "ça dépend": { lemma: "dépendre", pos: "expr", pt: "depende", pron: "sa dêpã", note: "ça dépend de… = depende de…" },
  dernier: { lemma: "dernier", pos: "adj", pt: "passado / último", pron: "dérniê", note: "samedi dernier = no sábado passado." },
  rapide: { lemma: "rapide", pos: "adj", pt: "rápido", pron: "rapíd" },
  "ah bon": { lemma: "ah bon", pos: "expr", pt: "ai sim? / a sério?", pron: "a bõ" },
  trouve: { lemma: "trouver", pos: "verb", pt: "acho / encontro", pron: "truv", conj: TROUVER, note: "je trouve que… = acho que… (opinião pessoal)." },
  trouves: { lemma: "trouver", pos: "verb", pt: "achas / encontras", pron: "truv", conj: TROUVER },
  plats: { lemma: "plat", pos: "noun", pt: "pratos", pron: "plá", gender: "m" },
  bons: { lemma: "bon", pos: "adj", pt: "bons", pron: "bõ" },
  raison: { lemma: "raison", pos: "noun", pt: "razão", pron: "rézõ", gender: "f" },
  "tu as raison": { lemma: "avoir raison", pos: "expr", pt: "tens razão", pron: "tü a rézõ", note: "Tal como em português, usa avoir: j'ai raison, tu as raison." },
  trop: { lemma: "trop", pos: "adv", pt: "demasiado", pron: "trô", note: "O p não se pronuncia. trop cher = demasiado caro." },
  intéressant: { lemma: "intéressant", pos: "adj", pt: "interessante", pron: "ãtêréssã" },
  vraiment: { lemma: "vraiment", pos: "adv", pt: "realmente / mesmo", pron: "vrémã" },
  important: { lemma: "important", pos: "adj", pt: "importante", pron: "ãportã" },
  "tout à fait": { lemma: "tout à fait", pos: "expr", pt: "totalmente / absolutamente", pron: "tutafé" },
  habiter: { lemma: "habiter", pos: "verb", pt: "morar / viver", pron: "abitê" },
  ville: { lemma: "ville", pos: "noun", pt: "cidade", pron: "víl", gender: "f", note: "Falso amigo: la ville = a cidade (não «vila»)." },

  // ── 23 · Imprevistos no restaurante ──
  froid: { lemma: "froid", pos: "adj", pt: "frio", pron: "fruá", note: "Il fait froid = está frio; le plat est froid = o prato está frio." },
  froide: { lemma: "froid", pos: "adj", pt: "fria", pron: "fruád" },
  changer: { lemma: "changer", pos: "verb", pt: "mudar / trocar", pron: "chãjê", conj: CHANGER, note: "changer de table = mudar de mesa (sem artigo)." },
  peut: { lemma: "pouvoir", pos: "verb", pt: "pode (on peut = podemos)", pron: "pö", conj: POUVOIR },
  table: { lemma: "table", pos: "noun", pt: "mesa", pron: "tábl", gender: "f" },
  "j'avais": { lemma: "avoir", pos: "aux", pt: "eu tinha", pron: "javé" },
  commandé: { lemma: "commander", pos: "verb", pt: "pedido / encomendado", pron: "komãdê", conj: COMMANDER },
  "j'avais commandé": { lemma: "commander", pos: "expr", pt: "eu tinha pedido", pron: "javé komãdê", note: "Mais-que-perfeito: muito usado para corrigir um pedido com delicadeza." },
  commander: { lemma: "commander", pos: "verb", pt: "pedir (no restaurante) / encomendar", pron: "komãdê", conj: COMMANDER },
  apporte: { lemma: "apporter", pos: "verb", pt: "trago / traz", pron: "apórt", conj: APPORTER },
  suite: { lemma: "suite", pos: "noun", pt: "seguida / continuação", pron: "süít", gender: "f" },
  "tout de suite": { lemma: "tout de suite", pos: "expr", pt: "imediatamente / já a seguir", pron: "tu dë süít" },
  plat: { lemma: "plat", pos: "noun", pt: "prato (comida servida)", pron: "plá", gender: "m", note: "le plat = a comida/prato do menu; l'assiette = o prato (objecto de louça)." },
  assiette: { lemma: "assiette", pos: "noun", pt: "prato (de louça)", pron: "assiét", gender: "f" },
  "ce n'est rien": { lemma: "ce n'est rien", pos: "expr", pt: "não é nada / não faz mal", pron: "së né riã" },
  manque: { lemma: "manquer", pos: "verb", pt: "falta (il manque)", pron: "mãk", conj: MANQUER, note: "il manque une fourchette = falta um garfo." },
  fourchette: { lemma: "fourchette", pos: "noun", pt: "garfo", pron: "furchét", gender: "f", note: "Feminino em francês: la fourchette (o garfo)." },
  couteau: { lemma: "couteau", pos: "noun", pt: "faca", pron: "kutô", gender: "m", note: "Masculino em francês: le couteau (a faca)." },
  sale: { lemma: "sale", pos: "adj", pt: "sujo / suja", pron: "sál", note: "Falso amigo: sale = sujo; «sala» diz-se salle (com dois l); «salgado» = salé." },
  sucre: { lemma: "sucre", pos: "noun", pt: "açúcar", pron: "sükr", gender: "m" },
  avoir: { lemma: "avoir", pos: "verb", pt: "ter", pron: "avuar" },
  voici: { lemma: "voici", pos: "expr", pt: "aqui está / eis", pron: "vuassí" },

  // ── 24 · Convites e desculpas ──
  envie: { lemma: "envie", pos: "noun", pt: "vontade / desejo", pron: "ãví", gender: "f", note: "avoir envie de = ter vontade de / apetecer." },
  "as envie": { lemma: "avoir envie", pos: "expr", pt: "tens vontade", pron: "a ãví" },
  "tu as envie": { lemma: "avoir envie", pos: "expr", pt: "tens vontade / apetece-te", pron: "tü a ãví" },
  dois: { lemma: "devoir", pos: "verb", pt: "devo / tenho de (também: deves / tens de)", pron: "duá", conj: DEVOIR, note: "je dois + infinitivo = tenho de…" },
  finir: { lemma: "finir", pos: "verb", pt: "acabar / terminar", pron: "finír", conj: FINIR },
  travail: { lemma: "travail", pos: "noun", pt: "trabalho", pron: "travái", gender: "m" },
  tard: { lemma: "tard", pos: "adv", pt: "tarde", pron: "tar", note: "O d final não se pronuncia." },
  "vingt-deux": { lemma: "vingt-deux", pos: "num", pt: "vinte e dois", pron: "vãt-dö" },
  reporte: { lemma: "reporter", pos: "verb", pt: "adia (on reporte = adiamos)", pron: "rëpórt", conj: REPORTER, note: "reporter à demain = adiar para amanhã." },
  dîner: { lemma: "dîner", pos: "verb", pt: "jantar", pron: "dinê", conj: DINER, note: "Em França: petit-déjeuner (pequeno-almoço), déjeuner (almoço), dîner (jantar)." },
  souci: { lemma: "souci", pos: "noun", pt: "preocupação / problema", pron: "sussí", gender: "m" },
  "pas de souci": { lemma: "pas de souci", pos: "expr", pt: "sem problema / tranquilo", pron: "pá dë sussí", note: "Muito usado no dia-a-dia em vez de pas de problème." },
  "une autre fois": { lemma: "une autre fois", pos: "expr", pt: "noutra altura / fica para outra vez", pron: "ün ôtrë fuá" },
  "peut-être": { lemma: "peut-être", pos: "adv", pt: "talvez", pron: "pötétr", note: "Literalmente «pode ser»." },
  exposition: { lemma: "exposition", pos: "noun", pt: "exposição", pron: "ékspozissiõ", gender: "f", note: "Na fala abrevia-se muitas vezes para une expo." },
  toute: { lemma: "tout", pos: "adj", pt: "toda", pron: "tut", note: "toute la journée = o dia todo." },
  étudier: { lemma: "étudier", pos: "verb", pt: "estudar", pron: "êtüdiê", conj: "étudier — j'étudie, tu étudies, il/elle étudie" },
  occupée: { lemma: "occupé", pos: "adj", pt: "ocupada", pron: "oküpê", note: "Masculino: occupé (pronuncia-se igual)." },

  // ── 25 · Ligações e atrasos ──
  ligne: { lemma: "ligne", pos: "noun", pt: "linha (de metro, comboio, autocarro)", pron: "lính", gender: "f", note: "«gn» lê-se como «nh» em português: ligne ≈ «linhe»." },
  lyon: { lemma: "Lyon", pos: "noun", pt: "Lyon (cidade francesa; Gare de Lyon em Paris)", pron: "liõ", gender: "m" },
  correspondance: { lemma: "correspondance", pos: "noun", pt: "transbordo / ligação (entre linhas)", pron: "koréspõdãs", gender: "f" },
  châtelet: { lemma: "Châtelet", pos: "noun", pt: "Châtelet (grande estação central do metro de Paris)", pron: "chatlé", gender: "m" },
  part: { lemma: "partir", pos: "verb", pt: "parte / sai", pron: "par", conj: PARTIR },
  "dépêchez-vous": { lemma: "se dépêcher", pos: "verb", pt: "despache-se / despachem-se", pron: "dêpêchê-vu", note: "Informal (tu): dépêche-toi !" },
  allô: { lemma: "allô", pos: "interj", pt: "estou? / alô? (ao telefone)", pron: "alô" },
  raté: { lemma: "rater", pos: "verb", pt: "perdido (j'ai raté = perdi o comboio/autocarro)", pron: "ratê", conj: RATER, note: "rater le train = perder o comboio." },
  rater: { lemma: "rater", pos: "verb", pt: "perder (um transporte) / falhar", pron: "ratê", conj: RATER },
  retard: { lemma: "retard", pos: "noun", pt: "atraso", pron: "rëtar", gender: "m", note: "avoir dix minutes de retard = ter dez minutos de atraso." },
  "en retard": { lemma: "en retard", pos: "expr", pt: "atrasado/a", pron: "ã rëtar", note: "être en retard = estar/chegar atrasado." },
  prochain: { lemma: "prochain", pos: "adj", pt: "próximo", pron: "prochã", note: "Feminino: prochaine (prochén)." },
  voie: { lemma: "voie", pos: "noun", pt: "linha / via (na estação de comboios)", pron: "vuá", gender: "f", note: "Pronuncia-se «vuá». Indica a linha/plataforma de onde parte o comboio." },
  "t'attends": { lemma: "attendre", pos: "verb", pt: "espero por ti (je t'attends)", pron: "tatã", conj: ATTENDRE, note: "Em francês attendre não leva preposição: je t'attends = espero por ti." },
  être: { lemma: "être", pos: "verb", pt: "ser / estar", pron: "étr" },
  "à l'heure": { lemma: "à l'heure", pos: "expr", pt: "a horas / pontual", pron: "a lör" },
  avance: { lemma: "avance", pos: "noun", pt: "adiantamento / avanço", pron: "avãs", gender: "f", note: "être en avance = estar/chegar adiantado." },
  "en avance": { lemma: "en avance", pos: "expr", pt: "adiantado/a (antes da hora)", pron: "ãnavãs" },
  cherchez: { lemma: "chercher", pos: "verb", pt: "procura / procuram (vous)", pron: "chérchê", conj: CHERCHER },
  chemin: { lemma: "chemin", pos: "noun", pt: "caminho", pron: "chëmã", gender: "m" },

  // ── 26 · Preferências e estilos ──
  écoutes: { lemma: "écouter", pos: "verb", pt: "ouves / estás a ouvir", pron: "êkút", conj: ECOUTER },
  "j'écoute": { lemma: "écouter", pos: "verb", pt: "oiço / estou a ouvir", pron: "jêkút", conj: ECOUTER },
  genre: { lemma: "genre", pos: "noun", pt: "género / estilo / tipo", pron: "jãr", gender: "m", note: "quel genre de… = que tipo / estilo de…" },
  musique: { lemma: "musique", pos: "noun", pt: "música", pron: "müzík", gender: "f" },
  "aimes-tu": { lemma: "aimer", pos: "verb", pt: "gostas (tu)?", pron: "ém-tü" },
  jazz: { lemma: "jazz", pos: "noun", pt: "jazz", pron: "djáz", gender: "m" },
  rock: { lemma: "rock", pos: "noun", pt: "rock", pron: "rók", gender: "m" },
  africaine: { lemma: "africain", pos: "adj", pt: "africana", pron: "afrikén", note: "Masculino: africain (afrikã)." },
  surtout: { lemma: "surtout", pos: "adv", pt: "sobretudo / especialmente", pron: "sürtú" },
  semba: { lemma: "semba", pos: "noun", pt: "semba (género musical angolano)", pron: "sembá", gender: "m" },
  films: { lemma: "film", pos: "noun", pt: "filmes", pron: "film", gender: "m" },
  mieux: { lemma: "mieux", pos: "adv", pt: "melhor (advérbio); (j'aime mieux) gosto mais / prefiro", pron: "miö" },
  "j'aime mieux": { lemma: "aimer mieux", pos: "expr", pt: "gosto mais de / prefiro", pron: "jém miö", note: "Sinónimo muito comum de je préfère." },
  comédies: { lemma: "comédie", pos: "noun", pt: "comédias", pron: "komêdí", gender: "f" },
  "d'action": { lemma: "action", pos: "noun", pt: "de acção", pron: "daksiõ", gender: "f", note: "un film d'action = um filme de acção." },
  horreur: { lemma: "horreur", pos: "noun", pt: "horror / pavor", pron: "orör", gender: "f" },
  "j'ai horreur": { lemma: "avoir horreur", pos: "expr", pt: "tenho pavor / detesto mesmo", pron: "jê orör", note: "avoir horreur de = detestar profundamente." },
  "d'horreur": { lemma: "horreur", pos: "noun", pt: "de terror (film d'horreur)", pron: "dorör", gender: "f" },
  livres: { lemma: "livre", pos: "noun", pt: "livros", pron: "lívr", gender: "m", note: "un livre (masc.) = um livro." },
  séries: { lemma: "série", pos: "noun", pt: "séries", pron: "sêrí", gender: "f" },
  "d'être": { lemma: "être", pos: "verb", pt: "de estar / de ser", pron: "détr" },

  // ── 27 · Conversa social ──
  beau: { lemma: "beau", pos: "adj", pt: "bonito / bom (tempo)", pron: "bô", note: "Il fait beau = está bom tempo." },
  "il fait beau": { lemma: "faire beau", pos: "expr", pt: "está bom tempo", pron: "il fé bô" },
  "aujourd'hui": { lemma: "aujourd'hui", pos: "adv", pt: "hoje", pron: "ôjurdüí" },
  agréable: { lemma: "agréable", pos: "adj", pt: "agradável", pron: "agrêábl" },
  soleil: { lemma: "soleil", pos: "noun", pt: "sol", pron: "soléi", gender: "m", note: "il y a du soleil = está sol." },
  connais: { lemma: "connaître", pos: "verb", pt: "conheço / conheces", pron: "koné", conj: CONNAITRE, note: "connaître + pessoa ou lugar = conhecer." },
  depuis: { lemma: "depuis", pos: "prep", pt: "há (tempo) / desde", pron: "dëpüí", note: "Com presente indica algo que continua: j'habite ici depuis cinq ans = moro aqui há cinco anos." },
  "t'amène": { lemma: "amener", pos: "verb", pt: "te traz", pron: "tamén", conj: AMENER, note: "Qu'est-ce qui t'amène à Paris ? = O que te traz a Paris?" },
  restes: { lemma: "rester", pos: "verb", pt: "ficas", pron: "rést", conj: RESTER },
  reste: { lemma: "rester", pos: "verb", pt: "fico / fica (on reste = ficamos / mantemos)", pron: "rést", conj: RESTER },
  quartier: { lemma: "quartier", pos: "noun", pt: "bairro", pron: "kartiê", gender: "m", note: "Falso amigo: le quartier = o bairro (não «quartel»)." },
  "on reste en contact": { lemma: "rester en contact", pos: "expr", pt: "mantemos o contacto!", pron: "õ rést ã kõtákt" },
  bientôt: { lemma: "bientôt", pos: "adv", pt: "em breve / logo", pron: "biãtô", note: "À bientôt ! = Até breve!" },
  frais: { lemma: "frais", pos: "adj", pt: "fresco", pron: "fré", note: "Il fait frais = está fresco." },
  mauvais: { lemma: "mauvais", pos: "adj", pt: "mau (il fait mauvais = está mau tempo)", pron: "môvé" },
  france: { lemma: "France", pos: "noun", pt: "França", pron: "frãs", gender: "f", note: "la France → en France (em/a França)." },
  "dis-moi": { lemma: "dire", pos: "expr", pt: "diz-me", pron: "di-muá" },
  première: { lemma: "premier", pos: "adj", pt: "primeira", pron: "prëmiér", note: "Masculino: premier (prëmiê)." },
  change: { lemma: "changer", pos: "verb", pt: "troco / mudo (também: troca / muda)", pron: "chãj", conj: CHANGER },
  amies: { lemma: "ami", pos: "noun", pt: "amigas", pron: "amí", gender: "f" },
  choix: { lemma: "choix", pos: "noun", pt: "escolha", pron: "chuá", gender: "m", note: "Masculino em francês: un bon choix (uma boa escolha)." },
  parfaits: { lemma: "parfait", pos: "adj", pt: "perfeitos", pron: "parfé" },
  discuter: { lemma: "discuter", pos: "verb", pt: "conversar / trocar ideias", pron: "diskütê", note: "Falso amigo parcial: discuter = conversar (não necessariamente «discutir/brigar», que é se disputer)." },
  appétit: { lemma: "appétit", pos: "noun", pt: "apetite", pron: "apêtí", gender: "m" },
  "bon appétit": { lemma: "bon appétit", pos: "expr", pt: "bom apetite", pron: "bõnapêtí" },
  passe: { lemma: "passer", pos: "verb", pt: "passa / passo", pron: "pás" },
};

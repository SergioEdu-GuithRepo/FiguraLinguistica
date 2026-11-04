import type { Dictionary } from "@/lib/types";

const ETRE = "être — je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont";
const AVOIR = "avoir — j'ai, tu as, il/elle a, nous avons, vous avez, ils/elles ont";
const ALLER = "aller — je vais, tu vas, il/elle va, nous allons, vous allez, ils/elles vont; passé composé: je suis allé(e)";
const FAIRE = "faire — je fais, tu fais, il/elle fait, nous faisons, vous faites, ils/elles font; passé composé: j'ai fait";
const POUVOIR = "pouvoir — je peux, tu peux, il/elle peut, nous pouvons, vous pouvez, ils/elles peuvent";
const PRENDRE = "prendre — je prends, tu prends, il/elle prend, nous prenons, vous prenez, ils/elles prennent; passé composé: j'ai pris";
const APPELER = "s'appeler — je m'appelle, tu t'appelles, il/elle s'appelle, nous nous appelons, vous vous appelez";
const HABITER = "habiter — j'habite, tu habites, il/elle habite, nous habitons, vous habitez, ils/elles habitent";
const ACHETER = "acheter — j'achète, tu achètes, il/elle achète, nous achetons, vous achetez, ils/elles achètent";
const MANGER = "manger — je mange, tu manges, il/elle mange, nous mangeons, vous mangez; passé composé: j'ai mangé";
const REGARDER = "regarder — je regarde, tu regardes, il/elle regarde, vous regardez; passé composé: j'ai regardé";
const VOIR = "voir — je vois, tu vois, il/elle voit, nous voyons, vous voyez, ils/elles voient; passé composé: j'ai vu";
const RESTER = "rester — je reste, tu restes, il/elle reste, vous restez; passé composé: je suis resté(e)";
const DORMIR = "dormir — je dors, tu dors, il/elle dort, nous dormons, vous dormez; passé composé: j'ai dormi";
const SORTIR = "sortir — je sors, tu sors, il/elle sort, nous sortons, vous sortez; passé composé: je suis sorti(e)";
const PARTIR = "partir — je pars, tu pars, il/elle part, nous partons, vous partez; passé composé: je suis parti(e)";
const TRAVAILLER = "travailler — je travaille, tu travailles, il/elle travaille, vous travaillez; passé composé: j'ai travaillé";
const PARLER = "parler — je parle, tu parles, il/elle parle, nous parlons, vous parlez, ils/elles parlent";
const VISITER = "visiter — je visite, tu visites, il/elle visite, vous visitez; passé composé: j'ai visité";
const BOIRE = "boire — je bois, tu bois, il/elle boit, nous buvons, vous buvez, ils/elles boivent; passé composé: j'ai bu";
const REPOSER = "se reposer — je me repose, tu te reposes, il/elle se repose, vous vous reposez";
const FALLOIR = "falloir — só existe com il: il faut (é preciso); passado: il a fallu";
const AIMER = "aimer — j'aime, tu aimes, il/elle aime, nous aimons, vous aimez, ils/elles aiment";
const ADORER = "adorer — j'adore, tu adores, il/elle adore, nous adorons, vous adorez, ils/elles adorent";
const DETESTER = "détester — je déteste, tu détestes, il/elle déteste, nous détestons, vous détestez";
const DANSER = "danser — je danse, tu danses, il/elle danse, nous dansons, vous dansez";
const LIRE = "lire — je lis, tu lis, il/elle lit, nous lisons, vous lisez, ils/elles lisent; passé composé: j'ai lu";
const NAGER = "nager — je nage, tu nages, il/elle nage, nous nageons, vous nagez";
const COURIR = "courir — je cours, tu cours, il/elle court, nous courons, vous courez";
const JOUER = "jouer — je joue, tu joues, il/elle joue, nous jouons, vous jouez, ils/elles jouent";
const CHANTER = "chanter — je chante, tu chantes, il/elle chante, nous chantons, vous chantez";
const DIRE = "dire — je dis, tu dis, il/elle dit, nous disons, vous dites, ils/elles disent";
const RETROUVER = "se retrouver — je me retrouve, tu te retrouves, on se retrouve, nous nous retrouvons, vous vous retrouvez";

/** Entradas novas da etapa "Rotina" (níveis 10–18). Só chaves que ainda não existem em dictionary.ts. */
export const dictionary: Dictionary = {
  // ── Família ──
  famille: { lemma: "famille", pos: "noun", pt: "família", pron: "famíi", gender: "f", note: "«ille» lê-se «íi»: famille (famíi)." },
  photo: { lemma: "photo", pos: "noun", pt: "fotografia", pron: "fôtô", gender: "f", note: "Cognato. Feminino: une photo (abreviatura de photographie)." },
  père: { lemma: "père", pos: "noun", pt: "pai", pron: "pér", gender: "m" },
  mère: { lemma: "mère", pos: "noun", pt: "mãe", pron: "mér", gender: "f" },
  frère: { lemma: "frère", pos: "noun", pt: "irmão", pron: "frér", gender: "m" },
  frères: { lemma: "frère", pos: "noun", pt: "irmãos", pron: "frér", gender: "m" },
  sœur: { lemma: "sœur", pos: "noun", pt: "irmã", pron: "sör", gender: "f", note: "«œu» lê-se como «ö» (boca de «o», língua de «e»)." },
  sœurs: { lemma: "sœur", pos: "noun", pt: "irmãs", pron: "sör", gender: "f" },
  "frères et sœurs": { lemma: "frères et sœurs", pos: "expr", pt: "irmãos (e irmãs)", pron: "frér ê sör", note: "Para «irmãos» em geral, o francês diz frères et sœurs." },
  "grand-mère": { lemma: "grand-mère", pos: "noun", pt: "avó", pron: "grã-mér", gender: "f", note: "Avô = grand-père; avós = grands-parents." },
  parents: { lemma: "parent", pos: "noun", pt: "pais (pai e mãe)", pron: "parã", gender: "m", note: "Falso amigo: parents = pais; «parentes» diz-se la famille." },
  enfants: { lemma: "enfant", pos: "noun", pt: "filhos / crianças", pron: "ãfã", gender: "m", note: "Liaison: trois‿enfants (truazãfã)." },
  amie: { lemma: "ami", pos: "noun", pt: "amiga", pron: "amí", gender: "f", note: "Masculino: ami (pronuncia-se igual). Antes de vogal: mon‿amie (mõnamí)." },
  amis: { lemma: "ami", pos: "noun", pt: "amigos", pron: "amí", gender: "m", note: "Liaison: mes‿amis (mêzamí)." },
  chien: { lemma: "chien", pos: "noun", pt: "cão", pron: "chiã", gender: "m", note: "Feminino: chienne (cadela)." },
  marc: { lemma: "Marc", pos: "noun", pt: "Marc (Marcos)", pron: "mark", gender: "m" },
  lucas: { lemma: "Lucas", pos: "noun", pt: "Lucas (nome masculino)", pron: "lüká", gender: "m", note: "Em francês o s final de Lucas normalmente não se pronuncia." },
  mon: { lemma: "mon", pos: "det", pt: "o meu", pron: "mõ", note: "Também antes de nome feminino começado por vogal: mon‿amie." },
  ma: { lemma: "mon", pos: "det", pt: "a minha", pron: "ma" },
  mes: { lemma: "mon", pos: "det", pt: "os meus / as minhas", pron: "mê", note: "Antes de vogal faz liaison: mes‿amis (mêzamí)." },
  "s'appelle": { lemma: "s'appeler", pos: "verb", pt: "chama-se", pron: "sapél", conj: APPELER },
  habite: { lemma: "habiter", pos: "verb", pt: "mora / moro", pron: "abit", conj: HABITER },
  habitent: { lemma: "habiter", pos: "verb", pt: "moram", pron: "abit", conj: HABITER, note: "O -ent final não se pronuncia: habitent soa igual a habite." },
  "qu'elle": { lemma: "que + elle", pos: "pron", pt: "que ela", pron: "kél", example: { text: "Qu'est-ce qu'elle fait ?", pt: "O que é que ela faz?" } },
  là: { lemma: "là", pos: "adv", pt: "ali / aqui / lá", pron: "la", note: "Com acento = lá/aqui; sem acento (la) = artigo «a»." },

  // ── Profissões ──
  médecin: { lemma: "médecin", pos: "noun", pt: "médico / médica", pron: "mêdsã", gender: "m", note: "Serve para homem e mulher: elle est médecin. Para chamar o médico: docteur." },
  infirmière: { lemma: "infirmier", pos: "noun", pt: "enfermeira", pron: "ãfirmiér", gender: "f", note: "Masculino: infirmier (ãfirmiê)." },
  professeure: { lemma: "professeur", pos: "noun", pt: "professora", pron: "proféssör", gender: "f", note: "Na fala diz-se muito prof: elle est prof." },
  étudiante: { lemma: "étudiant", pos: "noun", pt: "estudante (rapariga)", pron: "êtüdiãt", gender: "f", note: "Masculino: étudiant (o t final não se pronuncia)." },
  vendeuse: { lemma: "vendeur", pos: "noun", pt: "vendedora", pron: "vãdöz", gender: "f", note: "Masculino: vendeur (vãdör)." },
  avocate: { lemma: "avocat", pos: "noun", pt: "advogada", pron: "avokát", gender: "f", note: "Curioso: un avocat = um advogado e também um abacate!" },
  docteur: { lemma: "docteur", pos: "noun", pt: "doutor (médico)", pron: "doktör", gender: "m", note: "Usa-se para chamar o médico: Merci, docteur !" },

  // ── Casa ──
  maison: { lemma: "maison", pos: "noun", pt: "casa", pron: "mézõ", gender: "f", note: "O s entre vogais soa «z». À la maison = em casa." },
  appartement: { lemma: "appartement", pos: "noun", pt: "apartamento", pron: "apartëmã", gender: "m", note: "Cognato. Liaison: un‿appartement (ãnapartëmã)." },
  dans: { lemma: "dans", pos: "prep", pt: "em / dentro de", pron: "dã", note: "Antes de vogal faz liaison: dans‿un (dãzã)." },
  centre: { lemma: "centre", pos: "noun", pt: "centro", pron: "sãtr", gender: "m" },
  "près du": { lemma: "près de", pos: "expr", pt: "perto do", pron: "pré dü", note: "de + le = du: près du centre." },
  chambre: { lemma: "chambre", pos: "noun", pt: "quarto (de dormir)", pron: "chãbr", gender: "f", note: "Falso amigo: chambre = quarto (não «câmara»)." },
  chambres: { lemma: "chambre", pos: "noun", pt: "quartos", pron: "chãbr", gender: "f" },
  cuisine: { lemma: "cuisine", pos: "noun", pt: "cozinha", pron: "küizín", gender: "f", note: "Também «culinária»: la cuisine française." },
  salon: { lemma: "salon", pos: "noun", pt: "sala de estar", pron: "salõ", gender: "m" },
  salle: { lemma: "salle", pos: "noun", pt: "sala", pron: "sal", gender: "f", note: "Falso amigo: salle = sala; «sal» = sel." },
  bains: { lemma: "bain", pos: "noun", pt: "banhos", pron: "bã", gender: "m" },
  "salle de bains": { lemma: "salle de bains", pos: "noun", pt: "casa de banho", pron: "sal dë bã", gender: "f" },
  balcon: { lemma: "balcon", pos: "noun", pt: "varanda", pron: "balkõ", gender: "m", note: "Falso amigo: balcon = varanda; «balcão» diz-se comptoir." },
  ascenseur: { lemma: "ascenseur", pos: "noun", pt: "elevador", pron: "assãssör", gender: "m", note: "Cognato de «ascensor». Masculino: un‿ascenseur." },
  studio: { lemma: "studio", pos: "noun", pt: "estúdio (T0)", pron: "stüdiô", gender: "m" },
  jardin: { lemma: "jardin", pos: "noun", pt: "jardim", pron: "jardã", gender: "m" },
  garage: { lemma: "garage", pos: "noun", pt: "garagem", pron: "garáj", gender: "m", note: "Masculino em francês: le garage (a garagem)." },
  bruit: { lemma: "bruit", pos: "noun", pt: "barulho", pron: "brüí", gender: "m" },
  grand: { lemma: "grand", pos: "adj", pt: "grande", pron: "grã", note: "Feminino: grande — o d passa a ouvir-se (grãd)." },
  grande: { lemma: "grand", pos: "adj", pt: "grande (fem.)", pron: "grãd" },
  petit: { lemma: "petit", pos: "adj", pt: "pequeno", pron: "pëtí", note: "Feminino: petite (pëtít)." },
  joli: { lemma: "joli", pos: "adj", pt: "giro / bonito", pron: "jolí", note: "Feminino: jolie (pronuncia-se igual)." },
  calme: { lemma: "calme", pos: "adj", pt: "calmo / sossegado", pron: "kalm" },
  cher: { lemma: "cher", pos: "adj", pt: "caro", pron: "chér", note: "Também «querido»: cher ami." },
  mais: { lemma: "mais", pos: "conj", pt: "mas", pron: "mé", note: "Falso amigo: mais = mas; «mais» em português diz-se plus." },

  // ── Transportes ──
  aller: { lemma: "aller", pos: "verb", pt: "ir", pron: "alê", conj: ALLER, example: { text: "Pour aller à la gare ?", pt: "Para ir à estação?" } },
  "d'aller": { lemma: "aller", pos: "verb", pt: "de ir", pron: "dalê", conj: ALLER, note: "de + aller = d'aller (elisão antes de vogal)." },
  pouvez: { lemma: "pouvoir", pos: "verb", pt: "pode / podem (vous)", pron: "puvê", conj: POUVOIR },
  prend: { lemma: "prendre", pos: "verb", pt: "toma / apanha; (ça prend) demora", pron: "prã", conj: PRENDRE, note: "Ça prend vingt minutes = demora vinte minutos." },
  prenez: { lemma: "prendre", pos: "verb", pt: "tome / tomem (vous)", pron: "prënê", conj: PRENDRE },
  train: { lemma: "train", pos: "noun", pt: "comboio", pron: "trã", gender: "m", note: "train = comboio (no Brasil, trem). «ain» é nasal: trã." },
  temps: { lemma: "temps", pos: "noun", pt: "tempo", pron: "tã", gender: "m", note: "O p e o s não se pronunciam. Também «o tempo» meteorológico." },
  "combien de temps": { lemma: "combien de temps", pos: "expr", pt: "quanto tempo", pron: "kõbiã dë tã" },
  trente: { lemma: "trente", pos: "num", pt: "trinta", pron: "trãt" },
  billet: { lemma: "billet", pos: "noun", pt: "bilhete (comboio, avião, cinema)", pron: "biié", gender: "m", note: "Para metro e autocarro diz-se ticket." },
  ticket: { lemma: "ticket", pos: "noun", pt: "bilhete (metro, autocarro)", pron: "tikê", gender: "m" },
  simple: { lemma: "simple", pos: "adj", pt: "simples", pron: "sãpl" },
  "aller simple": { lemma: "aller simple", pos: "noun", pt: "bilhete só de ida", pron: "alê sãpl", gender: "m" },
  "aller-retour": { lemma: "aller-retour", pos: "noun", pt: "bilhete de ida e volta", pron: "alê-rëtur", gender: "m" },
  quai: { lemma: "quai", pos: "noun", pt: "plataforma / cais", pron: "ké", gender: "m", note: "Cognato de «cais»: na estação é a plataforma." },
  voyage: { lemma: "voyage", pos: "noun", pt: "viagem", pron: "vuaiáj", gender: "m", note: "Masculino em francês: le voyage (a viagem)." },
  "bon voyage": { lemma: "bon voyage", pos: "expr", pt: "boa viagem", pron: "bõ vuaiáj" },
  taxi: { lemma: "taxi", pos: "noun", pt: "táxi", pron: "taksí", gender: "m" },
  "l'avion": { lemma: "avion", pos: "noun", pt: "o avião", pron: "laviõ", gender: "m" },
  tram: { lemma: "tramway", pos: "noun", pt: "eléctrico", pron: "tram", gender: "m" },
  "d'heure": { lemma: "heure", pos: "noun", pt: "de hora", pron: "dör", gender: "f", note: "un quart d'heure = um quarto de hora." },
  plan: { lemma: "plan", pos: "noun", pt: "mapa / planta", pron: "plã", gender: "m", note: "Falso amigo: un plan = mapa (da cidade, do metro); também «plano»." },

  // ── Supermercado ──
  "qu'on": { lemma: "que + on", pos: "pron", pt: "que nós (que + on)", pron: "kõ" },
  achète: { lemma: "acheter", pos: "verb", pt: "compra / compro", pron: "achét", conj: ACHETER, note: "Falso amigo: acheter = comprar (não «achar»)." },
  viande: { lemma: "viande", pos: "noun", pt: "carne", pron: "viãd", gender: "f" },
  œufs: { lemma: "œuf", pos: "noun", pt: "ovos", pron: "ö", gender: "m", note: "Singular un‿œuf (ãnöf); no plural o f não se ouve: des‿œufs (dêzö)." },
  "d'œufs": { lemma: "œuf", pos: "noun", pt: "de ovos", pron: "dö", gender: "m" },
  lait: { lemma: "lait", pos: "noun", pt: "leite", pron: "lé", gender: "m" },
  fromage: { lemma: "fromage", pos: "noun", pt: "queijo", pron: "fromáj", gender: "m" },
  pâtes: { lemma: "pâtes", pos: "noun", pt: "massa (esparguete, etc.)", pron: "pát", gender: "f", note: "Falso amigo: les pâtes = a massa; «patas» = pattes." },
  tomates: { lemma: "tomate", pos: "noun", pt: "tomates", pron: "tomát", gender: "f", note: "Feminino em francês: une tomate." },
  pommes: { lemma: "pomme", pos: "noun", pt: "maçãs", pron: "póm", gender: "f", note: "pomme = maçã; pomme de terre = batata." },
  bouteille: { lemma: "bouteille", pos: "noun", pt: "garrafa", pron: "butéi", gender: "f", note: "«eille» lê-se «éi»: bouteille (butéi)." },
  kilo: { lemma: "kilo", pos: "noun", pt: "quilo", pron: "kilô", gender: "m" },
  kilos: { lemma: "kilo", pos: "noun", pt: "quilos", pron: "kilô", gender: "m" },
  litre: { lemma: "litre", pos: "noun", pt: "litro", pron: "lítr", gender: "m" },
  paquet: { lemma: "paquet", pos: "noun", pt: "pacote", pron: "paké", gender: "m" },
  douzaine: { lemma: "douzaine", pos: "noun", pt: "dúzia", pron: "duzén", gender: "f" },
  plus: { lemma: "plus", pos: "adv", pt: "mais; (ne … plus) já não", pron: "plü", note: "ne … plus = já não: il n'y a plus de lait." },
  "il n'y a plus": { lemma: "il y a", pos: "expr", pt: "já não há", pron: "ilniá plü", note: "Depois vem de: il n'y a plus de lait." },
  avez: { lemma: "avoir", pos: "verb", pt: "tem / têm (vous)", pron: "avê", conj: AVOIR, note: "Liaison: vous‿avez (vuzavê)." },
  "là-bas": { lemma: "là-bas", pos: "adv", pt: "ali / lá", pron: "la-bá" },
  côté: { lemma: "côté", pos: "noun", pt: "lado", pron: "kôtê", gender: "m" },
  "à côté de": { lemma: "à côté de", pos: "expr", pt: "ao lado de", pron: "a kôtê dë", note: "de + le = du: à côté du café." },
  idée: { lemma: "idée", pos: "noun", pt: "ideia", pron: "idê", gender: "f" },
  "bonne idée": { lemma: "bonne idée", pos: "expr", pt: "boa ideia", pron: "bón idê" },
  "à la maison": { lemma: "à la maison", pos: "expr", pt: "em casa", pron: "a la mézõ" },
  désolée: { lemma: "désolé", pos: "adj", pt: "lamento / desculpa (dito por uma mulher)", pron: "dêzolê", note: "Pronuncia-se igual a désolé." },

  // ── Passé composé e fim-de-semana ──
  "week-end": { lemma: "week-end", pos: "noun", pt: "fim-de-semana", pron: "uikénd", gender: "m", note: "le week-end = ao fim-de-semana; ce week-end = este fim-de-semana." },
  "ce week-end": { lemma: "ce week-end", pos: "expr", pt: "este fim-de-semana", pron: "së uikénd" },
  "as fait": { lemma: "faire", pos: "verb", pt: "fizeste (passé composé)", pron: "a fé", conj: FAIRE },
  "j'ai fait": { lemma: "faire", pos: "verb", pt: "fiz (passé composé)", pron: "jê fé", conj: FAIRE },
  ai: { lemma: "avoir", pos: "aux", pt: "(eu) tenho / auxiliar do passado", pron: "ê", conj: AVOIR, note: "Junta-se sempre a je: je + ai = j'ai." },
  es: { lemma: "être", pos: "verb", pt: "és / estás", pron: "é", conj: ETRE },
  allé: { lemma: "aller", pos: "verb", pt: "ido (je suis allé = fui)", pron: "alê", conj: ALLER, note: "aller usa être no passé composé: je suis allé, nunca «j'ai allé»." },
  allée: { lemma: "aller", pos: "verb", pt: "ida (fem.): je suis allée = fui", pron: "alê", conj: ALLER, note: "Uma mulher escreve allée (pronuncia-se igual)." },
  resté: { lemma: "rester", pos: "verb", pt: "ficado (je suis resté = fiquei)", pron: "réstê", conj: RESTER, note: "Falso amigo: rester = ficar (não «restar»)." },
  restée: { lemma: "rester", pos: "verb", pt: "ficada (fem.): je suis restée = fiquei", pron: "réstê", conj: RESTER },
  sortie: { lemma: "sortir", pos: "verb", pt: "saída (fem.): je suis sortie = saí", pron: "sortí", conj: SORTIR, note: "Também é nome: la sortie = a saída." },
  parti: { lemma: "partir", pos: "verb", pt: "partido (je suis parti = parti / fui-me embora)", pron: "partí", conj: PARTIR },
  vu: { lemma: "voir", pos: "verb", pt: "visto (j'ai vu = vi)", pron: "vü", conj: VOIR },
  mangé: { lemma: "manger", pos: "verb", pt: "comido (j'ai mangé = comi)", pron: "mãjê", conj: MANGER },
  regardé: { lemma: "regarder", pos: "verb", pt: "visto / olhado (j'ai regardé = vi)", pron: "rëgardê", conj: REGARDER },
  travaillé: { lemma: "travailler", pos: "verb", pt: "trabalhado (j'ai travaillé = trabalhei)", pron: "travaiê", conj: TRAVAILLER },
  dormi: { lemma: "dormir", pos: "verb", pt: "dormido (j'ai dormi = dormi)", pron: "dormí", conj: DORMIR },
  cinéma: { lemma: "cinéma", pos: "noun", pt: "cinema", pron: "sinêmá", gender: "m" },
  film: { lemma: "film", pos: "noun", pt: "filme", pron: "film", gender: "m" },
  comédie: { lemma: "comédie", pos: "noun", pt: "comédia", pron: "komêdí", gender: "f" },
  drôle: { lemma: "drôle", pos: "adj", pt: "engraçado", pron: "drôl", note: "Também pode ser «estranho»: c'est drôle !" },
  dimanche: { lemma: "dimanche", pos: "noun", pt: "domingo", pron: "dimãch", gender: "m" },
  chez: { lemma: "chez", pos: "prep", pt: "em casa de / a casa de", pron: "chê", note: "chez moi = em minha casa; chez le médecin = no médico." },
  match: { lemma: "match", pos: "noun", pt: "jogo (desportivo)", pron: "match", gender: "m" },
  foot: { lemma: "football", pos: "noun", pt: "futebol", pron: "fut", gender: "m", note: "Abreviatura de football: jouer au foot." },
  tranquille: { lemma: "tranquille", pos: "adj", pt: "sossegado / tranquilo", pron: "trãkíl" },
  restaurant: { lemma: "restaurant", pos: "noun", pt: "restaurante", pron: "réstorã", gender: "m" },
  plage: { lemma: "plage", pos: "noun", pt: "praia", pron: "pláj", gender: "f" },
  génial: { lemma: "génial", pos: "adj", pt: "genial", pron: "jênial" },
  sympa: { lemma: "sympa", pos: "adj", pt: "simpático / porreiro", pron: "sãpá", note: "Abreviatura de sympathique." },
  nul: { lemma: "nul", pos: "adj", pt: "péssimo / uma seca (informal)", pron: "nül", note: "Literalmente «nulo»: c'était nul = foi péssimo." },
  cool: { lemma: "cool", pos: "adj", pt: "fixe", pron: "kul" },
  ah: { lemma: "ah", pos: "interj", pt: "ah", pron: "a" },

  // ── Planos (futur proche) ──
  vas: { lemma: "aller", pos: "verb", pt: "vais", pron: "va", conj: ALLER, note: "tu vas + infinitivo = vais (fazer algo)." },
  faire: { lemma: "faire", pos: "verb", pt: "fazer", pron: "fér", conj: FAIRE },
  demain: { lemma: "demain", pos: "adv", pt: "amanhã", pron: "dëmã" },
  "demain soir": { lemma: "demain soir", pos: "expr", pt: "amanhã à noite", pron: "dëmã suar" },
  "ce soir": { lemma: "ce soir", pos: "expr", pt: "hoje à noite", pron: "së suar" },
  travailler: { lemma: "travailler", pos: "verb", pt: "trabalhar", pron: "travaiê", conj: TRAVAILLER },
  courses: { lemma: "course", pos: "noun", pt: "compras (do dia-a-dia)", pron: "kurs", gender: "f", note: "Falso amigo: les courses = as compras; também «corridas»." },
  "faire les courses": { lemma: "faire les courses", pos: "expr", pt: "fazer as compras", pron: "fér lê kurs" },
  sortir: { lemma: "sortir", pos: "verb", pt: "sair", pron: "sortír", conj: SORTIR },
  rester: { lemma: "rester", pos: "verb", pt: "ficar", pron: "réstê", conj: RESTER, note: "Falso amigo: rester = ficar (não «restar»)." },
  regarder: { lemma: "regarder", pos: "verb", pt: "ver / olhar", pron: "rëgardê", conj: REGARDER, note: "Falso amigo: regarder = ver, olhar (não «guardar»)." },
  série: { lemma: "série", pos: "noun", pt: "série", pron: "sêrí", gender: "f" },
  visiter: { lemma: "visiter", pos: "verb", pt: "visitar (lugares)", pron: "vizitê", conj: VISITER, note: "Para pessoas diz-se rendre visite à quelqu'un." },
  louvre: { lemma: "Louvre", pos: "noun", pt: "Louvre (museu de Paris)", pron: "lúvr", gender: "m" },
  semaine: { lemma: "semaine", pos: "noun", pt: "semana", pron: "sëmén", gender: "f" },
  prochaine: { lemma: "prochain", pos: "adj", pt: "próxima", pron: "prochén", note: "Masculino: prochain (prochã)." },
  "la semaine prochaine": { lemma: "la semaine prochaine", pos: "expr", pt: "na próxima semana", pron: "la sëmén prochén", note: "Sem preposição: la semaine prochaine = na próxima semana." },
  partir: { lemma: "partir", pos: "verb", pt: "partir / ir-se embora / ir (de viagem)", pron: "partír", conj: PARTIR },
  vacances: { lemma: "vacances", pos: "noun", pt: "férias", pron: "vakãs", gender: "f", note: "Sempre no plural: les vacances." },
  "en vacances": { lemma: "en vacances", pos: "expr", pt: "de férias", pron: "ã vakãs" },
  enfin: { lemma: "enfin", pos: "adv", pt: "finalmente", pron: "ãfã", note: "Parecido com «enfim», mas aqui significa «finalmente»." },
  parler: { lemma: "parler", pos: "verb", pt: "falar", pron: "parlê", conj: PARLER },
  voir: { lemma: "voir", pos: "verb", pt: "ver", pron: "vuar", conj: VOIR },

  // ── Saúde ──
  qui: { lemma: "qui", pos: "pron", pt: "quem / que", pron: "kí" },
  "qu'est-ce qui": { lemma: "qu'est-ce qui", pos: "expr", pt: "o que (é que) — como sujeito", pron: "késki", example: { text: "Qu'est-ce qui ne va pas ?", pt: "O que é que se passa?" } },
  "j'ai mal": { lemma: "avoir mal", pos: "expr", pt: "dói-me / tenho dores", pron: "jê mal", note: "avoir mal à + parte do corpo: j'ai mal à la tête, j'ai mal au dos." },
  tête: { lemma: "tête", pos: "noun", pt: "cabeça", pron: "tét", gender: "f", note: "O acento circunflexo marca um s antigo: tête ≈ «testa»." },
  gorge: { lemma: "gorge", pos: "noun", pt: "garganta", pron: "górj", gender: "f" },
  dos: { lemma: "dos", pos: "noun", pt: "costas", pron: "dô", gender: "m", note: "Falso amigo: le dos = as costas. O s final não se pronuncia." },
  ventre: { lemma: "ventre", pos: "noun", pt: "barriga / ventre", pron: "vãtr", gender: "m" },
  dents: { lemma: "dent", pos: "noun", pt: "dentes", pron: "dã", gender: "f", note: "Feminino em francês: une dent (um dente)." },
  aux: { lemma: "à + les", pos: "prep", pt: "aos / às (à + les)", pron: "ô", note: "Liaison antes de vogal: aux‿yeux (ôziö)." },
  fièvre: { lemma: "fièvre", pos: "noun", pt: "febre", pron: "fiévr", gender: "f" },
  fatigué: { lemma: "fatigué", pos: "adj", pt: "cansado", pron: "fatiguê", note: "Cognato de «fatigado». Feminino: fatiguée (pronuncia-se igual)." },
  fatiguée: { lemma: "fatigué", pos: "adj", pt: "cansada", pron: "fatiguê" },
  "n'est": { lemma: "être", pos: "verb", pt: "não é (ne + est)", pron: "né", conj: ETRE, note: "ne vira n' antes de vogal: ce n'est pas grave." },
  grave: { lemma: "grave", pos: "adj", pt: "grave", pron: "gráv" },
  rhume: { lemma: "rhume", pos: "noun", pt: "constipação", pron: "rüm", gender: "m", note: "Falso amigo: rhume = constipação; «reumatismo» = rhumatisme." },
  médicament: { lemma: "médicament", pos: "noun", pt: "medicamento", pron: "mêdikamã", gender: "m" },
  fois: { lemma: "fois", pos: "noun", pt: "vez", pron: "fuá", gender: "f", note: "une fois = uma vez; deux fois = duas vezes. O s não se pronuncia." },
  "fois par jour": { lemma: "fois par jour", pos: "expr", pt: "vezes por dia", pron: "fuá par jur" },
  matin: { lemma: "matin", pos: "noun", pt: "manhã", pron: "matã", gender: "m", note: "le matin = de manhã." },
  repas: { lemma: "repas", pos: "noun", pt: "refeição", pron: "rëpá", gender: "m" },
  faut: { lemma: "falloir", pos: "verb", pt: "é preciso (il faut)", pron: "fô", conj: FALLOIR },
  "il faut": { lemma: "falloir", pos: "expr", pt: "é preciso / tem de", pron: "il fô", note: "il faut + infinitivo: il faut dormir = é preciso dormir." },
  reposer: { lemma: "se reposer", pos: "verb", pt: "descansar (se reposer)", pron: "rëpozê", conj: REPOSER, note: "Cognato de «repousar»: vous reposer = descansar." },
  boire: { lemma: "boire", pos: "verb", pt: "beber", pron: "buar", conj: BOIRE },
  lit: { lemma: "lit", pos: "noun", pt: "cama", pron: "lí", gender: "m", note: "rester au lit = ficar na cama. O t não se pronuncia." },
  manger: { lemma: "manger", pos: "verb", pt: "comer", pron: "mãjê", conj: MANGER },
  fruits: { lemma: "fruit", pos: "noun", pt: "fruta / frutos", pron: "früí", gender: "m" },
  dormir: { lemma: "dormir", pos: "verb", pt: "dormir", pron: "dormír", conj: DORMIR },

  // ── Gostos e tempo livre ──
  "j'aime": { lemma: "aimer", pos: "verb", pt: "gosto / amo", pron: "jém", conj: AIMER, note: "aimer + infinitivo, sem «de»: j'aime lire = gosto de ler." },
  "j'aime bien": { lemma: "aimer bien", pos: "expr", pt: "gosto (bastante) de", pron: "jém biã", note: "Com pessoas, j'aime bien = gosto de (amizade); j'aime = amo." },
  aimes: { lemma: "aimer", pos: "verb", pt: "gostas / amas", pron: "ém", conj: AIMER },
  "n'aime": { lemma: "aimer", pos: "verb", pt: "não gosto (ne + aime)", pron: "ném", conj: AIMER },
  "j'adore": { lemma: "adorer", pos: "verb", pt: "adoro", pron: "jadór", conj: ADORER },
  déteste: { lemma: "détester", pos: "verb", pt: "detesto / detesta", pron: "dêtést", conj: DETESTER },
  détestes: { lemma: "détester", pos: "verb", pt: "detestas", pron: "dêtést", conj: DETESTER },
  danser: { lemma: "danser", pos: "verb", pt: "dançar", pron: "dãssê", conj: DANSER },
  lire: { lemma: "lire", pos: "verb", pt: "ler", pron: "lír", conj: LIRE },
  nager: { lemma: "nager", pos: "verb", pt: "nadar", pron: "najê", conj: NAGER },
  nage: { lemma: "nager", pos: "verb", pt: "nado / nada", pron: "náj", conj: NAGER },
  courir: { lemma: "courir", pos: "verb", pt: "correr", pron: "kurír", conj: COURIR },
  joue: { lemma: "jouer", pos: "verb", pt: "jogo / toco", pron: "ju", conj: JOUER, note: "jouer à + desporto (au foot); jouer de + instrumento (de la guitare)." },
  joues: { lemma: "jouer", pos: "verb", pt: "jogas / tocas", pron: "ju", conj: JOUER },
  chante: { lemma: "chanter", pos: "verb", pt: "canto / canta", pron: "chãt", conj: CHANTER },
  guitare: { lemma: "guitare", pos: "noun", pt: "guitarra / viola", pron: "guitár", gender: "f" },
  tennis: { lemma: "tennis", pos: "noun", pt: "ténis (desporto)", pron: "ténis", gender: "m", note: "Os sapatos de ténis dizem-se baskets." },
  basket: { lemma: "basket", pos: "noun", pt: "basquetebol", pron: "baskét", gender: "m", note: "les baskets (fem.) = os ténis (calçado)." },
  cartes: { lemma: "carte", pos: "noun", pt: "cartas (de jogar)", pron: "kart", gender: "f" },
  piano: { lemma: "piano", pos: "noun", pt: "piano", pron: "pianô", gender: "m" },
  tous: { lemma: "tout", pos: "adj", pt: "todos", pron: "tu" },
  samedis: { lemma: "samedi", pos: "noun", pt: "sábados", pron: "samdí", gender: "m" },
  jours: { lemma: "jour", pos: "noun", pt: "dias", pron: "jur", gender: "m" },
  "tous les samedis": { lemma: "tous les samedis", pos: "expr", pt: "todos os sábados", pron: "tu lê samdí" },
  "tous les jours": { lemma: "tous les jours", pos: "expr", pt: "todos os dias", pron: "tu lê jur" },
  souvent: { lemma: "souvent", pos: "adv", pt: "muitas vezes / frequentemente", pron: "suvã" },
  parfois: { lemma: "parfois", pos: "adv", pt: "às vezes", pron: "parfuá" },
  rarement: { lemma: "rarement", pos: "adv", pt: "raramente", pron: "rarmã" },
  jamais: { lemma: "jamais", pos: "adv", pt: "nunca", pron: "jamé", note: "ne … jamais = nunca: je ne chante jamais. Não confundir com «jamais» (pt)." },

  // ── Encontros ──
  libre: { lemma: "libre", pos: "adj", pt: "livre", pron: "líbr" },
  vendredi: { lemma: "vendredi", pos: "noun", pt: "sexta-feira", pron: "vãdrëdí", gender: "m" },
  "après-midi": { lemma: "après-midi", pos: "noun", pt: "tarde", pron: "apré-midí", gender: "m", note: "le matin (manhã), l'après-midi (tarde), le soir (noite)." },
  "je ne peux pas": { lemma: "pouvoir", pos: "expr", pt: "não posso", pron: "jë në pö pá", note: "Na fala, o ne cai muitas vezes: je peux pas." },
  dommage: { lemma: "dommage", pos: "expr", pt: "que pena", pron: "domáj", note: "C'est dommage = é pena. Literalmente «dano»." },
  dit: { lemma: "dire", pos: "verb", pt: "diz; (ça te dit ?) apetece-te?", pron: "dí", conj: DIRE },
  "ça te dit": { lemma: "ça te dit", pos: "expr", pt: "apetece-te? / que tal?", pron: "sa të dí", note: "Ça te dit de + infinitivo? Ex.: ça te dit d'aller au cinéma ?" },
  plaisir: { lemma: "plaisir", pos: "noun", pt: "prazer", pron: "plézír", gender: "m" },
  "avec plaisir": { lemma: "avec plaisir", pos: "expr", pt: "com prazer", pron: "avék plézír" },
  nouvelle: { lemma: "nouveau", pos: "adj", pt: "nova", pron: "nuvél", note: "Masculino: nouveau (nuvô). Também é nome: une nouvelle = uma notícia." },
  retrouve: { lemma: "se retrouver", pos: "verb", pt: "encontra(-se)", pron: "rëtruv", conj: RETROUVER },
  "on se retrouve": { lemma: "se retrouver", pos: "expr", pt: "encontramo-nos", pron: "õ së rëtruv", note: "se retrouver = encontrar-se (combinado); rencontrer = conhecer alguém." },
};

export type Badge = {
  label: string;
  tone: "rose" | "gold" | "emerald" | "slate";
};

export type MockProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  state: string;
  church: string;
  denomination: string;
  distance: string;
  bio: string;
  photos: string[];
  verified: boolean;
  online: boolean;
  badges: Badge[];
  interests: string[];
  faithTags: string[];
  compatibilityPercent: number;
  status: "available" | "committed" | "new";
  equippedFrame: string;
  equippedAura: string;
  equippedBackground: string;
  giftsReceived: string[];
  lastSeen: string;
  intention: string;
  relationshipStatus: "solteiro" | "viuvo" | "divorciado";
  ministry: string;
  favoriteVerse: string;
};

export type StoreItem = {
  id: string;
  name: string;
  category: "fundos" | "molduras" | "auras" | "stickers" | "destaques" | "pacotes";
  rarity: "comum" | "raro" | "epico" | "lendario" | "celestial";
  price: number;
  owned?: boolean;
  equipped?: boolean;
  description: string;
  preview: string;
};

export type Gift = {
  id: string;
  name: string;
  category: string;
  rarity: StoreItem["rarity"];
  price: number;
  image: string;
  note: string;
};

export const currentUser = {
  id: "antonio",
  name: "Antonio Rodrigues",
  age: 29,
  city: "Peruibe",
  state: "SP",
  church: "Comunidade Crista Vida",
  status: "aprovado",
  verified: true,
  coins: 1280,
  role: "contribuidor",
  photo:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80",
  bio: "Buscando viver um relacionamento com proposito, fe e maturidade.",
  badges: [
    { label: "Verificado", tone: "emerald" },
    { label: "Contribuidor", tone: "gold" },
    { label: "Perfil completo", tone: "rose" },
    { label: "Em oracao", tone: "slate" },
  ] satisfies Badge[],
};

export const profiles: MockProfile[] = [
  {
    id: "ana-clara",
    name: "Ana Clara",
    age: 26,
    city: "Santos",
    state: "SP",
    church: "Igreja Batista da Praia",
    denomination: "Batista",
    distance: "74 km",
    bio: "Sirvo no louvor e acredito que relacionamento saudavel nasce de amizade, oracao e clareza.",
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=900&q=80",
    ],
    verified: true,
    online: true,
    badges: [
      { label: "Verificada", tone: "emerald" },
      { label: "Louvor", tone: "gold" },
    ],
    interests: ["musica", "devocional", "familia"],
    faithTags: ["Louvor", "Celula", "Discipulado"],
    compatibilityPercent: 94,
    status: "available",
    equippedFrame: "Alianca de Ouro",
    equippedAura: "Aurora Boreal",
    equippedBackground: "Jardim da Promessa",
    giftsReceived: ["Buque de Flores", "Carta com Proposito"],
    lastSeen: "online agora",
    intention: "Construir uma relacao com amizade, maturidade e direcao de Deus.",
    relationshipStatus: "solteiro",
    ministry: "Ministerio de louvor",
    favoriteVerse: "Acima de tudo, porem, revistam-se do amor. Colossenses 3:14",
  },
  {
    id: "mariana-alves",
    name: "Mariana Alves",
    age: 28,
    city: "Curitiba",
    state: "PR",
    church: "Comunidade Nova Alianca",
    denomination: "Presbiteriana",
    distance: "412 km",
    bio: "Professora infantil, apaixonada por discipulado e por conversas que tenham profundidade.",
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
    ],
    verified: true,
    online: false,
    badges: [
      { label: "Em Proposito", tone: "gold" },
      { label: "Professora", tone: "rose" },
    ],
    interests: ["ensino", "leitura", "familia"],
    faithTags: ["Criancas", "Ensino", "Intercessao"],
    compatibilityPercent: 88,
    status: "committed",
    equippedFrame: "Floral Rosa",
    equippedAura: "Coracao Radiante",
    equippedBackground: "Ceu Dourado",
    giftsReceived: ["Biblia Dourada", "Cafe com Devocional"],
    lastSeen: "ha 2 horas",
    intention: "Viver um proposito com paciencia, respeito e responsabilidade.",
    relationshipStatus: "solteiro",
    ministry: "Professora infantil",
    favoriteVerse: "O amor e paciente, o amor e bondoso. 1 Corintios 13:4",
  },
  {
    id: "beatriz-lima",
    name: "Beatriz Lima",
    age: 24,
    city: "Sao Paulo",
    state: "SP",
    church: "Igreja Crista Esperanca",
    denomination: "Crista Reformada",
    distance: "137 km",
    bio: "Nova na comunidade, valorizo conversas honestas, vida simples e comunhao constante.",
    photos: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1526510747491-58f928ec870f?auto=format&fit=crop&w=900&q=80",
    ],
    verified: false,
    online: true,
    badges: [
      { label: "Nova", tone: "rose" },
      { label: "Comunidade", tone: "slate" },
    ],
    interests: ["cafe", "missoes", "amizade"],
    faithTags: ["Jovens", "Comunhao", "Voluntariado"],
    compatibilityPercent: 82,
    status: "new",
    equippedFrame: "Minimalista Prata",
    equippedAura: "Horizonte Celestial",
    equippedBackground: "Campo de Lirios",
    giftsReceived: ["Rosa Branca"],
    lastSeen: "online agora",
    intention: "Conhecer alguem com calma, amizade e valores alinhados.",
    relationshipStatus: "solteiro",
    ministry: "Voluntariado local",
    favoriteVerse: "Entrega o teu caminho ao Senhor. Salmos 37:5",
  },
  {
    id: "camila-rocha",
    name: "Camila Rocha",
    age: 31,
    city: "Campinas",
    state: "SP",
    church: "Comunidade Graca e Vida",
    denomination: "Pentecostal",
    distance: "226 km",
    bio: "Lidero uma celula e acredito em recomeco com sabedoria, cuidado e verdade.",
    photos: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
    ],
    verified: true,
    online: false,
    badges: [
      { label: "Verificada", tone: "emerald" },
      { label: "Lider de celula", tone: "gold" },
    ],
    interests: ["celula", "familia", "servico"],
    faithTags: ["Celula", "Aconselhamento", "Familia"],
    compatibilityPercent: 91,
    status: "available",
    equippedFrame: "Louros Dourados",
    equippedAura: "Chama Sagrada",
    equippedBackground: "Aurora de Proposito",
    giftsReceived: ["Pomba da Paz", "Coracao de Luz"],
    lastSeen: "ontem",
    intention: "Construir uma historia madura, sem pressa e com direcao espiritual.",
    relationshipStatus: "divorciado",
    ministry: "Lider de celula",
    favoriteVerse: "Eis que faco novas todas as coisas. Apocalipse 21:5",
  },
  {
    id: "julia-martins",
    name: "Julia Martins",
    age: 27,
    city: "Sorocaba",
    state: "SP",
    church: "Igreja do Caminho",
    denomination: "Metodista",
    distance: "184 km",
    bio: "Missionaria local, gosto de servir pessoas e conversar sobre sonhos com os pes no chao.",
    photos: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=900&q=80",
    ],
    verified: true,
    online: true,
    badges: [
      { label: "Missionaria", tone: "gold" },
      { label: "Online", tone: "emerald" },
    ],
    interests: ["missoes", "viagens", "oracao"],
    faithTags: ["Missoes", "Evangelismo", "Oracao"],
    compatibilityPercent: 89,
    status: "available",
    equippedFrame: "Cristal do Rei",
    equippedAura: "Eclipse Dourado",
    equippedBackground: "Noite de Oracao",
    giftsReceived: ["Estrela de Belem", "Carta com Proposito"],
    lastSeen: "online agora",
    intention: "Conhecer alguem que ame servir e tenha compromisso com a fe.",
    relationshipStatus: "solteiro",
    ministry: "Missionaria local",
    favoriteVerse: "Ide por todo o mundo e pregai o evangelho. Marcos 16:15",
  },
  {
    id: "fernanda-costa",
    name: "Fernanda Costa",
    age: 30,
    city: "Praia Grande",
    state: "SP",
    church: "Comunidade Luz da Praia",
    denomination: "Batista",
    distance: "58 km",
    bio: "Voluntaria, mae de coracao cuidadoso, vivendo uma nova estacao com paz e maturidade.",
    photos: [
      "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=80",
    ],
    verified: true,
    online: false,
    badges: [
      { label: "Verificada", tone: "emerald" },
      { label: "Voluntaria", tone: "rose" },
    ],
    interests: ["voluntariado", "familia", "cuidado"],
    faithTags: ["Servir", "Familia", "Acolhimento"],
    compatibilityPercent: 86,
    status: "available",
    equippedFrame: "Vitral Sagrado",
    equippedAura: "Aurora Boreal",
    equippedBackground: "Amanhecer da Alianca",
    giftsReceived: ["Pomba da Paz"],
    lastSeen: "ha 4 horas",
    intention: "Viver uma relacao com serenidade, fe e respeito ao tempo de Deus.",
    relationshipStatus: "viuvo",
    ministry: "Voluntaria",
    favoriteVerse: "O Senhor e o meu pastor; nada me faltara. Salmos 23:1",
  },
  {
    id: "rafaela-nunes",
    name: "Rafaela Nunes",
    age: 25,
    city: "Peruibe",
    state: "SP",
    church: "Comunidade Crista Vida",
    denomination: "Crista",
    distance: "4 km",
    bio: "Canto no coral, amo praia no fim da tarde e conversas simples depois do culto.",
    photos: [
      "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80",
    ],
    verified: false,
    online: true,
    badges: [
      { label: "Perto de voce", tone: "rose" },
      { label: "Coral", tone: "gold" },
    ],
    interests: ["coral", "praia", "familia"],
    faithTags: ["Coral", "Jovens", "Comunhao"],
    compatibilityPercent: 93,
    status: "available",
    equippedFrame: "Floral Rosa",
    equippedAura: "Coracao Radiante",
    equippedBackground: "Jardim da Promessa",
    giftsReceived: ["Buque de Flores", "Rosa Branca"],
    lastSeen: "online agora",
    intention: "Conhecer alguem da mesma caminhada, com leveza e sinceridade.",
    relationshipStatus: "solteiro",
    ministry: "Coral",
    favoriteVerse: "Cantarei ao Senhor enquanto eu viver. Salmos 104:33",
  },
  {
    id: "larissa-monteiro",
    name: "Larissa Monteiro",
    age: 29,
    city: "Sao Vicente",
    state: "SP",
    church: "Igreja Fonte de Vida",
    denomination: "Assembleia",
    distance: "66 km",
    bio: "Intercessora, leitora de bons livros e defensora de conversas sem jogos emocionais.",
    photos: [
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?auto=format&fit=crop&w=900&q=80",
    ],
    verified: true,
    online: false,
    badges: [
      { label: "Intercessao", tone: "slate" },
      { label: "Verificada", tone: "emerald" },
    ],
    interests: ["livros", "intercessao", "familia"],
    faithTags: ["Intercessao", "Leitura", "Discipulado"],
    compatibilityPercent: 90,
    status: "available",
    equippedFrame: "Alianca de Ouro",
    equippedAura: "Horizonte Celestial",
    equippedBackground: "Campo de Lirios",
    giftsReceived: ["Cafe com Devocional", "Biblia Dourada"],
    lastSeen: "ha 30 min",
    intention: "Construir um relacionamento com conversa adulta, fe e responsabilidade.",
    relationshipStatus: "solteiro",
    ministry: "Intercessao",
    favoriteVerse: "Orai sem cessar. 1 Tessalonicenses 5:17",
  },
];

export const storeItems: StoreItem[] = [
  "Jardim da Promessa",
  "Ceu Dourado",
  "Aurora de Proposito",
  "Campo de Lirios",
  "Noite de Oracao",
  "Amanhecer da Alianca",
].map((name, index) => ({
  id: `fundo-${index + 1}`,
  name,
  category: "fundos",
  rarity: ["raro", "lendario", "epico", "comum", "celestial", "raro"][index] as StoreItem["rarity"],
  price: [240, 520, 420, 180, 680, 360][index],
  owned: index < 2,
  equipped: index === 0,
  description: "Fundo premium com atmosfera leve para destacar a vitrine do perfil.",
  preview: `linear-gradient(135deg, hsl(${10 + index * 28} 70% 94%), hsl(${42 + index * 19} 76% 88%), hsl(${170 + index * 13} 26% 86%))`,
}));

export const frameItems: StoreItem[] = [
  "Alianca de Ouro",
  "Louros Dourados",
  "Floral Rosa",
  "Vitral Sagrado",
  "Cristal do Rei",
  "Minimalista Prata",
].map((name, index) => ({
  id: `moldura-${index + 1}`,
  name,
  category: "molduras",
  rarity: ["lendario", "raro", "comum", "epico", "celestial", "comum"][
    index
  ] as StoreItem["rarity"],
  price: [520, 320, 180, 430, 690, 140][index],
  owned: index < 3,
  equipped: index === 0,
  description: "Moldura visual para avatar e cards de perfil.",
  preview: `linear-gradient(135deg, hsl(${35 + index * 21} 78% 72%), hsl(${330 + index * 7} 62% 86%))`,
}));

export const auraItems: StoreItem[] = [
  "Aurora Boreal",
  "Chama Sagrada",
  "Coracao Radiante",
  "Horizonte Celestial",
  "Neon Violeta",
  "Eclipse Dourado",
].map((name, index) => ({
  id: `aura-${index + 1}`,
  name,
  category: "auras",
  rarity: ["epico", "raro", "lendario", "comum", "epico", "celestial"][
    index
  ] as StoreItem["rarity"],
  price: [430, 300, 560, 170, 480, 720][index],
  owned: index < 2,
  equipped: index === 0,
  description: "Aura suave para dar profundidade aos perfis sem poluir o visual.",
  preview: `radial-gradient(circle, hsl(${150 + index * 34} 64% 74%), hsl(${20 + index * 26} 72% 88%), transparent 70%)`,
}));

export const stickerItems: StoreItem[] = [
  "Amem",
  "Estou orando por voce",
  "Deus abencoe",
  "Paz",
  "Gostei do seu perfil",
  "Vamos conversar com proposito",
].map((name, index) => ({
  id: `sticker-${index + 1}`,
  name,
  category: "stickers",
  rarity: ["comum", "raro", "comum", "comum", "raro", "epico"][index] as StoreItem["rarity"],
  price: [40, 80, 40, 30, 90, 130][index],
  owned: index < 4,
  equipped: false,
  description: "Sticker para conversas leves e respeitosas.",
  preview: `linear-gradient(135deg, hsl(${index * 36} 70% 92%), white)`,
}));

export const gifts: Gift[] = [
  ["buque", "Buque de Flores", "romantico", "raro", 120],
  ["carta", "Carta com Proposito", "mensagem", "comum", 80],
  ["alianca", "Alianca Simbolica", "premium", "lendario", 420],
  ["castelo", "Castelo Romantico", "premium", "celestial", 720],
  ["estrela", "Estrela de Belem", "fe", "epico", 260],
  ["biblia", "Biblia Dourada", "fe", "lendario", 360],
  ["pomba", "Pomba da Paz", "fe", "raro", 150],
  ["cafe", "Cafe com Devocional", "gentileza", "comum", 70],
  ["rosa", "Rosa Branca", "gentileza", "comum", 50],
  ["coracao", "Coracao de Luz", "romantico", "epico", 280],
].map(([id, name, category, rarity, price], index) => ({
  id: id as string,
  name: name as string,
  category: category as string,
  rarity: rarity as Gift["rarity"],
  price: price as number,
  image: `linear-gradient(135deg, hsl(${15 + index * 24} 74% 86%), hsl(${45 + index * 17} 72% 94%))`,
  note: "Um presente visual para expressar cuidado com respeito.",
}));

export const allStoreItems = [...storeItems, ...frameItems, ...auraItems, ...stickerItems];

export const conversations = [
  {
    id: "ana-clara",
    person: profiles[0],
    unread: 2,
    last: "Gostei do que voce falou sobre servir com leveza.",
    messages: [
      {
        from: "them",
        text: "Oi Antonio, vi seu perfil e achei muito bonito seu testemunho.",
        time: "19:12",
      },
      {
        from: "me",
        text: "Obrigado, Ana. Tambem gostei da sua forma de falar sobre louvor.",
        time: "19:18",
      },
      { from: "them", text: "Gostei do que voce falou sobre servir com leveza.", time: "19:24" },
    ],
  },
  {
    id: "rafaela-nunes",
    person: profiles[6],
    unread: 0,
    last: "Nos vemos no culto de domingo?",
    messages: [
      { from: "me", text: "Voce tambem frequenta a Comunidade Crista Vida?", time: "16:40" },
      { from: "them", text: "Sim, geralmente no culto da noite.", time: "16:43" },
      { from: "them", text: "Nos vemos no culto de domingo?", time: "16:46" },
    ],
  },
  {
    id: "larissa-monteiro",
    person: profiles[7],
    unread: 1,
    last: "Essa conversa merece calma e verdade.",
    messages: [
      {
        from: "them",
        text: "Achei interessante voce falar sobre maturidade emocional.",
        time: "09:20",
      },
      {
        from: "me",
        text: "Pra mim isso e essencial. Fe tambem aparece no jeito de cuidar.",
        time: "09:29",
      },
      { from: "them", text: "Essa conversa merece calma e verdade.", time: "09:34" },
    ],
  },
];

export const communityPosts = [
  {
    id: "post-1",
    author: "Caren Rodrigues",
    title: "Live especial nesta sexta",
    text: "Hoje vamos conversar sobre intencao clara, responsabilidade emocional e como conhecer alguem sem pressa.",
    reactions: 148,
    comments: 24,
  },
  {
    id: "post-2",
    author: "Equipe VaiDarNamoro",
    title: "Diretriz da semana",
    text: "Seja honesto no perfil, respeite limites e inicie conversas com gentileza. Comunidade saudavel nasce de pequenos cuidados.",
    reactions: 96,
    comments: 13,
  },
];

export const prayers = [
  {
    id: "oracao-1",
    name: "Mariana",
    category: "Familia",
    text: "Orem pela minha familia nesta nova fase.",
    count: 42,
  },
  {
    id: "oracao-2",
    name: "Rafael",
    category: "Direcao",
    text: "Preciso de sabedoria para tomar uma decisao importante.",
    count: 31,
  },
  {
    id: "oracao-3",
    name: "Ana Clara",
    category: "Gratidao",
    text: "Gratidao por uma porta de trabalho que se abriu.",
    count: 58,
  },
];

export const devotionals = [
  {
    title: "Amor que amadurece",
    verse: "O amor seja sincero. Romanos 12:9",
    text: "Um relacionamento com proposito nao comeca no encanto, mas na verdade. A maturidade aparece quando a fe organiza nossas escolhas e nosso cuidado com o outro.",
  },
  {
    title: "Paz para decidir",
    verse: "Seja a paz de Cristo o arbitro em vosso coracao. Colossenses 3:15",
    text: "Nem toda pressa e direcao. Algumas respostas nascem quando a alma aprende a descansar em Deus.",
  },
];

export const news = [
  {
    id: "n-1",
    title: "Top 3 mensal sera anunciado na live",
    category: "Live",
    date: "07 Jun",
    text: "A comunidade vai conhecer os destaques do mes com criterios de respeito, participacao e perfil completo.",
  },
  {
    id: "n-2",
    title: "Novas molduras premium chegaram",
    category: "Loja",
    date: "10 Jun",
    text: "Itens visuais inspirados em vitrais, aliancas e tons champagne foram adicionados ao mock da loja.",
  },
  {
    id: "n-3",
    title: "Central de ajuda reorganizada",
    category: "Suporte",
    date: "12 Jun",
    text: "Perguntas frequentes agora aparecem por categorias para facilitar a jornada no prototipo.",
  },
];

export const tickets = [
  {
    id: "VDN-2041",
    title: "Duvida sobre verificacao",
    status: "Aberto",
    priority: "Media",
    last: "Equipe respondeu ha 12 min",
  },
  {
    id: "VDN-2038",
    title: "Presente nao apareceu no perfil",
    status: "Em analise",
    priority: "Alta",
    last: "Atualizado ontem",
  },
  {
    id: "VDN-2027",
    title: "Sugestao para loja",
    status: "Fechado",
    priority: "Baixa",
    last: "Resolvido ha 4 dias",
  },
];

export const adminStats = [
  { label: "Usuarios ativos", value: "8.412", trend: "+12%" },
  { label: "Verificacoes pendentes", value: "48", trend: "-6%" },
  { label: "Receita em moedas", value: "128k", trend: "+18%" },
  { label: "Tickets abertos", value: "21", trend: "+3%" },
];

export const adminRows = [
  { name: "Ana Clara", status: "Aprovada", type: "Verificacao", date: "Hoje", risk: "Baixo" },
  { name: "Mariana Alves", status: "Em proposito", type: "Perfil", date: "Ontem", risk: "Baixo" },
  { name: "Foto #4821", status: "Pendente", type: "Foto", date: "Hoje", risk: "Medio" },
  { name: "Ticket VDN-2041", status: "Aberto", type: "Suporte", date: "Hoje", risk: "Medio" },
];

export function getProfile(id?: string) {
  return profiles.find((profile) => profile.id === id) ?? profiles[0];
}

export function getConversation(id?: string) {
  return conversations.find((conversation) => conversation.id === id) ?? conversations[0];
}

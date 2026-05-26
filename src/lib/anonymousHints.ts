import { supabase } from "@/integrations/supabase/client";

export type HintCategory = "idade" | "regiao" | "personalidade" | "fe" | "compatibilidade";
export type GeneratedHint = { category: HintCategory; text: string };

const REGIONS: Record<string, { name: string; neighbors: string[] }> = {
  AC: { name: "Norte", neighbors: ["AM", "RO"] },
  AP: { name: "Norte", neighbors: ["PA"] },
  AM: { name: "Norte", neighbors: ["AC", "RO", "RR", "PA"] },
  PA: { name: "Norte", neighbors: ["AP", "AM", "TO", "MA"] },
  RO: { name: "Norte", neighbors: ["AC", "AM", "MT"] },
  RR: { name: "Norte", neighbors: ["AM"] },
  TO: { name: "Norte", neighbors: ["PA", "MA", "GO", "BA"] },
  AL: { name: "Nordeste", neighbors: ["PE", "SE", "BA"] },
  BA: { name: "Nordeste", neighbors: ["SE", "PE", "PI", "TO", "GO", "MG", "ES"] },
  CE: { name: "Nordeste", neighbors: ["PI", "RN", "PB", "PE"] },
  MA: { name: "Nordeste", neighbors: ["PA", "TO", "PI"] },
  PB: { name: "Nordeste", neighbors: ["CE", "RN", "PE"] },
  PE: { name: "Nordeste", neighbors: ["PB", "CE", "PI", "BA", "AL"] },
  PI: { name: "Nordeste", neighbors: ["MA", "CE", "PE", "BA", "TO"] },
  RN: { name: "Nordeste", neighbors: ["CE", "PB"] },
  SE: { name: "Nordeste", neighbors: ["AL", "BA"] },
  DF: { name: "Centro-Oeste", neighbors: ["GO"] },
  GO: { name: "Centro-Oeste", neighbors: ["DF", "MT", "MS", "MG", "BA", "TO"] },
  MT: { name: "Centro-Oeste", neighbors: ["RO", "GO", "MS"] },
  MS: { name: "Centro-Oeste", neighbors: ["MT", "GO", "MG", "SP", "PR"] },
  ES: { name: "Sudeste", neighbors: ["BA", "MG", "RJ"] },
  MG: { name: "Sudeste", neighbors: ["ES", "RJ", "SP", "MS", "GO", "BA"] },
  RJ: { name: "Sudeste", neighbors: ["ES", "MG", "SP"] },
  SP: { name: "Sudeste", neighbors: ["MG", "RJ", "PR", "MS"] },
  PR: { name: "Sul", neighbors: ["SP", "MS", "SC"] },
  RS: { name: "Sul", neighbors: ["SC"] },
  SC: { name: "Sul", neighbors: ["PR", "RS"] },
};

function ageBucket(age: number): string {
  if (age <= 22) return "início dos 20";
  if (age <= 27) return "perto dos 25";
  if (age <= 32) return "perto dos 30";
  if (age <= 37) return "perto dos 35";
  if (age <= 45) return "começo dos 40";
  return "vivendo uma fase madura da vida";
}

type ProfileBundle = {
  age: number | null;
  state: string | null;
  marital: string | null;
  ministry: string | null;
  participates: string[] | null;
  spiritual_routine: string[] | null;
  introversion: string | null;
  energy: string | null;
  pace: string | null;
  love_language: string | null;
  hobbies: string | null;
  worship_style: string | null;
  life_goals: string[] | null;
  wants_marriage: string | null;
  wants_children: string | null;
  faith_moment: string | null;
  seeking: string | null;
};

export async function fetchSenderProfile(userId: string): Promise<ProfileBundle | null> {
  const [{ data: p }, { data: a }] = await Promise.all([
    supabase.from("profiles").select("age, state, marital").eq("id", userId).maybeSingle(),
    supabase
      .from("profile_advanced")
      .select(
        "ministry, participates, spiritual_routine, introversion, energy, pace, love_language, hobbies, worship_style, life_goals, wants_marriage, wants_children, faith_moment, seeking"
      )
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  if (!p) return null;
  return {
    age: p.age ?? null,
    state: p.state ?? null,
    marital: p.marital ?? null,
    ministry: a?.ministry ?? null,
    participates: a?.participates ?? null,
    spiritual_routine: a?.spiritual_routine ?? null,
    introversion: a?.introversion ?? null,
    energy: a?.energy ?? null,
    pace: a?.pace ?? null,
    love_language: a?.love_language ?? null,
    hobbies: a?.hobbies ?? null,
    worship_style: a?.worship_style ?? null,
    life_goals: a?.life_goals ?? null,
    wants_marriage: a?.wants_marriage ?? null,
    wants_children: a?.wants_children ?? null,
    faith_moment: a?.faith_moment ?? null,
    seeking: a?.seeking ?? null,
  };
}

function add(out: GeneratedHint[], category: HintCategory, text: string) {
  const t = text.trim();
  if (t.length >= 4 && t.length <= 140 && !out.some((h) => h.text === t)) {
    out.push({ category, text: t });
  }
}

/** Build a wide pool of subjective hints from real profile data. */
export function buildHintPool(p: ProfileBundle): GeneratedHint[] {
  const out: GeneratedHint[] = [];

  // ===== Idade =====
  if (p.age) {
    add(out, "idade", `Estou ${ageBucket(p.age)}`);
    add(out, "idade", "Tenho uma idade próxima da sua");
    add(out, "idade", "Estamos em fases parecidas da vida");
    if (p.age >= 30) add(out, "idade", "Já vivi um pouco mais que a média daqui");
    if (p.age <= 25) add(out, "idade", "Sou alguém em começo de jornada adulta");
  }

  // ===== Região =====
  if (p.state && REGIONS[p.state]) {
    const r = REGIONS[p.state];
    add(out, "regiao", `Moro na região ${r.name} do país`);
    add(out, "regiao", "Talvez não estejamos tão longe assim 👀");
    if (r.neighbors.length > 0) add(out, "regiao", "Sou de um estado relativamente perto de você");
    if (r.name === "Sudeste") add(out, "regiao", "Vivo num lugar bem movimentado");
    if (r.name === "Nordeste") add(out, "regiao", "Carrego um pouco do calor do nordeste comigo");
    if (r.name === "Sul") add(out, "regiao", "Conheço bem o frio do sul do país");
    if (r.name === "Norte") add(out, "regiao", "Venho de uma região cheia de natureza");
    if (r.name === "Centro-Oeste") add(out, "regiao", "Sou do coração do Brasil");
  }

  // ===== Fé / Ministério =====
  const part = (p.participates ?? []).map((s) => s.toLowerCase());
  if (p.ministry === "louvor" || part.includes("louvor") || p.worship_style) {
    add(out, "fe", "A música faz parte da minha caminhada");
    add(out, "fe", "Sou alguém que se conecta com Deus pela adoração");
  }
  if (p.ministry === "jovens" || part.includes("jovens")) {
    add(out, "fe", "Caminho bastante com a juventude da igreja");
  }
  if (p.ministry === "intercessao" || part.includes("intercessao")) {
    add(out, "fe", "A oração tem um lugar muito grande na minha vida");
  }
  if (p.ministry === "infantil" || part.includes("kids") || part.includes("infantil")) {
    add(out, "fe", "Tenho um coração que se alegra com crianças");
  }
  if (p.ministry && p.ministry !== "outro") {
    add(out, "fe", "Sirvo ativamente na minha igreja");
  }
  const routine = (p.spiritual_routine ?? []).map((s) => s.toLowerCase());
  if (routine.includes("devocional") || routine.includes("biblia")) {
    add(out, "fe", "Tenho uma rotina constante com a Palavra");
  }
  if (routine.includes("jejum")) {
    add(out, "fe", "Busco a Deus também através do jejum");
  }
  if (p.faith_moment === "firmado") add(out, "fe", "Estou num momento firme da minha fé");
  if (p.faith_moment === "crescimento") add(out, "fe", "Estou amadurecendo bastante na fé agora");
  if (p.faith_moment === "restauracao") add(out, "fe", "Vivo um tempo de restauração com Deus");
  if (p.faith_moment === "recomecando") add(out, "fe", "Estou recomeçando algumas coisas com Deus");

  // ===== Personalidade =====
  if (p.introversion === "introvertido" || p.introversion === "muito_introvertido") {
    add(out, "personalidade", "Sou alguém mais reservado(a)");
    add(out, "personalidade", "Gosto bastante de momentos tranquilos");
  }
  if (p.introversion === "extrovertido" || p.introversion === "muito_extrovertido") {
    add(out, "personalidade", "Costumo ser bem comunicativo(a)");
    add(out, "personalidade", "Gosto de conviver e conhecer gente nova");
  }
  if (p.introversion === "equilibrado") {
    add(out, "personalidade", "Tenho momentos sociais e momentos bem caseiros");
  }
  if (p.pace === "calmo") add(out, "personalidade", "Levo a vida num ritmo mais calmo");
  if (p.pace === "agitado") add(out, "personalidade", "Tenho uma rotina bem ativa");
  if (p.energy === "casa") add(out, "personalidade", "Recarrego minhas energias em casa");
  if (p.energy === "rua") add(out, "personalidade", "Me sinto vivo(a) quando estou na rua");
  if (p.love_language) add(out, "personalidade", "Sei bem como gosto de demonstrar carinho");
  if (p.hobbies && p.hobbies.trim().length > 0) {
    add(out, "personalidade", "Tenho hobbies que ocupam meu tempo livre");
  }

  // ===== Compatibilidade =====
  if (p.marital === "solteiro" || p.marital === "solteira") {
    add(out, "compatibilidade", "Estou solteiro(a) e aberto(a) a algo sério");
  }
  if (p.marital === "divorciado" || p.marital === "divorciada") {
    add(out, "compatibilidade", "Já vivi um casamento e estou recomeçando com sabedoria");
  }
  if (p.marital === "viuvo" || p.marital === "viuva") {
    add(out, "compatibilidade", "Carrego uma história que me amadureceu muito");
  }
  if (p.wants_marriage === "sim" || p.wants_marriage === "muito") {
    add(out, "compatibilidade", "Penso em casamento de forma séria");
  }
  if (p.wants_children === "sim" || p.wants_children === "muito") {
    add(out, "compatibilidade", "Sonho em construir uma família um dia");
  }
  if (p.wants_children === "nao") {
    add(out, "compatibilidade", "Tenho uma visão bem definida sobre filhos");
  }
  if (p.seeking === "casamento") add(out, "compatibilidade", "Estou buscando algo que leve a algo eterno");
  if (p.seeking === "namoro") add(out, "compatibilidade", "Quero viver um namoro com propósito");
  if (p.seeking === "amizade") add(out, "compatibilidade", "Antes de tudo, quero construir uma amizade verdadeira");
  if ((p.life_goals ?? []).length > 0) {
    add(out, "compatibilidade", "Tenho sonhos e metas bem claras para o futuro");
  }

  // Generic safety net — always at least a few options
  add(out, "personalidade", "Sou alguém que valoriza pequenos detalhes");
  add(out, "fe", "Coloco Deus no centro das minhas decisões");
  add(out, "compatibilidade", "Acredito que vale a pena esperar pela pessoa certa");

  return out;
}

export function pickThree(pool: GeneratedHint[], exclude: Set<string>): GeneratedHint[] {
  const available = pool.filter((h) => !exclude.has(h.text));
  const source = available.length >= 3 ? available : pool.slice();
  // Fisher-Yates partial shuffle
  const copy = source.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 3);
}
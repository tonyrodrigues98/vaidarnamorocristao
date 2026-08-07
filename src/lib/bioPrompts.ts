export type BioPrompt = {
  id: string;
  label: string;
  starter: string;
};

export const BIO_PROMPTS: BioPrompt[] = [
  {
    id: "faith",
    label: "Minha fé é importante para mim porque...",
    starter: "Minha fé é importante para mim porque ",
  },
  {
    id: "match",
    label: "Uma pessoa combinaria comigo se...",
    starter: "Uma pessoa combinaria comigo se ",
  },
  {
    id: "talk",
    label: "Gosto de conversar sobre...",
    starter: "Gosto de conversar sobre ",
  },
  {
    id: "freetime",
    label: "No meu tempo livre eu gosto de...",
    starter: "No meu tempo livre eu gosto de ",
  },
  {
    id: "values",
    label: "Busco alguém que valorize...",
    starter: "Busco alguém que valorize ",
  },
];

export const LOOKING_FOR_PROMPTS: BioPrompt[] = [
  {
    id: "calm",
    label: "Quero conhecer alguém com calma...",
    starter: "Quero conhecer alguém com calma, ",
  },
  {
    id: "purpose",
    label: "Busco um namoro com propósito...",
    starter: "Busco um namoro com propósito, ",
  },
  {
    id: "marriage",
    label: "Estou preparado(a) para casar...",
    starter: "Estou preparado(a) para casar, ",
  },
];

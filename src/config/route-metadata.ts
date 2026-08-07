import {
  createPageMetadata,
  createPrivatePageMetadata,
  createPublicPageMetadata,
} from "@/lib/metadata";

export const rootMetadata = createPublicPageMetadata({
  title: "VaiDarNamoro — Comunidade cristã 18+",
  exactTitle: true,
  description:
    "Uma comunidade cristã 18+ para amizade, fé, experiências e conversas. O modo de relacionamento é opcional.",
  ogDescription: "Comunidade cristã para pertencer, conversar e viver boas experiências.",
  path: "/",
  canonical: false,
});

export const liveHomeMetadata = createPublicPageMetadata({
  title: "VaiDarNamoro — Comunidade cristã 18+",
  exactTitle: true,
  description:
    "Comunidade cristã 18+ para amizade, fé, experiências e conversas, com relacionamento opcional e Live pública.",
  ogDescription:
    "Comunidade cristã para pertencer, conversar e viver experiências. Relacionamento é opcional.",
  twitterDescription: "Comunidade cristã 18+ com amizade, fé e experiências.",
  keywords:
    "Caren, Vai Dar Namoro Cristão, live cristã TikTok, comunidade cristã, relacionamento cristão",
  path: "/",
});

export const inicioMetadata = createPrivatePageMetadata({
  title: "Início",
  description: "Seu espaço dentro do VaiDarNamoro. Bem-vindo(a) de volta.",
  path: "/inicio",
});

export const lojaMetadata = createPrivatePageMetadata({
  title: "Loja",
  description:
    "Use suas moedas para desbloquear molduras, auras e personalizações exclusivas do seu perfil.",
  path: "/loja",
});

export const instalarMetadata = createPageMetadata({
  title: "Instalar VaiDarNamoro no celular",
  exactTitle: true,
  description:
    "Adicione o VaiDarNamoro à tela inicial do iPhone ou Android para abrir como app — sem barra do navegador, com notificações.",
  ogDescription: "Tenha o VaiDarNamoro como app no seu celular em poucos segundos.",
  path: "/instalar",
  robots: "noindex-follow",
  social: true,
});

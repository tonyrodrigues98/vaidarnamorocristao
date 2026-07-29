import {
  createPageMetadata,
  createPrivatePageMetadata,
  createPublicPageMetadata,
} from "@/lib/metadata";

export const rootMetadata = createPublicPageMetadata({
  title: "VaiDarNamoro — Namoro cristão sério com propósito",
  exactTitle: true,
  description:
    "VaiDarNamoro é a plataforma cristã de relacionamentos sérios. Conheça pretendentes aprovados manualmente que vivem e compartilham a sua fé.",
  ogDescription: "Namoro cristão sério com propósito",
  path: "/",
  canonical: false,
});

export const liveHomeMetadata = createPublicPageMetadata({
  title: "Caren | Vai Dar Namoro Cristão",
  exactTitle: true,
  description:
    "Página oficial da live Vai Dar Namoro Cristão da Caren. Uma comunidade real, feita de pessoas reais.",
  ogDescription:
    "A página oficial da live da Caren no TikTok. Uma comunidade real, feita de pessoas reais.",
  twitterDescription: "Página oficial da live Vai Dar Namoro Cristão da Caren.",
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

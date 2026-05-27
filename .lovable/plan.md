## Objetivo

Adicionar a imagem enviada como banner promocional na página `/inicio`, posicionado logo abaixo da saudação ("Bom dia / Boa tarde / Boa noite / Boa madrugada, [nome]") dentro do hero.

## Passos

1. **Salvar a imagem como asset do projeto**
   - Copiar `user-uploads://image-23.png` para `src/assets/banner-stickers-chat.png`.

2. **Criar componente `StickersChatBanner`**
   - Arquivo: `src/components/StickersChatBanner.tsx`.
   - Layout: card rounded-2xl, full width do container do hero, com a imagem ocupando o banner inteiro (responsivo via `aspect-ratio` para manter a proporção original ~1900x540).
   - A imagem JÁ contém todo o conteúdo visual (título, texto, CTA visual), então o componente renderiza apenas:
     - `<Link to="/comunidade">` envolvendo a imagem (clique leva ao chat global).
     - `<img>` com `alt="Novidade: stickers no chat global"`, `loading="lazy"`, `decoding="async"`, `draggable={false}`.
     - Classes: `block w-full h-auto rounded-2xl object-cover`.
     - Wrapper com `shadow-soft`, `transition-transform`, `hover:scale-[1.01]`, `active:scale-[0.99]`, `animate-fade-up`.
   - Sem texto sobreposto (a arte já comunica tudo) — fica fiel à imagem enviada.

3. **Inserir o banner no `/inicio`**
   - Em `src/routes/inicio.tsx`, dentro do bloco do hero, **logo após o `</div>` que fecha a área da saudação + CTAs** (após a linha ~620, antes do fechamento do hero section).
   - Render: `<StickersChatBanner />` envolvido em `<div className="mt-8 animate-fade-up" style={{ animationDelay: "300ms" }}>`.
   - Visível para todos os usuários (aprovados ou não) — é uma novidade da plataforma.

4. **Acessibilidade & performance**
   - `alt` descritivo em português.
   - `loading="lazy"` no `<img>`.
   - Sem alteração de lógica de negócio, apenas frontend/presentational.

## Arquivos afetados

- `src/assets/banner-stickers-chat.png` (novo)
- `src/components/StickersChatBanner.tsx` (novo)
- `src/routes/inicio.tsx` (1 import + 1 bloco JSX abaixo da saudação)

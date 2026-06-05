## Objetivo

Preparar a base inicial do app — estrutura organizada de páginas e componentes, sem lógica de negócio — pronta para conectar ao GitHub.

## Stack já presente

O projeto já vem configurado com React 19 + TypeScript + Vite 7 + Tailwind v4 + shadcn/ui + TanStack Router (file-based routing em `src/routes/`). Vou aproveitar essa base em vez de reconfigurar do zero.

## Estrutura de pastas

```text
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx       # nav com links Home / Sobre
│   │   └── Footer.tsx       # rodapé simples
│   └── ui/                  # shadcn (já existe)
├── routes/
│   ├── __root.tsx           # já existe — sem alterações estruturais
│   ├── index.tsx            # Home (substitui o placeholder atual)
│   ├── about.tsx            # nova página "Sobre"
│   └── _layout.tsx          # layout compartilhado (Header + Outlet + Footer)
└── styles.css               # já existe
```

## Páginas

1. **Home (`/`)** — hero simples com título, subtítulo e CTA fictício. Sem dados, sem formulários.
2. **Sobre (`/about`)** — página estática descrevendo o app.
3. **404** — já tratado em `__root.tsx` via `notFoundComponent`.

## Componentes

- `Header` — logo/título + navegação (`Link` do TanStack Router).
- `Footer` — copyright e link para o repositório (placeholder).

Ambos usam tokens semânticos de `src/styles.css` (`bg-background`, `text-foreground`, `text-muted-foreground`, etc.) — sem cores hardcoded.

## O que NÃO será feito

- Sem autenticação, sem backend, sem Lovable Cloud.
- Sem formulários funcionais, sem chamadas de API.
- Sem alterações em `routeTree.gen.ts` (auto-gerado).

## Próximo passo após aprovação

Após aprovar o plano, conecte o projeto ao GitHub pelo menu **+ → GitHub → Connect project** na parte inferior esquerda — o código sincroniza automaticamente nos dois sentidos.

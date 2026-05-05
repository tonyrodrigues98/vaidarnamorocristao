## Visão geral

Três ondas sequenciais. Cada onda é entregue, testada e revisada antes da próxima. Foco da meta de 90 dias: **crescer base via SEO orgânico + engajamento**.

```text
ONDA 1 (SEO público)  →  ONDA 2 (Pretendentes)  →  ONDA 3 (Devocional)
   ~5 arquivos novos        ~2 arquivos editados      ~3 arquivos + migração
```

---

## ONDA 1 — Páginas públicas SEO

**Objetivo**: criar conteúdo indexável pelo Google. Hoje todo o app é privado (`robots.txt` bloqueia tudo exceto `/`, `/termos`, `/manual`). Sem páginas públicas, não há SEO possível.

### Páginas novas (cada uma com `head()` próprio: title, description, og:title, og:description únicos)

1. **`/sobre`** (`src/routes/sobre.tsx`)
   - Quem somos, missão cristã, valores (Mateus 19:6 como âncora)
   - Equipe / fundadores (texto editável depois)
   - CTA: "Crie seu perfil"

2. **`/como-funciona`** (`src/routes/como-funciona.tsx`)
   - 4 passos visuais: cadastro → aprovação manual → conheça pretendentes → conversa com propósito
   - Seção "Por que aprovação manual?" (diferencial vs Tinder)
   - FAQ embutido (5 perguntas)

3. **`/depoimentos`** (`src/routes/depoimentos.tsx`)
   - Grid de cards com casais (foto + nome + cidade + história curta)
   - Inicialmente com 3-4 depoimentos placeholder (você substitui por reais depois)
   - JSON-LD `Review` schema pra rich snippets no Google

4. **`/blog`** (`src/routes/blog.index.tsx`) + **`/blog/$slug`** (`src/routes/blog.$slug.tsx`)
   - Lista de artigos + página individual
   - Posts inicialmente em arquivos MDX ou em const (sem precisar de tabela no DB ainda — simples)
   - 3 posts iniciais escritos por mim com SEO de cauda longa:
     - "Como saber se é a pessoa certa para casar segundo a Bíblia"
     - "Namoro cristão sério: 7 sinais que vocês estão no caminho certo"
     - "O que diz a Bíblia sobre namoro"
   - Cada post: H1, H2/H3 estruturados, 1.200+ palavras, JSON-LD `Article`

### Ajustes de infra SEO

5. **`public/robots.txt`** — adicionar `Allow:` para as novas rotas públicas:
   ```
   Allow: /sobre
   Allow: /como-funciona
   Allow: /depoimentos
   Allow: /blog
   ```

6. **`public/sitemap.xml`** — adicionar todas as novas URLs com `<lastmod>` e `<priority>`.

7. **Header da landing** (`src/routes/index.tsx`) — adicionar links de navegação para as novas páginas (visíveis a usuário não-logado). Internal linking ajuda muito SEO.

8. **JSON-LD na landing** — adicionar `FAQPage` schema com 4 perguntas comuns ("É grátis?", "Como funciona aprovação?", etc.) → rich snippets no Google.

### Entregável Onda 1
- 6 páginas públicas indexáveis com metadata única por página
- Sitemap atualizado
- 3 posts de blog com conteúdo real cristão (não lorem)
- Schema.org em todas as páginas relevantes

---

## ONDA 2 — Pretendentes: filtros + ordenação por afinidade

**Objetivo**: usar `src/lib/affinity.ts` que já existe pra entregar matches mais relevantes e dar controle ao usuário.

### Mudanças em `src/routes/pretendentes/index.tsx`

1. **Barra de filtros** (drawer no mobile, sidebar no desktop):
   - Faixa etária (range slider)
   - Estado (multi-select)
   - Faixa de altura
   - Estado civil
   - Tem filhos (sim/não/tanto faz)
   - Anos batizado (mínimo)
   - Ministério (multi-select baseado em `profile_advanced.ministry`)
   - Linguagem do amor (baseado em `profile_advanced.love_language`)

2. **Ordenação** (select no topo):
   - **Afinidade** (padrão) — usa `affinity.ts`, ordena desc por nº de badges em comum
   - Mais recentes
   - Mais ativos (presence)

3. **Score visual no card**: badge "🔥 87% afinidade" quando score ≥ 70%, calculado client-side a partir do meu `profile_advanced` vs o do pretendente.

4. **Filtros persistem em URL** (search params via TanStack Router) — usuário pode compartilhar/bookmark e voltar com filtros aplicados.

### Sem mudança no DB
Tudo é client-side filtering em cima do fetch já existente (já buscamos os perfis aprovados). Só precisamos garantir que `profile_advanced` está sendo carregado junto (provavelmente já está pelas mudanças anteriores).

### Entregável Onda 2
- Filtros funcionais com persistência em URL
- Ordenação por afinidade como padrão
- Badge de % de afinidade nos cards

---

## ONDA 3 — Devocional: streak + pedidos de oração com contador

**Objetivo**: dar motivo pra abrir o app todo dia (retenção).

### Migração de DB

1. **Nova tabela `prayer_requests`**:
   ```sql
   CREATE TABLE prayer_requests (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid NOT NULL,
     content text NOT NULL,
     anonymous boolean DEFAULT false,
     created_at timestamptz DEFAULT now(),
     resolved_at timestamptz
   );
   ```
   RLS: aprovados podem inserir e ler todos; só dono pode deletar/marcar resolvido.

2. **Nova tabela `prayer_request_prayed`** (quem orou por qual pedido):
   ```sql
   CREATE TABLE prayer_request_prayed (
     request_id uuid NOT NULL,
     user_id uuid NOT NULL,
     created_at timestamptz DEFAULT now(),
     PRIMARY KEY (request_id, user_id)
   );
   ```
   RLS: aprovados podem inserir; todos leem (pra contar).

3. **View `devotional_streaks`** — calcula streak atual a partir de `devotional_prayed`:
   - Streak = dias consecutivos com pelo menos 1 registro de `devotional_prayed` até hoje (ou ontem, se ainda não orou hoje)

### Mudanças em `src/routes/devocional.tsx`

4. **Card de streak no topo**: "🔥 Você está em uma sequência de 12 dias! Não pare hoje."
   - Cor laranja quando streak ≥ 3
   - Mensagem motivacional muda conforme dias

5. **Seção "Pedidos de oração da comunidade"**:
   - Botão "Compartilhar pedido" (modal com textarea, checkbox "anônimo")
   - Lista dos pedidos recentes (paginada)
   - Cada card: conteúdo + botão "🙏 Orar por este pedido" + contador "47 irmãos oraram"
   - Dono pode marcar "Pedido respondido" → move pra seção "Testemunhos respondidos"

6. **Notificação leve**: toast quando alguém ora pelo seu pedido (via realtime na tabela `prayer_request_prayed`).

### Entregável Onda 3
- Streak visível e motivador no devocional
- Sistema completo de pedidos de oração com contador
- 2 tabelas novas com RLS, 1 view de cálculo

---

## Detalhes técnicos

- **TanStack Start head()**: cada rota nova define seu próprio `head()` — title, description, og:title, og:description, og:image herda do root quando faz sentido.
- **Robots/sitemap**: ambos são arquivos estáticos em `public/` por enquanto. Se a quantidade de blog posts crescer, migramos pra server route dinâmica (`/sitemap.xml` server route).
- **Blog sem CMS**: posts iniciais como objetos TypeScript (`src/data/blog-posts.ts`). Permite SEO completo sem custo de DB. Quando você quiser editar via admin, migramos pra tabela.
- **Affinity score**: cálculo já existe em `src/lib/affinity.ts` — só consumir e mostrar.
- **RLS Onda 3**: todas as policies novas exigem `has_accepted_current_terms` + `profile.status = approved` (consistente com padrão atual da base).

## O que NÃO está nesta onda (fica pra depois)

- Indicação de amigos / convites (Onda 4 sugerida)
- Vídeo de apresentação (Onda 5)
- Quiz de compatibilidade espiritual (Onda 5)
- Plano premium (depois de validar tração)

## Próximo passo

Aprove e eu começo pela **Onda 1 inteira** (SEO público + 3 blog posts reais). Depois te aviso pra revisar antes de partir pra Onda 2. Cada onda é independente e segura.

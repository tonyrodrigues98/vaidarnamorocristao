# Plano: XP, Conquistas, Quiz, Eventos e Efeitos do Pet

Entrega em **5 fases independentes** (cada fase = 1 turno de implementação). Você decide quando seguir pra próxima.

---

## Fase 1 — Sistema de XP + Barra + Conquistas

### O que muda na tela
- Barra azul **full-width dentro do bloco do pet**, embaixo da arte (não junto das barras de fome/energia).
- Mostra: nível atual, nome do nível, XP atual / XP pro próximo, % preenchido.
- Animação suave ao ganhar XP + toast "+12 XP".

### Curva de nível
- Cap **50**. Fórmula: `xp_pro_nivel(n) = 100 * n^1.6` (nível 2 ≈ 100, nível 10 ≈ 4k, nível 50 ≈ 60k).
- Nomes por faixa: Filhote (1–5), Curioso (6–10), Companheiro (11–20), Fiel (21–30), Sábio (31–40), Lendário (41–50).

### Fontes de XP (integradas ao app inteiro)
| Ação | XP | Cap diário |
|---|---|---|
| Usar item de care com barra <50% | +8 | 6×/dia |
| Usar item com barra <20% (resgate) | +15 | 4×/dia |
| Streak diário de login | +20 | 1×/dia |
| Completar missão diária | +30 | 3×/dia |
| Acerto no quiz bíblico | +10 por acerto | 3×/dia |
| Receber match | +25 | 5×/dia |
| Mandar 1ª mensagem em novo match | +15 | 3×/dia |
| Devocional do dia (ler+marcar como orei) | +20 | 1×/dia |
| Orar por pedido de oração de alguém | +5 | 5×/dia |
| Avatar/perfil completado (one-shot) | +50 | 1× total |

### Recompensas por nível (cosmético + econômico + social)
- **Cosmético**: a cada 3 níveis libera 1 fundo de pet/aura/moldura/gradiente do catálogo (marcados como `unlock_level` no admin).
- **Econômico**: claim diário cresce com nível (`nivel * 5 coins/dia`). Desconto na loja: -5% a partir do nv 20, -10% a partir do nv 35.
- **Social**: badge "Nv X" no perfil + título textual (ex: "Fiel"). A partir do nv 25, destaque sutil no card de pretendentes.

### Conquistas (achievements)
- Tabela `pet_achievements` com slug, nome, descrição, ícone (lucide), critério (JSONB) e recompensa (XP + opcionalmente coins/cosmético).
- ~30 conquistas seed: "Primeira refeição", "7 dias seguidos", "Nível 10", "100 carinhos", "Quiz: 50 acertos", "10 matches", "Devocional 30 dias", etc.
- Card "Conquistas" no perfil do pet com progress bars.

---

## Fase 2 — Missões Diárias (100 no pool, 3/dia)

- Tabela `pet_missions` com 100 missões seed (geradas via IA pt-BR), só ações **solo** (nada que dependa de outra pessoa aceitar — ex: nada de "dê match").
- Exemplos: "Alimente seu pet 2x", "Use 1 item de higiene", "Leia o devocional do dia", "Faça o quiz", "Visite 3 perfis", "Atualize sua bio", "Adicione 1 foto", "Marque 1 interesse novo", "Acerte 2 perguntas no quiz".
- Tabela `user_daily_missions` (3 por dia, sorteadas 00h SP, respeitando categorias variadas).
- Painel "Missões de hoje" na home + atalho na tela do pet.
- Recompensa: +30 XP + coins variável por dificuldade (easy/med/hard).

---

## Fase 3 — Quiz Bíblico

- Tabela `bible_quiz_questions`: 300 perguntas seed (geradas via Lovable AI em pt-BR, com referência bíblica e explicação curta após responder).
- 3 perguntas/dia, sorteadas sem repetir até esgotar o pool.
- 3 opções, 1 correta. Após responder mostra: ✓/✗, versículo de referência, 1–2 frases de contexto.
- Erro **consome tentativa** (não volta).
- Recompensas: 1 acerto = +10 XP +5 coins; 2 = +25 XP +15 coins; 3 = +50 XP +40 coins + buff de pet (24h decay -10%).
- Rota nova `/quiz-biblico` + card de entrada na home quando ainda há perguntas do dia.

---

## Fase 4 — Eventos/Confissões do Pet + Sonho com Match

### Confissões (500 textos)
- Tabela `pet_confessions` com 500 textos seed pt-BR (gerados via IA), cada um com efeito opcional nas barras (ex: "Sonhei que comi um biscoito gigante… acordei com fome" → fome -5).
- Disparam **automaticamente a cada 30–90 min** quando o pet está em foreground, ou via botão "O que meu pet está pensando?".
- Renderizam como balão de fala flutuante sobre o pet, com fade in/out de 6s.
- Categorias: feliz, faminto, sonolento, carente, travesso, espiritual, fofo.

### Sonho com match (raro, ~1×/dia)
- Server function `getPetDreamMatch`: filtra pretendentes que batem com **"o que eu busco"** (purpose compatibility já existe em `purposeCompatibility.ts`), pega 1 aleatório do top 10.
- Confissão especial: "Sonhei com alguém especial 💭… acho que era {nome}". CTA opcional: "Ver perfil".
- Trigger: aparece à noite (Zzz ativo) com chance baixa.

---

## Fase 5 — Efeitos Visuais + Diurno/Noturno + Push de Oração

### Efeitos visuais sobre o pet
- **Fedido (higiene <30)**: partículas verdes/onduladas saindo do pet, leves, contínuas. SVG/CSS, não asset.
- **Feliz (humor >85 E carência >85)**: 1–3 corações flutuando, raros (a cada ~20s), com fade subindo.
- **Dormindo à noite (pet noturno=false E phase=night, ou pet noturno=true E phase=day)**: "Zzz" azul claro subindo com fade in/out a cada 4s.

### Flag diurno/noturno por espécie
- Adicionar coluna `nocturnal boolean default false` em `pet_species`.
- Admin: toggle em `PetSpeciesPanel` (gato, coruja, morcego = noturno; cachorro, pássaro = diurno).
- Pet noturno fica **ativo de noite** e dorme de dia (e vice-versa). Decay de energia inverte: noturno regenera energia de dia.

### Push "Orou por você"
- Hoje o botão de orar (em `prayer_requests`) não dispara push. Vou ligar ao `push_queue` existente.
- Server fn `prayForRequest`: insere em `prayer_request_prayed` (já existe) + insere em `push_queue` com `title="🙏 Alguém orou por você"` `body="{nome} orou pelo seu pedido"` `url=/oracoes`.
- Throttle: 1 push por (orador, pedido) — não spamma se a pessoa orar várias vezes.

---

## Detalhes técnicos

### Banco (migrations Fase 1–5)
- `user_xp` (user_id, xp_total, level, updated_at) + RLS por usuário
- `xp_events` (id, user_id, source, amount, created_at) — log + cap diário
- `pet_achievements` + `user_achievements`
- `pet_missions` + `user_daily_missions`
- `bible_quiz_questions` + `user_quiz_attempts`
- `pet_confessions` + `user_pet_confession_log`
- `pet_species.nocturnal boolean`
- Sempre com GRANT + RLS + service_role

### Server functions novas
- `awardXp({ source, amount })` — middleware `requireSupabaseAuth`, valida cap diário, atualiza `user_xp`, dispara evento.
- `getMyXpState()` — retorna nível, xp, próximo nível, recompensas desbloqueadas.
- `rollDailyMissions()` — idempotente, roda 1×/dia/usuário.
- `getTodayQuiz()` / `answerQuiz({ questionId, optionIndex })`
- `getNextPetConfession()` — pesos por estado das barras
- `getPetDreamMatch()` — usa `purposeCompatibility`
- `prayForRequest({ requestId })` — insere prayed + push

### Geração de conteúdo (IA pt-BR)
- 500 confissões + 300 perguntas bíblicas + 100 missões + 30 conquistas → scripts no sandbox usando `lovable_ai.py` em modo batch + JSON schema, gravando direto via INSERT nas tabelas.
- Você revisa depois no admin (painéis CRUD pra cada tabela).

### Admin
- 4 painéis novos em `/admin`: Missões, Quiz Bíblico, Confissões do Pet, Conquistas (listar, editar texto, ativar/desativar).

---

## Ordem sugerida de implementação

1. **Fase 1** (base que tudo usa): XP + barra + conquistas
2. **Fase 5** (quick wins visuais): efeitos + diurno/noturno + push de oração
3. **Fase 2**: missões diárias (já consome XP da Fase 1)
4. **Fase 3**: quiz bíblico
5. **Fase 4**: confissões + sonho com match

Quando aprovar, começo pela **Fase 1**.


# Finalizar Recados Anônimos (Mystery Match)

O backend e os componentes-base já existem. Este plano cobre apenas a **integração faltante** no frontend para a feature ficar visível e funcional ponta a ponta.

## 1. Perfil do pretendente
Arquivo: `src/routes/pretendentes/$id.tsx`
- Importar e renderizar `<SendAnonymousButton receiverId={id} />` no bloco de ações do perfil (próximo dos botões de interesse / mensagem).
- O próprio componente já trata sexo oposto, opt-out, cooldown, limite diário e recado ativo — não precisa de gate adicional na página.
- Garantir que funcione também quando o alvo é um moderador que não aparece em `/pretendentes` (acessando direto pela URL do perfil).

## 2. Header global
Arquivo: `src/components/layout/Header.tsx`
- Adicionar item de navegação **“Recados”** (ícone `Sparkles` da lucide-react) apontando para `/recados`, tanto no menu desktop quanto no drawer mobile.
- Badge com contagem de recados não lidos na caixa de entrada (status `pending`, `hint_sent`, `reveal_requested` direcionados ao usuário atual).
- Query simples via `supabase.from('anonymous_messages').select('id', { count: 'exact', head: true })` filtrando `receiver_id = auth.uid()` e status relevante.

## 3. Realtime e notificações
Arquivos: `src/lib/useRealtimeNotifications.tsx`, `src/routes/recados.tsx`
- Subscrever canal Postgres em `anonymous_messages` e `anonymous_message_hints` para atualizar inbox/outbox e o badge do header em tempo real.
- Inserir linha em `notifications` (via trigger SQL **ou** dentro de cada RPC já existente — preferir trigger para não duplicar lógica) nos eventos:
  - novo recado recebido
  - dica solicitada / dica enviada
  - pedido de revelação
  - revelação concluída (cria match)
  - resposta recebida
- Mapear novos `type` de notificação no `useRealtimeNotifications` para roteamento até `/recados`.

## 4. Polimento visual (mobile-first 390px)
Arquivo: `src/styles.css` e componentes em `src/components/anonymous/`
- Tokens CSS específicos: `--mystery-gradient` (rose → âmbar suave), `--mystery-blur` para o “envelope lacrado”.
- Keyframe `reveal` (fade + scale + blur out) para a animação no momento em que ambos aceitam se revelar.
- Revisar `recados.tsx` em 390px: tabs, cards de recado, dialogs sem overflow.

## 5. QA no navegador (obrigatório antes de fechar)
- Conta A (masculino) → enviar recado para conta B (feminino): valida regra de sexo oposto.
- Conta B recebe, pede dica, A envia dica, B responde, A pede revelação, B aceita → match criado.
- Conta C com `accept_anonymous = false` → botão aparece como bloqueado com mensagem certa.
- Tentar enviar 4º recado no dia → bloqueio por `daily_limit`.
- Revalidar badge do header atualizando em tempo real.

## Detalhes técnicos
- Não alterar o schema do banco (já está completo). Se for necessário trigger de notificação, criar nova migração isolada.
- Reaproveitar `friendlyError` para todos os erros de RPC.
- Ícones somente `lucide-react`.
- Sem cores hex inline — usar tokens semânticos de `src/styles.css`.

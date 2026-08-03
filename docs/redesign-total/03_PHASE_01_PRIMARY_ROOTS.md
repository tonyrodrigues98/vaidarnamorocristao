# Fase 01 — cinco areas principais

## Inicio

`InicioPage` continua proprietaria de auth, queries, warnings, requests, apelos, devocional, sugestao, commitment e callbacks. O redesign recebe o mesmo `NativeInicioViewModel`: saudacao compacta, palavra editorial, prioridade real, atalhos, resumo social e estados de moderacao.

## Comunidade

Mantem os links e tabs existentes. A nova composicao hierarquiza Chat, Oracoes, Noticias e Devocional sem inventar feed, evento ou espaco persistente.

## Explorar

`nativeExploreRegistry` continua fonte unica. A apresentacao agrupa destinos reais em pessoas, fe/conteudo, expressao, pets/jogos, loja/recompensas e seguranca/conta, sem busca ficticia.

## Conversas

`useConversationsList` permanece fonte unica. O mesmo `NativeConversationsViewModel` alimenta inbox editorial com chat geral, avatares, ultima mensagem, horario e unread reais. Match IDs, realtime e navegacao nao mudam.

## Perfil

`PerfilPage` continua proprietaria de queries, upload, edicao, preferencias, decoracoes, moedas, presentes, conquistas e staff. A fase aplica uma identidade premium clara, avatar circular, progresso separado, tabs consistentes e acesso real a conta, verificacao, bloqueados e suporte sem remover controles.

## Regra comum

O novo frame aparece somente com Native Shell ativa e `VITE_FF_TOTAL_REDESIGN=true`. Focused chats continuam no shell especializado atual e ficam fora da composicao profunda desta fase.

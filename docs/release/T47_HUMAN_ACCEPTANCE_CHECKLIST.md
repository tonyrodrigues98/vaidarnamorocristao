# T47 human acceptance checklist

Todos os itens abaixo permanecem abertos até execução humana documentada. O harness visual não substitui estes testes.

## iPhone, Safari e PWA

- [ ] Instalar a PWA pelo Safari e confirmar ícone, splash, standalone e primeira abertura.
- [ ] Entrar, sair e trocar de conta sem dados privados residuais.
- [ ] Concluir onboarding e aprovação com uma conta controlada.
- [ ] Validar Início, Comunidade, Explorar, Conversas e Perfil.
- [ ] Abrir/fechar teclado real em input, textarea, select e contenteditable.
- [ ] Confirmar top bar visível, bottom navigation oculta e composer descoberto.
- [ ] Rotacionar portrait/landscape sem sobreposição ou perda de estado.
- [ ] Validar light, dark e preferência system.
- [ ] Capturar e enviar foto pela câmera; substituir e remover conforme os fluxos reais.
- [ ] Validar fotos públicas, mídia privada e signed URLs em conta de teste.
- [ ] Validar Meu Pet, cuidado, progressão e imagens sem deformação.
- [ ] Validar inbox, chat privado, chat geral, realtime, retry e offline.
- [ ] Autorizar, receber e abrir push real.
- [ ] Validar offline, retorno online e atualização do service worker.

## Android, Chrome e PWA

- [ ] Instalar a PWA e confirmar ícone, splash, standalone e atualização.
- [ ] Repetir login, onboarding, cinco abas e troca de conta.
- [ ] Repetir teclado, rotação, dark/system, câmera, upload, Pet, chat, push e offline.
- [ ] Validar back físico/browser e retorno ao app sem estado corrompido.

## Desktop

- [ ] Chrome: sidebar, navegação, dialogs, sheets e tabelas administrativas.
- [ ] Safari/WebKit: shell, formulários, mídia, safe areas aplicáveis e chats.
- [ ] Firefox: shell, navegação, formulários, PWA quando suportado e fallbacks.
- [ ] Navegação integral por teclado, foco visível, Escape e restauração de foco.
- [ ] Zoom 200% sem perda de conteúdo ou ações.
- [ ] Claro/escuro em resoluções de tablet e desktop.

## Supabase real controlado

Usar apenas projeto/contas de teste autorizados e dados reversíveis.

- [ ] Usuário novo, onboarding e status pending.
- [ ] Usuário approved, rejected e banned.
- [ ] Moderador, apresentador, admin e super_admin.
- [ ] Acesso direto permitido/negado às 13 rotas administrativas.
- [ ] Mensagens privadas e comunitárias, paginação, realtime, edit/delete/reply/read.
- [ ] Upload público e privado, ownership, MIME, tamanho, signed URL e expiração.
- [ ] Verificação: upload privado, pending, more_info, approved e rejected.
- [ ] Suporte: chamado, anexos, realtime, status e resposta staff.
- [ ] Economia: compra/equipar/remover, saldo, ledger e reversão em conta de teste.
- [ ] Pets: criação, cuidado, timers, progressão, expedição, Arcade e recompensas.
- [ ] Notificações: mark read, mark all, delete, undo, push e deep link.
- [ ] Reverter ou limpar todas as mutações destrutivas da conta de teste.

## Operação e resiliência

- [ ] Confirmar backup recente, integridade, local seguro e ensaio de restauração.
- [ ] Confirmar preservação dos objetos de Storage.
- [ ] Configurar/confirmar observabilidade, logs sanitizados e alertas externos.
- [ ] Definir responsáveis e janela de monitoramento do canário.
- [ ] Confirmar runbook de rollback e acesso operacional.
- [ ] Executar cenário de rede instável e perda/retorno de conexão.

## Jurídico e produto

- [ ] Resolver `REQUIRES_HUMAN_LEGAL_REVIEW` em `docs/legal/terms-product-consistency-audit.md`.
- [ ] Revisar Termos, privacidade, retenção, moderação, conteúdo e direitos autorais.
- [ ] Antonio validar visualmente as superfícies críticas em aparelhos reais.
- [ ] Registrar P2 aceitos ou corrigidos: imagem pública ausente e comportamento da rota 404.
- [ ] Obter autorização explícita e separada para o corte de produção.

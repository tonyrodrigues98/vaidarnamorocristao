# V2-016 — Economia, loja e inventário

## Objetivo e estado

A V2-016 cria uma autoridade estreita para a experiência V2 de economia sem
substituir os contratos atômicos já existentes. A rota `/v2/loja` só monta o
novo hub quando `VITE_FF_V2_ECONOMY` tem o valor exato `true` e a identidade
canônica possui a capability `economy`. A rota `/loja`, seus componentes,
catálogos, saldos, históricos e inventários continuam preservados.

A migration `20260723000011_v2_economy_authority.sql` é aditiva e **não foi
aplicada**. O estado do Supabase publicado continua não verificado; rollout
exige snapshot autenticado e ambiente descartável.

## Autoridade e fluxo de comandos

O frontend envia somente intenção, identificador do item e uma chave UUID
criptograficamente segura. Preço, catálogo ativo, propriedade, slot, saldo e
entrega são validados no servidor. `economy_commands_v2` serializa cada comando
por `(actor_id, idempotency_key)`, mantém recibo e rejeita o reuso da chave com
outro significado.

Compras V2 envolvem as RPCs atômicas preservadas:

| Intenção V2           | Autoridade preservada                                      | Fonte do preço/propriedade                                    |
| --------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| frame, aura, sticker  | `purchase_decoration` / `equip_decoration`                 | `avatar_decorations` / `user_decorations`                     |
| background            | `purchase_profile_background` / `equip_profile_background` | `profile_backgrounds` / `user_profile_backgrounds`            |
| name-gradient         | `purchase_name_gradient` / `equip_name_gradient`           | `name_gradients` / `user_name_gradients`                      |
| ajuste administrativo | `admin_grant_coins`                                        | papel confirmado por `has_role`, allowlist e limite de 10.000 |

O preflight da migration falha antes de criar o contrato V2 se alguma RPC
preservada não existir. As RPCs legadas não são revogadas nesta etapa porque o
aplicativo legado ainda depende delas. A contração só poderá ocorrer depois de
paridade, telemetria, reconciliação e rollback aprovados.

## Projeção de leitura e reconciliação

`get_economy_hub_v2` retorna somente dados do usuário autenticado:

- saldo de `user_coins`, XP e nível de `user_xp`;
- catálogo e propriedade das três famílias canônicas atuais;
- itens equipados nos slots já existentes do perfil;
- 50 lançamentos recentes de `coin_transactions`;
- 20 recibos V2;
- comparação semântica entre saldo materializado e último saldo do ledger;
- quantidade de itens equipados sem propriedade válida;
- contagens, sem conteúdo ou PII, das famílias preservadas.

`baseline-unverified` significa que não existe lançamento final comparável;
`investigation-required` bloqueia qualquer tentativa de “corrigir” saldo no
cliente. Nenhuma reconciliação sobrescreve dados automaticamente.

## Inventários preservados

Não houve consolidação de tabelas. Permanecem independentes:

- `user_decorations`;
- `user_profile_backgrounds`;
- `user_name_gradients`;
- `user_badges`;
- `gift_transactions`;
- `user_avatar_inventory`;
- `user_pet_backgrounds`;
- `user_pet_album_stickers`;
- inventários, compras, presentes e progressão relacionados a pets e jogos.

Itens inativos continuam visíveis no inventário projetado, mas não podem ser
comprados ou equipados. A prévia visual é local e não altera o slot equipado.

## Loja V2

`src/v2/features/economy` contém contratos puros, um único adapter Supabase e a
apresentação. O hub oferece:

- resumo de moedas, XP e nível;
- abas Loja, Inventário e Extrato;
- filtro por tipo;
- prévia segura de asset/gradiente;
- confirmação explícita para compra e equipamento;
- estados de loading, erro, vazio e feedback;
- aviso de reconciliação;
- indicação das famílias preservadas.

URLs de asset aceitam apenas caminho relativo ou HTTPS. Cores são hexadecimais
e `css_value` passa por allowlist defensiva; a UI atual não injeta `css_value`
como estilo arbitrário.

## XP, recompensas e caixas

Créditos de XP e recompensas permanecem nas capabilities server-authoritative
criadas pela V2-008; esta etapa não cria um endpoint que aceite quantidade,
origem ou metadata arbitrárias do browser.

Caixas dependentes de chance não foram redesenhadas. O gate server-only
`chance_based_boxes` nasce `false` com a versão
`legal-review-required-v1`. Não existe RPC V2 de abertura até aprovação
comercial/jurídica, política etária, odds versionadas, replay auditável e
critérios de transparência.

## Segurança, RLS e privacidade

- `economy_commands_v2` permite ao usuário somente ler seus recibos;
- escritas diretas são revogadas e ocorrem em funções `SECURITY DEFINER`;
- funções validam `auth.uid()` e usam `search_path` fixo;
- o admin é conferido no servidor, não por flag ou estado do frontend;
- erros do adapter são sanitizados;
- sessão, token, e-mail, telefone e cliente Supabase não chegam à apresentação;
- nenhuma chave privilegiada usa `VITE_`;
- nenhuma migration, RLS, policy ou dado foi aplicado ao ambiente remoto.

## Testes e gates de rollout

Os testes cobrem parsing defensivo, chave idempotente, assets/CSS seguros,
preço server-side, replay, propriedade, item inativo, slot, admin não
autorizado, limites, reconciliação, famílias preservadas, gate de caixas,
isolamento de imports, SSR e CSS escopado.

Antes de ativar a flag:

1. capturar snapshot autenticado das assinaturas, tabelas, constraints, RLS e
   grants publicados;
2. testar a migration em clone descartável com replay, concorrência, saldo
   insuficiente, preço alterado, entrega com falha e item inativo;
3. reconciliar saldo, ledger, propriedade e slots por usuário sem usar somente
   contagem de linhas;
4. validar RLS por papel;
5. observar erro, latência, conflito idempotente e divergência;
6. executar rollout por flag com capacidade de retorno imediato ao `/loja`.

## Limitações e rollback

O frontend depende das RPCs novas e só deve ser habilitado depois da migration.
O estado publicado não foi consultado. Catálogos raros e inventários adicionais
continuam preservados, mas ainda não são equipáveis pelo hub V2. Monitoramento
operacional e reconciliação em lote permanecem gates.

Rollback funcional: desligar `VITE_FF_V2_ECONOMY` e manter a rota legada.
Rollback de dados não apaga recibos nem desfaz compras legítimas. A contração
física das tabelas aditivas só é permitida depois de estabilização e retenção
auditável.

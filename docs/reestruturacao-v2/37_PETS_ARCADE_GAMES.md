# V2-017 — Pets, arcade e jogos

## Resultado

A etapa cria uma fronteira V2 para pets e um catálogo lazy do Pet Arcade sem
remover, consolidar ou alterar nenhuma estrutura legada. A rota
`/v2/meu-pet` só monta a experiência quando `VITE_FF_V2_PETS` e a capability
`pets:use` estão ativas. `/meu-pet` e `/pet-arcade` continuam sendo fallbacks
integrais.

A migration `20260723000012_v2_pets_care_authority.sql` é aditiva e local. Ela
não foi aplicada. Qualquer rollout depende de snapshot autenticado do banco
publicado, backup testado, Supabase descartável e rollback operacional.

## Evidência do legado

| Área            | Fonte observada                          | Decisão V2-017                           |
| --------------- | ---------------------------------------- | ---------------------------------------- |
| Pet clássico    | `user_pets`, `src/lib/pets.ts`           | preservar separadamente                  |
| Pet de catálogo | `user_pets_v2`, `src/lib/petCatalog.ts`  | preservar separadamente                  |
| Necessidades    | `pet_care_state`, `pet_care_config`      | projetar âncoras e usar hora do servidor |
| Cuidado         | `apply_pet_care(uuid, uuid)`             | envolver, não reimplementar              |
| Compatibilidade | `pet_care_item_compat`                   | autoridade do RPC existente              |
| Economia        | moedas, inventário de cuidado e eventos  | continuar atômica no RPC                 |
| Modificadores   | `pet_runtime_modifiers(uuid)`            | continuar server-authoritative           |
| Arcade          | `src/lib/petArcade.ts` e RPCs existentes | catálogo lazy, sem alterar rodadas       |
| Admin           | rotas e RPCs de pets/arcade existentes   | preservar capacidades                    |

O fluxo legado `createMyPetV2` apaga todas as linhas anteriores de
`user_pets_v2` antes de inserir uma nova. A V2 não importa nem chama esse fluxo.
Ele permanece um risco ativo a conter em uma etapa própria; substituí-lo agora
sem RPC publicada e reconciliada quebraria rollback e excederia este lote.

## Fronteiras

```text
V2ShellRuntimeRoute
  └─ V2PetsFeature (flag + capability)
      └─ V2PetsHub (React Query e apresentação)
          ├─ PetPlatformRepository
          │   └─ repository.ts (único adapter Supabase)
          └─ lazy(V2ArcadeCatalog)
```

O shell fornece somente `userId`. O componente não recebe sessão, tokens,
e-mail, telefone, papéis, cliente Supabase ou objetos internos de autenticação.
`contracts.ts` e a apresentação não importam Auth, router ou ambiente.

## Modelo de tempo

O banco devolve:

- `server_now`;
- `value_at_anchor`;
- `anchor_at`;
- `decay_per_hour`;
- `energy_regen_minutes_per_point`.

`derivePetNeedAtServerTime` recebe o relógio explicitamente. Necessidades comuns
decaem e energia regenera; ambas são limitadas a 0–100. Horários inválidos ou
anteriores à âncora preservam o valor ancorado. A UI não abre timer nem grava
decaimento. O RPC existente materializa a regra sob lock na próxima ação.

Isso evita:

- punição repetida após reconexão;
- confiança no relógio do aparelho;
- múltiplos timers concorrentes;
- gravação por render;
- divergência após longo período offline.

## Cuidado e idempotência

`apply_pet_care_v2(pet, item, idempotency_key)`:

1. exige `auth.uid()`;
2. valida propriedade do `user_pets_v2`;
3. valida item ativo;
4. registra a intenção única por ator e UUID;
5. bloqueia o recibo com `FOR UPDATE`;
6. rejeita reutilização do UUID com outro pet ou item;
7. retorna o resultado concluído em replay;
8. delega uma única vez para `apply_pet_care`.

O RPC preservado continua responsável por compatibilidade, limite diário,
inventário, débito, decaimento, energia, modificadores, eventos e rewards. O
browser não envia custo, restauração, chance, moedas, XP ou saldo.

## Projeção e preservação

`get_pet_platform_hub_v2` escolhe somente a instância V2 equipada/mais recente
para apresentação e retorna contagens independentes de:

- `user_pets`;
- `user_pets` equipados;
- `user_pets_v2`;
- `user_pets_v2` equipados.

Essas contagens são evidência de coexistência, não prova de equivalência.
Nenhum backfill, merge, rename ou deleção acontece. Uma unificação futura exige
mapa de ownership, equivalência semântica, reconciliação, decisão de produto,
backfill idempotente e rollback testado.

## Arcade

O manifesto tipado preserva estes 17 IDs:

`treasure`, `flight`, `plinko`, `keno`, `wheel`, `hilo`, `towers`,
`coinflip`, `race`, `memory`, `piggybank`, `dice`, `scratch`, `egg`, `album`,
`capsule` e `missions`.

Todos permanecem `awaiting-product-decision` até Antonio fornecer a lista de
jogos. Cada entrada declara versão, runtime, orientação, família de assets,
save/progresso, autoridade de reward, acessibilidade, budget, telemetria,
política offline e contrato Admin.

O bundle do catálogo é carregado somente quando a aba Arcade é selecionada. A
consulta agrega catálogo, uso do dia e histórico já existentes. O hub V2 não
inicia rodadas e aponta para `/pet-arcade` para o runtime preservado.

## Caixas, sorteios e coleções

`scratch`, `egg`, `capsule`, `album` e demais jogos de chance/coleção continuam
intactos. A V2-017:

- não altera odds;
- não altera rewards;
- não cria resultado no cliente;
- não apaga álbum, ovo, rodada, missão ou progresso;
- não cria gate jurídico fictício;
- não reclassifica assets como órfãos.

Uma superfície V2 executável para chance exige regra/odds versionadas,
resultado e recibo server-side, replay idempotente, concorrência testada,
integração econômica e decisão comercial/legal registrada.

## Acessibilidade e desempenho

- controles têm alvo mínimo herdado do Design System;
- imagens usam carregamento lazy e URL sanitizada;
- progressos possuem nome acessível;
- loading e falha usam live region/alert;
- Arcade é um chunk lazy;
- CSS é escopado em `.vdn-v2[data-vdn-v2]`;
- `prefers-reduced-motion` remove transições não essenciais;
- layout passa de uma para duas/três colunas sem overflow.

Os jogos legados ainda precisam de auditoria individual de teclado, touch,
orientação e alternativa a movimento antes de migração visual.

## Testes

Os testes cobrem:

- decay e regeneração com clock controlado;
- longo offline, clamp e data inválida;
- parser de pet, cuidado, recibo, catálogo, histórico e uso;
- UUID idempotente;
- 17 jogos presentes e sem decisão silenciosa;
- preflight, ownership, replay e ausência de SQL destrutivo;
- separação `user_pets`/`user_pets_v2`;
- capability e flag;
- SSR, lazy loading, imports e CSS;
- ausência de persistência, reward ou navegador administrativo na UI.

Validação SQL/RLS/RPC/concorrência real permanece bloqueada até existir Supabase
descartável autorizado. Nenhum teste desta etapa acessa o banco publicado.

## Ativação gradual

1. aplicar migrations anteriores e esta em Supabase descartável;
2. validar preflight contra snapshot compatível;
3. testar dois comandos concorrentes e replay;
4. reconciliar eventos, moeda e inventário antes/depois;
5. testar RLS por proprietário e atacante;
6. observar erro, latência e duplicidade;
7. ativar `VITE_FF_V2_PETS=true` apenas em ambiente isolado;
8. liberar coorte interna;
9. manter rotas legadas até paridade por jogo e por pet.

## Rollback

O rollback de produto desliga `VITE_FF_V2_PETS`. Isso restaura o placeholder V2
e mantém `/meu-pet` e `/pet-arcade`. Não se deve reverter cuidado, moeda,
inventário, rodada ou reward legítimos já confirmados. A contração da tabela de
recibos e dos RPCs só é permitida após estabilização e comprovação de que não
há consumidores.

## Limitações e próximos passos

- estado publicado não foi consultado;
- migration não foi aplicada;
- Admin ainda usa superfícies legadas;
- V2 não cria nem substitui pet;
- V2 não executa jogos;
- progressão, missões e assets continuam nos módulos preservados;
- o fluxo destrutivo `createMyPetV2` exige contenção própria;
- a lista de jogos a remover ainda depende de decisão explícita de Antonio.

O próximo lote pode tratar notificações/PWA de forma transversal, mantendo
pets e arcade fechados até os testes de banco e as decisões de produto.

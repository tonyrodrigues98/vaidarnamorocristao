# V2-013 — Perfil comunitário modular

## Resultado e fronteiras

`/v2/perfil` passa a montar um perfil comunitário modular somente quando
`VITE_FF_V2_PROFILE=true`. O perfil legado, as fotos, os itens equipados, os
inventários, os presentes, as conquistas, os pets e os dados românticos
permanecem nas suas fontes atuais. Nenhuma migration deste lote foi aplicada.

A apresentação recebe apenas `userId`, `profileUserId` e um repositório tipado.
Supabase está isolado em `repository.ts`; autenticação, sessão, router, saldo e
objetos completos de perfil não atravessam a fronteira visual.

## Contrato modular

Os onze módulos possuem ordem linear, visibilidade e audiência:

| Módulo                 | Padrão  | Audiência inicial |
| ---------------------- | ------- | ----------------- |
| Sobre mim              | visível | comunidade        |
| Minha fé               | visível | comunidade        |
| Favoritos              | visível | conexões          |
| Galeria                | visível | conexões          |
| Conquistas             | visível | conexões          |
| Presentes              | visível | conexões          |
| Pet em destaque        | visível | conexões          |
| Versículos/devocionais | visível | conexões          |
| Comunidades/eventos    | visível | conexões          |
| Coleções               | visível | conexões          |
| Relacionamento         | oculto  | somente eu        |

O editor oferece subir/descer, ocultar/mostrar, audiência, restaurar padrão,
salvar e cancelar. A alternativa por botões é o contrato acessível canônico;
drag-and-drop não é requisito para operar o editor. A escrita usa timestamp
esperado e falha em conflito, sem sobrescrever silenciosamente outra sessão.

## Dados e privacidade

A migration aditiva `20260723000008_v2_modular_profiles.sql` define:

- `profile_modules_v2`, apenas para configuração de apresentação;
- uma RPC de leitura que exige identidade comunitária aprovada, aplica bloqueio
  bilateral e filtra audiência no servidor;
- uma RPC de escrita owner-only com conjunto completo, ordem única e
  concorrência otimista;
- defaults calculados quando ainda não existem linhas de configuração.

O perfil comunitário não lê nem retorna preferências românticas. A vitrine de
relacionamento só pode ser habilitada quando o Namoro está ativo e permanece
visível apenas ao próprio usuário nesta etapa. Isso é deliberadamente mais
restritivo do que a visão futura e impede pistas românticas no contexto social.

Presença detalhada é limitada ao owner e às conexões. Galeria pública contém no
máximo doze fotos verificadas; o owner pode revisar suas próprias fotos ainda
não verificadas. URLs recebidas pelo cliente aceitam apenas caminhos internos
ou HTTPS e rejeitam `javascript:`, `data:`, HTTP e URLs protocol-relative.

## Inventário como autoridade

Fundo, moldura, aura e gradiente do nome só entram no payload quando:

1. o ID está equipado em `profiles`;
2. há uma linha correspondente no inventário do mesmo usuário;
3. o item de catálogo continua ativo.

O perfil não cria, compra, concede nem copia itens. Presentes, conquistas e o
pet equipado são agregados das tabelas existentes. `user_pets` e
`user_pets_v2` não são consolidados nem alterados.

## Interface

- hero responsivo com fundo, foto, moldura, aura, nome e presença;
- módulos em uma coluna no mobile e duas quando houver largura;
- editor como folha inferior no mobile e painel lateral sticky no desktop;
- controles de pelo menos 44 px, select com 16 px e safe area inferior;
- estados de loading, erro, vazio, conflito e feedback acessível;
- estilos escopados por `.vdn-v2[data-vdn-v2]`;
- reduced motion sem animação obrigatória.

## Migração, rollout e rollback

Antes de qualquer ativação:

1. capturar snapshot autenticado do schema publicado;
2. aplicar a migration em Supabase descartável;
3. validar RPCs/RLS por owner, visitante, conexão, bloqueado e usuário restrito;
4. reconciliar fotos, propriedade de itens, presentes, conquistas e pets;
5. testar troca de ordem concorrente e payloads malformados;
6. ativar a flag somente para coorte interna;
7. comparar paridade e acessibilidade com o perfil legado.

Rollback de frontend é desligar `VITE_FF_V2_PROFILE`. A estrutura aditiva deve
permanecer em quarentena se já tiver recebido configuração legítima; rollback
não apaga linhas, fotos, itens ou histórico. A rota legada só poderá ser
ocultada após paridade comprovada.

## Limitações e próximos gates

- O estado publicado não foi consultado e a migration não foi executada.
- Audiências por campo ainda usam a política existente do perfil; esta etapa
  aplica audiência por módulo.
- Favoritos, versos, comunidades e coleções possuem contrato e empty state, mas
  dependem das respectivas integrações verticais futuras.
- Edição de bio, foto e capa continua nas rotas legadas; o editor V2 organiza
  somente vitrines.
- Visitas de perfil não são coletadas nesta etapa.
- Um perfil de visitante por URL própria fica preparado pelo contrato
  `profileUserId`, mas a primeira integração expõe somente o perfil do owner.

## Validação

Os testes determinísticos cobrem normalização e reordenação, audiência,
imutabilidade, sanitização de payload e mídia, SSR, feature flag, isolamento
CSS/imports, privacidade server-side, bloqueios, ownership de inventário, fotos
verificadas, pet visível, ausência de preferências românticas, concorrência
otimista e natureza aditiva. Nenhum teste acessa Supabase.

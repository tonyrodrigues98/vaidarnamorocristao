# V2-013 — Perfil modular, expressivo e configurável

## Objetivo

Reconstruir o Perfil como espaço de identidade pessoal e comunitária, altamente
customizável, sem misturar regras de Namoro, economia, inventário e Admin na
rota.

## Princípios

- uma pessoa, várias renderizações contextuais;
- perfil comunitário é padrão;
- perfil romântico existe somente dentro do Namoro;
- perfil do casal é do Propósito;
- badge de staff não concede acesso;
- inventário prova propriedade;
- privacidade é aplicada na fonte de dados;
- personalização não quebra acessibilidade.

## Estrutura visual

- capa/fundo;
- foto decorada;
- nome, identificador e presença;
- frase/bio/testemunho;
- fé e interesses;
- status;
- vitrines;
- galeria/destaques;
- conquistas;
- pet em destaque;
- presentes;
- conteúdo favorito;
- atividade comunitária selecionada;
- controles de privacidade.

## Vitrines

Preparar módulos:

- Sobre mim;
- Minha fé;
- Favoritos;
- Galeria;
- Conquistas;
- Presentes;
- Pet;
- Versículos/devocionais;
- Comunidades/eventos;
- coleções;
- relacionamento somente se escolhido.

Requisitos:

- tipos/versionamento;
- ordem linear canônica;
- drag com alternativa por botões/teclado;
- esconder/mostrar;
- audiência por módulo;
- preview;
- restaurar padrão;
- limites definidos por capability/config, não hardcode visual.

## Editor

Desktop:

- perfil permanece visível;
- painel lateral contextual;
- preview imediato;
- salvar/cancelar/desfazer.

Mobile:

- transição lateral/tela contextual;
- continuidade;
- teclado/safe area;
- ações sticky sem sobreposição;
- zero zoom involuntário.

## Dados e adapters

Extrair da rota:

- leitura de identidade;
- fotos/galeria;
- preferências;
- aparência equipada;
- vitrines;
- presentes/conquistas/pet;
- métricas/visitas conforme consentimento;
- apresentação romântica.

Não duplicar saldo ou inventário no perfil.

## Privacidade

- audiência por campo e vitrine;
- perfil comunitário não revela preferências românticas;
- Namoro off deixa zero pistas;
- bloqueio global;
- preview público não vaza módulos privados;
- visitas somente conforme consentimento;
- localização com granularidade segura.

## Avatar-personagem

- não criar novas dependências;
- não reintroduzir personagem como foto;
- preservar `avatar_url` quando significar foto;
- preservar `DecoratedAvatar`, moderação e decorações legítimas;
- esconder personagem apenas no lote de retirada após inventário/compensação.

## Design

Inspiração Steam = liberdade, capa, vitrines e coleções. Não copiar tema,
layout ou marca. Manter identidade premium, leve e legível.

## Testes

- perfil simples/premium/staff;
- Namoro off/on;
- comprometido;
- owner/visitante/bloqueado;
- módulo privado;
- equipar item não possuído;
- reorder teclado/touch;
- save/retry/conflict;
- foto/moderação;
- decoração e contraste;
- mobile/desktop;
- cache/offline;
- performance com muitas vitrines.

## Critérios de conclusão

- rota fina;
- módulos reais;
- editor contextual;
- privacidade server-side;
- inventário como autoridade;
- nenhuma perda de item/foto;
- nenhuma pista romântica com modo off;
- acessibilidade e responsividade;
- flag/rollback e paridade.

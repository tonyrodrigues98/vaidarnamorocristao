## Objetivo

Inserir 11 novas personalidades em `pet_personalities`, cada uma com nome, slug, descrição curta e uma imagem com a mesma linguagem visual das atuais (Carinhoso, Brincalhão, Calmo, Curioso, Energético). Bônus/efeitos ficam para o próximo prompt — esta etapa só adiciona os registros base.

## Lista (ordem proposta a partir de sort_order = 6)

| # | Nome | Slug | Descrição curta |
|---|------|------|------|
| 6 | Guloso | guloso | Vive com fome, ama hora da comida |
| 7 | Preguiçoso | preguicoso | Dorminhoco profissional |
| 8 | Tímido | timido | Reservado, abre o coração devagar |
| 9 | Sábio | sabio | Antigo, observador, paciente |
| 10 | Travesso | travesso | Apronta sem parar |
| 11 | Sensível | sensivel | Sente tudo intensamente |
| 12 | Aventureiro | aventureiro | Vive em expedição |
| 13 | Devoto | devoto | Fiel ao dono, presença constante |
| 14 | Noturno | noturno | Acorda quando o mundo dorme |
| 15 | Resiliente | resiliente | Aguenta firme qualquer coisa |
| 16 | Carente | carente | Pede colo o tempo todo |

(Sem "Glutão Disciplinado" conforme solicitado.)

## Pipeline visual

1. Baixar via signed URL 2 das imagens atuais (`Carinhoso` e `Brincalhão`) do bucket `pets` para análise — definir paleta, enquadramento, traço e fundo.
2. Para cada nova personalidade, gerar PNG com `imagegen` (modelo `standard`) usando um prompt-template fixo que herda: mesmo formato/enquadramento, mesmo tratamento de fundo, mesma paleta-base, mascote estilizado expressando o traço. Apenas a expressão/pose/acessório muda — nome da personalidade guia a leitura (ex.: Noturno → tons de azul/lua; Sábio → óculos/livro; Travesso → sorriso maroto).
3. Upload de cada PNG para `pets/catalog/pet_personalities/<uuid>.png` via `supabase--storage_upload`.
4. `INSERT` em `pet_personalities` (name, slug, description, image_url=`catalog/pet_personalities/<uuid>.png`, sort_order, active=true) via `supabase--insert` — formato igual ao das linhas atuais que não usam URL absoluta.

## Detalhes técnicos

- Slug em snake_case ASCII (mesmo padrão das atuais).
- `image_url` salvo como caminho relativo dentro do bucket (igual a Carinhoso/Brincalhão), porque `petCatalog.hydrateImage` já resolve via `resolvePetImage`.
- Nada de mudança em código TS — só inserts + assets. Não mexer em efeitos (`pet_personality_effects`) nesta etapa.

## QA após inserir

- `SELECT name, slug, sort_order, image_url FROM pet_personalities ORDER BY sort_order` para confirmar 16 linhas ativas.
- Conferir no admin (`/admin/pets`) se todas aparecem com thumbnail carregando.

## Próximo prompt

Discutiremos e implementaremos os efeitos/bônus (linhas em `pet_personality_effects`) para essas 11.

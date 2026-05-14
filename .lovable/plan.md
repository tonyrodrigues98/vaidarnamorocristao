## Objetivo

Bloquear upload de fotos que não sejam pessoas reais (desenhos, animais, memes, logos, prints, paisagens) usando duas camadas **gratuitas**:

1. **face-api.js** no navegador (rápido, custo zero, detecta presença de exatamente 1 rosto humano).
2. **Lovable AI Gateway** com `google/gemini-2.5-flash` no servidor (valida que é foto real de humano, não desenho/animal/meme/print).

Sucesso esperado: ~90–95% de bloqueio de fotos inválidas, sem precisar pedir cartão ou API key ao usuário.

---

## Fluxo do upload

```text
Usuário escolhe foto
   │
   ▼
[1] face-api.js (client)         → 0 rostos OU >1 rostos → bloqueia com mensagem clara
   │ exatamente 1 rosto
   ▼
[2] Server fn verifyProfilePhoto → Gemini 2.5 Flash analisa
   │   { is_human, is_real_photo, has_single_face, confidence, reason }
   │ confidence >= 0.7 e tudo true → aprova
   │ confidence < 0.7 ou alguma flag false → bloqueia
   ▼
[3] Upload no Storage + insere registro
   │ marca ai_verified=true, ai_confidence, ai_reason
   ▼
Casos duvidosos (0.5–0.7) → fila /admin/verificacoes para revisão manual
```

---

## Mudanças

### Banco
Migration nova:
- Adiciona em `profiles`: `avatar_ai_verified boolean default false`, `avatar_ai_confidence numeric`, `avatar_ai_checked_at timestamptz`.
- Adiciona em `profile_photos`: mesmas 3 colunas.
- Cria tabela `photo_moderation_queue` (id, user_id, photo_url, scope `'avatar'|'extra'`, photo_id nullable, ai_result jsonb, status `pending|approved|rejected`, reviewed_by, reviewed_at, created_at) com RLS: usuário vê apenas as próprias; admins (via `has_role`) leem/atualizam todas.

### face-api.js (client)
- `bun add face-api.js`.
- Modelos `tiny_face_detector` hospedados em `public/models/` (download once, ~190KB).
- `src/lib/faceDetection.ts`:
  - `detectFaceInImage(file: File): Promise<{ count: number }>` carregando o modelo lazy uma vez.
- Mensagens:
  - `count === 0` → "Não detectamos um rosto na foto. Envie uma foto sua bem iluminada."
  - `count > 1` → "Envie uma foto somente com você."

### Lovable AI (server)
- `src/lib/photoVerification.functions.ts`:
  - `createServerFn({ method: "POST" })` com `requireSupabaseAuth`.
  - Input: `{ imageBase64: string, mimeType: string }` (Zod, max ~6MB base64).
  - Handler: chama `https://ai.gateway.lovable.dev/v1/chat/completions` com `google/gemini-2.5-flash`, mensagem multimodal e `response_format: json_object`. System prompt em PT-BR exigindo JSON `{ is_human, is_real_photo, has_single_face, confidence (0-1), reason }`.
  - Trata 429 (créditos do gateway esgotados) e 402 → retorna `{ ok: false, soft: true }` para **não bloquear** o usuário em caso de indisponibilidade.
  - Retorna `{ approved: boolean, needsReview: boolean, result }`.

### Integração nos 3 pontos de upload
Arquivos: `src/routes/onboarding/etapa-1.tsx`, `src/routes/perfil.tsx`, `src/components/ProfilePhotosManager.tsx`.

Função utilitária `src/lib/verifyAndUpload.ts`:
1. `detectFaceInImage(file)` → bloqueia se !=1.
2. Lê arquivo → base64, chama `verifyProfilePhoto` via `useServerFn`.
3. Se `approved` → segue upload normal e grava `ai_verified=true, ai_confidence`.
4. Se `needsReview` → upload segue, mas insere em `photo_moderation_queue` com `status='pending'` e mostra toast "Foto em análise".
5. Se rejeitado → `toast.error(result.reason)` e cancela.
6. Se `soft` (gateway indisponível) → segue upload sem bloquear, marca `ai_verified=false`.

UI: spinner "Verificando foto..." durante as duas etapas.

### Painel admin
- `src/routes/admin/verificacoes.tsx` (já existe) ganha aba "Fotos pendentes" listando `photo_moderation_queue` com preview, motivo da IA e botões Aprovar/Rejeitar (atualiza status; se rejeitado, deleta a foto do storage e do registro).

---

## Detalhes técnicos

- **Modelo Gemini**: `google/gemini-2.5-flash` (multimodal, baixo custo, incluso no Lovable AI Gateway).
- **Bundle**: face-api.js é ~700KB. Importar dinâmico (`await import("face-api.js")`) só no momento do upload pra não pesar a home.
- **Modelos face-api**: baixar `tiny_face_detector_model-weights_manifest.json` + shard de `https://github.com/justadudewhohacks/face-api.js-models` e salvar em `public/models/`.
- **Sem segredo extra**: `LOVABLE_API_KEY` já está disponível em `process.env` no servidor.
- **Privacidade**: imagem trafega só para o gateway durante a verificação; nada é persistido fora do nosso Storage.
- **Custos**: dentro do crédito gratuito do Lovable AI; cada verificação ≈ 1 chamada multimodal pequena.

---

## Entregáveis
- 1 migration (colunas + tabela de fila + RLS).
- `src/lib/faceDetection.ts`, `src/lib/photoVerification.functions.ts`, `src/lib/verifyAndUpload.ts`.
- `public/models/*` (face-api).
- Edição de `onboarding/etapa-1.tsx`, `perfil.tsx`, `ProfilePhotosManager.tsx`.
- Aba nova em `admin/verificacoes.tsx`.
- `bun add face-api.js`.

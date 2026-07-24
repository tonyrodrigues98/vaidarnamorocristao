# Matriz de dispositivos e navegadores

## Regra de evidência

“Físico” exige hardware real e captura identificável. Viewport em Chromium é
**emulação**, não iPhone/Android real. Este ambiente dispõe apenas do navegador
Chromium integrado; Safari iOS/macOS e instalação PWA móvel permanecem
bloqueados.

## Resultados em 24 de julho de 2026

| Plataforma | Navegador | Modo              | Estado           | Evidência                                         |
| ---------- | --------- | ----------------- | ---------------- | ------------------------------------------------- |
| iPhone/iOS | Safari    | físico + PWA      | não testado      | hardware indisponível                             |
| Android    | Chrome    | físico + PWA      | não testado      | hardware indisponível                             |
| Windows    | Chromium  | local             | parcial          | página pública e autenticação, sem Supabase local |
| Windows    | Edge      | físico local      | não testado      | runtime não selecionado                           |
| macOS      | Safari    | físico            | não testado      | host indisponível                                 |
| desktop    | Firefox   | compatibilidade   | não testado      | runtime indisponível                              |
| 390×844    | Chromium  | emulação viewport | aprovado parcial | sem overflow; login/signup 16 px; captura visual  |
| 768×1024   | Chromium  | emulação viewport | aprovado parcial | página pública sem overflow horizontal            |
| 1024×768   | Chromium  | emulação viewport | aprovado parcial | página pública sem overflow horizontal            |
| 1440×900   | Chromium  | emulação viewport | aprovado parcial | página pública sem overflow horizontal            |

Nos quatro viewports, `scrollWidth === clientWidth` na página pública e foram
encontrados 23 controles focáveis. Em 390×844, os campos de e-mail e senha do
login e do cadastro reportaram `font-size: 16px`, impedindo o zoom automático
conceitual do iOS.

O smoke autenticado não foi declarado aprovado: sem as variáveis locais do
Supabase, `/v2` e `/inicio` chegam corretamente ao boundary, que apresenta erro
controlado em vez de conteúdo privado. Login, upload, offline, PWA instalada,
troca de conta e fluxos de dados exigem o ambiente descartável ou hardware real.

## Checklist por execução física futura

- portrait/landscape, zoom 200%, teclado e foco;
- safe areas e bottom navigation;
- inputs ≥16 px e targets ≥44 px;
- claro/escuro e reduced motion;
- cache frio/aquecido, offline/reconexão e update do SW;
- logout/troca de conta sem mídia/cache privado;
- cadastro/login/onboarding;
- perfil/upload/configurações;
- Início/Comunidade/Conversas/Namoro;
- bloqueio/denúncia/notificações;
- Loja/Pets/Verbo/Cinema/Admin;
- back/forward/deep link e rota inexistente.

Cada achado deve registrar plataforma, versão, resolução, fluxo, esperado,
encontrado, severidade, evidência, correção e reteste.

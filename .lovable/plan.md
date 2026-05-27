# Implementação — Ambientação Dinâmica por Horário

Escopo confirmado pelo usuário:
- **Páginas**: plano completo (`/inicio` alta, `/devocional` média, `/comunidade` e `/perfil` baixa)
- **Ícones celestiais**: SVGs no estilo da lua atual (minimalista, inline, <2KB cada)

---

## Arquitetura

```text
src/lib/timeOfDay.ts
  └─ getPeriod(date?): 'morning' | 'afternoon' | 'evening' | 'night'
       faixas: 5–11 / 12–17 / 18–23 / 0–4

src/hooks/useTimeOfDay.ts
  └─ aplica data-period="..." no <html>, recalcula a cada 60s
  └─ respeita toggle do usuário (localStorage 'atmos-mode')

src/components/atmosphere/AtmosphereLayer.tsx
  └─ props: intensity = 'low' | 'medium' | 'high'
  └─ pointer-events: none, aria-hidden, fixed inset-0 ou absolute na seção
  └─ alta: overlay + glow + ícone celestial + partículas
  └─ média: overlay + glow + partículas (sem celestial)
  └─ baixa: só overlay + glow leve

src/components/atmosphere/CelestialIcon.tsx
  └─ SVG inline, troca por período (sol-baixo / sol-alto / lua-cheia / lua-crescente)
  └─ reaproveita a lua que já existe em /inicio

src/components/atmosphere/Particles.tsx
  └─ 4–6 nodes SVG com @keyframes (transform + opacity apenas)
  └─ tipo varia por período (motas douradas / nada / pontos quentes / estrelas)
  └─ respeita prefers-reduced-motion (não renderiza)
```

## Tokens em `src/styles.css`

```css
:root { --atmos-overlay: transparent; --atmos-glow: transparent; }
:root[data-period="morning"]   { --atmos-overlay: ...; --atmos-glow: ...; }
:root[data-period="afternoon"] { --atmos-overlay: ...; --atmos-glow: ...; }
:root[data-period="evening"]   { --atmos-overlay: ...; --atmos-glow: ...; }
:root[data-period="night"]     { --atmos-overlay: ...; --atmos-glow: ...; }
/* todos <8% de opacidade — só atmosfera, nunca substitui cor de marca */

* { transition: background-color 60s ease, box-shadow 60s ease; }
/* aplicado só nas camadas atmosféricas, não global */
```

Paletas (oklch, ainda a calibrar visualmente):
- Manhã: dourado pálido + pêssego
- Tarde: perolado quase neutro (estado base)
- Noite: índigo suave + violeta esfumaçado
- Madrugada: lavanda → pêssego desbotado (igual ao atual)

## Aplicação por página

| Rota | Componente | Intensidade |
|---|---|---|
| `src/routes/inicio.tsx` | `<AtmosphereLayer intensity="high" />` dentro do hero existente, substitui a lua atual pelo `<CelestialIcon />` | Alta |
| `src/routes/devocional.tsx` | `<AtmosphereLayer intensity="medium" />` no topo da seção principal | Média |
| `src/routes/comunidade.tsx` | `<AtmosphereLayer intensity="low" />` no container, **sem partículas** (não atrapalha chat) | Baixa |
| `src/routes/perfil.tsx` | `<AtmosphereLayer intensity="low" />` no header do perfil | Baixa |
| Demais rotas | nada | — |

O hook `useTimeOfDay` roda no `__root.tsx` uma vez — globalmente sincroniza o `data-period`.

## Controle do usuário

- Toggle em **Configurações** (`/conta` ou similar): "Ambiente dinâmico" → `on` / `cores-only` / `off`.
  - `on`: tudo (overlay + glow + celestial + partículas)
  - `cores-only`: só overlay + glow (sem animação)
  - `off`: desliga total
- Persistido em `localStorage` (`atmos-mode`).
- Default: `on`.
- `prefers-reduced-motion` força comportamento equivalente a `cores-only`.

## Performance

- 1 timer global recalcula período a cada 60s. CSS faz o resto via `data-period`.
- Partículas: 4–6 SVG nodes com `@keyframes` de 8–12s, só `transform` + `opacity` (GPU).
- Celestiais: 4 SVGs inline (<2KB cada), nenhum request.
- Transições atmosféricas: 60s ease (imperceptível, sem flash).
- Zero biblioteca nova. Reutiliza Framer Motion já presente para fade-in inicial das partículas.

## Roadmap de execução (em ordem, num único build)

1. Criar `src/lib/timeOfDay.ts` + `src/hooks/useTimeOfDay.ts`.
2. Adicionar tokens `--atmos-*` em `src/styles.css` para os 4 períodos.
3. Criar `src/components/atmosphere/` com `AtmosphereLayer`, `CelestialIcon`, `Particles`.
4. Registrar `useTimeOfDay()` no `__root.tsx`.
5. Aplicar `<AtmosphereLayer />` nas 4 rotas com a intensidade definida.
6. Trocar a lua atual do `/inicio` pelo `<CelestialIcon />` dinâmico.
7. Adicionar toggle em Configurações (`/conta`).
8. QA visual nos 4 períodos (forçando `data-period` manualmente para validar sem esperar o relógio).

## O que NÃO será tocado

- Cores de marca, logo, gradiente do CTA "Ver pretendentes".
- Tipografia, layout, espaçamento, raios.
- Conteúdo do usuário (fotos, mensagens, cards de perfil).
- Rotas: `/matches`, conversas privadas, onboarding, auth, admin.

## Riscos & mitigações

- **Risco**: usuário em fuso diferente vê período errado → sempre `new Date()` local do browser, nunca server.
- **Risco**: partícula distrai no chat → `intensity="low"` em `/comunidade` já exclui partículas por design.
- **Risco**: SSR/hydration mismatch (Date no server ≠ client) → hook só lê `Date` em `useEffect`, default neutro no SSR.

Pronto para construir quando o usuário confirmar.
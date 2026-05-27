# Preview manual de períodos da atmosfera

Objetivo: permitir que você visualize ao vivo como ficam manhã, tarde, noite e madrugada, sem mexer na hora do dispositivo nem na lógica automática.

## Como vai funcionar

- A hora real continua sendo a fonte padrão (nada muda para usuários finais).
- Em `/conta`, no card do `AtmosphereToggle`, adiciono um segundo controle: **"Visualizar período"** com 5 opções: `Automático (real)`, `Manhã`, `Tarde`, `Noite`, `Madrugada`.
- Ao escolher um período, todo o app passa a renderizar como se fosse aquele horário (sky, glow, partículas, ícone celestial, acentos roxos da madrugada — tudo).
- Ao escolher `Automático`, volta a seguir a hora real.
- A preferência é salva em `localStorage` (`atmos-period-override`) para você navegar entre páginas mantendo o preview.

## Mudanças técnicas

1. **`src/lib/timeOfDay.ts`**
   - Adicionar `getPeriodOverride()` / `setPeriodOverride(p | null)` (localStorage `atmos-period-override`).
   - Disparar evento `atmos-period-change` no set.

2. **`src/hooks/useTimeOfDay.ts`**
   - No `apply()`, se houver override, usar ele em vez de `getPeriod()`.
   - Escutar `atmos-period-change` além dos eventos já existentes.

3. **`src/components/atmosphere/AtmosphereToggle.tsx`**
   - Adicionar um grupo de botões/segmented control com as 5 opções.
   - Marcador visual sutil (ex.: badge "preview ativo") quando não está em Automático.

Nenhuma outra página é alterada — o efeito é puramente visual, controlado pelo atributo `data-period` no `<html>` que o resto do CSS já consome.

## O que NÃO muda

- `getPeriod()` (lógica por hora) permanece intacta.
- CSS/cores/partículas/ícone celestial: nenhuma alteração.
- Comportamento padrão para qualquer usuário sem override: idêntico ao atual.
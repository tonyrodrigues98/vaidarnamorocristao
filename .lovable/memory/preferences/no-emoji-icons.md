---
name: Sem emojis na UI
description: Regra universal — sempre usar lucide-react icons no lugar de emojis em qualquer texto/UI
type: preference
---
NUNCA usar emojis (😍😊🍪🥺 etc) em textos, badges, toasts, headers ou qualquer UI do projeto.
Sempre substituir por ícones lucide-react com `className="size-4"` (ajustar conforme contexto) e cor via tokens semânticos.
**Why:** Identidade visual do projeto é minimalista com lucide; emojis quebram consistência e renderizam diferente entre OS.
**How to apply:** Ao criar mensagens dinâmicas tipo "pet está feliz", mapear cada estado para um `LucideIcon` e renderizar `<Icon className="size-4" />` ao lado do texto.
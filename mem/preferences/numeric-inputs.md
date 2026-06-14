---
name: Inputs numéricos sem spinner
description: Todo input que aceita números deve ser type="text" com inputMode, nunca type="number"
type: preference
---
Nunca usar `<Input type="number">` — as setinhas bloqueiam digitação no celular em alguns teclados.

**Como aplicar:**
- Inteiros: `type="text" inputMode="numeric"` (opcional `pattern="[0-9]*"`)
- Decimais: `type="text" inputMode="decimal"`
- A validação/conversão fica no `onChange` (já existente: `Number(e.target.value)` ou `parseInt`).
- Remover `step`, `min`, `max` HTML — não funcionam em text; validar no handler.

**Why:** `type="number"` no mobile mostra teclado com spinner e em alguns Androids/iOS bloqueia ou não permite digitação fluida. Texto + inputMode mostra teclado numérico nativo sem spinner.
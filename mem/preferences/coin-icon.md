---
name: Ícone de moeda unificado
description: Sempre usar CoinIcon (mesma do saldo) em qualquer exibição de coins; nunca lucide Coins nem emoji
type: preference
---

Para qualquer valor em moedas (missões, lojas, presentes, recompensas, fundos, etc.), usar `<CoinIcon className="..." />` de `@/components/icons/CoinIcon`. Nunca usar `Coins` do `lucide-react` nem emojis 🪙/💰. **How to apply:** ao introduzir um novo lugar que mostre coins, importar `CoinIcon` e seguir o mesmo padrão do `CoinsCard`/`SaldoTab`.

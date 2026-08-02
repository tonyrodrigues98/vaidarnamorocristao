import type { LucideIcon } from "lucide-react";

import { CoinIcon } from "@/components/icons/CoinIcon";

export type NativeStoreCategory<Key extends string> = {
  key: Key;
  label: string;
  icon: LucideIcon;
};

export type NativeStoreHeaderProps<Key extends string> = {
  balance: number;
  balanceKnown: boolean;
  categories: readonly NativeStoreCategory<Key>[];
  activeCategory: Key;
  onCategoryChange(category: Key): void;
};

export function NativeStoreHeader<Key extends string>({
  balance,
  balanceKnown,
  categories,
  activeCategory,
  onCategoryChange,
}: NativeStoreHeaderProps<Key>) {
  return (
    <header className="mx-auto w-full max-w-5xl space-y-5 px-4 pt-6 sm:px-6 sm:pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loja</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Use suas Moedas para personalizar seu perfil. Compras e itens continuam vinculados à sua
            conta.
          </p>
        </div>
        <div className="flex min-h-11 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <CoinIcon className="h-6 w-6" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">Seu saldo</p>
            <p className="font-semibold text-foreground">
              {balanceKnown ? `${balance} Moedas` : "Saldo indisponível"}
            </p>
          </div>
        </div>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Categorias da loja"
      >
        {categories.map((category) => {
          const Icon = category.icon;
          const active = activeCategory === category.key;
          return (
            <button
              key={category.key}
              type="button"
              aria-pressed={active}
              data-active={active}
              onClick={() => onCategoryChange(category.key)}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {category.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}

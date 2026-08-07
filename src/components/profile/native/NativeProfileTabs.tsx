export type NativeProfileTabItem = {
  value: string;
  label: string;
};

export type NativeProfileTabsProps = {
  activeTab: string;
  items: readonly NativeProfileTabItem[];
  onTabChange(value: string): void;
};

export function NativeProfileTabs({ activeTab, items, onTabChange }: NativeProfileTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Áreas do perfil"
      className="native-profile__tabs -mx-1 flex gap-2 overflow-x-auto px-1 pb-2"
    >
      {items.map((item) => {
        const active = item.value === activeTab;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(item.value)}
            className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

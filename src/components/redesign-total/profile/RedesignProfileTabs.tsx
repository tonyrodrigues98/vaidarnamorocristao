export function RedesignProfileTabs({
  activeTab,
  items,
  onTabChange,
}: {
  activeTab: string;
  items: readonly { value: string; label: string }[];
  onTabChange(value: string): void;
}) {
  return (
    <div className="rd-profile-tabs" role="tablist" aria-label="Áreas do perfil">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={activeTab === item.value}
          onClick={() => onTabChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

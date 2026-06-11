import { avatarCategories, type AvatarCategoryId } from "@/data/avatarMockData";

type AvatarCategoryTabsProps = {
  activeCategory: AvatarCategoryId;
  onChange: (category: AvatarCategoryId) => void;
};

export function AvatarCategoryTabs({ activeCategory, onChange }: AvatarCategoryTabsProps) {
  return (
    <nav
      aria-label="Categorias do avatar"
      className="sticky top-[calc(env(safe-area-inset-top)+68px)] z-40 border-b border-white/70 bg-[#fff8f5]/85 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-md gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {avatarCategories.map(({ id, label, Icon }) => {
          const isActive = activeCategory === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`group relative flex min-w-max items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition active:scale-[0.98] ${
                isActive
                  ? "bg-white text-[#ff5c70] shadow-[0_12px_30px_rgba(255,92,112,0.16)]"
                  : "text-stone-500 hover:bg-white/70 hover:text-stone-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              <span
                className={`absolute bottom-1 left-4 right-4 h-0.5 rounded-full bg-[#ff5c70] transition-all duration-300 ${
                  isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

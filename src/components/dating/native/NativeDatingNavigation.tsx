import { Link, useLocation } from "@tanstack/react-router";

import { useNativeShellRuntime } from "@/components/native-shell/NativeShellRuntimeContext";
import {
  isNativeDatingNavigationItemActive,
  nativeDatingNavigation,
} from "@/config/native-dating-navigation";
import { cn } from "@/lib/utils";

export function NativeDatingNavigation() {
  const { active } = useNativeShellRuntime();
  const pathname = useLocation({ select: (location) => location.pathname });

  if (!active) return null;

  return (
    <section className="mb-6" aria-label="Modo namoro opcional">
      <p className="mb-3 text-sm text-muted-foreground">
        Relacionamento é uma experiência opcional da comunidade.
      </p>
      <nav className="overflow-x-auto" aria-label="Navegação do modo namoro">
        <div className="flex min-w-max gap-2 pb-1">
          {nativeDatingNavigation.map((item) => {
            const selected = isNativeDatingNavigationItemActive(item, pathname);
            return (
              <Link
                key={item.id}
                to={item.path}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </section>
  );
}

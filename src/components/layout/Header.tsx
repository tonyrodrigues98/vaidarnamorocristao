import { useState } from "react";
import { Menu, X } from "lucide-react";

import { AccountChip, HeaderQuickStats, megaNavGroups, primaryNav } from "@/components/mock/MockUI";

export function Header() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[#fdfbf7]/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-6 lg:px-8">
        <a href="/" className="min-w-0">
          <p className="text-base font-bold text-foreground">VaiDarNamoro Cristao</p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Relacionamento cristao com proposito
          </p>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {primaryNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-white/80 hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <button
            onClick={() => setMegaOpen((value) => !value)}
            className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-white/80 hover:text-foreground"
          >
            Todas as rotas
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <HeaderQuickStats />
          <AccountChip />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/75 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {megaOpen ? (
        <div className="absolute inset-x-0 top-full hidden border-b border-black/5 bg-[#fdfbf7]/95 shadow-[0_22px_70px_rgba(20,16,14,0.12)] backdrop-blur-xl lg:block">
          <div className="mx-auto grid max-w-7xl gap-5 px-8 py-6 md:grid-cols-3">
            {megaNavGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-[1.25rem] border border-black/5 bg-white/70 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {group.title}
                </p>
                <div className="mt-3 grid gap-1">
                  {group.links.map(([href, label]) => (
                    <a
                      key={href}
                      href={href}
                      className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm lg:hidden"
          onMouseDown={() => setMobileOpen(false)}
          role="presentation"
        >
          <div
            className="ml-auto h-full w-full max-w-sm overflow-y-auto bg-[#fdfbf7] p-5 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">VaiDarNamoro Cristao</p>
                <p className="text-xs text-muted-foreground">Menu do prototipo</p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 grid gap-5">
              {megaNavGroups.map((group) => (
                <div key={group.title}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    {group.title}
                  </p>
                  <div className="grid gap-1">
                    {group.links.map(([href, label]) => (
                      <a
                        key={href}
                        href={href}
                        className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold"
                        onClick={() => setMobileOpen(false)}
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

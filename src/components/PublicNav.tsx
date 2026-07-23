import { Link } from "@tanstack/react-router";
import { Radio, UsersRound } from "lucide-react";
import { CAREN_TIKTOK_LIVE_URL, PUBLIC_COMMUNITY_ROUTE } from "@/lib/publicAcquisition";

export function PublicNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#e8e3eb] bg-[#f7f7f5]/92 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-2 rounded-xl font-bold tracking-tight text-[#271b38] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5b21b6] text-white">
            <UsersRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Vai Dar Namoro</span>
        </Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-[#6d6476] lg:flex">
          <Link
            to="/sobre"
            className="hover:text-[#5b21b6]"
            activeProps={{ className: "text-[#5b21b6]" }}
          >
            Sobre
          </Link>
          <Link
            to="/como-funciona"
            className="hover:text-[#5b21b6]"
            activeProps={{ className: "text-[#5b21b6]" }}
          >
            Como funciona
          </Link>
          <Link
            to="/depoimentos"
            className="hover:text-[#5b21b6]"
            activeProps={{ className: "text-[#5b21b6]" }}
          >
            Depoimentos
          </Link>
          <Link
            to="/blog"
            className="hover:text-[#5b21b6]"
            activeProps={{ className: "text-[#5b21b6]" }}
          >
            Blog
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={CAREN_TIKTOK_LIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[#c93656] hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 md:inline-flex"
          >
            <Radio className="h-4 w-4" aria-hidden="true" />
            Live
          </a>
          <Link
            to="/auth/login"
            className="hidden min-h-11 items-center rounded-full px-3 text-sm font-medium text-[#6d6476] hover:text-[#5b21b6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            to={PUBLIC_COMMUNITY_ROUTE}
            className="inline-flex min-h-11 items-center rounded-full bg-[#5b21b6] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(91,33,182,.18)] hover:bg-[#4c1d95] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
          >
            Acessar comunidade
          </Link>
        </div>
      </div>
    </nav>
  );
}

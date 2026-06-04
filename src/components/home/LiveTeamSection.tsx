import { ExternalLink, Music2, Users } from "lucide-react";

import {
  LIVE_TEAM_CATEGORIES,
  LIVE_TEAM_CATEGORY_LABELS,
  type LiveTeamMember,
} from "@/lib/liveTeam";

export function LiveTeamSection({ members }: { members: LiveTeamMember[] }) {
  const activeMembers = members.filter((member) => member.is_active);

  if (activeMembers.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#0f0f10] px-4 py-20 text-white sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-16 h-96 w-[min(90vw,760px)] -translate-x-1/2 rounded-full bg-[#ff4f68]/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-[#ff5c70] backdrop-blur-xl">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.26em] text-[#ff5c70]">
            Comunidade da live
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            Quem faz a live acontecer
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/62 sm:text-base">
            Conheça as pessoas que ajudam a manter a comunidade organizada, divertida e acolhedora.
          </p>
        </div>

        <div className="mt-14 space-y-14">
          {LIVE_TEAM_CATEGORIES.map((category) => {
            const categoryMembers = activeMembers.filter((member) => member.category === category);
            if (categoryMembers.length === 0) return null;

            return (
              <div key={category} className="space-y-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                      Categoria
                    </p>
                    <h3 className="mt-1 text-2xl font-black">
                      {LIVE_TEAM_CATEGORY_LABELS[category]}
                    </h3>
                  </div>
                  <div className="hidden h-px flex-1 bg-gradient-to-r from-white/16 to-transparent sm:block" />
                </div>

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {categoryMembers.map((member) => (
                    <LiveTeamCard key={member.id} member={member} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LiveTeamCard({ member }: { member: LiveTeamMember }) {
  return (
    <article className="group relative aspect-[4/5] min-h-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/35 transition duration-300 hover:-translate-y-1 hover:border-[#ff5c70]/45">
      <img
        src={member.photo_url}
        alt={member.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/38 to-black/8" />
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/32 to-transparent" />

      {member.chip_text && (
        <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-gradient-to-r from-[#ff4f68] to-[#ff7a8c] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-[#ff4f68]/20">
          {member.chip_text}
        </div>
      )}

      {member.tiktok_url && (
        <a
          href={member.tiktok_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-black/45 text-white backdrop-blur transition hover:bg-[#ff4f68]"
          aria-label={`Abrir TikTok de ${member.name}`}
        >
          <Music2 className="h-4 w-4" />
        </a>
      )}

      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
          {LIVE_TEAM_CATEGORY_LABELS[member.category]}
        </p>
        <h4 className="mt-2 text-2xl font-black leading-tight">{member.name}</h4>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="line-clamp-2 text-sm font-semibold text-white/72">{member.role_title}</p>
          {member.tiktok_url && <ExternalLink className="h-4 w-4 shrink-0 text-[#ff5c70]" />}
        </div>
      </div>
    </article>
  );
}

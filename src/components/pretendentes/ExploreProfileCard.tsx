import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Heart, MapPin, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import { PhotoCarousel } from "@/components/PhotoCarousel";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { OnlineDot } from "@/components/OnlineDot";
import { UserBadges } from "@/components/UserBadges";
import { Button } from "@/components/ui/button";
import type { AffinityChip } from "@/lib/affinity";
import type { AppRole, RoleColor } from "@/lib/roles";

type StaffInfo = { role: AppRole; color: RoleColor | null };

type Profile = {
  id: string;
  full_name: string;
  age: number;
  city: string;
  state: string;
  church: string;
  bio: string | null;
  verified?: boolean;
};

interface ExploreProfileCardProps {
  profile: Profile;
  photos: string[];
  chips: AffinityChip[];
  score: number;
  showScore: boolean;
  isSuggestion: boolean;
  staff?: StaffInfo;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

export function ExploreProfileCard({
  profile,
  photos,
  chips,
  score,
  showScore,
  isSuggestion,
  staff,
  index,
  total,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: ExploreProfileCardProps) {
  const firstName = profile.full_name.split(" ")[0];

  return (
    <div className="vt-fade-in flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-soft">
        <div className="relative aspect-[4/5] max-h-[62dvh] sm:max-h-none">
          <PhotoCarousel
            photos={photos}
            alt={profile.full_name}
            eager
            imgClassName="h-full w-full object-cover"
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-gradient-love">
                <UserRound className="h-16 w-16 text-white/80" aria-hidden />
              </div>
            }
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Floating navigation chevrons — always reachable on mobile,
              even before the user scrolls to the bottom action row. */}
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            aria-label="Perfil anterior"
            className="tap app-pressable absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md backdrop-blur-sm transition disabled:pointer-events-none disabled:opacity-0 dark:bg-black/60 dark:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            aria-label="Próximo perfil"
            className="tap app-pressable absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md backdrop-blur-sm transition disabled:pointer-events-none disabled:opacity-0 dark:bg-black/60 dark:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {showScore ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-rose-700 shadow">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  {score}% afinidade
                </span>
              ) : isSuggestion ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-rose-700 shadow">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Sugestão
                </span>
              ) : null}
              {profile.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  Verificado
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-foreground/80 shadow">
                {Math.min(index + 1, total)} / {total}
              </span>
              <div className="rounded-full bg-white/95 p-1.5 shadow">
                <OnlineDot userId={profile.id} size="md" />
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {firstName}, {profile.age}
              </h2>
              {profile.verified && <VerifiedBadge size="md" />}
              {staff && <RoleBadge role={staff.role} color={staff.color} />}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {profile.city} • {profile.state}
            </p>
            {profile.church && (
              <p className="mt-1 text-xs font-medium text-rose-100">{profile.church}</p>
            )}
          </div>
        </div>

        {(profile.bio || chips.length > 0) && (
          <div className="space-y-3 p-4">
            {profile.bio && (
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {profile.bio}
              </p>
            )}
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {chips.slice(0, 4).map((chip) => (
                  <span
                    key={chip.key}
                    className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
                  >
                    {chip.label}
                  </span>
                ))}
                {chips.length > 4 && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    +{chips.length - 4}
                  </span>
                )}
              </div>
            )}
            <UserBadges userId={profile.id} size="xs" max={3} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="app-pressable h-12 w-12 shrink-0 rounded-full p-0"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Perfil anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="app-pressable h-12 flex-1 rounded-full"
        >
          <Link to="/pretendentes/$id" params={{ id: profile.id }}>
            <UserRound className="mr-2 h-4 w-4" />
            Ver perfil
          </Link>
        </Button>

        <Button
          asChild
          size="lg"
          className="app-pressable h-12 flex-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md hover:from-rose-500 hover:to-pink-600"
        >
          <Link to="/pretendentes/$id" params={{ id: profile.id }}>
            <Heart className="mr-2 h-4 w-4" />
            Interesse
          </Link>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="app-pressable h-12 w-12 shrink-0 rounded-full p-0"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Próximo perfil"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
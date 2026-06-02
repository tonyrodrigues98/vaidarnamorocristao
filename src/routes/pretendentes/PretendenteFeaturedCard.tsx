import { Link } from "@tanstack/react-router";
import { Flame, Sparkles } from "lucide-react";

import { PhotoCarousel } from "@/components/PhotoCarousel";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { OnlineDot } from "@/components/OnlineDot";
import { UserBadges } from "@/components/UserBadges";

import type { AffinityChip } from "@/lib/affinity";
import type { AppRole, RoleColor } from "@/lib/roles";

type StaffInfo = {
  role: AppRole;
  color: RoleColor | null;
};

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

interface PretendenteFeaturedCardProps {
  profile: Profile;
  photos: string[];
  score: number;
  showScore: boolean;
  isSuggestion: boolean;
  chips: AffinityChip[];
  eager?: boolean;
  staff?: StaffInfo;
  isCommitted?: boolean;
}

export function PretendenteFeaturedCard({
  profile,
  photos,
  score,
  showScore,
  isSuggestion,
  chips,
  eager = false,
  staff,
  isCommitted = false,
}: PretendenteFeaturedCardProps) {
  return (
    <Link
      to="/pretendentes/$id"
      params={{ id: profile.id }}
      className="
        group
        block
        overflow-hidden
        rounded-3xl
        border
        border-border
        bg-card
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-2xl
      "
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <PhotoCarousel
          photos={photos}
          alt={profile.full_name}
          eager={eager}
          imgClassName="transition duration-700 group-hover:scale-105"
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-gradient-love">
              <span className="text-6xl text-white">{profile.full_name.charAt(0)}</span>
            </div>
          }
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
        {isCommitted && (
          <div className="absolute left-3 top-3 z-10">
            <div
              className="
      flex
      items-center
      gap-1
      rounded-full
      bg-emerald-600
      px-3
      py-1
      text-xs
      font-semibold
      text-white
      shadow-lg
    "
            >
              💍 Em Propósito
            </div>
          </div>
        )}
        {showScore ? (
          <div className="absolute left-3 top-3">
            <div className="flex items-center gap-1 rounded-full bg-pink-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
              <Flame className="h-3 w-3" />
              {score}% Afinidade
            </div>
          </div>
        ) : (
          isSuggestion && (
            <div className="absolute left-3 top-3">
              <div className="flex items-center gap-1 rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                <Sparkles className="h-3 w-3" />
                Sugestão
              </div>
            </div>
          )
        )}

        <div className="absolute right-3 top-3">
          <div className="rounded-full bg-white/95 p-2 shadow-lg">
            <OnlineDot userId={profile.id} size="md" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold">
              {profile.full_name.split(" ")[0]}, {profile.age}
            </h3>

            {profile.verified && <VerifiedBadge size="md" />}

            {staff && <RoleBadge role={staff.role} color={staff.color} />}
          </div>

          <p className="text-sm text-white/90">
            {profile.city} • {profile.state}
          </p>

          {profile.church && <p className="mt-1 text-xs text-pink-200">{profile.church}</p>}
        </div>
      </div>

      <div className="p-4">
        <UserBadges userId={profile.id} size="xs" max={2} />

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {chips.slice(0, 3).map((chip) => (
              <span
                key={chip.key}
                className="
                  rounded-full
                  bg-pink-50
                  px-2.5
                  py-1
                  text-[11px]
                  font-medium
                  text-pink-700
                "
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}

        {profile.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{profile.bio}</p>}
      </div>
    </Link>
  );
}

import { Link } from "@tanstack/react-router";
import {
  BookHeart,
  CircleHelp,
  Gamepad2,
  HeartHandshake,
  Newspaper,
  Package,
  PawPrint,
  Radio,
  Sparkles,
  Store,
  Trophy,
  UserRound,
} from "lucide-react";

import type { NativeExploreIconKey, NativeExploreItem } from "@/config/native-explore-registry";
import { getNativeExploreStorage, recordNativeExploreRecent } from "@/lib/native-explore-recent";

const icons = {
  "book-heart": BookHeart,
  "paw-print": PawPrint,
  gamepad: Gamepad2,
  "circle-help": CircleHelp,
  store: Store,
  "user-round": UserRound,
  package: Package,
  trophy: Trophy,
  newspaper: Newspaper,
  sparkles: Sparkles,
  "heart-handshake": HeartHandshake,
  radio: Radio,
} satisfies Record<NativeExploreIconKey, typeof BookHeart>;

export function NativeExploreCard({
  item,
  onVisited,
}: {
  item: NativeExploreItem;
  onVisited?(): void;
}) {
  const Icon = icons[item.icon];

  return (
    <Link
      to={item.path as never}
      onClick={() => {
        recordNativeExploreRecent(getNativeExploreStorage(), item.id);
        onVisited?.();
      }}
      className="flex min-h-11 items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block font-semibold text-foreground">{item.title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </span>
        {item.relationshipOptional ? (
          <span className="mt-2 block text-xs font-medium text-primary">
            Relacionamento opcional
          </span>
        ) : null}
      </span>
    </Link>
  );
}

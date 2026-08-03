import { Compass, Home, MessageCircle, UserRound, UsersRound } from "lucide-react";

import type { NativePrimaryNavigationIcon } from "@/config/native-primary-navigation";

export const redesignNavigationIcons = {
  home: Home,
  community: UsersRound,
  explore: Compass,
  messages: MessageCircle,
  profile: UserRound,
} as const satisfies Record<NativePrimaryNavigationIcon, typeof Home>;

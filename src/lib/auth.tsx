import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { pickPrimaryRole, type AppRole, type RoleColor } from "@/lib/roles";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  role: AppRole;
  badgeColor: RoleColor | null;
  publicListing: boolean;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  role: "user",
  badgeColor: null,
  publicListing: false,
  refreshRole: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole>("user");
  const [badgeColor, setBadgeColor] = useState<RoleColor | null>(null);
  const [publicListing, setPublicListing] = useState(false);

  async function loadRoles(uid: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role, badge_color, public_listing")
      .eq("user_id", uid);
    const rows = data ?? [];
    const primary = pickPrimaryRole(rows.map((r) => r.role as AppRole));
    const primaryRow = rows.find((r) => r.role === primary);
    setRole(primary);
    setBadgeColor((primaryRow?.badge_color as RoleColor | null) ?? null);
    setPublicListing(!!primaryRow?.public_listing);
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
      if (s?.user) {
        setTimeout(() => { loadRoles(s.user.id); }, 0);
      } else {
        setRole("user");
        setBadgeColor(null);
        setPublicListing(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
      if (s?.user) loadRoles(s.user.id);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const isAdmin = role === "admin" || role === "super_admin";

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    loading,
    isAdmin,
    role,
    badgeColor,
    publicListing,
    refreshRole: async () => {
      if (session?.user) await loadRoles(session.user.id);
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
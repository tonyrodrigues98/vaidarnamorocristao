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
  isSupportAgent: boolean;
  profileStatus: "pending" | "approved" | "rejected" | "banned" | null;
  isApproved: boolean;
  rolesLoaded: boolean;
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
  isSupportAgent: false,
  profileStatus: null,
  isApproved: false,
  rolesLoaded: false,
  refreshRole: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole>("user");
  const [badgeColor, setBadgeColor] = useState<RoleColor | null>(null);
  const [publicListing, setPublicListing] = useState(false);
  const [isSupportAgent, setIsSupportAgent] = useState(false);
  const [profileStatus, setProfileStatus] = useState<AuthCtx["profileStatus"]>(null);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  async function loadRoles(uid: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role, badge_color, public_listing, is_support_agent")
      .eq("user_id", uid);
    const rows = data ?? [];
    const primary = pickPrimaryRole(rows.map((r) => r.role as AppRole));
    const primaryRow = rows.find((r) => r.role === primary);
    setRole(primary);
    setBadgeColor((primaryRow?.badge_color as RoleColor | null) ?? null);
    setPublicListing(!!primaryRow?.public_listing);
    setIsSupportAgent(
      rows.some((r) => (r as { is_support_agent?: boolean }).is_support_agent === true),
    );
    const { data: prof } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", uid)
      .maybeSingle();
    setProfileStatus((prof?.status as AuthCtx["profileStatus"]) ?? null);
    setRolesLoaded(true);
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
      if (s?.user) {
        setTimeout(() => {
          loadRoles(s.user.id);
        }, 0);
      } else {
        setRole("user");
        setBadgeColor(null);
        setPublicListing(false);
        setIsSupportAgent(false);
        setProfileStatus(null);
        setRolesLoaded(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
      if (s?.user) loadRoles(s.user.id);
      else setRolesLoaded(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // If the user's profile is hard-deleted by an admin, sign them out automatically.
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    const ch = supabase
      .channel(`profile-self-delete-${uid}`)
      .on(
        "postgres_changes" as never,
        { event: "DELETE", schema: "public", table: "profiles", filter: `id=eq.${uid}` },
        () => {
          supabase.auth.signOut();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session?.user?.id]);

  const isAdmin = role === "admin" || role === "super_admin";
  const isStaff = isAdmin || role === "apresentador" || role === "moderador";
  const isApproved = profileStatus === "approved" || isStaff;

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    loading,
    isAdmin,
    role,
    badgeColor,
    publicListing,
    isSupportAgent,
    profileStatus,
    isApproved,
    rolesLoaded,
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

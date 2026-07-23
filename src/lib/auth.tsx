import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { pickPrimaryRole, type AppRole, type RoleColor } from "@/lib/roles";
import {
  createAuthSessionCoordinator,
  createInitialAuthSessionSnapshot,
  type AuthSessionCoordinator,
  type AuthSessionSnapshot,
  type AuthSessionStatus,
  type SanitizedAuthError,
} from "@/v2/app/auth/session-state";
import { isolatePrivateQueryCache } from "@/v2/app/auth/private-cache";

type ProfileStatus = "pending" | "approved" | "rejected" | "banned" | null;

type AuthCtx = {
  user: User | null;
  session: Session | null;
  status: AuthSessionStatus;
  error: SanitizedAuthError | null;
  initialResolutionFinished: boolean;
  loading: boolean;
  isAdmin: boolean;
  role: AppRole;
  badgeColor: RoleColor | null;
  publicListing: boolean;
  isSupportAgent: boolean;
  profileStatus: ProfileStatus;
  isApproved: boolean;
  rolesLoaded: boolean;
  refreshRole: () => Promise<void>;
  signInWithPassword: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ error: SanitizedAuthError | null }>;
  signOut: () => Promise<void>;
};

const DEFAULT_ERROR: SanitizedAuthError = {
  code: "sign_in_failed",
  message: "Não foi possível entrar. Verifique os dados e tente novamente.",
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  status: "initializing",
  error: null,
  initialResolutionFinished: false,
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
  signInWithPassword: async () => ({ error: DEFAULT_ERROR }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [auth, setAuth] = useState<AuthSessionSnapshot<Session>>(createInitialAuthSessionSnapshot);
  const [role, setRole] = useState<AppRole>("user");
  const [badgeColor, setBadgeColor] = useState<RoleColor | null>(null);
  const [publicListing, setPublicListing] = useState(false);
  const [isSupportAgent, setIsSupportAgent] = useState(false);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>(null);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const coordinator = useRef<AuthSessionCoordinator<Session> | null>(null);
  const currentUserId = useRef<string | null>(null);
  const roleRequest = useRef(0);

  const publishAuthSnapshot = useCallback(
    (next: AuthSessionSnapshot<Session>) => {
      const nextUserId = next.user?.id ?? null;
      if (currentUserId.current !== nextUserId) {
        isolatePrivateQueryCache(queryClient);
        currentUserId.current = nextUserId;
      }
      setAuth(next);
    },
    [queryClient],
  );

  useEffect(() => {
    const authCoordinator = createAuthSessionCoordinator<Session>({
      source: {
        getSession: async () => {
          const { data, error } = await supabase.auth.getSession();
          return { session: data.session, error };
        },
        subscribe: (listener) => {
          const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            listener(session);
          });
          return {
            unsubscribe: () => data.subscription.unsubscribe(),
          };
        },
      },
      onSnapshot: publishAuthSnapshot,
    });
    coordinator.current = authCoordinator;
    authCoordinator.start();

    return () => {
      coordinator.current = null;
      authCoordinator.stop();
    };
  }, [publishAuthSnapshot]);

  const loadRoles = useCallback(async (uid: string) => {
    const request = ++roleRequest.current;
    const { data } = await supabase
      .from("user_roles")
      .select("role, badge_color, public_listing, is_support_agent")
      .eq("user_id", uid);
    if (request !== roleRequest.current || currentUserId.current !== uid) return;

    const rows = data ?? [];
    const primary = pickPrimaryRole(rows.map((row) => row.role as AppRole));
    const primaryRow = rows.find((row) => row.role === primary);
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", uid)
      .maybeSingle();
    if (request !== roleRequest.current || currentUserId.current !== uid) return;

    setRole(primary);
    setBadgeColor((primaryRow?.badge_color as RoleColor | null) ?? null);
    setPublicListing(!!primaryRow?.public_listing);
    setIsSupportAgent(
      rows.some((row) => (row as { is_support_agent?: boolean }).is_support_agent === true),
    );
    setProfileStatus((profile?.status as ProfileStatus) ?? null);
    setRolesLoaded(true);
  }, []);

  useEffect(() => {
    const uid = auth.user?.id;
    roleRequest.current += 1;
    setRole("user");
    setBadgeColor(null);
    setPublicListing(false);
    setIsSupportAgent(false);
    setProfileStatus(null);

    if (!uid) {
      setRolesLoaded(auth.status !== "initializing");
      return;
    }

    setRolesLoaded(false);
    void loadRoles(uid);
  }, [auth.user?.id, auth.status, loadRoles]);

  const signOut = useCallback(async () => {
    coordinator.current?.acceptSession(null);
    await supabase.auth.signOut();
  }, []);

  const signInWithPassword = useCallback(
    async (credentials: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error || !data.session) return { error: DEFAULT_ERROR };
      coordinator.current?.acceptSession(data.session);
      return { error: null };
    },
    [],
  );

  // If the user's profile is hard-deleted by an admin, sign them out automatically.
  useEffect(() => {
    const uid = auth.user?.id;
    if (!uid) return;
    const channel = supabase
      .channel(`profile-self-delete-${uid}`)
      .on(
        "postgres_changes" as never,
        { event: "DELETE", schema: "public", table: "profiles", filter: `id=eq.${uid}` },
        () => {
          void signOut();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [auth.user?.id, signOut]);

  const isAdmin = role === "admin" || role === "super_admin";
  const isStaff = isAdmin || role === "apresentador" || role === "moderador";
  const isApproved = profileStatus === "approved" || isStaff;

  const value: AuthCtx = {
    user: auth.user,
    session: auth.session,
    status: auth.status,
    error: auth.error,
    initialResolutionFinished: auth.initialResolutionFinished,
    loading: auth.status === "initializing",
    isAdmin,
    role,
    badgeColor,
    publicListing,
    isSupportAgent,
    profileStatus,
    isApproved,
    rolesLoaded,
    refreshRole: async () => {
      if (auth.user) await loadRoles(auth.user.id);
    },
    signInWithPassword,
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

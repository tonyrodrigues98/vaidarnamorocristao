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
import {
  createResolvingIdentity,
  createUnauthenticatedIdentity,
  resolveIdentityAccess,
  type IdentityAccessSnapshot,
  type TermsConsentRecord,
} from "@/v2/platform/identity";
import { v2FeatureFlags } from "@/v2/platform/feature-flags";

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
  identity: IdentityAccessSnapshot;
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
  identity: createUnauthenticatedIdentity(),
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
  const [identity, setIdentity] = useState<IdentityAccessSnapshot>(createUnauthenticatedIdentity);
  const [identityResolvedForUserId, setIdentityResolvedForUserId] = useState<string | null>(null);
  const coordinator = useRef<AuthSessionCoordinator<Session> | null>(null);
  const currentUserId = useRef<string | null>(null);
  const roleRequest = useRef(0);

  const publishAuthSnapshot = useCallback(
    (next: AuthSessionSnapshot<Session>) => {
      const nextUserId = next.user?.id ?? null;
      if (currentUserId.current !== nextUserId) {
        isolatePrivateQueryCache(queryClient);
        currentUserId.current = nextUserId;
        setRole("user");
        setBadgeColor(null);
        setPublicListing(false);
        setIsSupportAgent(false);
        setProfileStatus(null);
        setIdentity(nextUserId ? createResolvingIdentity() : createUnauthenticatedIdentity());
        setIdentityResolvedForUserId(null);
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
    const datingResultPromise = v2FeatureFlags.dating
      ? supabase.from("dating_memberships").select("status").eq("user_id", uid).maybeSingle()
      : Promise.resolve({ data: null, error: null });
    const [rolesResult, profileResult, termsResult, datingResult] = await Promise.all([
      supabase
        .from("user_roles")
        .select("role, badge_color, public_listing, is_support_agent")
        .eq("user_id", uid),
      supabase
        .from("profiles")
        .select("status, deactivated_at, deletion_requested_at")
        .eq("id", uid)
        .maybeSingle(),
      supabase.rpc("get_my_terms_status"),
      datingResultPromise,
    ]);
    if (request !== roleRequest.current || currentUserId.current !== uid) return;

    const rows = rolesResult.data ?? [];
    const roles = rows.map((row) => row.role as AppRole);
    const primary = pickPrimaryRole(roles);
    const primaryRow = rows.find((row) => row.role === primary);
    const profile = profileResult.data;
    const termsRow = termsResult.data?.[0];
    const terms: TermsConsentRecord | null | undefined = termsResult.error
      ? undefined
      : termsRow
        ? {
            accepted: termsRow.accepted,
            currentVersion: termsRow.current_version,
            acceptedVersion: termsRow.accepted_version,
            acceptedAt: termsRow.accepted_at,
          }
        : null;
    const resolution =
      rolesResult.error || profileResult.error || datingResult.error
        ? "recoverable-error"
        : "ready";
    const datingState = (() => {
      switch (datingResult.data?.status) {
        case "active":
        case "paused":
        case "restricted":
          return datingResult.data.status;
        case "legacy_active_pending_confirmation":
          return "legacy-active-pending-confirmation";
        case "paused_by_commitment":
          return "committed";
        default:
          return "inactive";
      }
    })();

    setRole(primary);
    setBadgeColor((primaryRow?.badge_color as RoleColor | null) ?? null);
    setPublicListing(!!primaryRow?.public_listing);
    setIsSupportAgent(
      rows.some((row) => (row as { is_support_agent?: boolean }).is_support_agent === true),
    );
    setProfileStatus((profile?.status as ProfileStatus) ?? null);
    setIdentity(
      resolveIdentityAccess({
        authenticated: true,
        resolution,
        roles,
        isSupportAgent: rows.some(
          (row) => (row as { is_support_agent?: boolean }).is_support_agent === true,
        ),
        profile: profileResult.error
          ? undefined
          : profile
            ? {
                status: profile.status,
                deactivatedAt: profile.deactivated_at,
                deletionRequestedAt: profile.deletion_requested_at,
              }
            : null,
        terms,
        datingState,
      }),
    );
    setIdentityResolvedForUserId(uid);
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
      setIdentity(createUnauthenticatedIdentity());
      setIdentityResolvedForUserId(null);
      return;
    }

    setIdentity(createResolvingIdentity());
    setIdentityResolvedForUserId(null);
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

  const rolesLoaded = auth.user
    ? identityResolvedForUserId === auth.user.id
    : auth.status !== "initializing";
  const isAdmin = role === "admin" || role === "super_admin";
  const isApproved = identity.isApproved;

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
    identity,
    refreshRole: async () => {
      if (auth.user) await loadRoles(auth.user.id);
    },
    signInWithPassword,
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

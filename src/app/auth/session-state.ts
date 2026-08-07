export type AuthSessionLike = Readonly<{
  user: Readonly<{ id: string }>;
}>;

export type AuthSessionStatus =
  | "initializing"
  | "authenticated"
  | "unauthenticated"
  | "recoverable-error";

export type SanitizedAuthError = Readonly<{
  code: "session_restore_failed" | "sign_in_failed";
  message:
    | "Não foi possível restaurar a sessão. Tente novamente."
    | "Não foi possível entrar. Verifique os dados e tente novamente.";
}>;

export type AuthSessionSnapshot<TSession extends AuthSessionLike> = Readonly<{
  session: TSession | null;
  user: TSession["user"] | null;
  status: AuthSessionStatus;
  error: SanitizedAuthError | null;
  initialResolutionFinished: boolean;
}>;

export type AuthSubscription = Readonly<{
  unsubscribe: () => void;
}>;

export type AuthSessionSource<TSession extends AuthSessionLike> = Readonly<{
  getSession: () => Promise<{ session: TSession | null; error?: unknown }>;
  subscribe: (listener: (session: TSession | null) => void) => AuthSubscription;
}>;

export type AuthSessionCoordinator<TSession extends AuthSessionLike> = Readonly<{
  start: () => void;
  stop: () => void;
  acceptSession: (session: TSession | null) => void;
}>;

export function createInitialAuthSessionSnapshot<
  TSession extends AuthSessionLike,
>(): AuthSessionSnapshot<TSession> {
  return {
    session: null,
    user: null,
    status: "initializing",
    error: null,
    initialResolutionFinished: false,
  };
}

function resolvedSnapshot<TSession extends AuthSessionLike>(
  session: TSession | null,
): AuthSessionSnapshot<TSession> {
  return {
    session,
    user: session?.user ?? null,
    status: session ? "authenticated" : "unauthenticated",
    error: null,
    initialResolutionFinished: true,
  };
}

const RECOVERABLE_SESSION_ERROR: SanitizedAuthError = {
  code: "session_restore_failed",
  message: "Não foi possível restaurar a sessão. Tente novamente.",
};

/**
 * Coordinates Supabase's initial getSession with its auth event stream.
 *
 * The subscription is installed first. An event advances eventRevision, so a
 * slower getSession result captured at an older revision cannot overwrite it.
 */
export function createAuthSessionCoordinator<TSession extends AuthSessionLike>({
  source,
  onSnapshot,
}: {
  source: AuthSessionSource<TSession>;
  onSnapshot: (snapshot: AuthSessionSnapshot<TSession>) => void;
}): AuthSessionCoordinator<TSession> {
  let active = false;
  let started = false;
  let eventRevision = 0;
  let subscription: AuthSubscription | null = null;

  const acceptSession = (session: TSession | null) => {
    if (!active) return;
    eventRevision += 1;
    onSnapshot(resolvedSnapshot(session));
  };

  return {
    start() {
      if (started) return;
      started = true;
      active = true;
      const revisionAtRequest = eventRevision;
      subscription = source.subscribe(acceptSession);

      void source
        .getSession()
        .then(({ session, error }) => {
          if (!active || eventRevision !== revisionAtRequest) return;
          if (error) {
            onSnapshot({
              session: null,
              user: null,
              status: "recoverable-error",
              error: RECOVERABLE_SESSION_ERROR,
              initialResolutionFinished: true,
            });
            return;
          }
          onSnapshot(resolvedSnapshot(session));
        })
        .catch(() => {
          if (!active || eventRevision !== revisionAtRequest) return;
          onSnapshot({
            session: null,
            user: null,
            status: "recoverable-error",
            error: RECOVERABLE_SESSION_ERROR,
            initialResolutionFinished: true,
          });
        });
    },
    stop() {
      if (!active) return;
      active = false;
      subscription?.unsubscribe();
      subscription = null;
    },
    acceptSession,
  };
}

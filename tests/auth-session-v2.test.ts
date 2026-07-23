import { describe, expect, it, vi } from "vitest";
import {
  createAuthSessionCoordinator,
  createInitialAuthSessionSnapshot,
  type AuthSessionSnapshot,
} from "../src/v2/app/auth/session-state";

type TestSession = Readonly<{
  accessToken: string;
  user: Readonly<{ id: string }>;
}>;

function session(userId: string, accessToken = `token-${userId}`): TestSession {
  return { accessToken, user: { id: userId } };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function harness() {
  const initial = deferred<{ session: TestSession | null; error?: unknown }>();
  const snapshots: AuthSessionSnapshot<TestSession>[] = [];
  let listener: ((value: TestSession | null) => void) | null = null;
  const unsubscribe = vi.fn();
  const subscribe = vi.fn((next: (value: TestSession | null) => void) => {
    listener = next;
    return { unsubscribe };
  });
  const getSession = vi.fn(() => initial.promise);
  const coordinator = createAuthSessionCoordinator<TestSession>({
    source: { getSession, subscribe },
    onSnapshot: (snapshot) => snapshots.push(snapshot),
  });
  return {
    coordinator,
    getSession,
    initial,
    snapshots,
    subscribe,
    unsubscribe,
    event(value: TestSession | null) {
      listener?.(value);
    },
  };
}

describe("V2 canonical auth session", () => {
  it("starts in the explicit initializing state", () => {
    expect(createInitialAuthSessionSnapshot<TestSession>()).toEqual({
      session: null,
      user: null,
      status: "initializing",
      error: null,
      initialResolutionFinished: false,
    });
  });

  it.each([
    ["an existing session", session("user-a"), "authenticated"],
    ["no existing session", null, "unauthenticated"],
  ] as const)("resolves %s exactly once", async (_label, value, expectedStatus) => {
    const test = harness();
    test.coordinator.start();
    test.initial.resolve({ session: value });
    await test.initial.promise;
    await Promise.resolve();

    expect(test.subscribe).toHaveBeenCalledTimes(1);
    expect(test.getSession).toHaveBeenCalledTimes(1);
    expect(test.snapshots).toHaveLength(1);
    expect(test.snapshots[0].status).toBe(expectedStatus);
  });

  it("lets an auth event win when it arrives before getSession", async () => {
    const test = harness();
    test.coordinator.start();
    test.event(session("new-user"));
    test.initial.resolve({ session: session("stale-user") });
    await test.initial.promise;
    await Promise.resolve();

    expect(test.snapshots.map((snapshot) => snapshot.user?.id)).toEqual(["new-user"]);
  });

  it("preserves an event emitted synchronously while the subscription is installed", async () => {
    const initial = deferred<{ session: TestSession | null; error?: unknown }>();
    const snapshots: AuthSessionSnapshot<TestSession>[] = [];
    const coordinator = createAuthSessionCoordinator<TestSession>({
      source: {
        getSession: () => initial.promise,
        subscribe: (listener) => {
          listener(session("event-user"));
          return { unsubscribe: () => {} };
        },
      },
      onSnapshot: (snapshot) => snapshots.push(snapshot),
    });

    coordinator.start();
    initial.resolve({ session: session("stale-user") });
    await initial.promise;
    await Promise.resolve();

    expect(snapshots.map((snapshot) => snapshot.user?.id)).toEqual(["event-user"]);
  });

  it("does not let an old empty getSession result overwrite a new login", async () => {
    const test = harness();
    test.coordinator.start();
    test.event(session("user-a"));
    test.initial.resolve({ session: null });
    await test.initial.promise;
    await Promise.resolve();

    expect(test.snapshots.at(-1)?.status).toBe("authenticated");
    expect(test.snapshots.at(-1)?.user?.id).toBe("user-a");
  });

  it("keeps duplicate and token refresh events authenticated for the same user", () => {
    const test = harness();
    test.coordinator.start();
    test.event(session("user-a", "first"));
    test.event(session("user-a", "first"));
    test.event(session("user-a", "refreshed"));

    expect(test.snapshots.every((snapshot) => snapshot.status === "authenticated")).toBe(true);
    expect(test.snapshots.map((snapshot) => snapshot.user?.id)).toEqual([
      "user-a",
      "user-a",
      "user-a",
    ]);
    expect(test.snapshots.at(-1)?.session?.accessToken).toBe("refreshed");
  });

  it("handles login, logout, expiration and user replacement immediately", () => {
    const test = harness();
    test.coordinator.start();
    test.coordinator.acceptSession(session("user-a"));
    test.coordinator.acceptSession(null);
    test.event(session("user-a"));
    test.event(null);
    test.event(session("user-b"));

    expect(test.snapshots.map((snapshot) => snapshot.user?.id ?? null)).toEqual([
      "user-a",
      null,
      "user-a",
      null,
      "user-b",
    ]);
    expect(test.snapshots.at(-1)?.status).toBe("authenticated");
  });

  it("sanitizes an initial restoration error and never exposes a session", async () => {
    const test = harness();
    test.coordinator.start();
    test.initial.resolve({ session: null, error: new Error("sensitive upstream detail") });
    await test.initial.promise;
    await Promise.resolve();

    expect(test.snapshots).toEqual([
      {
        session: null,
        user: null,
        status: "recoverable-error",
        error: {
          code: "session_restore_failed",
          message: "Não foi possível restaurar a sessão. Tente novamente.",
        },
        initialResolutionFinished: true,
      },
    ]);
  });

  it("unsubscribes once and ignores getSession after unmount", async () => {
    const test = harness();
    test.coordinator.start();
    test.coordinator.start();
    test.coordinator.stop();
    test.coordinator.stop();
    test.initial.resolve({ session: session("late-user") });
    await test.initial.promise;
    await Promise.resolve();

    expect(test.subscribe).toHaveBeenCalledTimes(1);
    expect(test.unsubscribe).toHaveBeenCalledTimes(1);
    expect(test.snapshots).toEqual([]);
  });

  it("ignores a rejected getSession after unmount", async () => {
    const test = harness();
    test.coordinator.start();
    test.coordinator.stop();
    test.initial.reject(new Error("network detail"));
    await expect(test.initial.promise).rejects.toThrow("network detail");
    await Promise.resolve();

    expect(test.snapshots).toEqual([]);
  });
});

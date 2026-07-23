import { describe, expect, it } from "vitest";
import {
  canMountAuthenticatedRoute,
  replaceLocationWithLogin,
  resolveAuthenticatedRouteState,
  resolveAuthenticationRedirectDecision,
} from "../src/v2/app/auth-navigation";

describe("V2 authenticated route navigation", () => {
  it("waits for authentication before mounting private content or redirecting", () => {
    const state = resolveAuthenticatedRouteState({
      loading: true,
      authenticated: false,
    });

    expect(state).toBe("loading");
    expect(canMountAuthenticatedRoute(state)).toBe(false);
    expect(
      resolveAuthenticationRedirectDecision({
        state,
        redirectStarted: false,
      }),
    ).toEqual({ redirectStarted: false, shouldNavigate: false });
  });

  it("allows at most one login navigation for each unauthenticated period", () => {
    const state = resolveAuthenticatedRouteState({
      loading: false,
      authenticated: false,
    });
    const first = resolveAuthenticationRedirectDecision({
      state,
      redirectStarted: false,
    });
    const repeated = resolveAuthenticationRedirectDecision({
      state,
      redirectStarted: first.redirectStarted,
    });

    expect(canMountAuthenticatedRoute(state)).toBe(false);
    expect(first).toEqual({ redirectStarted: true, shouldNavigate: true });
    expect(repeated).toEqual({ redirectStarted: true, shouldNavigate: false });
  });

  it("mounts private content without navigating when the user is authenticated", () => {
    const state = resolveAuthenticatedRouteState({
      loading: false,
      authenticated: true,
    });

    expect(canMountAuthenticatedRoute(state)).toBe(true);
    expect(
      resolveAuthenticationRedirectDecision({
        state,
        redirectStarted: false,
      }),
    ).toEqual({ redirectStarted: false, shouldNavigate: false });
  });

  it("rearms login navigation after authentication for logout or session expiry", () => {
    const authenticated = resolveAuthenticationRedirectDecision({
      state: "authenticated",
      redirectStarted: true,
    });
    const expired = resolveAuthenticationRedirectDecision({
      state: "redirect-to-login",
      redirectStarted: authenticated.redirectStarted,
    });

    expect(authenticated).toEqual({ redirectStarted: false, shouldNavigate: false });
    expect(expired).toEqual({ redirectStarted: true, shouldNavigate: true });
  });

  it("keeps repeated effects single-flight without starting a router transition", () => {
    const repeated = resolveAuthenticationRedirectDecision({
      state: "redirect-to-login",
      redirectStarted: true,
    });

    expect(repeated).toEqual({ redirectStarted: true, shouldNavigate: false });
  });

  it("replaces the current same-origin location with the login route", () => {
    const destinations: string[] = [];

    replaceLocationWithLogin({
      replace: (destination) => {
        destinations.push(String(destination));
      },
    });

    expect(destinations).toEqual(["/auth/login"]);
  });
});

import { describe, expect, it } from "vitest";
import {
  canControlCinema,
  canTransitionCinemaSession,
  cinemaPrivacyContract,
  createCinemaCommandKey,
  decideDriftCorrection,
  estimateCanonicalPosition,
  type CinemaPlaybackSnapshot,
} from "../src/v2/features/cinema/contracts";

const snapshot: CinemaPlaybackSnapshot = {
  mediaId: "media-1",
  mediaVersion: 2,
  positionMs: 10_000,
  playing: true,
  playbackRate: 1,
  sequence: 8,
  serverTimestamp: "2026-07-23T10:00:00.000Z",
  lastAction: "play",
};

describe("V2-019 Cinema synchronization contracts", () => {
  it("estimates playback from the server timestamp instead of the local anchor alone", () => {
    expect(estimateCanonicalPosition(snapshot, "2026-07-23T10:00:02.500Z")).toBe(12_500);
    expect(
      estimateCanonicalPosition({ ...snapshot, playing: false }, "2026-07-23T10:01:00.000Z"),
    ).toBe(10_000);
  });

  it("uses bounded smooth correction and a hard seek only for large drift", () => {
    expect(decideDriftCorrection(10_000, 10_200)).toEqual({ kind: "none", targetMs: 10_200 });
    expect(decideDriftCorrection(10_000, 11_000)).toMatchObject({ kind: "smooth", rate: 1.05 });
    expect(decideDriftCorrection(12_000, 11_000)).toMatchObject({ kind: "smooth", rate: 0.95 });
    expect(decideDriftCorrection(2_000, 8_000)).toEqual({ kind: "seek", targetMs: 8_000 });
  });

  it("keeps playback control role-based", () => {
    expect(canControlCinema("host", "seek")).toBe(true);
    expect(canControlCinema("cohost", "pause")).toBe(true);
    expect(canControlCinema("moderator", "end")).toBe(true);
    expect(canControlCinema("moderator", "seek")).toBe(false);
    expect(canControlCinema("participant", "play")).toBe(false);
  });

  it("enforces an explicit terminal session state machine", () => {
    expect(canTransitionCinemaSession("draft", "scheduled")).toBe(true);
    expect(canTransitionCinemaSession("scheduled", "live")).toBe(false);
    expect(canTransitionCinemaSession("live", "paused")).toBe(true);
    expect(canTransitionCinemaSession("ended", "live")).toBe(false);
    expect(canTransitionCinemaSession("cancelled", "scheduled")).toBe(false);
  });

  it("requires cryptographically shaped command identifiers", () => {
    expect(createCinemaCommandKey(() => "018f4bb2-fad4-7ccf-8c4f-7a7cf44f0192")).toBe(
      "018f4bb2-fad4-7ccf-8c4f-7a7cf44f0192",
    );
    expect(() => createCinemaCommandKey(() => "predictable")).toThrow(
      "secure_cinema_command_key_unavailable",
    );
  });

  it("keeps media, chat, authority and telemetry boundaries closed", () => {
    expect(cinemaPrivacyContract).toEqual({
      mediaInGitAllowed: false,
      publicPlaybackFailsClosed: true,
      signedPrivatePlaybackRequired: true,
      chatUsesConversationCore: true,
      localClockIsAuthority: false,
      telemetryContainsPii: false,
    });
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  cinemaRepositoryBoundaries,
  parseCinemaHub,
  parseCinemaSession,
} from "../src/v2/features/cinema/repository";
import { resolveV2FeatureFlags } from "../src/v2/platform/feature-flags";

const migration = readFileSync(
  new URL("../supabase/migrations/20260723000014_v2_cinema_watch_party.sql", import.meta.url),
  "utf8",
);

describe("V2-019 Cinema security contracts", () => {
  it("keeps the feature and public operation gates closed by default", () => {
    expect(resolveV2FeatureFlags({}).cinema).toBe(false);
    expect(resolveV2FeatureFlags({ VITE_FF_V2_CINEMA: "TRUE" }).cinema).toBe(false);
    expect(resolveV2FeatureFlags({ VITE_FF_V2_CINEMA: "true" }).cinema).toBe(true);
    expect(migration).toMatch(/upload_enabled boolean NOT NULL DEFAULT false/i);
    expect(migration).toMatch(/public_playback_enabled boolean NOT NULL DEFAULT false/i);
    expect(migration).toMatch(/legal_approval_recorded boolean NOT NULL DEFAULT false/i);
  });

  it("models media, processing, sessions, participants and append-only controls", () => {
    for (const table of [
      "cinema_media_v2",
      "cinema_media_processing_v2",
      "cinema_sessions_v2",
      "cinema_participants_v2",
      "cinema_control_events_v2",
    ]) {
      expect(migration).toContain(`CREATE TABLE public.${table}`);
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(migration).toMatch(/UNIQUE \(session_id, idempotency_key\)/i);
    expect(migration).toMatch(/playback_sequence = playback_sequence \+ 1/i);
  });

  it("requires authentication, participant visibility and server-side control authorization", () => {
    expect(migration).toMatch(/_uid uuid := auth\.uid\(\)/i);
    expect(migration).toMatch(/cinema_control_forbidden/i);
    expect(migration).toMatch(/cinema_sequence_conflict/i);
    expect(migration).toMatch(/FOR UPDATE OF session/i);
    expect(migration).toMatch(/_role NOT IN \('host', 'cohost'\)/i);
  });

  it("reuses the Conversations core and does not create a chat/messages table", () => {
    expect(migration).toMatch(
      /conversation_thread_id uuid REFERENCES public\.conversation_threads_v2\(id\)/i,
    );
    expect(migration).not.toMatch(/CREATE TABLE public\.cinema_(chat|messages)/i);
    expect(migration).not.toMatch(/CREATE TABLE public\.storage\./i);
  });

  it("requires ready, licensed and moderated media before session delivery", () => {
    expect(migration).toMatch(/media\.status = 'ready'/i);
    expect(migration).toMatch(/media\.rights_status = 'approved'/i);
    expect(migration).toMatch(/media\.moderation_status = 'approved'/i);
    expect(migration).not.toMatch(/playback_manifest_path['"]?\s*,?\s*'https?:/i);
  });

  it("returns a bounded presentation contract without storage paths or signed URLs", () => {
    const session = parseCinemaSession({
      id: "session-1",
      title: "Encontro",
      state: "live",
      source_bucket: "private-secret",
      media: {
        id: "media-1",
        title: "Conteúdo autorizado",
        status: "ready",
        rights_status: "approved",
        moderation_status: "approved",
        source_path: "owner/file.mp4",
      },
      playback: { media_id: "media-1", sequence: 2 },
    });
    expect(session).not.toHaveProperty("source_bucket");
    expect(session.media).not.toHaveProperty("source_path");
    expect(JSON.stringify(session)).not.toContain("owner/file.mp4");
  });

  it("fails closed when hub gates or collections are absent", () => {
    expect(parseCinemaHub({}).gates).toEqual({
      uploadEnabled: false,
      publicPlaybackEnabled: false,
      legalApprovalRecorded: false,
    });
    expect(parseCinemaHub({}).featured).toEqual([]);
  });

  it("keeps the UI adapter free of session objects and direct upload authority", () => {
    expect(cinemaRepositoryBoundaries).toMatchObject({
      presentationReceivesSession: false,
      presentationReceivesSignedPlaybackUrl: false,
      chatRepositoryCreated: false,
      storageUploadEnabled: false,
      publicPlaybackEnabled: false,
      controlAuthorityServerSide: true,
    });
  });
});

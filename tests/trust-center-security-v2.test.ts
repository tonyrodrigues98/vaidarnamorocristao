import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseTrustCenter, trustRepositoryBoundaries } from "../src/v2/features/trust/repository";
import { resolveV2FeatureFlags } from "../src/v2/platform/feature-flags";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260723000015_v2_notifications_trust_support.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("V2-020 Trust Center security", () => {
  it("keeps the feature flag exact and closed by default", () => {
    expect(resolveV2FeatureFlags({}).trust).toBe(false);
    expect(resolveV2FeatureFlags({ VITE_FF_V2_TRUST_CENTER: "TRUE" }).trust).toBe(false);
    expect(resolveV2FeatureFlags({ VITE_FF_V2_TRUST_CENTER: "true" }).trust).toBe(true);
  });

  it("separates domain facts, preferences, delivery and the preserved inbox", () => {
    expect(migration).toContain("CREATE TABLE public.notification_domain_events_v2");
    expect(migration).toContain("CREATE TABLE public.notification_preferences_v2");
    expect(migration).toContain("CREATE TABLE public.notification_delivery_attempts_v2");
    expect(migration).toMatch(/notification_id uuid REFERENCES public\.notifications\(id\)/i);
    expect(migration).toMatch(/UNIQUE \(recipient_id, domain, dedupe_key\)/i);
  });

  it("fails closed for essential security inbox preferences", () => {
    expect(migration).toMatch(/CHECK \(category <> 'security' OR inbox_enabled\)/i);
    expect(migration).toMatch(
      /CASE WHEN _category = 'security' THEN true ELSE _inbox_enabled END/i,
    );
    expect(migration).toMatch(/IF _domain = 'security' THEN\s+_essential := true/is);
  });

  it("centralizes blocking without turning mute or report into a block", () => {
    expect(migration).toMatch(/global block restricts notification visibility/i);
    expect(migration).toMatch(/global block restricts cinema sessions/i);
    expect(migration).toContain("CREATE TABLE public.user_mutes_v2");
    expect(migration).toContain("CREATE TABLE public.moderation_cases_v2");
    expect(migration).not.toMatch(/INSERT INTO public\.blocks[\s\S]{0,300}moderation_cases_v2/i);
  });

  it("preserves support tickets, messages and attachments", () => {
    expect(migration).toContain("CREATE TABLE public.support_ticket_context_v2");
    expect(migration).toMatch(
      /ticket_id uuid PRIMARY KEY REFERENCES public\.support_tickets\(id\)/i,
    );
    expect(migration).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM public\.support_/i);
    expect(migration).not.toMatch(/support-attachments[\s\S]*public\s*=\s*true/i);
  });

  it("keeps event creation server-only and hides push queue details", () => {
    expect(migration).toMatch(
      /record_notification_domain_event_v2[\s\S]+FROM PUBLIC, anon, authenticated/i,
    );
    expect(migration).toMatch(/record_notification_domain_event_v2[\s\S]+TO service_role/i);
    expect(migration).not.toMatch(/SELECT[\s\S]{0,100}FROM public\.push_queue/i);
    expect(trustRepositoryBoundaries.pushQueueReadable).toBe(false);
  });

  it("parses a bounded center without evidence, attachments, actor or session data", () => {
    const center = parseTrustCenter({
      notifications: [
        {
          id: "n-1",
          type: "message",
          title: "Nova atualização",
          body: "Conteúdo neutro",
          link: "/v2/conversas",
          actor_id: "hidden",
          access_token: "hidden",
        },
      ],
      support_tickets: [
        { id: "t-1", title: "Ajuda", category: "account", status: "open", attachments: ["x"] },
      ],
      moderation_evidence: "hidden",
    });
    expect(JSON.stringify(center)).not.toMatch(/actor_id|access_token|attachments|evidence/i);
    expect(center.notifications[0].category).toBe("conversations");
  });

  it("keeps photo verification pending instead of inferring approval", () => {
    expect(parseTrustCenter({ photo_verification: "pending" }).photoVerification).toBe("pending");
    expect(parseTrustCenter({ photo_verification: "provider-error" }).photoVerification).toBe(
      "not-started",
    );
    expect(migration).not.toMatch(/provider_error[\s\S]{0,100}approved/i);
  });
});

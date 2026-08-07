import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import { rewriteNotificationLink } from "../src/config/notification-links";
import { getNativeSecondaryDestinationChrome } from "../src/config/native-secondary-destinations";
import { getNativeDestinationTitle } from "../src/config/native-top-bar";

describe("native notifications center", () => {
  it("inherits Home and resolves its contextual title", () => {
    const behavior = getDestinationBehavior("/notificacoes");
    expect(behavior.futureTab).toBe("home");
    expect(getNativeSecondaryDestinationChrome(behavior.destinationId)).toEqual({
      destinationId: "app-notifications",
      title: "Notificações",
      parentTab: "home",
      parentPath: "/inicio",
    });
    expect(getNativeDestinationTitle(behavior.destinationId, "home")).toBe("Notificações");
  });

  it("rewrites Community according to rollout without touching valid or unknown links", () => {
    expect(rewriteNotificationLink("/comunidade", false)).toBe("/conversas");
    expect(rewriteNotificationLink("/comunidade/post", false)).toBe("/conversas");
    expect(rewriteNotificationLink("/comunidade", true)).toBe("/comunidade");
    expect(rewriteNotificationLink("/comunidade/post", true)).toBe("/comunidade");
    expect(rewriteNotificationLink("/dashboard", true)).toBe("/dashboard");
    expect(rewriteNotificationLink("/desconhecido", false)).toBe("/desconhecido");
    expect(rewriteNotificationLink(null, true)).toBeNull();
  });

  it("keeps one notification data owner and no backend in native views", () => {
    const route = readFileSync("src/routes/notificacoes.tsx", "utf8");
    const view = readFileSync(
      "src/components/notifications/native/NativeNotificationsView.tsx",
      "utf8",
    );
    const row = readFileSync(
      "src/components/notifications/native/NativeNotificationRow.tsx",
      "utf8",
    );

    expect(route.match(/useNotifications\(100\)/g)).toHaveLength(1);
    expect(route).toContain("<NativeNotificationsView");
    expect(route).toContain("pendingTimers");
    expect(route).toContain('label: "Desfazer"');
    expect(route).toContain("markAllRead");
    expect(route).toContain("markRead");
    expect(view).toContain("aria-pressed={filter === id}");
    expect(view).toContain("EnableNotificationsCard");
    expect(view).toContain("OfflineState");
    expect(row).toContain('aria-label="Apagar notificação"');
    expect(`${view}\n${row}`).not.toMatch(/supabase|useNotifications|\.channel\(|\.from\(/);
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import { getNativeSecondaryDestinationChrome } from "../src/config/native-secondary-destinations";

describe("native support workspace", () => {
  it.each([
    ["/suporte", "support-root", "Suporte", "/perfil"],
    ["/suporte/ajuda", "support-help", "Central de Ajuda", "/suporte"],
    ["/suporte/teste", "support-ticket", "Chamado", "/suporte"],
  ])("classifies %s without prefix capture", (path, id, title, parentPath) => {
    const behavior = getDestinationBehavior(path);
    expect(behavior).toMatchObject({ destinationId: id, futureTab: "profile" });
    expect(getNativeSecondaryDestinationChrome(id)).toMatchObject({
      title,
      parentTab: "profile",
      parentPath,
    });
  });

  it("preserves ticket list, filters, attachment limits and client navigation", () => {
    const source = readFileSync("src/routes/suporte/index.tsx", "utf8");
    for (const contract of [
      'from("support_tickets")',
      '.channel("support_tickets_list")',
      ".limit(200)",
      'from("support-attachments")',
      'from("support_messages")',
      ".slice(0, 5)",
      'to: "/suporte/$id"',
    ])
      expect(source).toContain(contract);
    expect(source).not.toContain("window.location.href");
  });

  it("preserves ticket realtime, private signed attachments and help CRUD", () => {
    const detail = readFileSync("src/routes/suporte/$id.tsx", "utf8");
    expect(detail.match(/\.channel\(`support_ticket_\$\{id\}`\)/g)).toHaveLength(1);
    expect(detail).toContain(".createSignedUrls(paths, 3600)");
    expect(detail).toContain('from("support-attachments")');

    const help = readFileSync("src/routes/suporte/ajuda.tsx", "utf8");
    for (const contract of [
      'from("support_articles")',
      'rpc("increment_article_views"',
      ".insert(payload)",
      ".update(payload)",
      ".delete()",
    ])
      expect(help).toContain(contract);
  });
});

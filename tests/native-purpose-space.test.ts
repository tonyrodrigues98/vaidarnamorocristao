import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import { getNativeSecondaryDestinationChrome } from "../src/config/native-secondary-destinations";

describe("native purpose space", () => {
  it("inherits Messages with contextual chrome", () => {
    const behavior = getDestinationBehavior("/proposito/teste");
    expect(behavior).toMatchObject({ destinationId: "app-purpose", futureTab: "messages" });
    expect(getNativeSecondaryDestinationChrome("app-purpose")).toEqual({
      destinationId: "app-purpose",
      title: "Propósito",
      parentTab: "messages",
      parentPath: "/conversas",
    });
  });

  it("preserves authorization, realtime, reads, sends and commitment end", () => {
    const source = readFileSync("src/routes/proposito/$matchId.tsx", "utf8");
    for (const contract of [
      "getCommitmentByMatch",
      "endCommitment",
      ".channel(`couple-chat-${matchId}`)",
      'from("messages")',
      'from("gift_transactions")',
      'rpc("mark_message_read"',
      "restricted",
    ])
      expect(source).toContain(contract);
    expect(source.match(/\.channel\(`couple-chat-\$\{matchId\}`\)/g)).toHaveLength(1);
  });
});

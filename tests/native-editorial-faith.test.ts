import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import { getNativeSecondaryDestinationChrome } from "../src/config/native-secondary-destinations";
import { isNativeShellEligibleDestination } from "../src/config/native-shell-feature";

describe("native editorial and faith surfaces", () => {
  it.each([
    ["/devocional", "app-devotional", "explore", "Devocional"],
    ["/noticias", "app-news", "community", "Notícias"],
    ["/oracoes", "app-prayers", "community", "Orações"],
    ["/quiz-biblico", "app-bible-quiz", "explore", "Quiz Bíblico"],
  ] as const)("classifies %s with native parent chrome", (path, id, parentTab, title) => {
    const behavior = getDestinationBehavior(path);
    expect(behavior).toMatchObject({ destinationId: id, futureTab: parentTab });
    expect(isNativeShellEligibleDestination(behavior)).toBe(true);
    expect(getNativeSecondaryDestinationChrome(id)).toMatchObject({ title, parentTab });
  });

  it("treats news as approved application data", () => {
    expect(getDestinationBehavior("/noticias")).toMatchObject({
      shell: "app",
      access: "approved",
    });
  });

  it("preserves devotional and news data/realtime contracts", () => {
    const devotional = readFileSync("src/routes/devocional.tsx", "utf8");
    for (const contract of [
      'from("daily_posts")',
      'from("devotional_reactions")',
      'from("devotional_comments")',
      'rpc("get_prayer_streak"',
      '.channel("devocional-live")',
    ])
      expect(devotional).toContain(contract);

    const news = readFileSync("src/routes/noticias.index.tsx", "utf8");
    expect(news).toContain('["news-posts", user?.id]');
    expect(news).toContain('from("daily_posts")');
    expect(news).toContain('.channel("daily-posts")');
  });

  it("preserves prayer privacy/realtime and quiz RPCs", () => {
    const prayers = readFileSync("src/routes/oracoes.tsx", "utf8");
    expect(prayers).toContain('from("prayer_requests")');
    expect(prayers).toContain('.channel("prayer-requests-live")');
    expect(prayers).toContain("is_anonymous");

    const quiz = readFileSync("src/routes/quiz-biblico.tsx", "utf8");
    expect(quiz).toContain('rpc("get_today_quiz"');
    expect(quiz).toContain(')("answer_quiz"');
  });
});

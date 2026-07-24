import { describe, expect, it } from "vitest";
import bibleData from "../src/data/bible-pt.json";
import {
  normalizeInternalShareReference,
  sanitizeBibleStructure,
  verboPrivacyContract,
} from "../src/v2/features/content/contracts";
import {
  parseChristianContentSnapshot,
  parseVerboNote,
} from "../src/v2/features/content/repository";

describe("V2-018 Christian content and Verbo contracts", () => {
  it("uses the existing 66-book topology without treating it as licensed verse text", () => {
    const books = sanitizeBibleStructure(bibleData);
    expect(books).toHaveLength(66);
    expect(books[0]).toMatchObject({ code: "gn" });
    expect(books.every((book) => book.versesPerChapter.length > 0)).toBe(true);
    expect(JSON.stringify(books)).not.toMatch(/No princípio|Porque Deus amou/i);
  });

  it("fails closed when no licensed version is enabled", () => {
    const snapshot = parseChristianContentSnapshot({});
    expect(snapshot.versions).toEqual([]);
    expect(snapshot.gates).toEqual({
      licensedBibleAvailable: false,
      conversationalExploration: false,
      offlineDownload: false,
      socialProgress: false,
    });
  });

  it("parses editorial content and private records into bounded contracts", () => {
    const snapshot = parseChristianContentSnapshot({
      devotionals: [
        {
          id: "post-1",
          title: "Esperança",
          content: "Uma reflexão.",
          bible_reference: "Romanos 12:12",
        },
        { id: "", title: "Inválido" },
      ],
      versions: [
        {
          id: "version-1",
          code: "licensed",
          name: "Versão licenciada",
          copyright_notice: "Licença aprovada",
          offline_allowed: true,
        },
      ],
      notes: [{ id: "note-1", passage_id: "passage-1", content: "Pessoal", version: 2 }],
      bookmark_passage_ids: ["passage-1", 42],
      gates: { licensed_bible_available: true },
    });
    expect(snapshot.devotionals).toHaveLength(1);
    expect(snapshot.versions).toHaveLength(1);
    expect(snapshot.notes[0].version).toBe(2);
    expect(snapshot.bookmarkPassageIds).toEqual(["passage-1"]);
    expect(snapshot.gates.licensedBibleAvailable).toBe(true);
  });

  it("does not expose arbitrary database fields through a note receipt", () => {
    expect(
      parseVerboNote({
        id: "note-1",
        passage_id: "passage-1",
        content: "Minha anotação",
        version: 3,
        updated_at: "2026-07-23T12:00:00Z",
        user_id: "private",
      }),
    ).toEqual({
      id: "note-1",
      passageId: "passage-1",
      content: "Minha anotação",
      version: 3,
      updatedAt: "2026-07-23T12:00:00Z",
    });
  });

  it("keeps sharing opt-in and accepts only a bounded textual reference", () => {
    expect(normalizeInternalShareReference("João 3:16")).toBe("João 3:16");
    expect(normalizeInternalShareReference("javascript:alert(1)")).toBeNull();
    expect(normalizeInternalShareReference("https://attacker.example")).toBeNull();
    expect(verboPrivacyContract).toMatchObject({
      sharingRequiresExplicitAction: true,
      spiritualityRankingAllowed: false,
      paidAiEnabled: false,
    });
  });
});

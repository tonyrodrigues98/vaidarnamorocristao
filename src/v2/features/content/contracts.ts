export interface ChristianDevotional {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly bibleReference: string | null;
  readonly bibleText: string | null;
  readonly publishedAt: string;
}

export interface BibleVersion {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly language: string;
  readonly copyrightNotice: string;
  readonly offlineAllowed: boolean;
  readonly searchAllowed: boolean;
}

export interface VerboNote {
  readonly id: string;
  readonly passageId: string;
  readonly content: string;
  readonly version: number;
  readonly updatedAt: string;
}

export interface VerboPassage {
  readonly id: string;
  readonly verse: number;
  readonly text: string;
}

export interface VerboGates {
  readonly licensedBibleAvailable: boolean;
  readonly conversationalExploration: boolean;
  readonly offlineDownload: boolean;
  readonly socialProgress: boolean;
}

export interface ChristianContentSnapshot {
  readonly devotionals: readonly ChristianDevotional[];
  readonly versions: readonly BibleVersion[];
  readonly notes: readonly VerboNote[];
  readonly bookmarkPassageIds: readonly string[];
  readonly gates: VerboGates;
}

export interface ChristianContentRepository {
  loadHub(userId: string): Promise<ChristianContentSnapshot>;
  loadChapter(
    userId: string,
    versionId: string,
    bookCode: string,
    chapter: number,
  ): Promise<readonly VerboPassage[]>;
  saveNote(
    userId: string,
    passageId: string,
    content: string,
    expectedVersion: number | null,
  ): Promise<VerboNote>;
  toggleBookmark(
    userId: string,
    passageId: string,
  ): Promise<{ readonly passageId: string; readonly bookmarked: boolean }>;
}

export interface BibleBookStructure {
  readonly code: string;
  readonly name: string;
  readonly versesPerChapter: readonly number[];
}

export const verboPrivacyContract = Object.freeze({
  notesPrivateByDefault: true,
  bookmarksPrivateByDefault: true,
  progressPrivateByDefault: true,
  sharingRequiresExplicitAction: true,
  spiritualityRankingAllowed: false,
  prayerAsPublicProofAllowed: false,
  paidAiEnabled: false,
});

export function sanitizeBibleStructure(
  value: readonly { readonly a?: unknown; readonly n?: unknown; readonly v?: unknown }[],
): readonly BibleBookStructure[] {
  return value
    .filter(
      (entry) =>
        typeof entry.a === "string" &&
        typeof entry.n === "string" &&
        Array.isArray(entry.v) &&
        entry.v.every((count) => typeof count === "number" && count > 0),
    )
    .map((entry) => ({
      code: entry.a as string,
      name: entry.n as string,
      versesPerChapter: Object.freeze([...(entry.v as number[])]),
    }));
}

export function normalizeInternalShareReference(reference: string): string | null {
  const normalized = reference.trim();
  return /^[\p{L}0-9 .:-]{3,120}$/u.test(normalized) ? normalized : null;
}

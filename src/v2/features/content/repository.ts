import { supabase } from "@/integrations/supabase/client";
import type {
  BibleVersion,
  ChristianContentRepository,
  ChristianContentSnapshot,
  ChristianDevotional,
  VerboNote,
  VerboPassage,
} from "./contracts";

type JsonRecord = Record<string, unknown>;
const SAFE_ERROR = "Não foi possível sincronizar o conteúdo cristão agora.";

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function nullableText(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function positiveInteger(value: unknown, fallback = 1) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.trunc(value))
    : fallback;
}

function parseDevotional(value: unknown): ChristianDevotional | null {
  if (!isRecord(value) || !text(value.id) || !text(value.title)) return null;
  return {
    id: text(value.id),
    title: text(value.title),
    content: text(value.content),
    bibleReference: nullableText(value.bible_reference),
    bibleText: nullableText(value.bible_text),
    publishedAt: text(value.published_at),
  };
}

function parseVersion(value: unknown): BibleVersion | null {
  if (!isRecord(value) || !text(value.id) || !text(value.code) || !text(value.name)) return null;
  return {
    id: text(value.id),
    code: text(value.code),
    name: text(value.name),
    language: text(value.language, "pt-BR"),
    copyrightNotice: text(value.copyright_notice),
    offlineAllowed: value.offline_allowed === true,
    searchAllowed: value.search_allowed === true,
  };
}

export function parseVerboNote(value: unknown): VerboNote {
  const row = isRecord(value) ? value : {};
  return {
    id: text(row.id),
    passageId: text(row.passage_id),
    content: text(row.content),
    version: positiveInteger(row.version),
    updatedAt: text(row.updated_at),
  };
}

function parsePassage(value: unknown): VerboPassage | null {
  if (!isRecord(value) || !text(value.id)) return null;
  return {
    id: text(value.id),
    verse: positiveInteger(value.verse),
    text: text(value.text),
  };
}

export function parseChristianContentSnapshot(value: unknown): ChristianContentSnapshot {
  const row = isRecord(value) ? value : {};
  const gates = isRecord(row.gates) ? row.gates : {};
  return {
    devotionals: Array.isArray(row.devotionals)
      ? row.devotionals
          .map(parseDevotional)
          .filter((item): item is ChristianDevotional => item !== null)
      : [],
    versions: Array.isArray(row.versions)
      ? row.versions.map(parseVersion).filter((item): item is BibleVersion => item !== null)
      : [],
    notes: Array.isArray(row.notes) ? row.notes.map(parseVerboNote) : [],
    bookmarkPassageIds: Array.isArray(row.bookmark_passage_ids)
      ? row.bookmark_passage_ids.filter((id): id is string => typeof id === "string")
      : [],
    gates: {
      licensedBibleAvailable: gates.licensed_bible_available === true,
      conversationalExploration: gates.conversational_exploration === true,
      offlineDownload: gates.offline_download === true,
      socialProgress: gates.social_progress === true,
    },
  };
}

async function rpc<T>(name: string, args?: JsonRecord): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw new Error(SAFE_ERROR);
  return data as T;
}

export const supabaseChristianContentRepository: ChristianContentRepository = {
  async loadHub(_userId) {
    return parseChristianContentSnapshot(await rpc("get_christian_content_hub_v2"));
  },
  async loadChapter(_userId, versionId, bookCode, chapter) {
    const value = await rpc<unknown>("get_verbo_chapter_v2", {
      _version_id: versionId,
      _book_code: bookCode,
      _chapter: chapter,
    });
    return Array.isArray(value)
      ? value.map(parsePassage).filter((item): item is VerboPassage => item !== null)
      : [];
  },
  async saveNote(_userId, passageId, content, expectedVersion) {
    return parseVerboNote(
      await rpc("save_verbo_note_v2", {
        _passage_id: passageId,
        _content: content,
        _expected_version: expectedVersion,
      }),
    );
  },
  async toggleBookmark(_userId, passageId) {
    const value = await rpc<unknown>("toggle_verbo_bookmark_v2", {
      _passage_id: passageId,
    });
    const row = isRecord(value) ? value : {};
    return { passageId: text(row.passage_id), bookmarked: row.bookmarked === true };
  },
};

export const christianContentRepositoryBoundaries = Object.freeze({
  editorialAuthorityServerSide: true,
  licenseGateFailsClosed: true,
  privateNotebookOwnerOnly: true,
  presentationReceivesSession: false,
  externalBibleApiCanonical: false,
  aiConversationEnabled: false,
});

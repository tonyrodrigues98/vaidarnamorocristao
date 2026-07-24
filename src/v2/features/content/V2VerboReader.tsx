import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookOpen, NotebookPen, ShieldCheck } from "lucide-react";
import bibleData from "@/data/bible-pt.json";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
  V2TextArea,
} from "@/v2/design-system";
import {
  sanitizeBibleStructure,
  type BibleVersion,
  type ChristianContentRepository,
  type VerboNote,
} from "./contracts";

const BOOKS = sanitizeBibleStructure(bibleData);

export default function V2VerboReader({
  userId,
  versions,
  notes,
  bookmarks,
  repository,
}: {
  readonly userId: string;
  readonly versions: readonly BibleVersion[];
  readonly notes: readonly VerboNote[];
  readonly bookmarks: readonly string[];
  readonly repository: ChristianContentRepository;
}) {
  const queryClient = useQueryClient();
  const [versionId, setVersionId] = useState(versions[0]?.id ?? "");
  const [bookCode, setBookCode] = useState(BOOKS[0]?.code ?? "");
  const [chapter, setChapter] = useState(1);
  const [selectedPassageId, setSelectedPassageId] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [feedback, setFeedback] = useState("");
  const selectedBook = BOOKS.find((book) => book.code === bookCode) ?? BOOKS[0];
  const chapterKey = useMemo(
    () => ["v2", "verbo-chapter", userId, versionId, bookCode, chapter] as const,
    [bookCode, chapter, userId, versionId],
  );
  const passages = useQuery({
    queryKey: chapterKey,
    queryFn: () => repository.loadChapter(userId, versionId, bookCode, chapter),
    enabled: !!versionId && !!bookCode,
    staleTime: 60_000,
  });
  const selected = passages.data?.find((passage) => passage.id === selectedPassageId) ?? null;
  const existingNote = notes.find((note) => note.passageId === selectedPassageId) ?? null;

  const saveNote = useMutation({
    mutationFn: () =>
      repository.saveNote(userId, selectedPassageId, noteContent, existingNote?.version ?? null),
    onSuccess: () => {
      setFeedback("Anotação privada salva.");
      void queryClient.invalidateQueries({ queryKey: ["v2", "christian-content", userId] });
    },
    onError: () => setFeedback("A anotação não foi salva. Recarregue antes de tentar novamente."),
  });
  const toggleBookmark = useMutation({
    mutationFn: () => repository.toggleBookmark(userId, selectedPassageId),
    onSuccess: ({ bookmarked }) => {
      setFeedback(
        bookmarked ? "Versículo salvo nos favoritos." : "Versículo removido dos favoritos.",
      );
      void queryClient.invalidateQueries({ queryKey: ["v2", "christian-content", userId] });
    },
    onError: () => setFeedback("Não foi possível alterar o favorito."),
  });

  if (!versions.length) {
    return (
      <V2Surface className="vdn-v2-content__state">
        <ShieldCheck aria-hidden="true" />
        <V2Heading level={3} size="small">
          Texto bíblico aguardando licença
        </V2Heading>
        <V2Text tone="muted">
          Nenhuma versão canônica foi habilitada. O Verbo não buscará texto em uma API externa sem
          fonte, licença e atribuição aprovadas.
        </V2Text>
        <V2StatusBadge tone="warning">Gate editorial fechado</V2StatusBadge>
      </V2Surface>
    );
  }

  return (
    <section className="vdn-v2-content__reader" aria-labelledby="vdn-v2-verbo-reader-title">
      <V2Surface className="vdn-v2-content__reader-controls" elevation="one">
        <div>
          <V2Heading id="vdn-v2-verbo-reader-title" level={3} size="small">
            Bíblia
          </V2Heading>
          <V2Text tone="muted">Leitura pessoal. Nada é compartilhado automaticamente.</V2Text>
        </div>
        <label>
          <span>Versão</span>
          <select value={versionId} onChange={(event) => setVersionId(event.currentTarget.value)}>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Livro</span>
          <select
            value={bookCode}
            onChange={(event) => {
              setBookCode(event.currentTarget.value);
              setChapter(1);
              setSelectedPassageId("");
            }}
          >
            {BOOKS.map((book) => (
              <option key={book.code} value={book.code}>
                {book.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Capítulo</span>
          <select
            value={chapter}
            onChange={(event) => {
              setChapter(Number(event.currentTarget.value));
              setSelectedPassageId("");
            }}
          >
            {selectedBook.versesPerChapter.map((_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
        </label>
      </V2Surface>

      {passages.isPending ? (
        <V2Surface className="vdn-v2-content__state" aria-live="polite">
          <V2LoadingIndicator label="Carregando capítulo" />
        </V2Surface>
      ) : passages.isError ? (
        <V2Surface className="vdn-v2-content__state" role="alert">
          <V2Text>Não foi possível carregar este capítulo.</V2Text>
          <V2Button variant="secondary" onClick={() => void passages.refetch()}>
            Tentar novamente
          </V2Button>
        </V2Surface>
      ) : (
        <V2Surface as="article" className="vdn-v2-content__passages">
          <V2Heading level={3} size="medium">
            {selectedBook.name} {chapter}
          </V2Heading>
          {passages.data?.length ? (
            <ol>
              {passages.data.map((passage) => (
                <li key={passage.id}>
                  <button
                    type="button"
                    className={selectedPassageId === passage.id ? "is-selected" : undefined}
                    aria-pressed={selectedPassageId === passage.id}
                    onClick={() => {
                      setSelectedPassageId(passage.id);
                      setNoteContent(
                        notes.find((note) => note.passageId === passage.id)?.content ?? "",
                      );
                    }}
                  >
                    <sup>{passage.verse}</sup> {passage.text}
                    {bookmarks.includes(passage.id) ? <Bookmark aria-label="Favorito" /> : null}
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <V2Text tone="muted">Nenhum versículo publicado neste capítulo.</V2Text>
          )}
        </V2Surface>
      )}

      {selected ? (
        <V2Surface className="vdn-v2-content__notebook" elevation="two">
          <div>
            <NotebookPen aria-hidden="true" />
            <V2Heading level={3} size="small">
              Caderno privado
            </V2Heading>
          </div>
          <V2TextArea
            label={`Anotação sobre ${selectedBook.name} ${chapter}:${selected.verse}`}
            value={noteContent}
            maxLength={12_000}
            rows={5}
            onChange={(event) => setNoteContent(event.currentTarget.value)}
          />
          <div>
            <V2Button
              variant="secondary"
              leadingIcon={<Bookmark />}
              loading={toggleBookmark.isPending}
              onClick={() => toggleBookmark.mutate()}
            >
              {bookmarks.includes(selected.id) ? "Remover favorito" : "Favoritar"}
            </V2Button>
            <V2Button
              loading={saveNote.isPending}
              disabled={!noteContent.trim()}
              onClick={() => saveNote.mutate()}
            >
              Salvar anotação
            </V2Button>
          </div>
        </V2Surface>
      ) : null}

      {feedback ? (
        <p className="vdn-v2-content__feedback" role="status">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}

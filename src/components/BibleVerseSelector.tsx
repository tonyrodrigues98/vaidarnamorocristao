import { useEffect, useMemo, useState } from "react";
import { Book, BookOpen, Hash, Loader2, X } from "lucide-react";
import bibleData from "@/data/bible-pt.json";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";

type BibleBook = { a: string; n: string; v: number[] };
const BOOKS = bibleData as BibleBook[];

export type BibleSelection = {
  book: string;        // PT name
  abbrev: string;      // 'gn'
  chapter: number;
  verse: number;
  reference: string;   // "João 3:16"
  text: string;        // verse content
};

export interface BibleVerseSelectorProps {
  value: BibleSelection | null;
  onChange: (sel: BibleSelection | null) => void;
}

// Cache fetched verses in-memory
const verseCache = new Map<string, string>();

async function fetchVerse(bookName: string, chapter: number, verse: number): Promise<string> {
  const key = `${bookName}|${chapter}|${verse}`;
  const cached = verseCache.get(key);
  if (cached !== undefined) return cached;
  const ref = `${bookName} ${chapter}:${verse}`;
  const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=almeida`);
  if (!res.ok) throw new Error("Não foi possível carregar o versículo");
  const data = (await res.json()) as { text?: string };
  const text = (data.text ?? "").trim();
  verseCache.set(key, text);
  return text;
}

export function BibleVerseSelector({ value, onChange }: BibleVerseSelectorProps) {
  const [bookOpen, setBookOpen] = useState(false);
  const [chapterOpen, setChapterOpen] = useState(false);
  const [verseOpen, setVerseOpen] = useState(false);
  const [selBook, setSelBook] = useState<BibleBook | null>(
    value ? BOOKS.find((b) => b.a === value.abbrev) ?? null : null,
  );
  const [selChapter, setSelChapter] = useState<number | null>(value?.chapter ?? null);
  const [selVerse, setSelVerse] = useState<number | null>(value?.verse ?? null);
  const [verseText, setVerseText] = useState<string>(value?.text ?? "");
  const [loading, setLoading] = useState(false);

  const chapters = useMemo(() => (selBook ? selBook.v.map((_, i) => i + 1) : []), [selBook]);
  const verses = useMemo(() => {
    if (!selBook || !selChapter) return [];
    const count = selBook.v[selChapter - 1] ?? 0;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [selBook, selChapter]);

  useEffect(() => {
    if (!selBook || !selChapter || !selVerse) {
      setVerseText("");
      return;
    }
    let active = true;
    setLoading(true);
    fetchVerse(selBook.n, selChapter, selVerse)
      .then((text) => {
        if (!active) return;
        setVerseText(text);
        onChange({
          abbrev: selBook.a,
          book: selBook.n,
          chapter: selChapter,
          verse: selVerse,
          reference: `${selBook.n} ${selChapter}:${selVerse}`,
          text,
        });
      })
      .catch(() => {
        if (!active) return;
        setVerseText("");
        // still emit reference even if text fetch fails
        onChange({
          abbrev: selBook.a,
          book: selBook.n,
          chapter: selChapter,
          verse: selVerse,
          reference: `${selBook.n} ${selChapter}:${selVerse}`,
          text: "",
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selBook, selChapter, selVerse]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.6fr_1fr_1fr]">
        {/* Book */}
        <Popover open={bookOpen} onOpenChange={setBookOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" type="button" className="justify-between font-normal">
              <span className="flex items-center gap-2 truncate">
                <Book className="h-4 w-4 text-[var(--rose)]" />
                {selBook ? selBook.n : "Livro"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar livro..." />
              <CommandList>
                <CommandEmpty>Nenhum livro</CommandEmpty>
                <CommandGroup>
                  {BOOKS.map((b) => (
                    <CommandItem
                      key={b.a}
                      value={b.n}
                      onSelect={() => {
                        setSelBook(b);
                        setSelChapter(null);
                        setSelVerse(null);
                        setBookOpen(false);
                        setChapterOpen(true);
                      }}
                    >
                      {b.n}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Chapter */}
        <Popover open={chapterOpen} onOpenChange={setChapterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" type="button" disabled={!selBook} className="justify-between font-normal">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[var(--rose)]" />
                {selChapter ? `Cap. ${selChapter}` : "Capítulo"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[260px] p-2" align="start">
            <div className="grid max-h-[260px] grid-cols-6 gap-1 overflow-y-auto">
              {chapters.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setSelChapter(c);
                    setSelVerse(null);
                    setChapterOpen(false);
                    setVerseOpen(true);
                  }}
                  className={`rounded-md px-2 py-1.5 text-sm transition ${
                    selChapter === c ? "bg-[var(--rose)] text-white" : "hover:bg-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Verse */}
        <Popover open={verseOpen} onOpenChange={setVerseOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" type="button" disabled={!selChapter} className="justify-between font-normal">
              <span className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-[var(--rose)]" />
                {selVerse ? `v. ${selVerse}` : "Versículo"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[260px] p-2" align="start">
            <div className="grid max-h-[260px] grid-cols-6 gap-1 overflow-y-auto">
              {verses.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setSelVerse(v);
                    setVerseOpen(false);
                  }}
                  className={`rounded-md px-2 py-1.5 text-sm transition ${
                    selVerse === v ? "bg-[var(--rose)] text-white" : "hover:bg-muted"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {value && (
        <div className="rounded-xl border border-[var(--rose)]/20 bg-[var(--petal)]/30 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--rose)]">
              {value.reference}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelBook(null);
                setSelChapter(null);
                setSelVerse(null);
                setVerseText("");
                onChange(null);
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Remover"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 font-serif text-sm italic text-foreground/85">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Carregando versículo...
              </span>
            ) : verseText ? (
              `"${verseText}"`
            ) : (
              <span className="text-muted-foreground">Texto não disponível — apenas a referência será salva.</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
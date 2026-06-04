import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function findRestrictedWord(text: string, words: string[]): string | null {
  if (!text || words.length === 0) return null;
  const norm = normalize(text);
  for (const w of words) {
    const nw = normalize(w).trim();
    if (!nw) continue;
    // word boundary match
    const re = new RegExp(`(^|[^\\p{L}])${escapeRegex(nw)}([^\\p{L}]|$)`, "u");
    if (re.test(norm)) return w;
  }
  return null;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function useRestrictedWords() {
  const [words, setWords] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("restricted_words").select("word");
      if (!active) return;
      setWords((data ?? []).map((r) => r.word));
    })();
    const ch = supabase
      .channel("restricted-words")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restricted_words" },
        async () => {
          const { data } = await supabase.from("restricted_words").select("word");
          if (!active) return;
          setWords((data ?? []).map((r) => r.word));
        },
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);
  return words;
}

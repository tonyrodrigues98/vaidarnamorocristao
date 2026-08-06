import { supabase } from "@/integrations/supabase/client";

// The restricted-word list is staff-only. Regular users check submissions through
// a server-side SECURITY DEFINER function that returns the first matched word.

export async function findRestrictedWord(text: string): Promise<string | null> {
  if (!text) return null;
  const { data, error } = await supabase.rpc("check_text_restricted", { _text: text });
  if (error) return null;
  return (data as string | null) ?? null;
}

// Kept for backwards compatibility with callers; no longer fetches anything.
export function useRestrictedWords(): [] {
  return [];
}

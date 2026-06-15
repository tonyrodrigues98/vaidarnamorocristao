ALTER TABLE public.pet_confessions
  ADD COLUMN IF NOT EXISTS personality_slug TEXT NULL;

CREATE INDEX IF NOT EXISTS pet_confessions_personality_idx
  ON public.pet_confessions (personality_slug)
  WHERE personality_slug IS NOT NULL;
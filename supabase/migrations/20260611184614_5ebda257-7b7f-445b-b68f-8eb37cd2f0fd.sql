ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS is_exclusive boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS pets_is_exclusive_idx ON public.pets(is_exclusive);
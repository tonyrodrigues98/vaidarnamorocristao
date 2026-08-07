
ALTER TABLE public.pet_species
  ADD COLUMN IF NOT EXISTS image_url_baby text,
  ADD COLUMN IF NOT EXISTS image_url_adult text,
  ADD COLUMN IF NOT EXISTS rarity public.pet_rarity NOT NULL DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS is_exclusive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_coins integer NOT NULL DEFAULT 0;

ALTER TABLE public.pet_variants
  ADD COLUMN IF NOT EXISTS image_url_baby text,
  ADD COLUMN IF NOT EXISTS image_url_adult text,
  ADD COLUMN IF NOT EXISTS rarity public.pet_rarity NOT NULL DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS is_exclusive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_coins integer NOT NULL DEFAULT 0;

UPDATE public.pet_species SET image_url_adult = image_url WHERE image_url_adult IS NULL AND image_url IS NOT NULL;
UPDATE public.pet_variants SET image_url_adult = image_url WHERE image_url_adult IS NULL AND image_url IS NOT NULL;

ALTER TABLE public.pet_life_stages
  ADD COLUMN IF NOT EXISTS kind text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pet_life_stages_kind_check'
  ) THEN
    ALTER TABLE public.pet_life_stages
      ADD CONSTRAINT pet_life_stages_kind_check
      CHECK (kind IS NULL OR kind IN ('baby','adult'));
  END IF;
END $$;

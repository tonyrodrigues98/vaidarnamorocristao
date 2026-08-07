ALTER TABLE public.pet_species
  ADD COLUMN IF NOT EXISTS benefit_id uuid REFERENCES public.pet_benefits(id) ON DELETE SET NULL;

ALTER TABLE public.pet_variants
  ADD COLUMN IF NOT EXISTS benefit_id uuid REFERENCES public.pet_benefits(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS pet_species_benefit_id_idx ON public.pet_species(benefit_id);
CREATE INDEX IF NOT EXISTS pet_variants_benefit_id_idx ON public.pet_variants(benefit_id);
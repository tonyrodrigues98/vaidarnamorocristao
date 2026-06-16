ALTER TABLE public.user_pet_expedition_runs
  DROP CONSTRAINT IF EXISTS user_pet_expedition_runs_expedition_id_fkey;

ALTER TABLE public.user_pet_expedition_runs
  ADD CONSTRAINT user_pet_expedition_runs_expedition_id_fkey
  FOREIGN KEY (expedition_id)
  REFERENCES public.pet_expeditions(id)
  ON DELETE CASCADE;
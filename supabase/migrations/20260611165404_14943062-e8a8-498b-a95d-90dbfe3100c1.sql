ALTER TABLE public.user_avatar_base
  ADD COLUMN IF NOT EXISTS avatar_name text;
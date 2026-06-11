
-- Head anchor for facial item alignment
ALTER TABLE public.avatar_bases
  ADD COLUMN IF NOT EXISTS head_anchor jsonb,
  ADD COLUMN IF NOT EXISTS age_range text NOT NULL DEFAULT '20-35';

ALTER TABLE public.user_avatar_base
  ADD COLUMN IF NOT EXISTS age_range text NOT NULL DEFAULT '20-35';

-- New facial item categories
INSERT INTO public.avatar_categories (slug, name, icon, sort_order, layer_index)
VALUES
  ('eyes',       'Olhos',        '👁️', 35, 30),
  ('eyebrows',   'Sobrancelhas', '✏️', 36, 31),
  ('mouth',      'Boca',         '👄', 37, 32)
ON CONFLICT (slug) DO NOTHING;

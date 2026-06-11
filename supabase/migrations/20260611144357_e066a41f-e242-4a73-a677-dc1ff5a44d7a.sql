
DROP INDEX IF EXISTS public.avatar_bases_gender_body_pose_unique;

ALTER TABLE public.avatar_bases
  ADD COLUMN IF NOT EXISTS skin_tone text NOT NULL DEFAULT 'default';

ALTER TABLE public.avatar_bases
  DROP CONSTRAINT IF EXISTS avatar_bases_skin_tone_check;
ALTER TABLE public.avatar_bases
  ADD CONSTRAINT avatar_bases_skin_tone_check
  CHECK (skin_tone = ANY (ARRAY['default','porcelain','light','tan','olive','brown','deep']));

DROP INDEX IF EXISTS public.avatar_bases_unique_idx;
CREATE UNIQUE INDEX avatar_bases_unique_idx
  ON public.avatar_bases (gender, body_type, pose_key, skin_tone);

ALTER TABLE public.user_avatar_base
  ADD COLUMN IF NOT EXISTS skin_tone text NOT NULL DEFAULT 'default';

INSERT INTO public.avatar_bases (name, gender, body_type, pose_key, skin_tone, image_url, is_active, sort_order)
VALUES
  ('Feminino · Padrão · Deep',     'feminino', 'default',    'standing_default', 'deep', '', true, 60),
  ('Feminino · Magro · Deep',      'feminino', 'slim',       'standing_default', 'deep', '', true, 61),
  ('Feminino · Sobrepeso · Deep',  'feminino', 'overweight', 'standing_default', 'deep', '', true, 62),
  ('Feminino · Musculoso · Deep',  'feminino', 'muscular',   'standing_default', 'deep', '', true, 63),
  ('Feminino · Elegante · Deep',   'feminino', 'default',    'elegant',          'deep', '', true, 64),
  ('Feminino · Oração · Deep',     'feminino', 'default',    'praying',          'deep', '', true, 65),
  ('Feminino · Acenando · Deep',   'feminino', 'default',    'waving',           'deep', '', true, 66),
  ('Feminino · Coração · Deep',    'feminino', 'default',    'holding_heart',    'deep', '', true, 67),
  ('Masculino · Padrão · Deep',    'masculino','default',    'standing_default', 'deep', '', true, 68),
  ('Masculino · Magro · Deep',     'masculino','slim',       'standing_default', 'deep', '', true, 69),
  ('Masculino · Sobrepeso · Deep', 'masculino','overweight', 'standing_default', 'deep', '', true, 70),
  ('Masculino · Musculoso · Deep', 'masculino','muscular',   'standing_default', 'deep', '', true, 71),
  ('Masculino · Elegante · Deep',  'masculino','default',    'elegant',          'deep', '', true, 72),
  ('Masculino · Oração · Deep',    'masculino','default',    'praying',          'deep', '', true, 73),
  ('Masculino · Acenando · Deep',  'masculino','default',    'waving',           'deep', '', true, 74),
  ('Masculino · Coração · Deep',   'masculino','default',    'holding_heart',    'deep', '', true, 75)
ON CONFLICT (gender, body_type, pose_key, skin_tone) DO NOTHING;

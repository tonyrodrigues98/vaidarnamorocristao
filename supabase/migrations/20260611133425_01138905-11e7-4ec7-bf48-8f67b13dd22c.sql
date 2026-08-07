
ALTER TABLE public.avatar_bases
  ADD COLUMN IF NOT EXISTS body_type text NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS pose_key text NOT NULL DEFAULT 'standing_default';

ALTER TABLE public.avatar_bases
  DROP CONSTRAINT IF EXISTS avatar_bases_body_type_check,
  ADD CONSTRAINT avatar_bases_body_type_check
    CHECK (body_type IN ('default','overweight','slim','muscular'));

ALTER TABLE public.avatar_bases
  DROP CONSTRAINT IF EXISTS avatar_bases_pose_key_check,
  ADD CONSTRAINT avatar_bases_pose_key_check
    CHECK (pose_key IN ('standing_default','elegant','praying','waving','holding_heart'));

-- Backfill existing bases as default body / standing pose
UPDATE public.avatar_bases
  SET body_type = 'default', pose_key = 'standing_default'
  WHERE body_type IS NULL OR pose_key IS NULL OR body_type = '' OR pose_key = '';

-- Uniqueness so the page can fetch a single base per (gender, body, pose)
CREATE UNIQUE INDEX IF NOT EXISTS avatar_bases_gender_body_pose_unique
  ON public.avatar_bases (gender, body_type, pose_key)
  WHERE is_active;

-- ============================================================
-- Seed body type variations (pose = standing_default)
-- ============================================================
INSERT INTO public.avatar_bases (name, gender, body_type, pose_key, image_url, sort_order, is_active) VALUES
  ('Masculino sobrepeso',   'masculino', 'overweight', 'standing_default', '/__l5e/assets-v1/792dbee3-3917-4258-9968-6fed1bb3986b/male-overweight.png', 10, true),
  ('Masculino magro',       'masculino', 'slim',       'standing_default', '/__l5e/assets-v1/6c5afb79-4997-4961-80a8-60c3df434ca8/male-slim.png',       11, true),
  ('Masculino musculoso',   'masculino', 'muscular',   'standing_default', '/__l5e/assets-v1/48908bd2-15ee-4bb9-81d5-14a955fcb7b8/male-muscular.png',   12, true),
  ('Feminino sobrepeso',    'feminino',  'overweight', 'standing_default', '/__l5e/assets-v1/427f582b-2df7-4c7e-868e-6b5a7a46fb70/female-overweight.png', 10, true),
  ('Feminino magro',        'feminino',  'slim',       'standing_default', '/__l5e/assets-v1/8c289a9a-9fe8-48d2-bb1e-ecacc950e0c6/female-slim.png',       11, true),
  ('Feminino musculoso',    'feminino',  'muscular',   'standing_default', '/__l5e/assets-v1/55aafd17-5619-435c-9f0f-de2a0e6ab79c/female-muscular.png',   12, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed poses for the default body, both genders
-- ============================================================
INSERT INTO public.avatar_bases (name, gender, body_type, pose_key, image_url, sort_order, is_active) VALUES
  ('Masculino elegante',  'masculino', 'default', 'elegant',       '/__l5e/assets-v1/a1c4a5a8-c8da-4c26-9cf4-7a9ff49b5423/male-pose-elegant.png', 20, true),
  ('Masculino em oração', 'masculino', 'default', 'praying',       '/__l5e/assets-v1/fc9a2b60-420f-4765-8c3a-9358b98e27a3/male-pose-praying.png', 21, true),
  ('Masculino acenando',  'masculino', 'default', 'waving',        '/__l5e/assets-v1/deece440-3d02-4248-80ae-29a385566af6/male-pose-waving.png',  22, true),
  ('Masculino coração',   'masculino', 'default', 'holding_heart', '/__l5e/assets-v1/59246e97-9d59-464c-9435-b05130116065/male-pose-heart.png',   23, true),
  ('Feminino elegante',   'feminino',  'default', 'elegant',       '/__l5e/assets-v1/06fe5fa6-b197-437e-820e-a148493f4ac5/female-pose-elegant.png', 20, true),
  ('Feminino em oração',  'feminino',  'default', 'praying',       '/__l5e/assets-v1/e9ee2647-28de-4c5b-8c82-0b10f1148045/female-pose-praying.png', 21, true),
  ('Feminino acenando',   'feminino',  'default', 'waving',        '/__l5e/assets-v1/cae8c062-95e5-4d2c-a52e-f40c627c2f94/female-pose-waving.png',  22, true),
  ('Feminino coração',    'feminino',  'default', 'holding_heart', '/__l5e/assets-v1/fb21a841-22f5-4b3f-9adb-28085087c841/female-pose-heart.png',   23, true)
ON CONFLICT DO NOTHING;

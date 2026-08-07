ALTER TABLE public.user_avatar_base
  ADD COLUMN IF NOT EXISTS color_selections jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.user_avatar_base.color_selections IS
  'Persistência das cores escolhidas pelo usuário no pipeline composicional. Chave = AvatarLayerKey (hairFront, top, bottom, etc.), valor = id do preset em src/data/avatarColorPresets.ts. skin_tone continua na coluna dedicada.';
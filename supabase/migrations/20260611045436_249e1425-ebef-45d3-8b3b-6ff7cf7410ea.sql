ALTER TABLE public.profile_photos
ADD COLUMN IF NOT EXISTS category text;

CREATE INDEX IF NOT EXISTS idx_profile_photos_user_category
ON public.profile_photos(user_id, category);

COMMENT ON COLUMN public.profile_photos.category IS
'Galeria de Fé e Vida — categoria opcional escolhida pelo usuário: fe, familia, especiais, viagens, dia_a_dia. NULL = sem categoria (fotos antigas continuam válidas).';
-- Seed das imagens das 5 categorias de pets, geradas com imagegen premium.
-- Storage path relativo ao bucket `pets` (resolvido via createSignedUrl).
UPDATE public.pet_categories SET image_url = 'catalog/categories/cachorros.png' WHERE slug = 'cachorros';
UPDATE public.pet_categories SET image_url = 'catalog/categories/gatos.png'     WHERE slug = 'gatos';
UPDATE public.pet_categories SET image_url = 'catalog/categories/aves.png'      WHERE slug = 'aves';
UPDATE public.pet_categories SET image_url = 'catalog/categories/roedores.png'  WHERE slug = 'roedores';
UPDATE public.pet_categories SET image_url = 'catalog/categories/peixes.png'    WHERE slug = 'peixes';


-- Allow restore_amount=0 (sleep items use sleep_hours instead)
ALTER TABLE public.pet_care_items DROP CONSTRAINT IF EXISTS pet_care_items_restore_amount_check;
ALTER TABLE public.pet_care_items ADD CONSTRAINT pet_care_items_restore_amount_check CHECK (restore_amount BETWEEN 0 AND 100);

-- ============ 1) Atualizar imagens dos itens existentes ============
UPDATE public.pet_care_items SET image_url='/__l5e/assets-v1/aeb625e7-51ca-476c-be02-95b20cb0cd58/care-carne.png' WHERE slug='carne' AND kind='feed';
UPDATE public.pet_care_items SET image_url='/__l5e/assets-v1/ae19491d-0076-40bc-99ba-e77985c293e8/care-graos.png' WHERE slug='graos' AND kind='feed';
UPDATE public.pet_care_items SET image_url='/__l5e/assets-v1/ea06f4a4-fad6-47d9-862d-d593df63d4b0/care-verduras.png' WHERE slug='verduras' AND kind='feed';
UPDATE public.pet_care_items SET image_url='/__l5e/assets-v1/0fa7a426-fa68-4819-8574-c66895f01504/care-banho-completo.png' WHERE slug='banho-e-tosa' AND kind='hygiene';
UPDATE public.pet_care_items SET image_url='/__l5e/assets-v1/baa26d15-36b8-4135-82cf-fc6a76544f5a/care-chao.png' WHERE slug='c' AND kind='sleep';
UPDATE public.pet_care_items SET image_url='/__l5e/assets-v1/e5cf7883-25b3-4465-b91e-c437e860d402/care-fazer-carinho.png' WHERE slug='fazer-carinho' AND kind='affection';

-- ============ 2) Inserir novos itens ============
INSERT INTO public.pet_care_items (kind, slug, name, description, image_url, cost_coins, restore_amount, energy_cost, daily_uses, sleep_hours, sort_order) VALUES
('feed','sementes','Sementes','Mix nutritivo de sementes para aves, roedores e galináceos.','/__l5e/assets-v1/476bb4ee-3c4b-48c1-9dac-cedb477fd132/care-sementes.png',2,6,0,0,0,10),
('feed','frutas','Frutas frescas','Frutas fresquinhas — leve, doce e refrescante.','/__l5e/assets-v1/01b77c75-d021-4e3a-9cc4-9778206bd28c/care-frutas.png',3,8,0,3,0,11),
('feed','petisco-premium','Petisco premium','Petisco gourmet em formato de coração — restaura bastante fome.','/__l5e/assets-v1/c2545eba-6ac3-4442-b234-df5d5f12d391/care-petisco-premium.png',8,15,0,2,0,12),
('feed','feno','Feno & Alfafa','Fibra essencial para herbívoros — dura o dia inteiro.','/__l5e/assets-v1/2f2c3b72-ba6f-479d-a2da-371eee3a1635/care-feno.png',1,5,0,0,0,13),
('play','mordedor','Mordedor de borracha','Roer alivia o tédio e fortalece os dentes.','/__l5e/assets-v1/b3559999-f675-4208-8ef4-51ec082bd617/care-mordedor.png',5,12,5,5,0,10),
('play','penas','Varinha com penas','Movimento rápido das penas desperta o instinto de caça.','/__l5e/assets-v1/18b77005-7008-4d74-a9b0-5c5360430109/care-penas.png',4,14,4,6,0,11),
('play','laser','Laser ponteiro','Caçada veloz pelo pontinho vermelho — gasta bastante energia.','/__l5e/assets-v1/5b2b5e0f-9777-4e98-9b22-b740b208a218/care-laser.png',6,18,8,3,0,12),
('play','roda-exercicio','Roda de exercício','Corrida sem fim na roda — clássico dos pequenos.','/__l5e/assets-v1/94e24b2f-81b5-473d-8be2-553d3b4030ca/care-roda-exercicio.png',10,16,7,4,0,13),
('play','cabo-de-guerra','Cabo de guerra','Puxa-puxa entre os dois — diversão e cumplicidade.','/__l5e/assets-v1/b2bc953e-62c2-4a6c-9bd3-cd57d1c6cff1/care-cabo-de-guerra.png',5,15,6,4,0,14),
('hygiene','banho-a-seco','Banho a seco','Limpeza rápida sem molhar — útil entre banhos.','/__l5e/assets-v1/fd3e7227-e4ff-415f-9187-f5b93c9483d5/care-banho-a-seco.png',3,25,2,3,0,10),
('hygiene','banho-de-areia','Banho de areia','Areia fina limpa penas e pelos finos sem água.','/__l5e/assets-v1/61229302-cfa4-4dc6-97be-8ee79004bb2a/care-banho-de-areia.png',2,35,3,3,0,11),
('hygiene','escovacao','Escovação caprichada','Remove pelos soltos e relaxa o pet.','/__l5e/assets-v1/b60e9b4f-3269-4eee-8ae7-6e314d6e0e41/care-escovacao.png',1,20,1,5,0,12),
('hygiene','spa-relaxante','Spa relaxante','Tratamento completo com aromas e toalha quentinha.','/__l5e/assets-v1/9ffbb72f-9df0-4840-9544-0f865ce02aa8/care-spa-relaxante.png',25,90,5,1,0,13),
('sleep','caminha-simples','Caminha simples','Caminha básica e aconchegante para um cochilo.','/__l5e/assets-v1/e7c03d9b-c5d9-44a7-bd26-dbfa396e4c99/care-caminha-simples.png',5,0,0,2,5,10),
('sleep','caminha-ortopedica','Caminha ortopédica','Espuma viscoelástica — sono profundo de 8h.','/__l5e/assets-v1/d77a1a85-c691-4ce2-bca4-9a59203588ae/care-caminha-ortopedica.png',40,0,0,1,8,11),
('sleep','casinha','Casinha aconchegante','Abrigo seguro para um cochilo tranquilo.','/__l5e/assets-v1/e87d2679-ba45-4a27-8537-46933db17ed3/care-casinha.png',30,0,0,2,6,12),
('sleep','iglu','Iglu fofinho','Cama fechada que dá sensação de toca segura.','/__l5e/assets-v1/01b290c9-6a85-4bc2-bea1-59266aebc64a/care-iglu.png',20,0,0,2,7,13),
('sleep','rede','Rede preguiçosa','Balanço suave embala o sono — perfeita pra soneca.','/__l5e/assets-v1/da33d34f-662b-4d29-b7d1-188780704564/care-rede.png',15,0,0,3,4,14),
('affection','cocar-barriga','Coçar a barriga','Coçadinha na barriga — paraíso felino e canino.','/__l5e/assets-v1/f3ec5ba3-2c89-46c9-a686-a5ca236ed492/care-cocar-barriga.png',0,12,1,6,0,10),
('affection','cafune','Cafuné','Cafuné na cabeça — clássico do aconchego.','/__l5e/assets-v1/f49713bb-b947-472b-8d78-9535de959d74/care-cafune.png',0,10,1,8,0,11),
('affection','abraco','Abraço apertado','Abraço apertado — amor sem palavras.','/__l5e/assets-v1/2188daa4-32d0-4893-bddf-20bb90d8be7e/care-abraco.png',0,18,2,4,0,12),
('affection','beijinho','Beijinho','Beijinho rápido — sempre bem-vindo.','/__l5e/assets-v1/418a7938-c183-409e-a53f-c3afec11f235/care-beijinho.png',0,8,0,10,0,13),
('affection','conversinha','Conversinha de amor','Vozinha calma que acalma qualquer bicho.','/__l5e/assets-v1/a1e190da-ac52-4349-8525-48ff3f57ab7d/care-conversinha.png',0,9,0,8,0,14),
('affection','massagem','Massagem relaxante','Massagem com movimentos circulares — alívio profundo.','/__l5e/assets-v1/a35ab442-80c4-48aa-99bb-9fb13cc4127a/care-massagem.png',5,20,2,2,0,15)
ON CONFLICT (kind, slug) DO UPDATE SET
  name=EXCLUDED.name,
  description=EXCLUDED.description,
  image_url=EXCLUDED.image_url,
  cost_coins=EXCLUDED.cost_coins,
  restore_amount=EXCLUDED.restore_amount,
  energy_cost=EXCLUDED.energy_cost,
  daily_uses=EXCLUDED.daily_uses,
  sleep_hours=EXCLUDED.sleep_hours,
  sort_order=EXCLUDED.sort_order;

-- ============ 3) Compatibilidades ============
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='sementes' AND i.kind='feed' AND c.slug IN ('aves','roedores','peixes')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, s.id FROM public.pet_care_items i
JOIN public.pet_categories c ON c.slug='sitio-e-fazenda'
JOIN public.pet_species s ON s.category_id=c.id AND s.slug IN ('galinha','pato','ganso','codorna')
WHERE i.slug='sementes' AND i.kind='feed'
ON CONFLICT DO NOTHING;

INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='frutas' AND i.kind='feed' AND c.slug IN ('cachorros','gatos','aves','roedores','biblico')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, s.id FROM public.pet_care_items i
JOIN public.pet_categories c ON c.slug='exoticos'
JOIN public.pet_species s ON s.category_id=c.id AND s.slug IN ('furao','ourico-pigmeu','petauro-do-acucar','mini-porco')
WHERE i.slug='frutas' AND i.kind='feed'
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, s.id FROM public.pet_care_items i
JOIN public.pet_categories c ON c.slug='repteis'
JOIN public.pet_species s ON s.category_id=c.id AND s.slug IN ('jabuti','tartaruga','iguana','dragao-barbudo')
WHERE i.slug='frutas' AND i.kind='feed'
ON CONFLICT DO NOTHING;

INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='petisco-premium' AND i.kind='feed' AND c.slug IN ('cachorros','gatos','exoticos','aves','roedores','biblico')
ON CONFLICT DO NOTHING;

INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='feno' AND i.kind='feed' AND c.slug IN ('roedores')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, s.id FROM public.pet_care_items i
JOIN public.pet_categories c ON c.slug='sitio-e-fazenda'
JOIN public.pet_species s ON s.category_id=c.id AND s.slug IN ('ovelha','cavalo','ponei','vaca','cabra','lhama')
WHERE i.slug='feno' AND i.kind='feed'
ON CONFLICT DO NOTHING;

INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='mordedor' AND i.kind='play' AND c.slug IN ('cachorros','biblico')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='penas' AND i.kind='play' AND c.slug IN ('gatos','aves')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='laser' AND i.kind='play' AND c.slug IN ('gatos')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='roda-exercicio' AND i.kind='play' AND c.slug IN ('roedores')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, s.id FROM public.pet_care_items i
JOIN public.pet_categories c ON c.slug='exoticos'
JOIN public.pet_species s ON s.category_id=c.id AND s.slug IN ('ourico-pigmeu','petauro-do-acucar','furao')
WHERE i.slug='roda-exercicio' AND i.kind='play'
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='cabo-de-guerra' AND i.kind='play' AND c.slug IN ('cachorros','biblico')
ON CONFLICT DO NOTHING;

INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='banho-a-seco' AND i.kind='hygiene' AND c.slug IN ('cachorros','gatos','exoticos')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='banho-de-areia' AND i.kind='hygiene' AND c.slug IN ('aves','roedores')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='escovacao' AND i.kind='hygiene' AND c.slug IN ('cachorros','gatos','exoticos','biblico')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, s.id FROM public.pet_care_items i
JOIN public.pet_categories c ON c.slug='sitio-e-fazenda'
JOIN public.pet_species s ON s.category_id=c.id AND s.slug IN ('cavalo','ponei','vaca','ovelha','cabra','lhama')
WHERE i.slug='escovacao' AND i.kind='hygiene'
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='spa-relaxante' AND i.kind='hygiene' AND c.slug IN ('cachorros','gatos','exoticos','roedores','biblico')
ON CONFLICT DO NOTHING;

INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='caminha-simples' AND i.kind='sleep' AND c.slug IN ('cachorros','gatos','exoticos','biblico')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='caminha-ortopedica' AND i.kind='sleep' AND c.slug IN ('cachorros','gatos','exoticos','biblico')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='casinha' AND i.kind='sleep' AND c.slug IN ('cachorros','biblico')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, s.id FROM public.pet_care_items i
JOIN public.pet_categories c ON c.slug='sitio-e-fazenda'
JOIN public.pet_species s ON s.category_id=c.id AND s.slug IN ('cabra','ovelha','porco')
WHERE i.slug='casinha' AND i.kind='sleep'
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='iglu' AND i.kind='sleep' AND c.slug IN ('gatos','roedores','exoticos')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='rede' AND i.kind='sleep' AND c.slug IN ('gatos','aves')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, s.id FROM public.pet_care_items i
JOIN public.pet_categories c ON c.slug='exoticos'
JOIN public.pet_species s ON s.category_id=c.id AND s.slug IN ('petauro-do-acucar','furao')
WHERE i.slug='rede' AND i.kind='sleep'
ON CONFLICT DO NOTHING;

INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='cocar-barriga' AND i.kind='affection' AND c.slug IN ('cachorros','gatos','exoticos','biblico')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='cafune' AND i.kind='affection' AND c.slug IN ('cachorros','gatos','exoticos','roedores','sitio-e-fazenda','biblico','aves')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='abraco' AND i.kind='affection' AND c.slug IN ('cachorros','gatos','exoticos','biblico')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, s.id FROM public.pet_care_items i
JOIN public.pet_categories c ON c.slug='sitio-e-fazenda'
JOIN public.pet_species s ON s.category_id=c.id AND s.slug IN ('cabra','ovelha','lhama','ponei')
WHERE i.slug='abraco' AND i.kind='affection'
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='beijinho' AND i.kind='affection' AND c.slug IN ('cachorros','gatos','exoticos','aves','roedores','biblico')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='conversinha' AND i.kind='affection' AND c.slug IN ('cachorros','gatos','exoticos','aves','roedores','biblico','repteis','sitio-e-fazenda','peixes')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, NULL FROM public.pet_care_items i, public.pet_categories c
WHERE i.slug='massagem' AND i.kind='affection' AND c.slug IN ('cachorros','gatos','exoticos','biblico')
ON CONFLICT DO NOTHING;
INSERT INTO public.pet_care_item_compat (item_id, category_id, species_id)
SELECT i.id, c.id, s.id FROM public.pet_care_items i
JOIN public.pet_categories c ON c.slug='sitio-e-fazenda'
JOIN public.pet_species s ON s.category_id=c.id AND s.slug IN ('cavalo','ponei')
WHERE i.slug='massagem' AND i.kind='affection'
ON CONFLICT DO NOTHING;

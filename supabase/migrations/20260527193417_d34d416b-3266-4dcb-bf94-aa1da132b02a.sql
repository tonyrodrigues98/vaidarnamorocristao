
INSERT INTO public.avatar_decorations (type, slug, name, image_url, price_coins, sort_order, active) VALUES
('frame','eclipse-dourado','Eclipse Dourado','frame-eclipse-dourado.png',120,100,true),
('frame','neon-violeta','Neon Violeta','frame-neon-violeta.png',110,110,true),
('frame','horizonte','Horizonte','frame-horizonte.png',100,120,true),
('frame','cristal-do-rei','Cristal do Rei','frame-cristal-do-rei.png',150,130,true),
('frame','chama-sagrada','Chama Sagrada','frame-chama-sagrada.png',130,140,true),
('frame','galaxia','Galáxia','frame-galaxia.png',160,150,true),
('frame','aurora-boreal','Aurora Boreal','frame-aurora-boreal.png',120,160,true),
('frame','minimalista-prata','Minimalista Prata','frame-minimalista-prata.png',90,170,true),
('frame','coracao-radiante','Coração Radiante','frame-coracao-radiante.png',110,180,true),
('frame','vortice','Vórtice','frame-vortice.png',140,190,true),
('frame','folhas-oliveiras','Folhas de Oliveiras','frame-folhas-oliveiras.png',100,200,true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  image_url = EXCLUDED.image_url,
  price_coins = EXCLUDED.price_coins,
  sort_order = EXCLUDED.sort_order,
  active = true;

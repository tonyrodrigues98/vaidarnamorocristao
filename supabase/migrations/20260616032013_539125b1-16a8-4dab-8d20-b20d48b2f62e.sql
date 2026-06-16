
-- Deactivate any existing expeditions so they don't surface in the daily roll
UPDATE public.pet_expeditions SET active = false WHERE active = true;

-- Seed 30 new expeditions (2 extreme, 6 hard, 10 medium, 12 easy)
INSERT INTO public.pet_expeditions (slug,title,description,icon,image_url,difficulty,duration_minutes,energy_cost,min_user_level,xp_reward,coin_reward,item_reward_label,success_rate,crit_rate,active,sort_order) VALUES
('abismo-do-dragao-negro','Abismo do Dragão Negro','Desça ao núcleo de um vulcão adormecido onde dorme o último dragão negro.','Flame','abismo-do-dragao-negro.jpg','extreme',960,80,10,280,320,'Escama de obsidiana',50,20,true,1),
('coracao-do-vazio','Coração do Vazio','Atravesse um portal cósmico onde o tempo se dobra e estrelas nascem.','Sparkle','coracao-do-vazio.jpg','extreme',960,80,10,280,320,'Fragmento de nebulosa',50,20,true,2),
('catacumbas-de-lumen','Catacumbas de Lúmen','Cavernas profundas onde cristais azuis cantam ao toque da luz.','Gem','catacumbas-de-lumen.jpg','hard',480,60,5,120,150,'Geoda de safira',70,15,true,3),
('picos-flutuantes','Picos Flutuantes','Ilhas montanhosas suspensas no céu por magia esquecida.','Mountain','picos-flutuantes.jpg','hard',480,60,5,120,150,'Pena do grifo',70,15,true,4),
('selva-da-lua-prateada','Selva da Lua Prateada','Floresta tropical banhada pelo luar onde vagalumes guiam o caminho.','Moon','selva-da-lua-prateada.jpg','hard',480,60,5,120,150,'Orquídea de prata',70,15,true,5),
('fornalha-de-prometeu','Fornalha de Prometeu','Antiga forja titânica esculpida na lava, onde armas lendárias nascem.','Hammer','fornalha-de-prometeu.jpg','hard',480,60,5,120,150,'Lingote rúnico',70,15,true,6),
('labirinto-de-espelhos','Labirinto de Espelhos','Corredores infinitos onde cada espelho mostra uma vida possível.','Diamond','labirinto-de-espelhos.jpg','hard',480,60,5,120,150,'Caco prismático',70,15,true,7),
('cripta-da-aurora-boreal','Cripta da Aurora Boreal','Templo de gelo guardado sob o véu dançante das auroras.','Snowflake','cripta-da-aurora-boreal.jpg','hard',480,60,5,120,150,'Cristal de glacial',70,15,true,8),
('clareira-dos-lampejos','Clareira dos Lampejos','Pequena clareira onde feixes de sol dançam entre as folhas.','Sun','clareira-dos-lampejos.jpg','easy',60,20,1,20,30,'Folha dourada',100,10,true,9),
('mercado-de-nuvens','Mercado de Nuvens','Bazar suspenso entre nuvens onde mercadores vendem sonhos.','Cloud','mercado-de-nuvens.jpg','medium',240,40,3,50,60,'Frasco de neblina doce',85,12,true,10),
('praia-de-cristal','Praia de Cristal','Litoral onde a areia é feita de minúsculos diamantes.','Waves','praia-de-cristal.jpg','easy',60,20,1,20,30,'Concha iridescente',100,10,true,11),
('jardim-de-cogumelos-luminosos','Jardim dos Cogumelos Luminosos','Recanto úmido onde cogumelos enormes brilham em mil cores.','Sprout','jardim-de-cogumelos-luminosos.jpg','easy',60,20,1,20,30,'Esporo fluorescente',100,10,true,12),
('vila-dos-coelhos-postais','Vila dos Coelhos Postais','Aldeia minúscula onde coelhos entregam cartas em bicicletas.','Mail','vila-dos-coelhos-postais.jpg','easy',60,20,1,20,30,'Selo encantado',100,10,true,13),
('biblioteca-do-vento','Biblioteca do Vento','Torre onde livros voam livres e leem a si mesmos ao vento.','BookOpen','biblioteca-do-vento.jpg','medium',240,40,3,50,60,'Marcador de página alada',85,12,true,14),
('ilha-das-tartarugas-gigantes','Ilha das Tartarugas Gigantes','Arquipélago vivo: cada ilha é uma tartaruga ancestral.','Anchor','ilha-das-tartarugas-gigantes.jpg','medium',240,40,3,50,60,'Casco musgoso',85,12,true,15),
('circo-itinerante','Circo Itinerante das Estrelas','Caravana mágica que aparece sob a lua cheia.','PartyPopper','circo-itinerante.jpg','easy',60,20,1,20,30,'Bilhete de veludo',100,10,true,16),
('pomar-de-frutas-musicais','Pomar das Frutas Musicais','Cada fruta colhida toca uma nota; a colheita vira canção.','Music','pomar-de-frutas-musicais.jpg','easy',60,20,1,20,30,'Maçã de cristal',100,10,true,17),
('lago-dos-espelhos-dagua','Lago dos Espelhos d''Água','Águas tão calmas que refletem outro céu.','Droplets','lago-dos-espelhos-dagua.jpg','easy',60,20,1,20,30,'Gota de espelho',100,10,true,18),
('caravana-do-deserto-rosa','Caravana do Deserto Rosa','Dunas cor-de-rosa onde caravanas atravessam ao pôr do sol.','Tent','caravana-do-deserto-rosa.jpg','medium',240,40,3,50,60,'Areia de rubi',85,12,true,19),
('ruinas-douradas','Ruínas Douradas','Restos de um templo coberto pelo tempo e pelo ouro.','Landmark','ruinas-douradas.jpg','medium',240,40,3,50,60,'Relíquia esculpida',85,12,true,20),
('fazenda-das-estrelas-cadentes','Fazenda das Estrelas Cadentes','Pequena fazenda onde colhe-se estrelas caídas do céu.','Star','fazenda-das-estrelas-cadentes.jpg','medium',240,40,3,50,60,'Estrela morna',85,12,true,21),
('floresta-de-bambu-cantante','Floresta de Bambu Cantante','Bambuzal onde o vento toca melodias antigas.','TreePine','floresta-de-bambu-cantante.jpg','easy',60,20,1,20,30,'Flauta de bambu',100,10,true,22),
('cidade-flutuante-de-papel','Cidade Flutuante de Papel','Reino origami suspenso por pássaros de papel.','Sparkles','cidade-flutuante-de-papel.jpg','medium',240,40,3,50,60,'Tsuru dourado',85,12,true,23),
('bazar-das-pocoes','Bazar das Poções','Becos coloridos onde se vendem poções para todo desejo.','FlaskConical','bazar-das-pocoes.jpg','easy',60,20,1,20,30,'Frasco borbulhante',100,10,true,24),
('observatorio-perdido','Observatório Perdido','Cúpula esquecida no alto da montanha que cataloga estrelas mortas.','Telescope','observatorio-perdido.jpg','medium',240,40,3,50,60,'Lente de cristal',85,12,true,25),
('balao-sobre-vulcoes','Balão sobre os Vulcões','Travessia em balão entre crateras fumegantes.','Wind','balao-sobre-vulcoes.jpg','medium',240,40,3,50,60,'Mapa chamuscado',85,12,true,26),
('moinho-das-libelulas','Moinho das Libélulas','Antigo moinho cercado por nuvens de libélulas turquesa.','Feather','moinho-das-libelulas.jpg','easy',60,20,1,20,30,'Asa iridescente',100,10,true,27),
('trilha-dos-vaga-lumes','Trilha dos Vaga-lumes','Trilha noturna onde milhares de vaga-lumes iluminam o caminho.','Lightbulb','trilha-dos-vaga-lumes.jpg','easy',60,20,1,20,30,'Lanterna viva',100,10,true,28),
('cachoeira-de-arco-iris','Cachoeira do Arco-Íris','Catarata onde a água se separa em sete cores ao cair.','Rainbow','cachoeira-de-arco-iris.jpg','easy',60,20,1,20,30,'Pluma de névoa',100,10,true,29),
('estufa-de-borboletas-azuis','Estufa das Borboletas Azuis','Estufa vitoriana habitada por borboletas azul-elétrico.','Flower2','estufa-de-borboletas-azuis.jpg','easy',60,20,1,20,30,'Pólen iridescente',100,10,true,30)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  image_url = EXCLUDED.image_url,
  difficulty = EXCLUDED.difficulty,
  duration_minutes = EXCLUDED.duration_minutes,
  energy_cost = EXCLUDED.energy_cost,
  min_user_level = EXCLUDED.min_user_level,
  xp_reward = EXCLUDED.xp_reward,
  coin_reward = EXCLUDED.coin_reward,
  item_reward_label = EXCLUDED.item_reward_label,
  success_rate = EXCLUDED.success_rate,
  crit_rate = EXCLUDED.crit_rate,
  active = true,
  sort_order = EXCLUDED.sort_order;

-- Storage RLS for pet-expeditions bucket: authenticated users can read (needed to sign URLs); admins manage
CREATE POLICY "pet-expeditions read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pet-expeditions');

CREATE POLICY "pet-expeditions admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pet-expeditions'
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "pet-expeditions admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'pet-expeditions'
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "pet-expeditions admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'pet-expeditions'
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  );

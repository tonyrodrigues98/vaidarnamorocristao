
-- Categorias do avatar (roupas, acessórios, cabelo, calçados, especiais)
CREATE TABLE public.avatar_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  layer_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.avatar_categories TO authenticated, anon;
GRANT ALL ON public.avatar_categories TO service_role;
ALTER TABLE public.avatar_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories readable by all" ON public.avatar_categories FOR SELECT USING (true);
CREATE POLICY "admins manage categories" ON public.avatar_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Itens (roupas, acessórios etc)
CREATE TABLE public.avatar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.avatar_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  price INT NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'common',
  is_premium BOOLEAN NOT NULL DEFAULT false,
  gender TEXT NOT NULL DEFAULT 'unisex',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.avatar_items TO authenticated, anon;
GRANT ALL ON public.avatar_items TO service_role;
ALTER TABLE public.avatar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items readable by all" ON public.avatar_items FOR SELECT USING (is_active = true);
CREATE POLICY "admins manage items" ON public.avatar_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Avatares base (corpo+rosto+cabelo)
CREATE TABLE public.avatar_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.avatar_bases TO authenticated, anon;
GRANT ALL ON public.avatar_bases TO service_role;
ALTER TABLE public.avatar_bases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bases readable" ON public.avatar_bases FOR SELECT USING (is_active = true);
CREATE POLICY "admins manage bases" ON public.avatar_bases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Inventário do usuário
CREATE TABLE public.user_avatar_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.avatar_items(id) ON DELETE CASCADE,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_avatar_inventory TO authenticated;
GRANT ALL ON public.user_avatar_inventory TO service_role;
ALTER TABLE public.user_avatar_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own inventory" ON public.user_avatar_inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own inventory" ON public.user_avatar_inventory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own inventory" ON public.user_avatar_inventory FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users delete own inventory" ON public.user_avatar_inventory FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Itens equipados pelo usuário (1 por categoria)
CREATE TABLE public.user_avatar_equipped (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.avatar_categories(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.avatar_items(id) ON DELETE CASCADE,
  base_id UUID REFERENCES public.avatar_bases(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_avatar_equipped TO authenticated;
GRANT ALL ON public.user_avatar_equipped TO service_role;
ALTER TABLE public.user_avatar_equipped ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own equipped" ON public.user_avatar_equipped FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users manage own equipped" ON public.user_avatar_equipped FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Base escolhida pelo usuário
CREATE TABLE public.user_avatar_base (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  base_id UUID NOT NULL REFERENCES public.avatar_bases(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_avatar_base TO authenticated;
GRANT ALL ON public.user_avatar_base TO service_role;
ALTER TABLE public.user_avatar_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own base" ON public.user_avatar_base FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed categorias
INSERT INTO public.avatar_categories (slug, name, icon, sort_order, layer_index) VALUES
  ('roupas', 'Roupas', 'shirt', 1, 20),
  ('acessorios', 'Acessórios', 'watch', 2, 40),
  ('cabelo', 'Cabelo', 'scissors', 3, 10),
  ('calcados', 'Calçados', 'footprints', 4, 15),
  ('especiais', 'Itens Especiais', 'star', 5, 50);

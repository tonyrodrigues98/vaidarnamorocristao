
-- =========================================================
-- PET CATALOG (admin-managed) + user_pets_v2
-- =========================================================

-- Updated_at trigger reuse
-- public.update_updated_at_column() already exists

-- Helper for catalog RLS
CREATE OR REPLACE FUNCTION public.is_pet_catalog_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(),'admin'::app_role)
      OR public.has_role(auth.uid(),'super_admin'::app_role);
$$;

-- ---------- pet_categories ----------
CREATE TABLE public.pet_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_categories TO authenticated;
GRANT ALL ON public.pet_categories TO service_role;
ALTER TABLE public.pet_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pet_categories read active" ON public.pet_categories
  FOR SELECT TO authenticated USING (active = true OR public.is_pet_catalog_admin());
CREATE POLICY "pet_categories admin write" ON public.pet_categories
  FOR ALL TO authenticated USING (public.is_pet_catalog_admin()) WITH CHECK (public.is_pet_catalog_admin());
CREATE TRIGGER pet_categories_updated_at BEFORE UPDATE ON public.pet_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- pet_species ----------
CREATE TABLE public.pet_species (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.pet_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_species TO authenticated;
GRANT ALL ON public.pet_species TO service_role;
ALTER TABLE public.pet_species ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pet_species read active" ON public.pet_species
  FOR SELECT TO authenticated USING (active = true OR public.is_pet_catalog_admin());
CREATE POLICY "pet_species admin write" ON public.pet_species
  FOR ALL TO authenticated USING (public.is_pet_catalog_admin()) WITH CHECK (public.is_pet_catalog_admin());
CREATE TRIGGER pet_species_updated_at BEFORE UPDATE ON public.pet_species
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX pet_species_category_idx ON public.pet_species(category_id);

-- ---------- pet_variants ----------
CREATE TABLE public.pet_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.pet_categories(id) ON DELETE CASCADE,
  species_id  uuid REFERENCES public.pet_species(id)    ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (category_id IS NOT NULL OR species_id IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_variants TO authenticated;
GRANT ALL ON public.pet_variants TO service_role;
ALTER TABLE public.pet_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pet_variants read active" ON public.pet_variants
  FOR SELECT TO authenticated USING (active = true OR public.is_pet_catalog_admin());
CREATE POLICY "pet_variants admin write" ON public.pet_variants
  FOR ALL TO authenticated USING (public.is_pet_catalog_admin()) WITH CHECK (public.is_pet_catalog_admin());
CREATE TRIGGER pet_variants_updated_at BEFORE UPDATE ON public.pet_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX pet_variants_category_idx ON public.pet_variants(category_id);
CREATE INDEX pet_variants_species_idx  ON public.pet_variants(species_id);

-- ---------- pet_life_stages ----------
CREATE TABLE public.pet_life_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_life_stages TO authenticated;
GRANT ALL ON public.pet_life_stages TO service_role;
ALTER TABLE public.pet_life_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pet_life_stages read active" ON public.pet_life_stages
  FOR SELECT TO authenticated USING (active = true OR public.is_pet_catalog_admin());
CREATE POLICY "pet_life_stages admin write" ON public.pet_life_stages
  FOR ALL TO authenticated USING (public.is_pet_catalog_admin()) WITH CHECK (public.is_pet_catalog_admin());
CREATE TRIGGER pet_life_stages_updated_at BEFORE UPDATE ON public.pet_life_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- pet_personalities ----------
CREATE TABLE public.pet_personalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_personalities TO authenticated;
GRANT ALL ON public.pet_personalities TO service_role;
ALTER TABLE public.pet_personalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pet_personalities read active" ON public.pet_personalities
  FOR SELECT TO authenticated USING (active = true OR public.is_pet_catalog_admin());
CREATE POLICY "pet_personalities admin write" ON public.pet_personalities
  FOR ALL TO authenticated USING (public.is_pet_catalog_admin()) WITH CHECK (public.is_pet_catalog_admin());
CREATE TRIGGER pet_personalities_updated_at BEFORE UPDATE ON public.pet_personalities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- pet_benefits ----------
CREATE TABLE public.pet_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('global','category','species','variant')),
  scope_id uuid,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((scope = 'global' AND scope_id IS NULL) OR (scope <> 'global' AND scope_id IS NOT NULL))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_benefits TO authenticated;
GRANT ALL ON public.pet_benefits TO service_role;
ALTER TABLE public.pet_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pet_benefits read active" ON public.pet_benefits
  FOR SELECT TO authenticated USING (active = true OR public.is_pet_catalog_admin());
CREATE POLICY "pet_benefits admin write" ON public.pet_benefits
  FOR ALL TO authenticated USING (public.is_pet_catalog_admin()) WITH CHECK (public.is_pet_catalog_admin());
CREATE TRIGGER pet_benefits_updated_at BEFORE UPDATE ON public.pet_benefits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX pet_benefits_scope_idx ON public.pet_benefits(scope, scope_id);

-- ---------- user_pets_v2 ----------
CREATE TABLE public.user_pets_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.pet_categories(id),
  species_id  uuid REFERENCES public.pet_species(id),
  variant_id  uuid REFERENCES public.pet_variants(id),
  life_stage_id uuid NOT NULL REFERENCES public.pet_life_stages(id),
  personality_id uuid NOT NULL REFERENCES public.pet_personalities(id),
  benefit_id uuid REFERENCES public.pet_benefits(id),
  custom_name text NOT NULL,
  is_equipped boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_pets_v2 TO authenticated;
GRANT ALL ON public.user_pets_v2 TO service_role;
ALTER TABLE public.user_pets_v2 ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX user_pets_v2_one_equipped ON public.user_pets_v2(user_id) WHERE is_equipped = true;
CREATE INDEX user_pets_v2_user_idx ON public.user_pets_v2(user_id);

CREATE POLICY "user_pets_v2 owner all" ON public.user_pets_v2
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_pets_v2 read public equipped" ON public.user_pets_v2
  FOR SELECT TO authenticated USING (is_equipped = true AND visibility = 'public');
CREATE POLICY "user_pets_v2 admin all" ON public.user_pets_v2
  FOR ALL TO authenticated USING (public.is_pet_catalog_admin()) WITH CHECK (public.is_pet_catalog_admin());

CREATE TRIGGER user_pets_v2_updated_at BEFORE UPDATE ON public.user_pets_v2
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Equip RPC: only one equipped per user
CREATE OR REPLACE FUNCTION public.equip_user_pet_v2(_user_pet_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_owner uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT user_id INTO v_owner FROM public.user_pets_v2 WHERE id = _user_pet_id;
  IF v_owner IS NULL OR v_owner <> uid THEN RAISE EXCEPTION 'not allowed'; END IF;
  UPDATE public.user_pets_v2 SET is_equipped = false, updated_at = now()
    WHERE user_id = uid AND is_equipped = true AND id <> _user_pet_id;
  UPDATE public.user_pets_v2 SET is_equipped = true, updated_at = now()
    WHERE id = _user_pet_id;
END;
$$;

-- ============== SEED MÍNIMO ==============
INSERT INTO public.pet_life_stages (name, slug, sort_order) VALUES
  ('Filhote','filhote',1),
  ('Adulto','adulto',2),
  ('Sênior','senior',3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pet_personalities (name, slug, description, sort_order) VALUES
  ('Carinhoso','carinhoso','Demonstra afeto constantemente',1),
  ('Brincalhão','brincalhao','Cheio de energia e travessuras',2),
  ('Calmo','calmo','Sereno e tranquilo',3),
  ('Curioso','curioso','Sempre explorando o novo',4),
  ('Fiel','fiel','Companheiro inseparável',5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pet_categories (name, slug, description, sort_order) VALUES
  ('Cachorros','cachorros','Os melhores amigos do ser humano',1),
  ('Gatos','gatos','Independentes e cheios de charme',2),
  ('Aves','aves','Companheiros que cantam',3),
  ('Roedores','roedores','Pequenos e fofos',4),
  ('Peixes','peixes','Beleza silenciosa em movimento',5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.pet_benefits (name, slug, description, scope, sort_order) VALUES
  ('Companhia diária','companhia-diaria','Seu pet aparece no perfil','global',1),
  ('Bônus de carisma','bonus-carisma','Destaque sutil no seu cartão','global',2)
ON CONFLICT (slug) DO NOTHING;

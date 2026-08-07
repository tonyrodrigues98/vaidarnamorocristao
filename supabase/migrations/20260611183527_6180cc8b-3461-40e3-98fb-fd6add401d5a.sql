
-- Enum de raridade dos pets
DO $$ BEGIN
  CREATE TYPE public.pet_rarity AS ENUM ('common','rare','epic','legendary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================
-- Tabela pets (catálogo)
-- =========================
CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  species text NOT NULL,
  description text,
  rarity public.pet_rarity NOT NULL DEFAULT 'common',
  price_coins integer NOT NULL DEFAULT 0 CHECK (price_coins >= 0),
  image_url text,
  preview_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  -- Campos reservados para evolução futura (não usados ainda na UI)
  pose text,
  animation_url text,
  shadow_url text,
  sound_url text,
  event_tag text,
  limited_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pets TO anon;
GRANT SELECT ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Qualquer um lê pets ativos
CREATE POLICY "Pets ativos são públicos"
  ON public.pets FOR SELECT
  USING (is_active = true);

-- Admins veem tudo
CREATE POLICY "Admins veem todos os pets"
  ON public.pets FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Admins inserem pets"
  ON public.pets FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Admins atualizam pets"
  ON public.pets FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Admins removem pets"
  ON public.pets FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER pets_set_updated_at
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX pets_active_sort_idx ON public.pets (is_active, sort_order);

-- =========================
-- Tabela user_pets
-- =========================
CREATE TABLE public.user_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  custom_name text CHECK (custom_name IS NULL OR char_length(custom_name) BETWEEN 1 AND 30),
  acquired_at timestamptz NOT NULL DEFAULT now(),
  is_equipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pet_id)
);

-- No máximo 1 pet equipado por usuário
CREATE UNIQUE INDEX user_pets_one_equipped
  ON public.user_pets (user_id) WHERE is_equipped;

CREATE INDEX user_pets_user_idx ON public.user_pets (user_id);

GRANT SELECT ON public.user_pets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_pets TO authenticated;
GRANT ALL ON public.user_pets TO service_role;

ALTER TABLE public.user_pets ENABLE ROW LEVEL SECURITY;

-- Leitura pública apenas dos pets equipados (para mostrar em perfis)
CREATE POLICY "Pets equipados são públicos"
  ON public.user_pets FOR SELECT
  USING (is_equipped = true);

-- Usuário lê todos os próprios pets
CREATE POLICY "Usuário lê seus pets"
  ON public.user_pets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin lê todos user_pets"
  ON public.user_pets FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Usuário adquire/edita/remove apenas seus próprios pets
CREATE POLICY "Usuário adquire pet"
  ON public.user_pets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário edita seu pet"
  ON public.user_pets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário remove seu pet"
  ON public.user_pets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER user_pets_set_updated_at
  BEFORE UPDATE ON public.user_pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Função: equipar pet (atômico)
-- =========================
CREATE OR REPLACE FUNCTION public.equip_pet(_user_pet_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_owner uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT user_id INTO v_owner FROM public.user_pets WHERE id = _user_pet_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'pet_not_found'; END IF;
  IF v_owner <> uid THEN RAISE EXCEPTION 'not_owner'; END IF;

  -- Desequipa tudo antes
  UPDATE public.user_pets
     SET is_equipped = false, updated_at = now()
   WHERE user_id = uid AND is_equipped = true;

  UPDATE public.user_pets
     SET is_equipped = true, updated_at = now()
   WHERE id = _user_pet_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.equip_pet(uuid) TO authenticated;

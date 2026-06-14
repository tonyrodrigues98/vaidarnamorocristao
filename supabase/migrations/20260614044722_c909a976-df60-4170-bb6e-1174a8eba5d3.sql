
-- ============== Central de Ações do Pet ==============

-- enum dos tipos de cuidado que têm itens
DO $$ BEGIN
  CREATE TYPE public.pet_care_kind AS ENUM ('feed','play','hygiene','sleep','affection');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- pet_care_items ----------
CREATE TABLE public.pet_care_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.pet_care_kind NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  image_url text,
  cost_coins int NOT NULL DEFAULT 0 CHECK (cost_coins >= 0),
  restore_amount int NOT NULL DEFAULT 10 CHECK (restore_amount BETWEEN 1 AND 100),
  active bool NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, slug)
);
GRANT SELECT ON public.pet_care_items TO anon, authenticated;
GRANT ALL ON public.pet_care_items TO service_role;
ALTER TABLE public.pet_care_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "care_items_read_active" ON public.pet_care_items
  FOR SELECT USING (active OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "care_items_admin_write" ON public.pet_care_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- ---------- pet_care_item_compat ----------
CREATE TABLE public.pet_care_item_compat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.pet_care_items(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.pet_categories(id) ON DELETE CASCADE,
  species_id uuid REFERENCES public.pet_species(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX pet_care_item_compat_uq
  ON public.pet_care_item_compat (item_id, category_id, COALESCE(species_id, '00000000-0000-0000-0000-000000000000'::uuid));
GRANT SELECT ON public.pet_care_item_compat TO anon, authenticated;
GRANT ALL ON public.pet_care_item_compat TO service_role;
ALTER TABLE public.pet_care_item_compat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "care_compat_read" ON public.pet_care_item_compat FOR SELECT USING (true);
CREATE POLICY "care_compat_admin_write" ON public.pet_care_item_compat
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- ---------- pet_care_state (uma linha por pet × barra) ----------
CREATE TABLE public.pet_care_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_pet_id uuid NOT NULL REFERENCES public.user_pets_v2(id) ON DELETE CASCADE,
  kind text NOT NULL, -- 'feed' | 'play' | 'hygiene' | 'sleep' | 'affection' | 'energy'
  value_at_anchor int NOT NULL DEFAULT 80 CHECK (value_at_anchor BETWEEN 0 AND 100),
  anchor_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_pet_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pet_care_state TO authenticated;
GRANT ALL ON public.pet_care_state TO service_role;
ALTER TABLE public.pet_care_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "care_state_owner_all" ON public.pet_care_state
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_pets_v2 p WHERE p.id = pet_care_state.user_pet_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_pets_v2 p WHERE p.id = pet_care_state.user_pet_id AND p.user_id = auth.uid()));

-- ---------- pet_care_events (log) ----------
CREATE TABLE public.pet_care_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_pet_id uuid NOT NULL REFERENCES public.user_pets_v2(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  item_id uuid REFERENCES public.pet_care_items(id) ON DELETE SET NULL,
  delta int NOT NULL,
  cost_coins int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pet_care_events TO authenticated;
GRANT ALL ON public.pet_care_events TO service_role;
ALTER TABLE public.pet_care_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "care_events_owner_read" ON public.pet_care_events FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ---------- pet_care_config (singleton) ----------
CREATE TABLE public.pet_care_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  decay_per_hour int NOT NULL DEFAULT 2 CHECK (decay_per_hour BETWEEN 0 AND 100),
  energy_regen_minutes_per_point int NOT NULL DEFAULT 6 CHECK (energy_regen_minutes_per_point BETWEEN 1 AND 240),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pet_care_config TO anon, authenticated;
GRANT ALL ON public.pet_care_config TO service_role;
ALTER TABLE public.pet_care_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "care_config_read" ON public.pet_care_config FOR SELECT USING (true);
CREATE POLICY "care_config_admin_write" ON public.pet_care_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));
INSERT INTO public.pet_care_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.tg_pet_care_touch() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
CREATE TRIGGER pet_care_items_touch BEFORE UPDATE ON public.pet_care_items FOR EACH ROW EXECUTE FUNCTION public.tg_pet_care_touch();
CREATE TRIGGER pet_care_state_touch BEFORE UPDATE ON public.pet_care_state FOR EACH ROW EXECUTE FUNCTION public.tg_pet_care_touch();
CREATE TRIGGER pet_care_config_touch BEFORE UPDATE ON public.pet_care_config FOR EACH ROW EXECUTE FUNCTION public.tg_pet_care_touch();

-- ---------- RPC: apply_pet_care ----------
-- Aplica um item de cuidado em um pet: valida ownership, compat, debita moedas
-- (se necessário), atualiza a barra e registra evento. Retorna o novo valor.
CREATE OR REPLACE FUNCTION public.apply_pet_care(_user_pet_id uuid, _item_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  v_pet record;
  v_item public.pet_care_items;
  v_kind_text text;
  v_state public.pet_care_state;
  v_cfg public.pet_care_config;
  v_decay numeric;
  v_minutes numeric;
  v_current int;
  v_new int;
  v_compat int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id, user_id, category_id, species_id INTO v_pet FROM public.user_pets_v2 WHERE id = _user_pet_id;
  IF v_pet IS NULL OR v_pet.user_id <> uid THEN RAISE EXCEPTION 'pet not found'; END IF;
  SELECT * INTO v_item FROM public.pet_care_items WHERE id = _item_id AND active;
  IF v_item IS NULL THEN RAISE EXCEPTION 'item not found'; END IF;

  -- compat: precisa existir uma regra que cubra (categoria, espécie) do pet
  SELECT count(*) INTO v_compat FROM public.pet_care_item_compat c
    WHERE c.item_id = v_item.id
      AND c.category_id = v_pet.category_id
      AND (c.species_id IS NULL OR c.species_id = v_pet.species_id);
  IF v_compat = 0 THEN RAISE EXCEPTION 'item incompativel com este pet'; END IF;

  v_kind_text := v_item.kind::text;
  SELECT * INTO v_cfg FROM public.pet_care_config WHERE id = 1;
  IF v_cfg IS NULL THEN v_cfg.decay_per_hour := 2; END IF;

  -- carrega/cria estado
  INSERT INTO public.pet_care_state (user_pet_id, kind, value_at_anchor, anchor_at)
    VALUES (_user_pet_id, v_kind_text, 80, now())
    ON CONFLICT (user_pet_id, kind) DO NOTHING;
  SELECT * INTO v_state FROM public.pet_care_state WHERE user_pet_id = _user_pet_id AND kind = v_kind_text FOR UPDATE;

  -- valor corrente derivado (decay -1 por barra normal)
  v_minutes := EXTRACT(EPOCH FROM (now() - v_state.anchor_at)) / 60.0;
  v_decay := (v_cfg.decay_per_hour::numeric) * (v_minutes / 60.0);
  v_current := GREATEST(0, LEAST(100, FLOOR(v_state.value_at_anchor - v_decay)::int));
  v_new := LEAST(100, v_current + v_item.restore_amount);

  -- moedas
  IF v_item.cost_coins > 0 THEN
    PERFORM public.spend_coin(v_item.cost_coins);
  END IF;

  UPDATE public.pet_care_state
    SET value_at_anchor = v_new, anchor_at = now()
    WHERE id = v_state.id;

  INSERT INTO public.pet_care_events (user_pet_id, user_id, kind, item_id, delta, cost_coins)
    VALUES (_user_pet_id, uid, v_kind_text, v_item.id, v_new - v_current, v_item.cost_coins);

  RETURN v_new;
END $$;
GRANT EXECUTE ON FUNCTION public.apply_pet_care(uuid, uuid) TO authenticated;


-- 1) Catalog of effect types
CREATE TABLE public.pet_perk_effects (
  key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'cosmetic',
  numeric_param boolean NOT NULL DEFAULT false,
  default_param int,
  needs_target text, -- 'avatar_decorations' | 'profile_backgrounds' | 'badges' | null
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pet_perk_effects_category_chk CHECK (category IN ('coins','missions','anonymous','gifts','cosmetic','pet_collect','avatar_fx','pet_meta'))
);

GRANT SELECT ON public.pet_perk_effects TO authenticated;
GRANT ALL ON public.pet_perk_effects TO service_role;

ALTER TABLE public.pet_perk_effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_perk_effects read active" ON public.pet_perk_effects FOR SELECT TO authenticated
  USING (active = true OR public.is_pet_catalog_admin());

CREATE POLICY "pet_perk_effects admin write" ON public.pet_perk_effects FOR ALL TO authenticated
  USING (public.is_pet_catalog_admin()) WITH CHECK (public.is_pet_catalog_admin());

CREATE TRIGGER pet_perk_effects_updated_at BEFORE UPDATE ON public.pet_perk_effects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Extend pet_benefits
ALTER TABLE public.pet_benefits
  ADD COLUMN perk_label text,
  ADD COLUMN effect_key text REFERENCES public.pet_perk_effects(key) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD COLUMN effect_param int,
  ADD COLUMN effect_target_id uuid;

CREATE INDEX pet_benefits_effect_key_idx ON public.pet_benefits(effect_key);

-- 3) Per-user state for collectable perks
CREATE TABLE public.user_pet_perk_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  effect_key text NOT NULL REFERENCES public.pet_perk_effects(key) ON UPDATE CASCADE ON DELETE CASCADE,
  last_collected_at timestamptz,
  total_collected int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, effect_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_pet_perk_state TO authenticated;
GRANT ALL ON public.user_pet_perk_state TO service_role;

ALTER TABLE public.user_pet_perk_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own perk state" ON public.user_pet_perk_state FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER user_pet_perk_state_updated_at BEFORE UPDATE ON public.user_pet_perk_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Resolver: active perks for the user's equipped pet
CREATE OR REPLACE FUNCTION public.get_active_pet_perks(_user_id uuid)
RETURNS TABLE(benefit_id uuid, effect_key text, effect_param int, effect_target_id uuid, label text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH eq AS (
    SELECT category_id, species_id, variant_id
    FROM public.user_pets_v2
    WHERE user_id = _user_id AND is_equipped = true
    LIMIT 1
  )
  SELECT b.id, b.effect_key, COALESCE(b.effect_param, e.default_param), b.effect_target_id,
         COALESCE(b.perk_label, b.name)
  FROM public.pet_benefits b
  LEFT JOIN public.pet_perk_effects e ON e.key = b.effect_key
  CROSS JOIN eq
  WHERE b.active = true
    AND b.effect_key IS NOT NULL
    AND (
      b.scope = 'global'
      OR (b.scope = 'category' AND b.scope_id = eq.category_id)
      OR (b.scope = 'species'  AND b.scope_id = eq.species_id)
      OR (b.scope = 'variant'  AND b.scope_id = eq.variant_id)
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_active_pet_perks(uuid) TO authenticated;

-- 5) Helper: sum integer perk effects
CREATE OR REPLACE FUNCTION public.pet_perk_sum(_user_id uuid, _keys text[])
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(COALESCE(effect_param, 1)), 0)::int
  FROM public.get_active_pet_perks(_user_id)
  WHERE effect_key = ANY(_keys);
$$;

GRANT EXECUTE ON FUNCTION public.pet_perk_sum(uuid, text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.pet_perk_has(_user_id uuid, _key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.get_active_pet_perks(_user_id) WHERE effect_key = _key);
$$;

GRANT EXECUTE ON FUNCTION public.pet_perk_has(uuid, text) TO authenticated;

-- 6) Updated claim_daily_coins with pet bonus
CREATE OR REPLACE FUNCTION public.claim_daily_coins()
RETURNS TABLE(balance integer, awarded integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  r public.user_coins;
  new_balance INTEGER;
  award INTEGER := 10;
  bonus INTEGER := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO r FROM public.user_coins WHERE user_id = uid FOR UPDATE;
  IF r.balance >= 500 THEN RAISE EXCEPTION 'max_balance' USING ERRCODE='check_violation'; END IF;
  IF r.last_claim_date IS NOT NULL AND r.last_claim_date >= CURRENT_DATE THEN
    RAISE EXCEPTION 'already_claimed' USING ERRCODE='check_violation';
  END IF;
  bonus := public.pet_perk_sum(uid, ARRAY['daily_coins_plus_1','daily_coins_plus_2','daily_coins_plus_3']);
  award := award + GREATEST(0, bonus);
  new_balance := LEAST(500, r.balance + award);
  award := new_balance - r.balance;
  UPDATE public.user_coins
    SET balance = new_balance, last_claim_date = CURRENT_DATE, updated_at = now()
    WHERE user_id = uid;
  PERFORM public.log_coin_tx(uid, 'daily_claim', 'in', award, new_balance,
    CASE WHEN bonus > 0 THEN 'Resgate diário (+ bônus do pet)' ELSE 'Resgate diário' END,
    'Bônus diário de moedas');
  RETURN QUERY SELECT new_balance, award;
END;
$$;

-- 7) Updated request_anonymous_hint (+1 hint when perk active)
CREATE OR REPLACE FUNCTION public.request_anonymous_hint(_message_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); m public.anonymous_messages; hints_count int; max_hints int := 2;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO m FROM public.anonymous_messages WHERE id=_message_id;
  IF NOT FOUND OR m.receiver_id <> uid THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF m.status NOT IN ('pending','hint_sent') THEN RAISE EXCEPTION 'invalid state'; END IF;
  IF public.pet_perk_has(uid, 'anonymous_hint_plus_1') THEN max_hints := max_hints + 1; END IF;
  SELECT count(*) INTO hints_count FROM public.anonymous_message_hints WHERE message_id=_message_id;
  IF hints_count >= max_hints THEN RAISE EXCEPTION 'hint limit reached'; END IF;
  INSERT INTO public.anonymous_message_hints (message_id) VALUES (_message_id);
  UPDATE public.anonymous_messages SET status='hint_requested', updated_at=now() WHERE id=_message_id;
  PERFORM public.create_notification(
    m.sender_id, 'anonymous_hint_requested',
    'Pediram uma dica sobre você 👀',
    'Escolha uma dica para enviar.',
    '/recados', NULL, _message_id);
END $$;

-- 8) Updated send_virtual_gift with pet discount
CREATE OR REPLACE FUNCTION public.send_virtual_gift(_receiver_id uuid, _gift_id uuid, _message text DEFAULT NULL::text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  g public.virtual_gifts;
  v_balance int;
  v_new_balance int;
  tx_id uuid;
  sender_name text;
  msg text;
  v_discount int := 0;
  v_price int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF uid = _receiver_id THEN RAISE EXCEPTION 'cannot_send_to_self'; END IF;
  IF EXISTS (SELECT 1 FROM public.blocks WHERE (blocker_id=_receiver_id AND blocked_id=uid) OR (blocker_id=uid AND blocked_id=_receiver_id)) THEN
    RAISE EXCEPTION 'blocked';
  END IF;
  SELECT * INTO g FROM public.virtual_gifts WHERE id = _gift_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'gift_not_found'; END IF;
  IF _message IS NOT NULL AND length(_message) > 120 THEN RAISE EXCEPTION 'message_too_long'; END IF;
  msg := NULLIF(trim(COALESCE(_message,'')), '');

  -- pet discount (percentage, capped at 50)
  v_discount := LEAST(50, GREATEST(0, public.pet_perk_sum(uid, ARRAY['gift_discount'])));
  v_price := GREATEST(1, (g.price_coins * (100 - v_discount) / 100)::int);

  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100) ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO v_balance FROM public.user_coins WHERE user_id = uid FOR UPDATE;
  IF v_balance < v_price THEN RAISE EXCEPTION 'insufficient_coins' USING ERRCODE='check_violation'; END IF;
  v_new_balance := v_balance - v_price;
  UPDATE public.user_coins SET balance = v_new_balance, updated_at = now() WHERE user_id = uid;

  INSERT INTO public.gift_transactions (sender_id, receiver_id, gift_id, price_paid, message)
  VALUES (uid, _receiver_id, _gift_id, v_price, msg) RETURNING id INTO tx_id;

  PERFORM public.log_coin_tx(uid, 'gift_sent', 'out', v_price, v_new_balance,
    'Presente enviado: ' || g.name || CASE WHEN v_discount>0 THEN ' (desconto pet '||v_discount||'%)' ELSE '' END,
    'Presentes Virtuais', tx_id, g.image_url);

  -- gift_cashback (% returned to sender)
  DECLARE
    v_cashback_pct int := LEAST(50, GREATEST(0, public.pet_perk_sum(uid, ARRAY['gift_cashback'])));
    v_cashback int;
    v_bal_after int;
  BEGIN
    IF v_cashback_pct > 0 THEN
      v_cashback := GREATEST(1, (v_price * v_cashback_pct / 100)::int);
      v_bal_after := LEAST(500, v_new_balance + v_cashback);
      v_cashback := v_bal_after - v_new_balance;
      IF v_cashback > 0 THEN
        UPDATE public.user_coins SET balance = v_bal_after, updated_at = now() WHERE user_id = uid;
        PERFORM public.log_coin_tx(uid, 'gift_cashback', 'in', v_cashback, v_bal_after,
          'Cashback do pet em presente', 'Presentes Virtuais', tx_id, g.image_url);
      END IF;
    END IF;
  END;

  SELECT full_name INTO sender_name FROM public.profiles WHERE id = uid;
  PERFORM public.create_notification(
    _receiver_id, 'gift_received',
    '🎁 Você recebeu um presente!',
    COALESCE(sender_name,'Alguém') || ' enviou ' || g.name,
    '/perfil?tab=presentes', uid, tx_id);

  RETURN tx_id;
END $$;

-- 9) collect_pet_reward (daily)
CREATE OR REPLACE FUNCTION public.collect_pet_reward()
RETURNS TABLE(awarded int, balance int, source text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  v_amt int := 0;
  v_bal int;
  v_new int;
  v_state public.user_pet_perk_state;
  v_key text;
  v_param int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT effect_key, effect_param INTO v_key, v_param
  FROM public.get_active_pet_perks(uid)
  WHERE effect_key IN ('pet_finds_coins_daily','pet_daily_reward')
  ORDER BY CASE effect_key WHEN 'pet_daily_reward' THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_key IS NULL THEN RAISE EXCEPTION 'no_pet_perk' USING ERRCODE='check_violation'; END IF;
  v_amt := COALESCE(v_param, 3);

  SELECT * INTO v_state FROM public.user_pet_perk_state
    WHERE user_id=uid AND effect_key=v_key FOR UPDATE;

  IF v_state.id IS NULL THEN
    INSERT INTO public.user_pet_perk_state(user_id, effect_key, last_collected_at, total_collected)
    VALUES (uid, v_key, now(), v_amt);
  ELSE
    IF v_state.last_collected_at IS NOT NULL AND v_state.last_collected_at::date >= CURRENT_DATE THEN
      RAISE EXCEPTION 'already_collected_today' USING ERRCODE='check_violation';
    END IF;
    UPDATE public.user_pet_perk_state
       SET last_collected_at=now(), total_collected=total_collected+v_amt, updated_at=now()
     WHERE id=v_state.id;
  END IF;

  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100) ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO v_bal FROM public.user_coins WHERE user_id=uid FOR UPDATE;
  v_new := LEAST(500, v_bal + v_amt);
  v_amt := v_new - v_bal;
  UPDATE public.user_coins SET balance=v_new, updated_at=now() WHERE user_id=uid;
  PERFORM public.log_coin_tx(uid, 'pet_reward', 'in', v_amt, v_new,
    'Recompensa do pet', 'Pet', NULL, NULL);
  RETURN QUERY SELECT v_amt, v_new, v_key;
END $$;

GRANT EXECUTE ON FUNCTION public.collect_pet_reward() TO authenticated;

-- 10) Trigger: grant unlocks on equip
CREATE OR REPLACE FUNCTION public.apply_pet_unlock_perks()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  perk RECORD;
BEGIN
  IF NEW.is_equipped IS NOT TRUE THEN RETURN NEW; END IF;
  FOR perk IN
    SELECT effect_key, effect_target_id
    FROM public.get_active_pet_perks(NEW.user_id)
    WHERE effect_target_id IS NOT NULL
      AND effect_key IN ('unlock_frame','unlock_aura','unlock_background','unlock_badge')
  LOOP
    BEGIN
      IF perk.effect_key IN ('unlock_frame','unlock_aura') THEN
        INSERT INTO public.user_decorations(user_id, decoration_id)
        VALUES (NEW.user_id, perk.effect_target_id) ON CONFLICT DO NOTHING;
      ELSIF perk.effect_key = 'unlock_background' THEN
        INSERT INTO public.user_profile_backgrounds(user_id, background_id)
        VALUES (NEW.user_id, perk.effect_target_id) ON CONFLICT DO NOTHING;
      ELSIF perk.effect_key = 'unlock_badge' THEN
        INSERT INTO public.user_badges(user_id, badge_id, active, awarded_at)
        VALUES (NEW.user_id, perk.effect_target_id, true, now()) ON CONFLICT DO NOTHING;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- ignore (target id may not exist); never block equip
      NULL;
    END;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS user_pets_v2_unlocks ON public.user_pets_v2;
CREATE TRIGGER user_pets_v2_unlocks
  AFTER INSERT OR UPDATE OF is_equipped, benefit_id ON public.user_pets_v2
  FOR EACH ROW EXECUTE FUNCTION public.apply_pet_unlock_perks();

-- 11) Seed effects
INSERT INTO public.pet_perk_effects(key, label, description, category, numeric_param, default_param, needs_target, sort_order) VALUES
  ('daily_coins_plus_1','+1 moeda no resgate diário','Soma 1 moeda no claim diário.','coins',false,1,NULL,10),
  ('daily_coins_plus_2','+2 moedas no resgate diário','Soma 2 moedas no claim diário.','coins',false,2,NULL,20),
  ('daily_coins_plus_3','+3 moedas no resgate diário','Soma 3 moedas no claim diário.','coins',false,3,NULL,30),
  ('pet_finds_coins_daily','Pet encontra moedas uma vez por dia','Resgate manual diário separado.','pet_collect',true,3,NULL,40),
  ('pet_daily_reward','Recompensa diária do pet (coletável)','Resgate manual diário do pet.','pet_collect',true,5,NULL,50),
  ('anonymous_hint_plus_1','+1 dica extra em recado anônimo','Aumenta o limite de dicas de 2 para 3.','anonymous',false,1,NULL,60),
  ('gift_cashback','Cashback ao enviar presentes virtuais','Devolve % do preço ao remetente.','gifts',true,10,NULL,70),
  ('gift_discount','Desconto em presentes virtuais','Aplica % de desconto no envio.','gifts',true,10,NULL,80),
  ('mission_coins_plus_1','+1 moeda extra em missões diárias','Bônus de moedas em missões.','missions',false,1,NULL,90),
  ('mission_bonus_chance','Chance de recompensa bônus em missões','Probabilidade de bônus extra em missões.','missions',true,15,NULL,100),
  ('unlock_frame','Moldura exclusiva desbloqueada pelo pet','Concede uma moldura ao equipar o pet.','cosmetic',false,NULL,'avatar_decorations',110),
  ('unlock_background','Fundo exclusivo desbloqueado pelo pet','Concede um fundo de perfil ao equipar.','cosmetic',false,NULL,'profile_backgrounds',120),
  ('unlock_aura','Aura exclusiva desbloqueada pelo pet','Concede uma aura ao equipar o pet.','cosmetic',false,NULL,'avatar_decorations',130),
  ('unlock_badge','Badge exclusiva de companheiro fiel','Concede uma badge ao equipar o pet.','cosmetic',false,NULL,'badges',140),
  ('pet_customization_plus','Mais opções de personalização do pet','Libera novas opções visuais para o pet.','pet_meta',false,NULL,NULL,150),
  ('pet_accessory_slot_plus_1','+1 espaço para acessórios do pet','Aumenta slots de acessório.','pet_meta',false,1,NULL,160),
  ('pet_collectible_slot_plus_1','+1 espaço para colecionáveis do pet','Aumenta slots de colecionáveis.','pet_meta',false,1,NULL,170),
  ('pet_themed_frame','Pet libera moldura temática própria','Libera moldura temática do pet.','cosmetic',false,NULL,'avatar_decorations',180),
  ('pet_cosmetic_set','Pet libera conjunto cosmético próprio','Libera um conjunto cosmético.','cosmetic',false,NULL,NULL,190),
  ('pet_profile_seal','Pet libera selo especial de perfil','Libera selo de perfil.','cosmetic',false,NULL,'badges',200),
  ('pet_avatar_aura_fx','Pet libera aura exclusiva visual no avatar','Aura visual sobre o avatar.','avatar_fx',false,NULL,'avatar_decorations',210),
  ('pet_message_fx','Pet libera efeito visual em mensagens','Glow leve nas mensagens (estilo admin, menor intensidade).','avatar_fx',false,NULL,NULL,220);

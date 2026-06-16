-- ============================================================================
-- PET EXPEDITIONS SYSTEM
-- ============================================================================

-- 1. Catálogo de expedições (admin) -------------------------------------------
CREATE TABLE public.pet_expeditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'Compass',
  image_url text,
  difficulty text NOT NULL DEFAULT 'easy'
    CHECK (difficulty IN ('easy','medium','hard','extreme')),
  duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes BETWEEN 5 AND 1440),
  energy_cost integer NOT NULL DEFAULT 20 CHECK (energy_cost BETWEEN 0 AND 100),
  min_user_level integer NOT NULL DEFAULT 1 CHECK (min_user_level BETWEEN 1 AND 100),
  xp_reward integer NOT NULL DEFAULT 20 CHECK (xp_reward BETWEEN 0 AND 1000),
  coin_reward integer NOT NULL DEFAULT 30 CHECK (coin_reward BETWEEN 0 AND 1000),
  item_reward_label text,
  success_rate integer NOT NULL DEFAULT 100 CHECK (success_rate BETWEEN 0 AND 100),
  crit_rate integer NOT NULL DEFAULT 10 CHECK (crit_rate BETWEEN 0 AND 100),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pet_expeditions TO authenticated;
GRANT ALL ON public.pet_expeditions TO service_role;
ALTER TABLE public.pet_expeditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expeditions readable by authenticated"
  ON public.pet_expeditions FOR SELECT TO authenticated USING (true);
CREATE POLICY "expeditions admin manage"
  ON public.pet_expeditions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_pet_expeditions_updated
  BEFORE UPDATE ON public.pet_expeditions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2. Sorteio diário (3 por usuário) -------------------------------------------
CREATE TABLE public.user_daily_expeditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
  expedition_id uuid NOT NULL REFERENCES public.pet_expeditions(id) ON DELETE CASCADE,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day, expedition_id)
);
CREATE INDEX idx_user_daily_expeditions_day ON public.user_daily_expeditions (user_id, day);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_daily_expeditions TO authenticated;
GRANT ALL ON public.user_daily_expeditions TO service_role;
ALTER TABLE public.user_daily_expeditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily expeditions self read"
  ON public.user_daily_expeditions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 3. Corridas (ativas + histórico) --------------------------------------------
CREATE TABLE public.user_pet_expedition_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_pet_id uuid NOT NULL,
  expedition_id uuid NOT NULL REFERENCES public.pet_expeditions(id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  claimed_at timestamptz,
  outcome text NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending','success','crit','fail')),
  xp_awarded integer NOT NULL DEFAULT 0,
  coin_awarded integer NOT NULL DEFAULT 0,
  item_awarded_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Garante 1 corrida ativa por pet (claimed_at IS NULL)
CREATE UNIQUE INDEX idx_one_active_run_per_pet
  ON public.user_pet_expedition_runs (user_pet_id)
  WHERE claimed_at IS NULL;
CREATE INDEX idx_runs_user ON public.user_pet_expedition_runs (user_id, created_at DESC);

GRANT SELECT ON public.user_pet_expedition_runs TO authenticated;
GRANT ALL ON public.user_pet_expedition_runs TO service_role;
ALTER TABLE public.user_pet_expedition_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "runs self read"
  ON public.user_pet_expedition_runs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- RPCs
-- ============================================================================

-- Sorteia (idempotente) e retorna ids das 3 expedições de hoje
CREATE OR REPLACE FUNCTION public.roll_daily_expeditions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _count integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT count(*) INTO _count FROM public.user_daily_expeditions
    WHERE user_id = _uid AND day = _today;
  IF _count >= 3 THEN RETURN; END IF;

  INSERT INTO public.user_daily_expeditions (user_id, day, expedition_id)
  SELECT _uid, _today, e.id FROM public.pet_expeditions e
    WHERE e.active = true
      AND e.id NOT IN (
        SELECT expedition_id FROM public.user_daily_expeditions
          WHERE user_id = _uid AND day = _today
      )
    ORDER BY random()
    LIMIT (3 - _count);
END;
$$;

-- Lista as expedições de hoje com info do catálogo e status
CREATE OR REPLACE FUNCTION public.get_today_expeditions()
RETURNS TABLE (
  id uuid,
  expedition_id uuid,
  slug text,
  title text,
  description text,
  icon text,
  image_url text,
  difficulty text,
  duration_minutes integer,
  energy_cost integer,
  min_user_level integer,
  xp_reward integer,
  coin_reward integer,
  item_reward_label text,
  success_rate integer,
  crit_rate integer,
  sent_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  RETURN QUERY
    SELECT d.id, e.id, e.slug, e.title, e.description, e.icon, e.image_url,
           e.difficulty, e.duration_minutes, e.energy_cost, e.min_user_level,
           e.xp_reward, e.coin_reward, e.item_reward_label,
           e.success_rate, e.crit_rate, d.sent_at
    FROM public.user_daily_expeditions d
    JOIN public.pet_expeditions e ON e.id = d.expedition_id
    WHERE d.user_id = _uid AND d.day = _today
    ORDER BY
      CASE e.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 ELSE 4 END,
      e.sort_order;
END;
$$;

-- Retorna a corrida ativa do pet (ou null)
CREATE OR REPLACE FUNCTION public.get_active_expedition(_user_pet_id uuid)
RETURNS TABLE (
  run_id uuid,
  expedition_id uuid,
  slug text,
  title text,
  icon text,
  image_url text,
  difficulty text,
  started_at timestamptz,
  ends_at timestamptz,
  duration_minutes integer,
  xp_reward integer,
  coin_reward integer,
  item_reward_label text,
  success_rate integer,
  crit_rate integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  RETURN QUERY
    SELECT r.id, e.id, e.slug, e.title, e.icon, e.image_url, e.difficulty,
           r.started_at, r.ends_at, e.duration_minutes,
           e.xp_reward, e.coin_reward, e.item_reward_label,
           e.success_rate, e.crit_rate
    FROM public.user_pet_expedition_runs r
    JOIN public.pet_expeditions e ON e.id = r.expedition_id
    WHERE r.user_id = _uid
      AND r.user_pet_id = _user_pet_id
      AND r.claimed_at IS NULL
    ORDER BY r.started_at DESC
    LIMIT 1;
END;
$$;

-- Envia o pet em expedição
CREATE OR REPLACE FUNCTION public.start_expedition(_expedition_id uuid, _user_pet_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  _exp pet_expeditions%ROWTYPE;
  _daily user_daily_expeditions%ROWTYPE;
  _user_level integer := 1;
  _current_energy integer;
  _new_energy integer;
  _ends_at timestamptz;
  _run_id uuid;
  _has_active boolean;
  _pet_owner uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  -- valida posse do pet
  SELECT user_id INTO _pet_owner FROM public.user_pets_v2 WHERE id = _user_pet_id;
  IF _pet_owner IS NULL OR _pet_owner <> _uid THEN
    RAISE EXCEPTION 'pet_not_found';
  END IF;

  -- valida expedição ativa
  SELECT * INTO _exp FROM public.pet_expeditions WHERE id = _expedition_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'expedition_unavailable'; END IF;

  -- valida sorteio do dia
  SELECT * INTO _daily FROM public.user_daily_expeditions
    WHERE user_id = _uid AND day = _today AND expedition_id = _expedition_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_in_today_pool'; END IF;
  IF _daily.sent_at IS NOT NULL THEN RAISE EXCEPTION 'already_sent_today'; END IF;

  -- só 1 corrida ativa
  SELECT EXISTS (
    SELECT 1 FROM public.user_pet_expedition_runs
      WHERE user_id = _uid AND claimed_at IS NULL
  ) INTO _has_active;
  IF _has_active THEN RAISE EXCEPTION 'already_on_expedition'; END IF;

  -- valida nível do usuário
  SELECT COALESCE(level, 1) INTO _user_level FROM public.user_xp WHERE user_id = _uid;
  IF _user_level < _exp.min_user_level THEN
    RAISE EXCEPTION 'user_level_too_low';
  END IF;

  -- valida energia atual (usa snapshot via pet_state_snapshot quando possível)
  SELECT value_at_anchor INTO _current_energy
    FROM public.pet_care_state
    WHERE user_pet_id = _user_pet_id AND kind = 'energy';
  IF _current_energy IS NULL THEN _current_energy := 100; END IF;
  IF _current_energy < _exp.energy_cost THEN
    RAISE EXCEPTION 'not_enough_energy';
  END IF;

  -- debita energia
  _new_energy := GREATEST(0, _current_energy - _exp.energy_cost);
  INSERT INTO public.pet_care_state (user_pet_id, kind, value_at_anchor, anchor_at)
    VALUES (_user_pet_id, 'energy', _new_energy, now())
    ON CONFLICT (user_pet_id, kind) DO UPDATE
      SET value_at_anchor = EXCLUDED.value_at_anchor,
          anchor_at = EXCLUDED.anchor_at;

  -- cria corrida
  _ends_at := now() + make_interval(mins => _exp.duration_minutes);
  INSERT INTO public.user_pet_expedition_runs
    (user_id, user_pet_id, expedition_id, started_at, ends_at)
    VALUES (_uid, _user_pet_id, _exp.id, now(), _ends_at)
    RETURNING id INTO _run_id;

  -- marca sorteio como enviado
  UPDATE public.user_daily_expeditions SET sent_at = now() WHERE id = _daily.id;

  -- buff de decaimento 1.5x (todas as barras) durante a missão
  INSERT INTO public.user_pet_buffs
    (user_id, user_pet_id, kind, restore_mult, decay_mult, label, source, expires_at)
    VALUES (_uid, _user_pet_id, 'all', 1.0, 1.5, 'Em expedição', 'expedition', _ends_at);

  RETURN _run_id;
END;
$$;

-- Coleta recompensa (sorteia resultado se ainda pendente)
CREATE OR REPLACE FUNCTION public.claim_expedition(_run_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _run user_pet_expedition_runs%ROWTYPE;
  _exp pet_expeditions%ROWTYPE;
  _roll integer;
  _crit_roll integer;
  _outcome text;
  _xp integer := 0;
  _coins integer := 0;
  _item text;
  _new_balance integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT * INTO _run FROM public.user_pet_expedition_runs
    WHERE id = _run_id AND user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'run_not_found'; END IF;
  IF _run.claimed_at IS NOT NULL THEN RAISE EXCEPTION 'already_claimed'; END IF;
  IF now() < _run.ends_at THEN RAISE EXCEPTION 'not_ready'; END IF;

  SELECT * INTO _exp FROM public.pet_expeditions WHERE id = _run.expedition_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'expedition_missing'; END IF;

  -- sorteia resultado
  _roll := (floor(random() * 100))::int + 1;        -- 1..100
  _crit_roll := (floor(random() * 100))::int + 1;
  IF _roll <= _exp.success_rate THEN
    IF _crit_roll <= _exp.crit_rate THEN
      _outcome := 'crit';
      _xp := _exp.xp_reward * 2;
      _coins := _exp.coin_reward * 2;
      _item := _exp.item_reward_label;
    ELSE
      _outcome := 'success';
      _xp := _exp.xp_reward;
      _coins := _exp.coin_reward;
      _item := _exp.item_reward_label;
    END IF;
  ELSE
    _outcome := 'fail';
    _xp := (_exp.xp_reward * 30) / 100;
    _coins := (_exp.coin_reward * 30) / 100;
    _item := NULL;
  END IF;

  -- credita XP (sem cap diário — recompensa é pontual)
  IF _xp > 0 THEN
    PERFORM public.award_xp('expedition', _xp, NULL,
      jsonb_build_object('run_id', _run_id, 'outcome', _outcome));
  END IF;

  -- credita moedas (clampa em 500)
  IF _coins > 0 THEN
    INSERT INTO public.user_coins (user_id, balance)
      VALUES (_uid, _coins)
      ON CONFLICT (user_id) DO UPDATE
        SET balance = LEAST(500, public.user_coins.balance + _coins);
    SELECT balance INTO _new_balance FROM public.user_coins WHERE user_id = _uid;
    PERFORM public.log_coin_tx(_uid, 'expedition', 'in', _coins, _new_balance,
      'Expedição: ' || _exp.title,
      CASE _outcome WHEN 'crit' THEN 'Crítico!' WHEN 'fail' THEN 'Recompensa parcial' ELSE 'Sucesso' END,
      _run_id, NULL);
  END IF;

  UPDATE public.user_pet_expedition_runs
    SET claimed_at = now(),
        outcome = _outcome,
        xp_awarded = _xp,
        coin_awarded = _coins,
        item_awarded_label = _item
    WHERE id = _run_id;

  -- buff de retorno em caso de sucesso/crítico
  IF _outcome IN ('success','crit') THEN
    INSERT INTO public.user_pet_buffs
      (user_id, user_pet_id, kind, restore_mult, decay_mult, label, source, expires_at)
      VALUES (_uid, _run.user_pet_id, 'affection',
              CASE WHEN _outcome = 'crit' THEN 1.5 ELSE 1.2 END,
              1.0, 'Saudades do dono', 'expedition_return',
              now() + interval '1 hour');
  END IF;

  RETURN jsonb_build_object(
    'outcome', _outcome,
    'xp', _xp,
    'coins', _coins,
    'item', _item
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.roll_daily_expeditions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_today_expeditions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_expedition(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_expedition(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_expedition(uuid) TO authenticated;

-- Seeds iniciais (3 expedições de exemplo)
INSERT INTO public.pet_expeditions
  (slug, title, description, icon, difficulty, duration_minutes, energy_cost, min_user_level, xp_reward, coin_reward, item_reward_label, success_rate, crit_rate, sort_order)
VALUES
  ('caverna-de-tundra', 'Caverna de Tundra', 'Uma expedição congelante em busca de cristais raros.', 'Mountain', 'easy', 60, 20, 1, 20, 30, 'Cristal de gelo', 100, 10, 1),
  ('floresta-encantada', 'Floresta Encantada', 'Trilhas profundas com criaturas curiosas.', 'Trees', 'medium', 240, 40, 3, 50, 60, 'Folha luminosa', 85, 12, 2),
  ('templo-perdido', 'Templo Perdido', 'Ruínas antigas guardam tesouros — e perigos.', 'Landmark', 'hard', 480, 60, 5, 120, 150, 'Relíquia dourada', 70, 15, 3);

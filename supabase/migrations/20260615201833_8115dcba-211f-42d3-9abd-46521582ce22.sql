
-- ============================================================
-- Pacote inicial: trava por usuário + transação registrada
-- ============================================================

CREATE OR REPLACE FUNCTION public.claim_starter_bundle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _coins integer := 300;
  _xp integer := 200;
  _xp_res jsonb;
  _old_balance integer := 0;
  _new_balance integer;
  _delta integer;
  _lock_key bigint;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  -- Trava por usuário durante a transação para impedir cliques duplos.
  _lock_key := ('x' || substr(md5('starter_bundle:' || _uid::text), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(_lock_key);

  -- Reentrada idempotente
  IF EXISTS (SELECT 1 FROM public.user_starter_bundle WHERE user_id = _uid) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END IF;

  INSERT INTO public.user_starter_bundle (user_id, coins_granted, xp_granted)
  VALUES (_uid, _coins, _xp);

  SELECT COALESCE(balance, 0) INTO _old_balance
    FROM public.user_coins WHERE user_id = _uid;

  INSERT INTO public.user_coins (user_id, balance)
  VALUES (_uid, LEAST(500, COALESCE(_old_balance, 0) + _coins))
  ON CONFLICT (user_id) DO UPDATE
    SET balance = LEAST(500, public.user_coins.balance + _coins),
        updated_at = now()
  RETURNING balance INTO _new_balance;

  _delta := _new_balance - COALESCE(_old_balance, 0);

  -- Registra a "compra" do pacote no histórico de moedas para auditoria.
  INSERT INTO public.coin_transactions
    (user_id, kind, direction, amount, balance_after, title, subtitle)
  VALUES
    (_uid, 'starter_bundle', 'in', _delta, _new_balance,
     'Pacote inicial', '+' || _delta || ' moedas · +' || _xp || ' XP');

  _xp_res := public.award_xp(
    'starter_bundle', _xp, NULL,
    jsonb_build_object('one_time', true)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'coins_granted', _delta,
    'xp_granted', _xp,
    'new_balance', _new_balance,
    'xp_result', _xp_res
  );
END
$$;

-- ============================================================
-- Histórico de renascimentos / medalhas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pet_rebirth_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prestige_level integer NOT NULL,
  xp_at_rebirth integer NOT NULL DEFAULT 0,
  medal text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_rebirth_user_created
  ON public.pet_rebirth_history(user_id, created_at DESC);

GRANT SELECT ON public.pet_rebirth_history TO authenticated;
GRANT ALL ON public.pet_rebirth_history TO service_role;

ALTER TABLE public.pet_rebirth_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rebirth_history_owner_read"
  ON public.pet_rebirth_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Helper: medalha por nível
CREATE OR REPLACE FUNCTION public.medal_for_prestige(_level integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _level >= 10 THEN 'diamond'
    WHEN _level >= 5  THEN 'gold'
    WHEN _level >= 3  THEN 'silver'
    WHEN _level >= 1  THEN 'bronze'
    ELSE NULL
  END
$$;

-- prestige_rebirth: grava histórico + medalha
CREATE OR REPLACE FUNCTION public.prestige_rebirth()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _xp_level integer := 1;
  _xp_total integer := 0;
  _new_prestige integer;
  _medal text;
  _lock_key bigint;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  _lock_key := ('x' || substr(md5('prestige_rebirth:' || _uid::text), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(_lock_key);

  SELECT COALESCE(level,1), COALESCE(xp_total,0)
    INTO _xp_level, _xp_total
  FROM public.user_xp WHERE user_id = _uid;

  IF _xp_level < 50 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'level_too_low', 'required_level', 50);
  END IF;

  UPDATE public.user_xp
     SET xp_total = 0, level = 1, updated_at = now()
   WHERE user_id = _uid;

  INSERT INTO public.user_prestige (user_id, level, total_rebirths, last_prestige_at, updated_at)
  VALUES (_uid, 1, 1, now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET level = public.user_prestige.level + 1,
        total_rebirths = public.user_prestige.total_rebirths + 1,
        last_prestige_at = now(),
        updated_at = now()
  RETURNING level INTO _new_prestige;

  _medal := public.medal_for_prestige(_new_prestige);

  INSERT INTO public.pet_rebirth_history
    (user_id, prestige_level, xp_at_rebirth, medal)
  VALUES
    (_uid, _new_prestige, _xp_total, _medal);

  RETURN jsonb_build_object(
    'ok', true,
    'new_prestige_level', _new_prestige,
    'xp_bonus_pct', LEAST(_new_prestige, 10) * 5,
    'medal', _medal
  );
END
$$;

-- Histórico
CREATE OR REPLACE FUNCTION public.get_my_rebirth_history()
RETURNS TABLE (
  id uuid,
  prestige_level integer,
  xp_at_rebirth integer,
  medal text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id, prestige_level, xp_at_rebirth, medal, created_at
  FROM public.pet_rebirth_history
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 50
$$;

GRANT EXECUTE ON FUNCTION public.get_my_rebirth_history() TO authenticated;
GRANT EXECUTE ON FUNCTION public.medal_for_prestige(integer) TO authenticated;

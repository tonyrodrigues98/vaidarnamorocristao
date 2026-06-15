
-- Admin economy: user search + per-user economy + grant coins

CREATE OR REPLACE FUNCTION public.admin_search_users(_q text DEFAULT '', _limit int DEFAULT 20)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  photo_url text,
  balance integer,
  claim_streak integer,
  top_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller uuid := auth.uid();
  q text := COALESCE(NULLIF(trim(_q), ''), '');
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF NOT (public.has_role(caller,'admin') OR public.has_role(caller,'super_admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH excluded AS (
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'super_admin'
  ),
  roles_agg AS (
    SELECT ur.user_id,
           string_agg(ur.role::text, ',' ORDER BY ur.role::text) AS roles
    FROM public.user_roles ur
    GROUP BY ur.user_id
  )
  SELECT p.id,
         p.full_name,
         p.photo_url,
         COALESCE(uc.balance, 0)::int,
         COALESCE(uc.claim_streak, 0)::int,
         COALESCE(ra.roles, 'user')
  FROM public.profiles p
  LEFT JOIN public.user_coins uc ON uc.user_id = p.id
  LEFT JOIN roles_agg ra ON ra.user_id = p.id
  WHERE p.id NOT IN (SELECT user_id FROM excluded)
    AND (
      q = '' OR
      p.full_name ILIKE '%' || q || '%' OR
      p.city ILIKE '%' || q || '%' OR
      p.id::text = q
    )
  ORDER BY (CASE WHEN q = '' THEN COALESCE(uc.updated_at, p.created_at) END) DESC NULLS LAST,
           p.full_name ASC
  LIMIT GREATEST(1, LEAST(_limit, 50));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_user_economy(_user_id uuid, _limit int DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller uuid := auth.uid();
  is_target_super boolean;
  bal int;
  streak int;
  txs jsonb;
  totals jsonb;
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF NOT (public.has_role(caller,'admin') OR public.has_role(caller,'super_admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT public.has_role(_user_id,'super_admin') INTO is_target_super;
  IF is_target_super THEN RAISE EXCEPTION 'target is super_admin'; END IF;

  SELECT COALESCE(balance,0), COALESCE(claim_streak,0)
    INTO bal, streak FROM public.user_coins WHERE user_id = _user_id;

  SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'created_at') DESC), '[]'::jsonb)
    INTO txs FROM (
      SELECT to_jsonb(ct) AS t FROM public.coin_transactions ct
      WHERE ct.user_id = _user_id
      ORDER BY ct.created_at DESC
      LIMIT GREATEST(1, LEAST(_limit, 200))
    ) s;

  SELECT jsonb_build_object(
    'coins_in', COALESCE(SUM(amount) FILTER (WHERE direction='in'),0),
    'coins_out', COALESCE(SUM(amount) FILTER (WHERE direction='out'),0),
    'tx_count', COUNT(*)
  ) INTO totals FROM public.coin_transactions WHERE user_id = _user_id;

  RETURN jsonb_build_object(
    'user_id', _user_id,
    'balance', COALESCE(bal,0),
    'claim_streak', COALESCE(streak,0),
    'totals', totals,
    'transactions', txs
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_grant_coins(_user_id uuid, _amount int, _note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller uuid := auth.uid();
  cur int;
  new_balance int;
  delta int;
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF NOT (public.has_role(caller,'admin') OR public.has_role(caller,'super_admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _user_id IS NULL OR _amount IS NULL OR _amount = 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;
  IF _amount > 10000 OR _amount < -10000 THEN
    RAISE EXCEPTION 'amount out of range';
  END IF;
  IF public.has_role(_user_id,'super_admin') THEN
    RAISE EXCEPTION 'cannot modify super_admin';
  END IF;

  INSERT INTO public.user_coins (user_id, balance) VALUES (_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO cur FROM public.user_coins WHERE user_id = _user_id FOR UPDATE;
  new_balance := GREATEST(0, cur + _amount);
  delta := new_balance - cur;

  UPDATE public.user_coins
    SET balance = new_balance, updated_at = now()
    WHERE user_id = _user_id;

  IF delta > 0 THEN
    PERFORM public.log_coin_tx(_user_id, 'admin_grant', 'in', delta, new_balance,
      'Crédito do administrador', COALESCE(_note, 'Recarga manual'));
  ELSIF delta < 0 THEN
    PERFORM public.log_coin_tx(_user_id, 'admin_debit', 'out', -delta, new_balance,
      'Débito do administrador', COALESCE(_note, 'Ajuste manual'));
  END IF;

  RETURN jsonb_build_object('balance', new_balance, 'delta', delta);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_search_users(text,int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_user_economy(uuid,int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_grant_coins(uuid,int,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text,int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_economy(uuid,int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_coins(uuid,int,text) TO authenticated;

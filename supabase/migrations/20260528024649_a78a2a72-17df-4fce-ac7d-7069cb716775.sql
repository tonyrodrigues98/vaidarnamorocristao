-- 1) Coin transactions table (financial ledger of coin movements)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  amount integer NOT NULL CHECK (amount >= 0),
  balance_after integer NOT NULL,
  title text NOT NULL,
  subtitle text,
  ref_id uuid,
  icon_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coin_tx_user_created
  ON public.coin_transactions (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coin_transactions TO authenticated;
GRANT ALL ON public.coin_transactions TO service_role;

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own coin tx" ON public.coin_transactions;
CREATE POLICY "users read own coin tx"
ON public.coin_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- inserts/updates/deletes only via SECURITY DEFINER helpers (no direct client policy)

-- 2) Internal logger
CREATE OR REPLACE FUNCTION public.log_coin_tx(
  _user_id uuid,
  _kind text,
  _direction text,
  _amount integer,
  _balance_after integer,
  _title text,
  _subtitle text DEFAULT NULL,
  _ref_id uuid DEFAULT NULL,
  _icon_url text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF _user_id IS NULL OR _amount IS NULL OR _amount < 0 THEN RETURN NULL; END IF;
  INSERT INTO public.coin_transactions
    (user_id, kind, direction, amount, balance_after, title, subtitle, ref_id, icon_url)
  VALUES
    (_user_id, _kind, _direction, _amount, _balance_after, _title, _subtitle, _ref_id, _icon_url)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- 3) Patch claim_daily_coins to log
CREATE OR REPLACE FUNCTION public.claim_daily_coins()
 RETURNS TABLE(balance integer, awarded integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid UUID := auth.uid();
  r public.user_coins;
  new_balance INTEGER;
  award INTEGER := 10;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO r FROM public.user_coins WHERE user_id = uid FOR UPDATE;
  IF r.balance >= 500 THEN
    RAISE EXCEPTION 'max_balance' USING ERRCODE='check_violation';
  END IF;
  IF r.last_claim_date IS NOT NULL AND r.last_claim_date >= CURRENT_DATE THEN
    RAISE EXCEPTION 'already_claimed' USING ERRCODE='check_violation';
  END IF;
  new_balance := LEAST(500, r.balance + award);
  award := new_balance - r.balance;
  UPDATE public.user_coins
    SET balance = new_balance,
        last_claim_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = uid;
  PERFORM public.log_coin_tx(uid, 'daily_claim', 'in', award, new_balance,
    'Resgate diário', 'Bônus diário de moedas');
  RETURN QUERY SELECT new_balance, award;
END;
$function$;

-- 4) Patch spend_coin to log as sticker spend (only caller today)
CREATE OR REPLACE FUNCTION public.spend_coin(_amount integer DEFAULT 1)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid UUID := auth.uid();
  r public.user_coins;
  new_balance INTEGER;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO r FROM public.user_coins WHERE user_id = uid FOR UPDATE;
  IF r.balance < _amount THEN
    RAISE EXCEPTION 'insufficient_coins' USING ERRCODE='check_violation';
  END IF;
  new_balance := r.balance - _amount;
  UPDATE public.user_coins
    SET balance = new_balance, updated_at = now()
    WHERE user_id = uid;
  PERFORM public.log_coin_tx(uid, 'sticker_spend', 'out', _amount, new_balance,
    'Sticker enviado', 'Comunidade');
  RETURN new_balance;
END;
$function$;

-- 5) Patch purchase_decoration to log with decoration name + icon
CREATE OR REPLACE FUNCTION public.purchase_decoration(_decoration_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID := auth.uid();
  _price INTEGER;
  _balance INTEGER;
  _name TEXT;
  _type public.decoration_type;
  _img TEXT;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT price_coins, name, type, image_url INTO _price, _name, _type, _img
  FROM public.avatar_decorations
  WHERE id = _decoration_id AND active = true;

  IF _price IS NULL THEN
    RAISE EXCEPTION 'decoration_not_found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_decorations
    WHERE user_id = _user_id AND decoration_id = _decoration_id
  ) THEN
    RAISE EXCEPTION 'already_owned';
  END IF;

  SELECT balance INTO _balance
  FROM public.user_coins
  WHERE user_id = _user_id
  FOR UPDATE;

  IF _balance IS NULL OR _balance < _price THEN
    RAISE EXCEPTION 'insufficient_coins';
  END IF;

  UPDATE public.user_coins
  SET balance = balance - _price, updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO public.user_decorations(user_id, decoration_id)
  VALUES (_user_id, _decoration_id);

  PERFORM public.log_coin_tx(
    _user_id, 'decoration_purchase', 'out', _price, _balance - _price,
    COALESCE(_name, 'Decoração'),
    CASE _type
      WHEN 'frame' THEN 'Moldura'
      WHEN 'aura' THEN 'Aura'
      WHEN 'sticker' THEN 'Sticker'
      ELSE 'Decoração'
    END,
    _decoration_id,
    _img
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', _balance - _price
  );
END;
$function$;

-- 6) Patch buy_anonymous_extra: deduct directly + log as 'anonymous_extra' (no sticker tx leak)
CREATE OR REPLACE FUNCTION public.buy_anonymous_extra()
 RETURNS TABLE(extras integer, coin_balance integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  v_cost int := 10;
  v_balance int;
  v_new_balance int;
  v_extras int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100)
    ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.anonymous_message_settings (user_id, accept_anonymous)
    VALUES (uid, true) ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO v_balance FROM public.user_coins WHERE user_id = uid FOR UPDATE;
  IF v_balance IS NULL OR v_balance < v_cost THEN
    RAISE EXCEPTION 'insufficient_coins' USING ERRCODE='check_violation';
  END IF;
  v_new_balance := v_balance - v_cost;
  UPDATE public.user_coins SET balance = v_new_balance, updated_at = now()
   WHERE user_id = uid;

  UPDATE public.anonymous_message_settings
     SET extras_balance = COALESCE(extras_balance, 0) + 1,
         updated_at = now()
   WHERE user_id = uid
  RETURNING extras_balance INTO v_extras;

  PERFORM public.log_coin_tx(uid, 'anonymous_extra', 'out', v_cost, v_new_balance,
    'Recado anônimo extra', 'Mystery Match');

  RETURN QUERY SELECT v_extras, v_new_balance;
END $function$;

-- 7) Patch admin_add_user_coins to log
CREATE OR REPLACE FUNCTION public.admin_add_user_coins(_user_id uuid, _amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_balance integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount > 500 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  INSERT INTO public.user_coins (user_id, balance)
  VALUES (_user_id, LEAST(100 + _amount, 500))
  ON CONFLICT (user_id) DO UPDATE
    SET balance = LEAST(public.user_coins.balance + _amount, 500),
        updated_at = now()
  RETURNING balance INTO new_balance;

  PERFORM public.log_coin_tx(_user_id, 'admin_grant', 'in', _amount, new_balance,
    'Bônus da equipe', 'Adicionado pela administração');

  RETURN new_balance;
END;
$function$;
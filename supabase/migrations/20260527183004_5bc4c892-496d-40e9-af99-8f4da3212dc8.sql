CREATE OR REPLACE FUNCTION public.admin_add_user_coins(_user_id uuid, _amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  RETURN new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_add_user_coins(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_add_user_coins(uuid, integer) TO authenticated;
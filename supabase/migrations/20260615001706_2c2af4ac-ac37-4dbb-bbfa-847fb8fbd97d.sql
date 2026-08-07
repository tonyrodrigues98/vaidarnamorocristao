CREATE OR REPLACE FUNCTION public.spend_coin_for_pet_care(_amount integer, _item_id uuid, _user_pet_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  r public.user_coins;
  v_new int;
  v_item public.pet_care_items;
  v_pet_name text;
  v_kind_label text;
  v_action_label text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RETURN NULL; END IF;

  SELECT * INTO v_item FROM public.pet_care_items WHERE id = _item_id;
  IF v_item IS NULL THEN RAISE EXCEPTION 'item not found'; END IF;

  SELECT COALESCE(custom_name, 'seu pet') INTO v_pet_name
  FROM public.user_pets_v2 WHERE id = _user_pet_id;

  v_kind_label := CASE v_item.kind::text
    WHEN 'feed' THEN 'Alimento'
    WHEN 'play' THEN 'Brincadeira'
    WHEN 'hygiene' THEN 'Banho'
    WHEN 'sleep' THEN 'Cama'
    WHEN 'affection' THEN 'Carinho'
    ELSE 'Cuidado'
  END;

  v_action_label := CASE v_item.kind::text
    WHEN 'feed' THEN 'Alimentou'
    WHEN 'play' THEN 'Brincou'
    WHEN 'hygiene' THEN 'Banhou'
    WHEN 'sleep' THEN 'Colocou para dormir'
    WHEN 'affection' THEN 'Fez carinho em'
    ELSE 'Cuidou de'
  END;

  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO r FROM public.user_coins WHERE user_id = uid FOR UPDATE;
  IF r.balance < _amount THEN
    RAISE EXCEPTION 'insufficient_coins' USING ERRCODE='check_violation';
  END IF;
  v_new := r.balance - _amount;
  UPDATE public.user_coins SET balance = v_new, updated_at = now() WHERE user_id = uid;

  PERFORM public.log_coin_tx(
    uid,
    'pet_care_spend',
    'out',
    _amount,
    v_new,
    v_kind_label || ': ' || v_item.name,
    v_action_label || ' ' || COALESCE(v_pet_name, 'seu pet') || ' com "' || v_item.name || '"',
    _item_id,
    v_item.image_url
  );

  RETURN v_new;
END $function$;
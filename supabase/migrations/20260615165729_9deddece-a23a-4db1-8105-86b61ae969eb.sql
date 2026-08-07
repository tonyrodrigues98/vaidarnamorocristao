-- Add min_level to pet_backgrounds and enforce server-side on unlock.
ALTER TABLE public.pet_backgrounds
  ADD COLUMN IF NOT EXISTS min_level integer NOT NULL DEFAULT 1;

-- Backfill min_level based on rarity, respecting LEVEL_REWARDS:
--   common=1, rare=3, epic=9, legendary=30
UPDATE public.pet_backgrounds SET min_level = CASE rarity
  WHEN 'legendary' THEN 30
  WHEN 'epic'      THEN 9
  WHEN 'rare'      THEN 3
  ELSE 1
END
WHERE min_level = 1; -- only update rows not yet customized

-- Replace unlock RPC to enforce min_level check using the user's current level.
CREATE OR REPLACE FUNCTION public.unlock_pet_background(_background_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  bg public.pet_backgrounds;
  v_bal int;
  v_new int;
  v_existing uuid;
  v_user_lv int := 1;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO bg FROM public.pet_backgrounds WHERE id = _background_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'background_not_found'; END IF;

  SELECT id INTO v_existing FROM public.user_pet_backgrounds
    WHERE user_id = uid AND background_id = _background_id;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  -- Level gate (server-side enforcement)
  SELECT COALESCE(level, 1) INTO v_user_lv FROM public.user_xp WHERE user_id = uid;
  IF v_user_lv IS NULL THEN v_user_lv := 1; END IF;
  IF v_user_lv < COALESCE(bg.min_level, 1) THEN
    RAISE EXCEPTION 'level_too_low:%', bg.min_level USING ERRCODE='check_violation';
  END IF;

  IF bg.is_exclusive AND bg.price_coins > 0 THEN
    INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100) ON CONFLICT (user_id) DO NOTHING;
    SELECT balance INTO v_bal FROM public.user_coins WHERE user_id = uid FOR UPDATE;
    IF v_bal < bg.price_coins THEN RAISE EXCEPTION 'insufficient_coins' USING ERRCODE='check_violation'; END IF;
    v_new := v_bal - bg.price_coins;
    UPDATE public.user_coins SET balance = v_new, updated_at = now() WHERE user_id = uid;
    PERFORM public.log_coin_tx(uid, 'pet_background_purchase', 'out', bg.price_coins, v_new,
      'Cenário do pet: ' || bg.name, 'Pet', _background_id, bg.image_url_day);
  END IF;

  INSERT INTO public.user_pet_backgrounds (user_id, background_id, is_equipped)
  VALUES (uid, _background_id, false)
  RETURNING id INTO v_existing;

  RETURN v_existing;
END;
$function$;
-- Sincroniza os limites diarios do Pet Arcade e preserva limites personalizados por jogo.

DO $$
DECLARE
  v_effective integer;
BEGIN
  SELECT GREATEST(s.daily_play_limit, c.daily_round_limit)
  INTO v_effective
  FROM public.pet_arcade_settings s
  CROSS JOIN public.pet_arcade_config c
  WHERE s.id = 1 AND c.id = 1;

  UPDATE public.pet_arcade_settings
  SET daily_play_limit = v_effective, updated_at = now()
  WHERE id = 1;

  UPDATE public.pet_arcade_config
  SET daily_round_limit = v_effective, updated_at = now()
  WHERE id = 1;

  -- 30 era o valor inicial por jogo. Valores diferentes sao tratados como personalizados.
  UPDATE public.pet_arcade_game_configs
  SET daily_play_limit = v_effective, updated_at = now()
  WHERE daily_play_limit = 30;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_pet_arcade_daily_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_global_limit integer;
  v_game_limit integer;
  v_global_count integer;
  v_game_count integer;
BEGIN
  SELECT daily_play_limit INTO v_global_limit
  FROM public.pet_arcade_settings WHERE id = 1;

  SELECT daily_play_limit INTO v_game_limit
  FROM public.pet_arcade_game_configs WHERE game_type = NEW.game_type;

  SELECT count(*) INTO v_global_count
  FROM public.pet_arcade_rounds
  WHERE user_id = NEW.user_id AND day = NEW.day;

  IF v_global_limit IS NOT NULL AND v_global_count >= v_global_limit THEN
    RAISE EXCEPTION 'daily_round_limit';
  END IF;

  SELECT count(*) INTO v_game_count
  FROM public.pet_arcade_rounds
  WHERE user_id = NEW.user_id AND game_type = NEW.game_type AND day = NEW.day;

  IF v_game_limit IS NOT NULL AND v_game_count >= v_game_limit THEN
    RAISE EXCEPTION 'game_daily_limit';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS pet_arcade_daily_limits_trg ON public.pet_arcade_rounds;
CREATE TRIGGER pet_arcade_daily_limits_trg
BEFORE INSERT ON public.pet_arcade_rounds
FOR EACH ROW EXECUTE FUNCTION public.enforce_pet_arcade_daily_limits();

REVOKE ALL ON FUNCTION public.enforce_pet_arcade_daily_limits() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_pet_arcade_usage_today()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH usage_by_game AS (
    SELECT game_type, count(*)::integer AS used
    FROM public.pet_arcade_rounds
    WHERE user_id = auth.uid()
      AND day = (now() AT TIME ZONE 'America/Sao_Paulo')::date
    GROUP BY game_type
  )
  SELECT jsonb_build_object(
    'total_used', COALESCE((SELECT sum(used) FROM usage_by_game), 0),
    'by_game', COALESCE(
      (SELECT jsonb_object_agg(game_type, used) FROM usage_by_game),
      '{}'::jsonb
    ),
    'day', (now() AT TIME ZONE 'America/Sao_Paulo')::date
  );
$$;

REVOKE ALL ON FUNCTION public.get_pet_arcade_usage_today() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pet_arcade_usage_today() TO authenticated;

CREATE OR REPLACE FUNCTION public.pet_arcade_admin_update_settings(_patch jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.pet_arcade_settings;
  v_old_limit integer;
  v_new_limit integer;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT daily_play_limit INTO v_old_limit
  FROM public.pet_arcade_settings WHERE id = 1 FOR UPDATE;

  v_new_limit := COALESCE((_patch->>'daily_play_limit')::integer, v_old_limit);

  UPDATE public.pet_arcade_settings SET
    is_enabled = COALESCE((_patch->>'is_enabled')::boolean, is_enabled),
    daily_play_limit = v_new_limit,
    daily_win_limit = COALESCE((_patch->>'daily_win_limit')::integer, daily_win_limit),
    global_min_entry = COALESCE((_patch->>'global_min_entry')::integer, global_min_entry),
    global_max_entry = COALESCE((_patch->>'global_max_entry')::integer, global_max_entry),
    maintenance_message = COALESCE(_patch->>'maintenance_message', maintenance_message),
    healthy_play_message = COALESCE(_patch->>'healthy_play_message', healthy_play_message),
    updated_at = now()
  WHERE id = 1
  RETURNING * INTO v_row;

  UPDATE public.pet_arcade_config
  SET daily_round_limit = v_new_limit, updated_at = now()
  WHERE id = 1;

  -- Jogos ainda usando o limite anterior/default acompanham o limite geral.
  UPDATE public.pet_arcade_game_configs
  SET daily_play_limit = v_new_limit, updated_at = now()
  WHERE daily_play_limit IN (30, v_old_limit);

  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public.pet_arcade_admin_update_config(_patch jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.pet_arcade_config;
  v_old_limit integer;
  v_new_limit integer;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT daily_play_limit INTO v_old_limit
  FROM public.pet_arcade_settings WHERE id = 1 FOR UPDATE;
  v_new_limit := COALESCE((_patch->>'daily_round_limit')::integer, v_old_limit);

  UPDATE public.pet_arcade_config SET
    treasure_active = COALESCE((_patch->>'treasure_active')::boolean, treasure_active),
    flight_active = COALESCE((_patch->>'flight_active')::boolean, flight_active),
    maintenance = COALESCE((_patch->>'maintenance')::boolean, maintenance),
    min_entry = COALESCE((_patch->>'min_entry')::integer, min_entry),
    max_entry = COALESCE((_patch->>'max_entry')::integer, max_entry),
    daily_round_limit = v_new_limit,
    daily_reward_limit = COALESCE((_patch->>'daily_reward_limit')::integer, daily_reward_limit),
    max_multiplier = COALESCE((_patch->>'max_multiplier')::numeric, max_multiplier),
    explanatory_text = COALESCE(_patch->>'explanatory_text', explanatory_text),
    updated_at = now()
  WHERE id = 1
  RETURNING * INTO v_row;

  UPDATE public.pet_arcade_settings
  SET daily_play_limit = v_new_limit, updated_at = now()
  WHERE id = 1;

  UPDATE public.pet_arcade_game_configs
  SET daily_play_limit = v_new_limit, updated_at = now()
  WHERE daily_play_limit IN (30, v_old_limit);

  RETURN to_jsonb(v_row);
END $$;

REVOKE ALL ON FUNCTION public.pet_arcade_admin_update_settings(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pet_arcade_admin_update_config(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pet_arcade_admin_update_settings(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pet_arcade_admin_update_config(jsonb) TO authenticated;

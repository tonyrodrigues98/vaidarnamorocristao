
DELETE FROM public.user_daily_expeditions d
USING public.pet_expeditions e
WHERE d.expedition_id = e.id
  AND e.active = false
  AND d.sent_at IS NULL;

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
    WHERE d.user_id = _uid AND d.day = _today AND e.active = true
    ORDER BY
      CASE e.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 ELSE 4 END,
      e.sort_order;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_today_expeditions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_today_expeditions() TO authenticated;


-- 1) Marca de evolução individual no pet
ALTER TABLE public.user_pets_v2
  ADD COLUMN IF NOT EXISTS evolved_at timestamptz;

-- Pets já criados como adulto: consideramos "já cresceu" (sem banner retroativo).
UPDATE public.user_pets_v2 p
SET evolved_at = p.created_at
FROM public.pet_life_stages ls
WHERE p.life_stage_id = ls.id
  AND ls.kind = 'adult'
  AND p.evolved_at IS NULL;

-- 2) Marca por usuário: a partir de quando ele pode escolher adulto direto
CREATE TABLE IF NOT EXISTS public.user_pet_unlocks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  adult_unlocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_pet_unlocks TO authenticated;
GRANT ALL ON public.user_pet_unlocks TO service_role;

ALTER TABLE public.user_pet_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own pet unlocks"
  ON public.user_pet_unlocks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS user_pet_unlocks_updated ON public.user_pet_unlocks;
CREATE TRIGGER user_pet_unlocks_updated
  BEFORE UPDATE ON public.user_pet_unlocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Retroativo: quem já tem qualquer pet adulto, já desbloqueia direto.
INSERT INTO public.user_pet_unlocks (user_id, adult_unlocked_at)
SELECT DISTINCT p.user_id, now()
FROM public.user_pets_v2 p
JOIN public.pet_life_stages ls ON ls.id = p.life_stage_id
WHERE ls.kind = 'adult'
ON CONFLICT (user_id) DO UPDATE
  SET adult_unlocked_at = COALESCE(public.user_pet_unlocks.adult_unlocked_at, EXCLUDED.adult_unlocked_at);

-- 3) Helper: usuário pode criar pet adulto?
CREATE OR REPLACE FUNCTION public.is_adult_pet_unlocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_pet_unlocks
    WHERE user_id = _user_id AND adult_unlocked_at IS NOT NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_adult_pet_unlocked(uuid) TO authenticated;

-- 4) Trigger de proteção: se o usuário não desbloqueou adulto, só pode inserir filhote
CREATE OR REPLACE FUNCTION public.enforce_first_pet_baby()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _kind text;
BEGIN
  SELECT kind INTO _kind FROM public.pet_life_stages WHERE id = NEW.life_stage_id;
  IF _kind = 'adult' AND NOT public.is_adult_pet_unlocked(NEW.user_id) THEN
    RAISE EXCEPTION 'Primeiro pet precisa ser filhote. Faça seu pet crescer pra desbloquear adultos.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_pets_v2_first_baby ON public.user_pets_v2;
CREATE TRIGGER user_pets_v2_first_baby
  BEFORE INSERT ON public.user_pets_v2
  FOR EACH ROW EXECUTE FUNCTION public.enforce_first_pet_baby();

-- 5) RPC: status de evolução do pet atual do usuário
CREATE OR REPLACE FUNCTION public.get_pet_evolution_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _pet_id uuid;
  _stage_kind text;
  _level int := 1;
  _streak int := 0;
  _required_level constant int := 15;
  _required_streak constant int := 14;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'auth');
  END IF;

  SELECT p.id, ls.kind
    INTO _pet_id, _stage_kind
  FROM public.user_pets_v2 p
  JOIN public.pet_life_stages ls ON ls.id = p.life_stage_id
  WHERE p.user_id = _uid
  ORDER BY p.is_equipped DESC, p.created_at DESC
  LIMIT 1;

  IF _pet_id IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'no_pet');
  END IF;

  SELECT COALESCE(level, 1) INTO _level FROM public.user_xp WHERE user_id = _uid;
  SELECT COALESCE(current_streak, 0) INTO _streak FROM public.pet_care_streaks WHERE user_id = _uid;

  RETURN jsonb_build_object(
    'pet_id', _pet_id,
    'stage_kind', _stage_kind,
    'is_baby', _stage_kind = 'baby',
    'level', _level,
    'streak', _streak,
    'required_level', _required_level,
    'required_streak', _required_streak,
    'eligible', _stage_kind = 'baby' AND _level >= _required_level AND _streak >= _required_streak
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pet_evolution_status() TO authenticated;

-- 6) RPC: executar a evolução (cerimônia)
CREATE OR REPLACE FUNCTION public.evolve_my_pet()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _pet record;
  _level int := 1;
  _streak int := 0;
  _required_level constant int := 15;
  _required_streak constant int := 14;
  _adult_stage_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'auth');
  END IF;

  SELECT p.id, p.life_stage_id, p.evolved_at, ls.kind AS stage_kind
    INTO _pet
  FROM public.user_pets_v2 p
  JOIN public.pet_life_stages ls ON ls.id = p.life_stage_id
  WHERE p.user_id = _uid
  ORDER BY p.is_equipped DESC, p.created_at DESC
  LIMIT 1;

  IF _pet.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_pet');
  END IF;
  IF _pet.stage_kind <> 'baby' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_baby');
  END IF;

  SELECT COALESCE(level, 1) INTO _level FROM public.user_xp WHERE user_id = _uid;
  SELECT COALESCE(current_streak, 0) INTO _streak FROM public.pet_care_streaks WHERE user_id = _uid;

  IF _level < _required_level OR _streak < _required_streak THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'gate',
      'level', _level,
      'streak', _streak,
      'required_level', _required_level,
      'required_streak', _required_streak
    );
  END IF;

  SELECT id INTO _adult_stage_id FROM public.pet_life_stages WHERE kind = 'adult' LIMIT 1;
  IF _adult_stage_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_adult_stage');
  END IF;

  UPDATE public.user_pets_v2
     SET life_stage_id = _adult_stage_id,
         evolved_at = now(),
         updated_at = now()
   WHERE id = _pet.id;

  -- Desbloqueia escolha de adulto em pets futuros
  INSERT INTO public.user_pet_unlocks (user_id, adult_unlocked_at)
  VALUES (_uid, now())
  ON CONFLICT (user_id) DO UPDATE
    SET adult_unlocked_at = COALESCE(public.user_pet_unlocks.adult_unlocked_at, EXCLUDED.adult_unlocked_at),
        updated_at = now();

  -- Bônus de XP (200) — usa award_xp sem cap diário pra essa fonte única
  PERFORM public.award_xp('pet_evolved', 200, NULL, jsonb_build_object('pet_id', _pet.id));

  RETURN jsonb_build_object(
    'ok', true,
    'pet_id', _pet.id,
    'xp_bonus', 200,
    'adult_unlocked', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.evolve_my_pet() TO authenticated;

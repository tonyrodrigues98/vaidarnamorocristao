CREATE TABLE IF NOT EXISTS public.name_gradients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color_a text NOT NULL DEFAULT '#ff4f68',
  color_b text NOT NULL DEFAULT '#7c3aed',
  price integer NOT NULL DEFAULT 0 CHECK (price >= 0),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

ALTER TABLE public.name_gradients
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS color_a text NOT NULL DEFAULT '#ff4f68',
  ADD COLUMN IF NOT EXISTS color_b text NOT NULL DEFAULT '#7c3aed',
  ADD COLUMN IF NOT EXISTS price integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.name_gradients
  DROP CONSTRAINT IF EXISTS name_gradients_price_check,
  ADD CONSTRAINT name_gradients_price_check CHECK (price >= 0);

CREATE INDEX IF NOT EXISTS name_gradients_active_sort_idx
  ON public.name_gradients (is_active, sort_order, created_at DESC);

ALTER TABLE public.name_gradients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "active name gradients readable" ON public.name_gradients;
CREATE POLICY "active name gradients readable"
ON public.name_gradients
FOR SELECT
USING (
  is_active = true
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "admins manage name gradients" ON public.name_gradients;
CREATE POLICY "admins manage name gradients"
ON public.name_gradients
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE TABLE IF NOT EXISTS public.user_name_gradients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gradient_id uuid NOT NULL REFERENCES public.name_gradients(id) ON DELETE CASCADE,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, gradient_id)
);

ALTER TABLE public.user_name_gradients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own name gradients" ON public.user_name_gradients;
CREATE POLICY "users read own name gradients"
ON public.user_name_gradients
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS equipped_name_gradient_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_equipped_name_gradient_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_equipped_name_gradient_id_fkey
      FOREIGN KEY (equipped_name_gradient_id) REFERENCES public.name_gradients(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.purchase_name_gradient(_gradient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_price integer;
  v_balance integer;
  v_name text;
  v_new_balance integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT price, name
  INTO v_price, v_name
  FROM public.name_gradients
  WHERE id = _gradient_id AND is_active = true;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'name_gradient_not_found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_name_gradients
    WHERE user_id = uid AND gradient_id = _gradient_id
  ) THEN
    RAISE EXCEPTION 'already_owned';
  END IF;

  INSERT INTO public.user_coins (user_id, balance)
  VALUES (uid, 100)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO v_balance
  FROM public.user_coins
  WHERE user_id = uid
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < v_price THEN
    RAISE EXCEPTION 'insufficient_coins' USING ERRCODE = 'check_violation';
  END IF;

  v_new_balance := v_balance - v_price;

  UPDATE public.user_coins
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = uid;

  INSERT INTO public.user_name_gradients (user_id, gradient_id)
  VALUES (uid, _gradient_id);

  PERFORM public.log_coin_tx(
    uid,
    'name_gradient_purchase',
    'out',
    v_price,
    v_new_balance,
    'Gradiente de nome: ' || COALESCE(v_name, 'Gradiente'),
    'Gradiente de Nome',
    _gradient_id,
    NULL
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_name_gradient(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.equip_name_gradient(_gradient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.name_gradients
    WHERE id = _gradient_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'name_gradient_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_name_gradients
    WHERE user_id = uid AND gradient_id = _gradient_id
  ) THEN
    RAISE EXCEPTION 'not_owned';
  END IF;

  UPDATE public.profiles
  SET equipped_name_gradient_id = _gradient_id
  WHERE id = uid;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.equip_name_gradient(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.unequip_name_gradient()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE public.profiles
  SET equipped_name_gradient_id = NULL
  WHERE id = uid;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.unequip_name_gradient() TO authenticated;

INSERT INTO public.name_gradients (name, color_a, color_b, price, is_active, sort_order)
VALUES
  ('Amor Coral', '#ff4f68', '#ff8a4c', 120, true, 10),
  ('Aurora Real', '#ff4f68', '#7c3aed', 180, true, 20),
  ('Céu Navy', '#38bdf8', '#6366f1', 160, true, 30)
ON CONFLICT DO NOTHING;

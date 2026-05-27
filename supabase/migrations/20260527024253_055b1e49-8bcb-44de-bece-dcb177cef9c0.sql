
-- Tabela de moedas
CREATE TABLE public.user_coins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 100,
  last_claim_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT balance_non_negative CHECK (balance >= 0),
  CONSTRAINT balance_max_500 CHECK (balance <= 500)
);

GRANT SELECT ON public.user_coins TO authenticated;
GRANT ALL ON public.user_coins TO service_role;

ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own coins" ON public.user_coins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_user_coins_updated_at
  BEFORE UPDATE ON public.user_coins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed 100 moedas para todos os usuários existentes
INSERT INTO public.user_coins (user_id, balance)
SELECT id, 100 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Trigger: cria registro com 100 moedas para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_coins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_coins (user_id, balance) VALUES (NEW.id, 100)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_coins
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_coins();

-- Função: obter saldo (cria se faltar)
CREATE OR REPLACE FUNCTION public.get_my_coins()
RETURNS TABLE(balance INTEGER, last_claim_date DATE, can_claim_today BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  r public.user_coins;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO r FROM public.user_coins WHERE user_id = uid;
  RETURN QUERY SELECT r.balance, r.last_claim_date,
    (r.balance < 500 AND (r.last_claim_date IS NULL OR r.last_claim_date < CURRENT_DATE));
END;
$$;

-- Resgate diário (+10, max 500, reset 00:00)
CREATE OR REPLACE FUNCTION public.claim_daily_coins()
RETURNS TABLE(balance INTEGER, awarded INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  RETURN QUERY SELECT new_balance, award;
END;
$$;

-- Gastar 1 moeda (envio de sticker)
CREATE OR REPLACE FUNCTION public.spend_coin(_amount INTEGER DEFAULT 1)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  r public.user_coins;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO r FROM public.user_coins WHERE user_id = uid FOR UPDATE;
  IF r.balance < _amount THEN
    RAISE EXCEPTION 'insufficient_coins' USING ERRCODE='check_violation';
  END IF;
  UPDATE public.user_coins
    SET balance = balance - _amount, updated_at = now()
    WHERE user_id = uid;
  RETURN r.balance - _amount;
END;
$$;

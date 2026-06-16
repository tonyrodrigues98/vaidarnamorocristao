CREATE OR REPLACE FUNCTION public.clamp_user_coins_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.balance IS NULL THEN
    NEW.balance := 0;
  END IF;
  IF NEW.balance > 500 THEN
    NEW.balance := 500;
  END IF;
  IF NEW.balance < 0 THEN
    NEW.balance := 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clamp_user_coins_balance_trg ON public.user_coins;
CREATE TRIGGER clamp_user_coins_balance_trg
BEFORE INSERT OR UPDATE ON public.user_coins
FOR EACH ROW EXECUTE FUNCTION public.clamp_user_coins_balance();

ALTER TABLE public.user_coins DROP CONSTRAINT IF EXISTS balance_max_500;
ALTER TABLE public.user_coins ADD CONSTRAINT balance_max_500 CHECK (balance <= 500);
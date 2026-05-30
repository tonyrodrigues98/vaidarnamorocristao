
-- Enums
CREATE TYPE public.gift_category AS ENUM ('romantic','spiritual','caring','friendship','fun','legendary');
CREATE TYPE public.gift_rarity AS ENUM ('common','rare','epic','legendary','exclusive');
CREATE TYPE public.gift_tx_status AS ENUM ('held','redeemed');

-- Catalog
CREATE TABLE public.virtual_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_url text,
  emoji text,
  price_coins integer NOT NULL CHECK (price_coins >= 0),
  category public.gift_category NOT NULL,
  rarity public.gift_rarity NOT NULL DEFAULT 'common',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.virtual_gifts TO anon, authenticated;
GRANT ALL ON public.virtual_gifts TO service_role;

ALTER TABLE public.virtual_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active gifts readable" ON public.virtual_gifts
  FOR SELECT USING (active = true OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "admins manage gifts" ON public.virtual_gifts
  FOR ALL USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER virtual_gifts_updated_at BEFORE UPDATE ON public.virtual_gifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Transactions
CREATE TABLE public.gift_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  gift_id uuid NOT NULL REFERENCES public.virtual_gifts(id) ON DELETE RESTRICT,
  price_paid integer NOT NULL CHECK (price_paid >= 0),
  message text,
  status public.gift_tx_status NOT NULL DEFAULT 'held',
  redeemed_coins integer,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gift_tx_receiver_idx ON public.gift_transactions(receiver_id, created_at DESC);
CREATE INDEX gift_tx_sender_idx ON public.gift_transactions(sender_id, created_at DESC);

GRANT SELECT ON public.gift_transactions TO authenticated;
GRANT ALL ON public.gift_transactions TO service_role;

ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read gifts where receiver = themselves or sender = themselves
CREATE POLICY "participants read gift tx" ON public.gift_transactions
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "admins read all gift tx" ON public.gift_transactions
  FOR SELECT USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Public preview RPC for highlights on profiles
CREATE OR REPLACE FUNCTION public.get_received_gifts_public(_user_id uuid, _limit int DEFAULT 6)
RETURNS TABLE(
  id uuid, gift_id uuid, sender_id uuid, message text, created_at timestamptz,
  gift_name text, gift_image_url text, gift_emoji text, gift_rarity public.gift_rarity, gift_category public.gift_category
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$
  SELECT t.id, t.gift_id, t.sender_id, t.message, t.created_at,
         g.name, g.image_url, g.emoji, g.rarity, g.category
    FROM public.gift_transactions t
    JOIN public.virtual_gifts g ON g.id = t.gift_id
   WHERE t.receiver_id = _user_id AND t.status = 'held'
   ORDER BY t.created_at DESC
   LIMIT GREATEST(1, LEAST(_limit, 24));
$$;

GRANT EXECUTE ON FUNCTION public.get_received_gifts_public(uuid, int) TO anon, authenticated;

-- Send gift
CREATE OR REPLACE FUNCTION public.send_virtual_gift(_receiver_id uuid, _gift_id uuid, _message text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  uid uuid := auth.uid();
  g public.virtual_gifts;
  v_balance int;
  v_new_balance int;
  tx_id uuid;
  sender_name text;
  msg text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF uid = _receiver_id THEN RAISE EXCEPTION 'cannot_send_to_self'; END IF;
  IF EXISTS (SELECT 1 FROM public.blocks WHERE (blocker_id=_receiver_id AND blocked_id=uid) OR (blocker_id=uid AND blocked_id=_receiver_id)) THEN
    RAISE EXCEPTION 'blocked';
  END IF;

  SELECT * INTO g FROM public.virtual_gifts WHERE id = _gift_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'gift_not_found'; END IF;

  IF _message IS NOT NULL AND length(_message) > 120 THEN
    RAISE EXCEPTION 'message_too_long';
  END IF;
  msg := NULLIF(trim(COALESCE(_message,'')), '');

  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO v_balance FROM public.user_coins WHERE user_id = uid FOR UPDATE;
  IF v_balance < g.price_coins THEN
    RAISE EXCEPTION 'insufficient_coins' USING ERRCODE='check_violation';
  END IF;
  v_new_balance := v_balance - g.price_coins;
  UPDATE public.user_coins SET balance = v_new_balance, updated_at = now() WHERE user_id = uid;

  INSERT INTO public.gift_transactions (sender_id, receiver_id, gift_id, price_paid, message)
  VALUES (uid, _receiver_id, _gift_id, g.price_coins, msg)
  RETURNING id INTO tx_id;

  PERFORM public.log_coin_tx(uid, 'gift_sent', 'out', g.price_coins, v_new_balance,
    'Presente enviado: ' || g.name, 'Presentes Virtuais', tx_id, g.image_url);

  SELECT full_name INTO sender_name FROM public.profiles WHERE id = uid;
  PERFORM public.create_notification(
    _receiver_id, 'gift_received',
    '🎁 Você recebeu um presente!',
    COALESCE(sender_name,'Alguém') || ' enviou ' || g.name,
    '/perfil?tab=presentes', uid, tx_id);

  RETURN tx_id;
END $$;

GRANT EXECUTE ON FUNCTION public.send_virtual_gift(uuid, uuid, text) TO authenticated;

-- Redeem gift (30% of price back, min 1)
CREATE OR REPLACE FUNCTION public.redeem_virtual_gift(_tx_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  uid uuid := auth.uid();
  tx public.gift_transactions;
  v_refund int;
  v_balance int;
  v_new_balance int;
  v_gift_name text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO tx FROM public.gift_transactions WHERE id = _tx_id FOR UPDATE;
  IF NOT FOUND OR tx.receiver_id <> uid THEN RAISE EXCEPTION 'not_allowed'; END IF;
  IF tx.status <> 'held' THEN RAISE EXCEPTION 'already_redeemed'; END IF;

  v_refund := GREATEST(1, floor(tx.price_paid * 0.3)::int);

  INSERT INTO public.user_coins (user_id, balance) VALUES (uid, 100)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO v_balance FROM public.user_coins WHERE user_id = uid FOR UPDATE;
  v_new_balance := LEAST(v_balance + v_refund, 500);
  UPDATE public.user_coins SET balance = v_new_balance, updated_at = now() WHERE user_id = uid;

  UPDATE public.gift_transactions
     SET status='redeemed', redeemed_coins=v_refund, redeemed_at=now()
   WHERE id = _tx_id;

  SELECT name INTO v_gift_name FROM public.virtual_gifts WHERE id = tx.gift_id;
  PERFORM public.log_coin_tx(uid, 'gift_redeem', 'in', v_refund, v_new_balance,
    'Resgate de presente: ' || COALESCE(v_gift_name,'?'), 'Presentes Virtuais', _tx_id, NULL);

  RETURN v_refund;
END $$;

GRANT EXECUTE ON FUNCTION public.redeem_virtual_gift(uuid) TO authenticated;

-- Storage bucket for gift images
INSERT INTO storage.buckets (id, name, public) VALUES ('gift-images','gift-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "gift-images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gift-images');

CREATE POLICY "admins upload gift-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gift-images' AND
    (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  );

CREATE POLICY "admins update gift-images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'gift-images' AND
    (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  );

CREATE POLICY "admins delete gift-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'gift-images' AND
    (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  );

-- Seed initial catalog
INSERT INTO public.virtual_gifts (slug, name, emoji, price_coins, category, rarity, sort_order) VALUES
  ('rose','Rosa Encantada','🌹',10,'romantic','common',10),
  ('heart','Coração Apaixonado','❤️',15,'romantic','common',20),
  ('crystal-heart','Coração de Cristal','💎',60,'romantic','epic',30),
  ('kiss','Beijo Doce','💋',20,'romantic','rare',40),
  ('bouquet','Buquê de Flores','💐',35,'romantic','rare',50),
  ('prayer','Oração','🙏',8,'spiritual','common',60),
  ('dove','Pomba da Paz','🕊️',25,'spiritual','rare',70),
  ('bible','Bíblia Dourada','📖',45,'spiritual','epic',80),
  ('cross','Cruz Sagrada','✝️',30,'spiritual','rare',90),
  ('hug','Abraço Carinhoso','🤗',5,'caring','common',100),
  ('teddy','Ursinho de Pelúcia','🧸',40,'caring','rare',110),
  ('chocolate','Chocolate','🍫',12,'caring','common',120),
  ('coffee','Café Quentinho','☕',6,'friendship','common',130),
  ('high-five','Toca Aqui','✋',4,'friendship','common',140),
  ('star-buddy','Estrela da Amizade','🌟',18,'friendship','rare',150),
  ('party','Festa','🎉',22,'fun','common',160),
  ('rocket','Foguete','🚀',55,'fun','epic',170),
  ('rainbow','Arco-Íris','🌈',28,'fun','rare',180),
  ('crown','Coroa Real','👑',150,'legendary','legendary',190),
  ('diamond','Diamante Lendário','💎',300,'legendary','exclusive',200),
  ('phoenix','Fênix de Fogo','🔥',200,'legendary','legendary',210);

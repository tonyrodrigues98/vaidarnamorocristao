
-- Storage policies: avatar-items (público pra leitura, super_admin escreve)
CREATE POLICY "avatar items public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatar-items');
CREATE POLICY "avatar items admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatar-items' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "avatar items admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatar-items' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "avatar items admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatar-items' AND public.has_role(auth.uid(), 'super_admin'));

-- Storage policies: avatar-looks (usuário gerencia os próprios)
CREATE POLICY "avatar looks owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatar-looks' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatar looks owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatar-looks' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatar looks owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatar-looks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Looks salvos
CREATE TABLE public.user_avatar_looks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_avatar_looks TO authenticated;
GRANT ALL ON public.user_avatar_looks TO service_role;
ALTER TABLE public.user_avatar_looks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own looks" ON public.user_avatar_looks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own looks" ON public.user_avatar_looks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own looks" ON public.user_avatar_looks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Função RPC de compra atômica
CREATE OR REPLACE FUNCTION public.purchase_avatar_item(_item_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _price INT;
  _name TEXT;
  _is_active BOOLEAN;
  _balance INT;
  _already_owned BOOLEAN;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT price, name, is_active INTO _price, _name, _is_active
  FROM public.avatar_items WHERE id = _item_id;

  IF _price IS NULL THEN
    RAISE EXCEPTION 'item not found';
  END IF;
  IF NOT _is_active THEN
    RAISE EXCEPTION 'item inactive';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_avatar_inventory WHERE user_id = _user_id AND item_id = _item_id
  ) INTO _already_owned;
  IF _already_owned THEN
    RAISE EXCEPTION 'already owned';
  END IF;

  -- Garante linha de moedas
  INSERT INTO public.user_coins (user_id, balance)
  VALUES (_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock + valida saldo
  SELECT balance INTO _balance FROM public.user_coins WHERE user_id = _user_id FOR UPDATE;
  IF _balance < _price THEN
    RAISE EXCEPTION 'insufficient balance';
  END IF;

  -- Debita
  UPDATE public.user_coins SET balance = balance - _price WHERE user_id = _user_id;

  -- Adiciona ao inventário
  INSERT INTO public.user_avatar_inventory (user_id, item_id) VALUES (_user_id, _item_id);

  -- Registra transação (best-effort; ignora se schema diferir)
  BEGIN
    INSERT INTO public.coin_transactions (user_id, amount, type, description, metadata)
    VALUES (_user_id, -_price, 'purchase', 'Compra: ' || _name, jsonb_build_object('item_id', _item_id, 'kind', 'avatar_item'));
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object('ok', true, 'new_balance', _balance - _price);
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_avatar_item(UUID) TO authenticated;

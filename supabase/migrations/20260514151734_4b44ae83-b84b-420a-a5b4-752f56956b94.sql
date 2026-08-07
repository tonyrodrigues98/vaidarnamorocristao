-- 1) Coluna de imagem nas notificações (para mostrar a foto deletada / removida)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS image_url text;

-- 2) Caminho de storage no log de moderação (para fotos rejeitadas/em revisão guardadas em bucket privado)
ALTER TABLE public.photo_moderation_log
  ADD COLUMN IF NOT EXISTS storage_bucket text,
  ADD COLUMN IF NOT EXISTS storage_path text;

-- 3) Bucket privado para guardar fotos rejeitadas pela IA por 7 dias
INSERT INTO storage.buckets (id, name, public)
VALUES ('photo-moderation-rejects', 'photo-moderation-rejects', false)
ON CONFLICT (id) DO NOTHING;

-- Apenas admin/super_admin leem/apagam; usuário insere apenas dentro da própria pasta
DROP POLICY IF EXISTS "rejects admin read" ON storage.objects;
CREATE POLICY "rejects admin read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'photo-moderation-rejects'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  );

DROP POLICY IF EXISTS "rejects owner insert" ON storage.objects;
CREATE POLICY "rejects owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photo-moderation-rejects'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "rejects admin delete" ON storage.objects;
CREATE POLICY "rejects admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'photo-moderation-rejects'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  );

-- 4) Atualiza RPC admin_delete_user_photo para gravar image_url na notificação
CREATE OR REPLACE FUNCTION public.admin_delete_user_photo(
  _user_id uuid, _photo_id uuid, _scope text, _photo_url text, _reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _reason IS NULL OR length(trim(_reason)) = 0 THEN
    RAISE EXCEPTION 'reason required';
  END IF;

  IF _scope = 'avatar' THEN
    UPDATE public.profiles
      SET photo_url = NULL,
          avatar_ai_verified = false,
          avatar_ai_confidence = NULL,
          avatar_ai_checked_at = NULL,
          updated_at = now()
    WHERE id = _user_id;
  ELSIF _photo_id IS NOT NULL THEN
    DELETE FROM public.profile_photos WHERE id = _photo_id AND user_id = _user_id;
  END IF;

  INSERT INTO public.photo_moderation_log
    (user_id, scope, photo_url, decision, confidence, reason, ai_result)
  VALUES (
    _user_id,
    COALESCE(_scope::photo_moderation_scope, 'avatar'::photo_moderation_scope),
    _photo_url,
    'admin_deleted',
    NULL,
    _reason,
    jsonb_build_object('admin_id', auth.uid(), 'reason', _reason)
  );

  INSERT INTO public.notifications (user_id, type, title, body, link, actor_id, entity_id, image_url)
  VALUES (
    _user_id,
    'photo_removed',
    'Sua foto foi removida pela moderação',
    'Motivo: ' || _reason,
    '/notificacoes',
    auth.uid(),
    _user_id,
    _photo_url
  );
END;
$$;

-- Permitir 'admin_deleted' no constraint do log
ALTER TABLE public.photo_moderation_log DROP CONSTRAINT IF EXISTS photo_moderation_log_decision_check;
ALTER TABLE public.photo_moderation_log
  ADD CONSTRAINT photo_moderation_log_decision_check
  CHECK (decision = ANY (ARRAY['approved','needs_review','rejected','soft_fail','admin_deleted']));

-- 5) Função de limpeza: apaga logs e arquivos rejeitados/em revisão com mais de 7 dias
CREATE OR REPLACE FUNCTION public.cleanup_photo_moderation_rejects()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
  v_count int := 0;
BEGIN
  FOR r IN
    SELECT id, storage_bucket, storage_path
    FROM public.photo_moderation_log
    WHERE decision IN ('rejected','needs_review','soft_fail','admin_deleted')
      AND created_at < now() - interval '7 days'
  LOOP
    IF r.storage_bucket IS NOT NULL AND r.storage_path IS NOT NULL THEN
      DELETE FROM storage.objects
        WHERE bucket_id = r.storage_bucket AND name = r.storage_path;
    END IF;
    DELETE FROM public.photo_moderation_log WHERE id = r.id;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- 6) Agendar diariamente às 04:00 UTC
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-photo-moderation-rejects');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-photo-moderation-rejects',
  '0 4 * * *',
  $$ SELECT public.cleanup_photo_moderation_rejects(); $$
);
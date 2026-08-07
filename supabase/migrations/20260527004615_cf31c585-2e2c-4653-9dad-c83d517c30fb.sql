
-- Stickers system
CREATE TABLE IF NOT EXISTS public.sticker_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sticker_categories TO authenticated;
GRANT ALL ON public.sticker_categories TO service_role;

ALTER TABLE public.sticker_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read sticker categories" ON public.sticker_categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "super_admin manage sticker categories" ON public.sticker_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TABLE IF NOT EXISTS public.stickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.sticker_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  mime_type text NOT NULL,
  is_animated boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stickers TO authenticated;
GRANT ALL ON public.stickers TO service_role;

ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read active stickers" ON public.stickers
  FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "super_admin manage stickers" ON public.stickers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_stickers_category ON public.stickers(category_id, sort_order);

CREATE TRIGGER trg_stickers_updated_at BEFORE UPDATE ON public.stickers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sticker_categories_updated_at BEFORE UPDATE ON public.sticker_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- global_messages: allow sticker reference
ALTER TABLE public.global_messages ADD COLUMN IF NOT EXISTS sticker_id uuid REFERENCES public.stickers(id) ON DELETE SET NULL;
ALTER TABLE public.global_messages DROP CONSTRAINT IF EXISTS global_messages_content_check;
ALTER TABLE public.global_messages ADD CONSTRAINT global_messages_content_check
  CHECK (
    (sticker_id IS NOT NULL AND char_length(content) BETWEEN 0 AND 2000)
    OR (sticker_id IS NULL AND char_length(content) BETWEEN 1 AND 2000)
  );

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('stickers', 'stickers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "stickers public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'stickers');
CREATE POLICY "stickers super_admin insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stickers' AND public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "stickers super_admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'stickers' AND public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "stickers super_admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'stickers' AND public.has_role(auth.uid(), 'super_admin'::app_role));

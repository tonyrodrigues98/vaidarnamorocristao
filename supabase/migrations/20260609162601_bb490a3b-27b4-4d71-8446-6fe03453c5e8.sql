
-- Push on new published daily_posts (news/devotional)
CREATE OR REPLACE FUNCTION public.enqueue_push_on_daily_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  label text;
  emoji text;
  url text;
BEGIN
  IF NEW.published IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.published IS TRUE THEN RETURN NEW; END IF;

  IF NEW.kind = 'devotional' THEN
    label := 'Novo devocional';
    emoji := '📖 ';
    url := '/devocional';
  ELSE
    label := 'Nova notícia';
    emoji := '📰 ';
    url := '/noticias';
  END IF;

  INSERT INTO public.push_queue (user_id, title, body, url)
  SELECT DISTINCT ps.user_id, emoji || label, NEW.title, url
  FROM public.push_subscriptions ps;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_push_daily_post_ins ON public.daily_posts;
CREATE TRIGGER trg_push_daily_post_ins
AFTER INSERT ON public.daily_posts
FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_on_daily_post();

DROP TRIGGER IF EXISTS trg_push_daily_post_upd ON public.daily_posts;
CREATE TRIGGER trg_push_daily_post_upd
AFTER UPDATE OF published ON public.daily_posts
FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_on_daily_post();

-- Generic helper for shop items
CREATE OR REPLACE FUNCTION public.enqueue_push_for_shop_item(
  p_label text,
  p_name text,
  p_emoji text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.push_queue (user_id, title, body, url)
  SELECT DISTINCT ps.user_id,
         p_emoji || 'Novidade na loja',
         p_label || ': ' || COALESCE(p_name, 'novo item disponível'),
         '/loja'
  FROM public.push_subscriptions ps;
END;
$$;

-- avatar_decorations (molduras / auras)
CREATE OR REPLACE FUNCTION public.enqueue_push_on_avatar_decoration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  label text;
  emoji text;
BEGIN
  IF NEW.active IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.active IS TRUE THEN RETURN NEW; END IF;

  IF NEW.type = 'aura' THEN
    label := 'Nova aura';
    emoji := '✨ ';
  ELSE
    label := 'Nova moldura';
    emoji := '🖼️ ';
  END IF;

  PERFORM public.enqueue_push_for_shop_item(label, NEW.name, emoji);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_push_avatar_dec_ins ON public.avatar_decorations;
CREATE TRIGGER trg_push_avatar_dec_ins
AFTER INSERT ON public.avatar_decorations
FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_on_avatar_decoration();

DROP TRIGGER IF EXISTS trg_push_avatar_dec_upd ON public.avatar_decorations;
CREATE TRIGGER trg_push_avatar_dec_upd
AFTER UPDATE OF active ON public.avatar_decorations
FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_on_avatar_decoration();

-- profile_backgrounds (fundos)
CREATE OR REPLACE FUNCTION public.enqueue_push_on_profile_background()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_active IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_active IS TRUE THEN RETURN NEW; END IF;
  PERFORM public.enqueue_push_for_shop_item('Novo fundo de perfil', NEW.name, '🌅 ');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_push_bg_ins ON public.profile_backgrounds;
CREATE TRIGGER trg_push_bg_ins
AFTER INSERT ON public.profile_backgrounds
FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_on_profile_background();

DROP TRIGGER IF EXISTS trg_push_bg_upd ON public.profile_backgrounds;
CREATE TRIGGER trg_push_bg_upd
AFTER UPDATE OF is_active ON public.profile_backgrounds
FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_on_profile_background();

-- name_gradients (gradientes de nome)
CREATE OR REPLACE FUNCTION public.enqueue_push_on_name_gradient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_active IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_active IS TRUE THEN RETURN NEW; END IF;
  PERFORM public.enqueue_push_for_shop_item('Novo gradiente de nome', NEW.name, '🌈 ');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_push_grad_ins ON public.name_gradients;
CREATE TRIGGER trg_push_grad_ins
AFTER INSERT ON public.name_gradients
FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_on_name_gradient();

DROP TRIGGER IF EXISTS trg_push_grad_upd ON public.name_gradients;
CREATE TRIGGER trg_push_grad_upd
AFTER UPDATE OF is_active ON public.name_gradients
FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_on_name_gradient();

-- stickers (figurinhas)
CREATE OR REPLACE FUNCTION public.enqueue_push_on_sticker()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.active IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.active IS TRUE THEN RETURN NEW; END IF;
  PERFORM public.enqueue_push_for_shop_item('Novo sticker', NEW.name, '🎟️ ');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_push_sticker_ins ON public.stickers;
CREATE TRIGGER trg_push_sticker_ins
AFTER INSERT ON public.stickers
FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_on_sticker();

DROP TRIGGER IF EXISTS trg_push_sticker_upd ON public.stickers;
CREATE TRIGGER trg_push_sticker_upd
AFTER UPDATE OF active ON public.stickers
FOR EACH ROW EXECUTE FUNCTION public.enqueue_push_on_sticker();

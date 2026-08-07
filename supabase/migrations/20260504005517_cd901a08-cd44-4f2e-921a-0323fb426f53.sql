
-- 1) Support articles (FAQ + artigos)
CREATE TABLE IF NOT EXISTS public.support_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  content text NOT NULL,
  category public.support_category NOT NULL DEFAULT 'other',
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users read published articles"
  ON public.support_articles FOR SELECT TO authenticated
  USING (published = true OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "admins manage articles"
  ON public.support_articles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_support_articles_updated
  BEFORE UPDATE ON public.support_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS support_articles_pub_idx ON public.support_articles(published, sort_order);
CREATE INDEX IF NOT EXISTS support_articles_cat_idx ON public.support_articles(category);

-- RPC para incrementar views (sem precisar update direto)
CREATE OR REPLACE FUNCTION public.increment_article_views(_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.support_articles SET views_count = views_count + 1 WHERE slug = _slug AND published = true;
$$;

-- 2) Revoke anon from sensitive SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_ids() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_primary_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_flagged_message_ids() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_hidden_staff_ids() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_message_read(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unmatch(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_terms_status() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_accepted_current_terms(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_support_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_verified() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_support_ticket_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_self_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_default_public_listing() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_message_edited_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_restricted_words() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_match_on_reciprocal() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.increment_article_views(text) TO authenticated;

-- Seed alguns artigos iniciais
INSERT INTO public.support_articles (slug, title, summary, content, category, featured, sort_order) VALUES
('como-criar-perfil', 'Como criar e completar meu perfil',
 'Guia rápido para preencher seu perfil e aumentar suas chances de aprovação.',
 E'## Passo a passo\n\n1. Acesse **Perfil** no menu superior.\n2. Preencha todas as informações obrigatórias.\n3. Adicione uma foto clara e recente.\n4. Aguarde a aprovação da equipe.\n\nDicas:\n- Use uma foto sem filtros pesados.\n- Capriche na bio: ela ajuda nos matches.', 'profile', true, 1),
('como-funciona-verificacao', 'Como funciona a verificação de perfil',
 'Entenda o selo verificado e como solicitá-lo.',
 E'O selo de verificado mostra que sua identidade foi confirmada pela nossa equipe.\n\n### Como solicitar\n1. Acesse **Verificação** no menu de perfil.\n2. Envie uma selfie e um documento.\n3. Aguarde a análise (geralmente em até 48h).', 'security', true, 2),
('problemas-pagamento', 'Tive um problema com pagamento',
 'Veja o que fazer se cobranças não foram processadas ou foram duplicadas.',
 E'Se identificou cobrança incorreta, abra um chamado na categoria **Pagamentos** com:\n- Data e valor da transação\n- Forma de pagamento usada\n- Print ou comprovante\n\nNossa equipe responde em até 24h.', 'payments', false, 3),
('denunciar-usuario', 'Como denunciar um usuário ou conteúdo',
 'Mantemos a comunidade segura com sua ajuda.',
 E'Para denunciar:\n1. Acesse o perfil do usuário.\n2. Clique no menu (⋯) e escolha **Denunciar**.\n3. Informe o motivo com o máximo de detalhes.\n\nDenúncias são analisadas com prioridade.', 'security', false, 4),
('matches-conversas', 'Como funcionam matches e conversas',
 'Saiba quando o chat libera e como evitar bloqueios.',
 E'O chat só libera após **interesse mútuo**.\n\nDicas:\n- Seja respeitoso desde a primeira mensagem.\n- Evite mensagens repetidas em massa.\n- Compartilhar contato pessoal é desencorajado nas primeiras conversas.', 'matches', false, 5)
ON CONFLICT (slug) DO NOTHING;

-- ===== 1. message_flags =====
CREATE TABLE public.message_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.global_messages(id) ON DELETE CASCADE,
  flagged_by uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, flagged_by)
);

ALTER TABLE public.message_flags ENABLE ROW LEVEL SECURITY;

-- Staff que sinalizou pode ver / editar / excluir as próprias
CREATE POLICY "staff manage own flags select" ON public.message_flags
FOR SELECT TO authenticated
USING (
  auth.uid() = flagged_by
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "staff create flag" ON public.message_flags
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = flagged_by
  AND (
    public.has_role(auth.uid(), 'moderador'::app_role)
    OR public.has_role(auth.uid(), 'apresentador'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);

CREATE POLICY "staff update own flag" ON public.message_flags
FOR UPDATE TO authenticated
USING (auth.uid() = flagged_by)
WITH CHECK (auth.uid() = flagged_by);

CREATE POLICY "staff delete flag" ON public.message_flags
FOR DELETE TO authenticated
USING (
  auth.uid() = flagged_by
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE TRIGGER update_message_flags_updated_at
BEFORE UPDATE ON public.message_flags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.message_flags;

-- Função para listar mensagens sinalizadas (para esconder do front)
CREATE OR REPLACE FUNCTION public.get_flagged_message_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT message_id FROM public.message_flags;
$$;

-- ===== 2. pre_cadastro_matches =====
CREATE TYPE public.couple_status AS ENUM (
  'aceitaram_conversar',
  'namorando',
  'casamento_marcado'
);

CREATE TABLE public.pre_cadastro_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_cadastro_id uuid NOT NULL REFERENCES public.pre_cadastros(id) ON DELETE CASCADE,
  -- Quando o par é outra ficha:
  partner_pre_cadastro_id uuid REFERENCES public.pre_cadastros(id) ON DELETE SET NULL,
  -- Quando o par é um usuário aprovado:
  partner_user_id uuid,
  -- Dados manuais do par (sempre preenchidos como snapshot)
  partner_full_name text,
  partner_username text,
  partner_age integer,
  partner_height_cm integer,
  partner_sex text,
  partner_marital text,
  partner_city text,
  partner_state text,
  partner_church text,
  partner_has_children boolean,
  partner_children_count integer,
  internal_notes text,
  status public.couple_status,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pre_cadastro_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff select pre_cadastro_matches" ON public.pre_cadastro_matches
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'apresentador'::app_role)
  OR auth.uid() = created_by
);

CREATE POLICY "staff insert pre_cadastro_matches" ON public.pre_cadastro_matches
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'apresentador'::app_role)
  )
);

CREATE POLICY "staff update pre_cadastro_matches" ON public.pre_cadastro_matches
FOR UPDATE TO authenticated
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "staff delete pre_cadastro_matches" ON public.pre_cadastro_matches
FOR DELETE TO authenticated
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE TRIGGER update_pre_cadastro_matches_updated_at
BEFORE UPDATE ON public.pre_cadastro_matches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pre_cadastro_matches_pc ON public.pre_cadastro_matches(pre_cadastro_id);
CREATE INDEX idx_pre_cadastro_matches_partner_pc ON public.pre_cadastro_matches(partner_pre_cadastro_id);
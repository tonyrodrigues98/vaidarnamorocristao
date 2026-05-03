-- Server-side restricted word enforcement
CREATE OR REPLACE FUNCTION public.check_restricted_words()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w TEXT;
  norm_content TEXT;
  norm_word TEXT;
BEGIN
  IF NEW.content IS NULL OR length(trim(NEW.content)) = 0 THEN
    RETURN NEW;
  END IF;

  -- Normalize: lowercase + strip diacritics
  norm_content := lower(public.unaccent_safe(NEW.content));

  FOR w IN SELECT word FROM public.restricted_words LOOP
    IF w IS NULL OR length(trim(w)) = 0 THEN
      CONTINUE;
    END IF;
    norm_word := lower(public.unaccent_safe(trim(w)));
    -- Word-boundary match
    IF norm_content ~ ('(^|[^[:alpha:]])' || regexp_replace(norm_word, '([.*+?^${}()|\[\]\\])', '\\\1', 'g') || '([^[:alpha:]]|$)') THEN
      RAISE EXCEPTION 'Mensagem contém conteúdo restrito.' USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Lightweight unaccent helper (avoids requiring the unaccent extension)
CREATE OR REPLACE FUNCTION public.unaccent_safe(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT translate(
    input,
    'áàâãäåÁÀÂÃÄÅéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
    'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUcCnN'
  );
$$;

DROP TRIGGER IF EXISTS check_restricted_words_global ON public.global_messages;
CREATE TRIGGER check_restricted_words_global
BEFORE INSERT OR UPDATE OF content ON public.global_messages
FOR EACH ROW EXECUTE FUNCTION public.check_restricted_words();

DROP TRIGGER IF EXISTS check_restricted_words_messages ON public.messages;
CREATE TRIGGER check_restricted_words_messages
BEFORE INSERT OR UPDATE OF content ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.check_restricted_words();
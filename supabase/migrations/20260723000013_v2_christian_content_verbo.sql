BEGIN;

DO $$
DECLARE
  _required regclass;
BEGIN
  FOREACH _required IN ARRAY ARRAY[
    to_regclass('public.daily_posts'),
    to_regclass('public.prayer_requests'),
    to_regclass('public.bible_quiz_questions'),
    to_regclass('public.user_quiz_attempts')
  ]
  LOOP
    IF _required IS NULL THEN
      RAISE EXCEPTION 'V2 content preflight failed: required legacy relation is missing';
    END IF;
  END LOOP;
END;
$$;

CREATE TABLE public.christian_content_sources_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  publisher text,
  license_status text NOT NULL DEFAULT 'unverified'
    CHECK (license_status IN ('unverified', 'review-required', 'approved', 'expired', 'revoked')),
  license_reference text,
  attribution text,
  editorial_status text NOT NULL DEFAULT 'draft'
    CHECK (editorial_status IN ('draft', 'review', 'approved', 'retired')),
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT enabled OR (license_status = 'approved' AND editorial_status = 'approved'))
);

CREATE TABLE public.bible_versions_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.christian_content_sources_v2(id),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  language text NOT NULL DEFAULT 'pt-BR',
  copyright_notice text NOT NULL,
  offline_allowed boolean NOT NULL DEFAULT false,
  search_allowed boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bible_passages_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.bible_versions_v2(id),
  book_code text NOT NULL,
  chapter integer NOT NULL CHECK (chapter > 0),
  verse integer NOT NULL CHECK (verse > 0),
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 4000),
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version_id, book_code, chapter, verse)
);

CREATE INDEX bible_passages_v2_lookup_idx
  ON public.bible_passages_v2 (version_id, book_code, chapter, verse);

CREATE TABLE public.verbo_notes_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  passage_id uuid NOT NULL REFERENCES public.bible_passages_v2(id),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 12000),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, passage_id)
);

CREATE TABLE public.verbo_bookmarks_v2 (
  user_id uuid NOT NULL,
  passage_id uuid NOT NULL REFERENCES public.bible_passages_v2(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, passage_id)
);

CREATE TABLE public.verbo_reading_progress_v2 (
  user_id uuid PRIMARY KEY,
  version_id uuid NOT NULL REFERENCES public.bible_versions_v2(id),
  book_code text NOT NULL,
  chapter integer NOT NULL CHECK (chapter > 0),
  verse integer CHECK (verse > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.verbo_studies_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 30000),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.verbo_challenges_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.christian_content_sources_v2(id),
  kind text NOT NULL CHECK (kind IN ('quiz', 'books-order', 'character', 'event', 'memory', 'review')),
  prompt text NOT NULL,
  answer_payload jsonb NOT NULL,
  explanation text NOT NULL,
  reference text NOT NULL,
  difficulty integer NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(answer_payload) = 'object')
);

CREATE TABLE public.verbo_challenge_progress_v2 (
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.verbo_challenges_v2(id),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  mastered boolean NOT NULL DEFAULT false,
  last_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, challenge_id),
  CHECK (jsonb_typeof(last_result) = 'object')
);

ALTER TABLE public.christian_content_sources_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_versions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_passages_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verbo_notes_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verbo_bookmarks_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verbo_reading_progress_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verbo_studies_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verbo_challenges_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verbo_challenge_progress_v2 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.christian_content_sources_v2,
  public.bible_versions_v2,
  public.bible_passages_v2,
  public.verbo_notes_v2,
  public.verbo_bookmarks_v2,
  public.verbo_reading_progress_v2,
  public.verbo_studies_v2,
  public.verbo_challenges_v2,
  public.verbo_challenge_progress_v2
FROM PUBLIC, anon;

GRANT SELECT ON TABLE
  public.christian_content_sources_v2,
  public.bible_versions_v2,
  public.bible_passages_v2,
  public.verbo_challenges_v2
TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.verbo_notes_v2,
  public.verbo_bookmarks_v2,
  public.verbo_reading_progress_v2,
  public.verbo_studies_v2,
  public.verbo_challenge_progress_v2
TO authenticated;
GRANT ALL ON TABLE
  public.christian_content_sources_v2,
  public.bible_versions_v2,
  public.bible_passages_v2,
  public.verbo_notes_v2,
  public.verbo_bookmarks_v2,
  public.verbo_reading_progress_v2,
  public.verbo_studies_v2,
  public.verbo_challenges_v2,
  public.verbo_challenge_progress_v2
TO service_role;

CREATE POLICY "licensed content sources are readable"
  ON public.christian_content_sources_v2 FOR SELECT TO authenticated
  USING (enabled AND license_status = 'approved' AND editorial_status = 'approved');
CREATE POLICY "licensed bible versions are readable"
  ON public.bible_versions_v2 FOR SELECT TO authenticated
  USING (
    enabled AND EXISTS (
      SELECT 1 FROM public.christian_content_sources_v2 source
      WHERE source.id = source_id
        AND source.enabled
        AND source.license_status = 'approved'
        AND source.editorial_status = 'approved'
    )
  );
CREATE POLICY "licensed bible passages are readable"
  ON public.bible_passages_v2 FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bible_versions_v2 version
      JOIN public.christian_content_sources_v2 source ON source.id = version.source_id
      WHERE version.id = version_id
        AND version.enabled
        AND source.enabled
        AND source.license_status = 'approved'
        AND source.editorial_status = 'approved'
    )
  );
CREATE POLICY "active verified challenges are readable"
  ON public.verbo_challenges_v2 FOR SELECT TO authenticated
  USING (
    active AND EXISTS (
      SELECT 1 FROM public.christian_content_sources_v2 source
      WHERE source.id = source_id
        AND source.enabled
        AND source.license_status = 'approved'
        AND source.editorial_status = 'approved'
    )
  );

CREATE POLICY "owner manages verbo notes"
  ON public.verbo_notes_v2 FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner manages verbo bookmarks"
  ON public.verbo_bookmarks_v2 FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner manages verbo progress"
  ON public.verbo_reading_progress_v2 FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner manages verbo studies"
  ON public.verbo_studies_v2 FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner manages verbo challenge progress"
  ON public.verbo_challenge_progress_v2 FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_christian_content_hub_v2()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'devotionals', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', post.id,
        'title', post.title,
        'content', post.content,
        'bible_reference', post.bible_reference,
        'bible_text', post.bible_text,
        'published_at', post.published_at
      ) ORDER BY post.published_at DESC, post.id DESC)
      FROM (
        SELECT *
        FROM public.daily_posts
        WHERE published AND kind = 'devotional'
        ORDER BY published_at DESC, id DESC
        LIMIT 12
      ) post
    ), '[]'::jsonb),
    'versions', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', version.id,
        'code', version.code,
        'name', version.name,
        'language', version.language,
        'copyright_notice', version.copyright_notice,
        'offline_allowed', version.offline_allowed,
        'search_allowed', version.search_allowed
      ) ORDER BY version.name)
      FROM public.bible_versions_v2 version
      JOIN public.christian_content_sources_v2 source ON source.id = version.source_id
      WHERE version.enabled
        AND source.enabled
        AND source.license_status = 'approved'
        AND source.editorial_status = 'approved'
    ), '[]'::jsonb),
    'notes', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', note.id,
        'passage_id', note.passage_id,
        'content', note.content,
        'version', note.version,
        'updated_at', note.updated_at
      ) ORDER BY note.updated_at DESC)
      FROM public.verbo_notes_v2 note
      WHERE note.user_id = _uid
    ), '[]'::jsonb),
    'bookmark_passage_ids', coalesce((
      SELECT jsonb_agg(bookmark.passage_id ORDER BY bookmark.created_at DESC)
      FROM public.verbo_bookmarks_v2 bookmark
      WHERE bookmark.user_id = _uid
    ), '[]'::jsonb),
    'reading_progress', (
      SELECT jsonb_build_object(
        'version_id', progress.version_id,
        'book_code', progress.book_code,
        'chapter', progress.chapter,
        'verse', progress.verse,
        'updated_at', progress.updated_at
      )
      FROM public.verbo_reading_progress_v2 progress
      WHERE progress.user_id = _uid
    ),
    'private_defaults', jsonb_build_object(
      'notes', true,
      'bookmarks', true,
      'progress', true,
      'challenges', true
    ),
    'gates', jsonb_build_object(
      'licensed_bible_available', EXISTS (
        SELECT 1
        FROM public.bible_versions_v2 version
        JOIN public.christian_content_sources_v2 source ON source.id = version.source_id
        WHERE version.enabled
          AND source.enabled
          AND source.license_status = 'approved'
          AND source.editorial_status = 'approved'
      ),
      'conversational_exploration', false,
      'offline_download', false,
      'social_progress', false
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_verbo_chapter_v2(
  _version_id uuid,
  _book_code text,
  _chapter integer
)
RETURNS TABLE (id uuid, verse integer, text text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT passage.id, passage.verse, passage.text
  FROM public.bible_passages_v2 passage
  JOIN public.bible_versions_v2 version ON version.id = passage.version_id
  JOIN public.christian_content_sources_v2 source ON source.id = version.source_id
  WHERE auth.uid() IS NOT NULL
    AND passage.version_id = _version_id
    AND passage.book_code = lower(trim(_book_code))
    AND passage.chapter = _chapter
    AND version.enabled
    AND source.enabled
    AND source.license_status = 'approved'
    AND source.editorial_status = 'approved'
  ORDER BY passage.verse;
$$;

CREATE OR REPLACE FUNCTION public.save_verbo_note_v2(
  _passage_id uuid,
  _content text,
  _expected_version integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _note public.verbo_notes_v2;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF _passage_id IS NULL OR char_length(trim(coalesce(_content, ''))) NOT BETWEEN 1 AND 12000 THEN
    RAISE EXCEPTION 'invalid_note' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.bible_passages_v2 passage
    JOIN public.bible_versions_v2 version ON version.id = passage.version_id
    JOIN public.christian_content_sources_v2 source ON source.id = version.source_id
    WHERE passage.id = _passage_id
      AND version.enabled
      AND source.enabled
      AND source.license_status = 'approved'
      AND source.editorial_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'licensed_passage_unavailable' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO _note
  FROM public.verbo_notes_v2
  WHERE user_id = _uid AND passage_id = _passage_id
  FOR UPDATE;

  IF _note.id IS NULL THEN
    IF _expected_version IS NOT NULL THEN
      RAISE EXCEPTION 'note_conflict' USING ERRCODE = '40001';
    END IF;
    INSERT INTO public.verbo_notes_v2 (user_id, passage_id, content)
    VALUES (_uid, _passage_id, trim(_content))
    RETURNING * INTO _note;
  ELSE
    IF _expected_version IS NULL OR _note.version <> _expected_version THEN
      RAISE EXCEPTION 'note_conflict' USING ERRCODE = '40001';
    END IF;
    UPDATE public.verbo_notes_v2
    SET content = trim(_content), version = version + 1, updated_at = now()
    WHERE id = _note.id
    RETURNING * INTO _note;
  END IF;

  RETURN jsonb_build_object(
    'id', _note.id,
    'passage_id', _note.passage_id,
    'content', _note.content,
    'version', _note.version,
    'updated_at', _note.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_verbo_bookmark_v2(_passage_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _bookmarked boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.bible_passages_v2 passage
    JOIN public.bible_versions_v2 version ON version.id = passage.version_id
    JOIN public.christian_content_sources_v2 source ON source.id = version.source_id
    WHERE passage.id = _passage_id
      AND version.enabled
      AND source.enabled
      AND source.license_status = 'approved'
      AND source.editorial_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'passage_not_found' USING ERRCODE = '22023';
  END IF;
  DELETE FROM public.verbo_bookmarks_v2
  WHERE user_id = _uid AND passage_id = _passage_id;
  IF FOUND THEN
    _bookmarked := false;
  ELSE
    INSERT INTO public.verbo_bookmarks_v2 (user_id, passage_id)
    VALUES (_uid, _passage_id);
    _bookmarked := true;
  END IF;
  RETURN jsonb_build_object('passage_id', _passage_id, 'bookmarked', _bookmarked);
END;
$$;

REVOKE ALL ON FUNCTION public.get_christian_content_hub_v2() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_verbo_chapter_v2(uuid, text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_verbo_note_v2(uuid, text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.toggle_verbo_bookmark_v2(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_christian_content_hub_v2() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_verbo_chapter_v2(uuid, text, integer)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.save_verbo_note_v2(uuid, text, integer)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.toggle_verbo_bookmark_v2(uuid)
  TO authenticated, service_role;

COMMENT ON TABLE public.christian_content_sources_v2 IS
  'Editorial and licensing authority; no source can be enabled without explicit approval.';
COMMENT ON TABLE public.verbo_notes_v2 IS
  'Private owner-only notes. They are never part of community discovery by default.';
COMMENT ON TABLE public.verbo_challenge_progress_v2 IS
  'Private learning progress; never a public spirituality ranking.';

COMMIT;

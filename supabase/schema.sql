-- ============================================================
-- Databasschema – komplett uppsättning för ett NYTT Supabase-projekt
--
-- Kör hela denna fil i Supabase SQL Editor. Den ersätter det gamla
-- schema.sql plus samtliga migrationer, som är hopslagna hit. Ett nytt
-- projekt ska inte ärva en migrationskedja det aldrig gått igenom.
-- (Originalmigrationerna finns kvar i referenskopian av gamla repot.)
--
-- Ändringar mot originalet:
--   * Betalning borttagen. enrollments.payment_status heter nu `status`
--     och styr åtkomst: 'active' ger tillgång till lektioner och material.
--   * Stripe-/Klarna-kolumner borttagna.
--   * applications och waitlist är definierade här – de saknades helt
--     i originalrepot trots att koden använder dem.
--   * courses.max_participants tillagd – saknades också i originalet.
--   * student_progress utelämnad – ersatt av lesson_notes, ingen kod
--     läser den längre.
-- ============================================================

-- ------------------------------------------------------------
-- Tabeller
-- ------------------------------------------------------------

-- Profiler (utökar auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kurser
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  price_sek INTEGER NOT NULL,          -- Visas publikt; ingen betalning sker i appen
  duration_weeks INTEGER,
  sessions_per_week INTEGER DEFAULT 2,
  max_participants INTEGER,            -- NULL = obegränsat
  image_url TEXT,
  teacher_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  meeting_link TEXT,                   -- En videolänk per kurs, samma för alla lektioner
  weekly_schedule JSONB,               -- [{enabled: bool, time: "HH:MM"}] × 7, index 0 = måndag
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anmälningar / Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  -- Åtkomststyrning: endast 'active' ger tillgång till lektioner och material
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'cancelled')),
  UNIQUE(student_id, course_id)
);

-- Atomisk aktivering för att samtidiga godkännanden inte ska överboka kursen.
CREATE OR REPLACE FUNCTION claim_active_enrollment(
  p_student_id UUID,
  p_course_id UUID,
  p_expected_max_participants INTEGER,
  p_expand_capacity BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  enrollment_id UUID,
  was_already_active BOOLEAN,
  capacity_expanded BOOLEAN,
  new_capacity INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  locked_course courses%ROWTYPE;
  current_enrollment_id UUID;
  current_enrollment_status TEXT;
  active_count INTEGER;
BEGIN
  SELECT * INTO locked_course FROM courses
  WHERE id = p_course_id AND is_active = TRUE
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'COURSE_NOT_ACTIVE'; END IF;

  SELECT id, status INTO current_enrollment_id, current_enrollment_status
  FROM enrollments
  WHERE student_id = p_student_id AND course_id = p_course_id;
  IF current_enrollment_status = 'active' THEN
    RETURN QUERY SELECT current_enrollment_id, TRUE, FALSE, locked_course.max_participants;
    RETURN;
  END IF;

  SELECT count(*)::INTEGER INTO active_count
  FROM enrollments WHERE course_id = p_course_id AND status = 'active';
  capacity_expanded := FALSE;
  IF locked_course.max_participants IS NOT NULL AND active_count >= locked_course.max_participants THEN
    IF NOT p_expand_capacity THEN RAISE EXCEPTION 'COURSE_FULL'; END IF;
    IF locked_course.max_participants IS DISTINCT FROM p_expected_max_participants THEN
      RAISE EXCEPTION 'CAPACITY_CHANGED';
    END IF;
    IF active_count > locked_course.max_participants THEN RAISE EXCEPTION 'COURSE_OVER_CAPACITY'; END IF;
    UPDATE courses SET max_participants = max_participants + 1 WHERE id = p_course_id;
    locked_course.max_participants := locked_course.max_participants + 1;
    capacity_expanded := TRUE;
  END IF;

  INSERT INTO enrollments (student_id, course_id, status)
  VALUES (p_student_id, p_course_id, 'active')
  ON CONFLICT (student_id, course_id) DO UPDATE SET status = 'active'
  RETURNING id INTO current_enrollment_id;

  RETURN QUERY SELECT current_enrollment_id, FALSE, capacity_expanded, locked_course.max_participants;
END;
$$;

REVOKE ALL ON FUNCTION claim_active_enrollment(UUID, UUID, INTEGER, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION claim_active_enrollment(UUID, UUID, INTEGER, BOOLEAN) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_active_enrollment(UUID, UUID, INTEGER, BOOLEAN) TO service_role;

-- Lektioner
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  is_cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lektionsmaterial
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('pdf', 'video', 'note', 'audio')),
  url TEXT,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meddelanden
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ansökningar (publikt formulär → granskas av lärare/admin)
-- OBS: innehåller personuppgifter (namn, e-post, telefon, adress).
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  experience TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'redirected')),
  admin_notes TEXT,
  redirect_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_course ON applications(course_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
-- Koden slår upp befintlig ansökan på (course_id, email)
CREATE INDEX IF NOT EXISTS idx_applications_course_email ON applications(course_id, lower(email));

-- Äldre väntelista, endast kvar för bakåtkompatibilitet och verifierad migrering.
-- Nya anmälningar ska alltid sparas i applications.
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  level_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, email)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_course ON waitlist(course_id);

-- Läggs på efter att äldre väntelistrader har migrerats och dubbletter verifierats.
CREATE UNIQUE INDEX IF NOT EXISTS applications_one_open_per_course_email
  ON applications (course_id, lower(btrim(email)))
  WHERE status <> 'rejected';

-- Lärarens anteckningar per elev och kurs – en rad per lektion (append-only)
CREATE TABLE IF NOT EXISTS lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  lesson_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT,        -- Vad ni gjorde / var ni slutade (syns för eleven)
  homework TEXT,       -- Läxa till nästa gång (syns för eleven)
  notes TEXT,          -- Interna anteckningar (endast lärare)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_notes_student_course ON lesson_notes(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_lesson_date ON lesson_notes(lesson_date DESC);

-- Server-side rate limiting for public API routes. Only service_role may use it.
CREATE TABLE IF NOT EXISTS request_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 1
);

CREATE OR REPLACE FUNCTION consume_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  IF p_key IS NULL OR p_limit < 1 OR p_window_seconds < 1 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO request_limits AS limits (key, window_start, request_count)
  VALUES (p_key, NOW(), 1)
  ON CONFLICT (key) DO UPDATE SET
    window_start = CASE
      WHEN limits.window_start <= NOW() - make_interval(secs => p_window_seconds) THEN NOW()
      ELSE limits.window_start
    END,
    request_count = CASE
      WHEN limits.window_start <= NOW() - make_interval(secs => p_window_seconds) THEN 1
      ELSE limits.request_count + 1
    END
  RETURNING request_count INTO current_count;

  RETURN current_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION consume_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

-- ============================================================
-- Row Level Security
--
-- Två mönster används:
--   1. Tabeller som klienten läser direkt med anon/authenticated-nyckeln
--      (profiles, courses, enrollments, lessons, materials, messages)
--      har RLS + policies nedan.
--   2. Tabeller som ENDAST nås via serverns service_role-nyckel
--      (applications, waitlist, lesson_notes) har RLS påslaget UTAN
--      policies. service_role går förbi RLS, så appen fungerar, medan
--      den publika anon-nyckeln inte kommer åt något alls.
--
-- Att slå på RLS utan policies är avsiktligt – inte en glömd rad.
-- ============================================================

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials    ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;  -- avsiktligt utan policies
ALTER TABLE waitlist     ENABLE ROW LEVEL SECURITY;  -- avsiktligt utan policies
ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;  -- avsiktligt utan policies
ALTER TABLE request_limits ENABLE ROW LEVEL SECURITY; -- avsiktligt utan policies

-- Rollkontroll i SECURITY DEFINER-funktion undviker rekursiv RLS på profiles.
CREATE OR REPLACE FUNCTION has_role(allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = ANY(allowed_roles)
  );
$$;

REVOKE ALL ON FUNCTION has_role(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION has_role(TEXT[]) TO authenticated;

DROP POLICY IF EXISTS "profiles_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "courses_public_read" ON courses;
DROP POLICY IF EXISTS "courses_admin_all" ON courses;
DROP POLICY IF EXISTS "enrollments_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_insert" ON enrollments;
DROP POLICY IF EXISTS "enrollments_admin_all" ON enrollments;
DROP POLICY IF EXISTS "lessons_enrolled" ON lessons;
DROP POLICY IF EXISTS "lessons_admin_all" ON lessons;
DROP POLICY IF EXISTS "materials_enrolled" ON materials;
DROP POLICY IF EXISTS "materials_admin_all" ON materials;
DROP POLICY IF EXISTS "messages_own" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update_read" ON messages;

-- Profiler: egen profil, admin, eller personer kopplade via en tilldelad kurs.
CREATE POLICY "profiles_own" ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR has_role(ARRAY['admin'])
    OR EXISTS (
      SELECT 1
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE (c.teacher_id = auth.uid() AND e.student_id = profiles.id)
         OR (e.student_id = auth.uid() AND c.teacher_id = profiles.id)
    )
  );

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Kurser: alla kan läsa aktiva kurser
CREATE POLICY "courses_public_read" ON courses FOR SELECT
  USING (is_active = true);

CREATE POLICY "courses_admin_all" ON courses FOR ALL
  USING (has_role(ARRAY['admin']))
  WITH CHECK (has_role(ARRAY['admin']));

-- Anmälningar: elever ser sina egna, lärare bara sina kursers, admin alla.
CREATE POLICY "enrollments_own" ON enrollments FOR SELECT
  USING (
    student_id = auth.uid()
    OR has_role(ARRAY['admin'])
    OR EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

-- Elever kan inte aktivera sig själva. Alla writes går via godkända serverflöden/admin.
CREATE POLICY "enrollments_admin_all" ON enrollments FOR ALL
  USING (has_role(ARRAY['admin']))
  WITH CHECK (has_role(ARRAY['admin']));

-- Lektioner: endast elever med AKTIV anmälan ser kursens lektioner
CREATE POLICY "lessons_enrolled" ON lessons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = lessons.course_id
    AND enrollments.student_id = auth.uid()
    AND enrollments.status = 'active'
  ) OR has_role(ARRAY['admin']) OR EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = lessons.course_id
    AND courses.teacher_id = auth.uid()
  ));

CREATE POLICY "lessons_admin_all" ON lessons FOR ALL
  USING (has_role(ARRAY['admin']))
  WITH CHECK (has_role(ARRAY['admin']));

-- Material: samma regel som lektioner
CREATE POLICY "materials_enrolled" ON materials FOR SELECT
  USING ((course_id IS NULL AND auth.uid() IS NOT NULL) OR EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = materials.course_id
    AND enrollments.student_id = auth.uid()
    AND enrollments.status = 'active'
  ) OR has_role(ARRAY['admin']) OR EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = materials.course_id
    AND courses.teacher_id = auth.uid()
  ));

CREATE POLICY "materials_admin_all" ON materials FOR ALL
  USING (has_role(ARRAY['admin']))
  WITH CHECK (has_role(ARRAY['admin']));

-- Meddelanden: avsändare och mottagare ser sina egna
CREATE POLICY "messages_own" ON messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Uppdateringar (t.ex. läst-status) sker via autentiserad server-route.

-- Minimera direkt klientåtkomst. Särskilt får en elev aldrig uppdatera sin roll.
REVOKE ALL ON profiles, courses, enrollments, lessons, materials, messages FROM anon, authenticated;
GRANT SELECT ON courses TO anon;
GRANT SELECT ON profiles, courses, enrollments, lessons, materials, messages TO authenticated;
GRANT UPDATE (full_name, avatar_url) ON profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON courses, enrollments, lessons TO authenticated;

-- Privat bucket. Filer levereras endast via kortlivade signerade länkar från servern.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materials',
  'materials',
  FALSE,
  20971520,
  ARRAY['application/pdf', 'video/mp4', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- Triggers
-- ============================================================

-- Håll profiles.updated_at aktuell
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Skapa profil automatiskt när ett auth-konto skapas
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

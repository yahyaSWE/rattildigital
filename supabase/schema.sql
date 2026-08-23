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

-- Väntelista för fullsatta kurser
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

-- Profiler: elever ser bara sin egen, lärare och admins ser alla
CREATE POLICY "profiles_own" ON profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Kurser: alla kan läsa aktiva kurser
CREATE POLICY "courses_public_read" ON courses FOR SELECT
  USING (is_active = true);

CREATE POLICY "courses_admin_all" ON courses FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Anmälningar: elever ser sina egna, lärare och admins ser alla
CREATE POLICY "enrollments_own" ON enrollments FOR SELECT
  USING (student_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "enrollments_insert" ON enrollments FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Lektioner: endast elever med AKTIV anmälan ser kursens lektioner
CREATE POLICY "lessons_enrolled" ON lessons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = lessons.course_id
    AND enrollments.student_id = auth.uid()
    AND enrollments.status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

-- Material: samma regel som lektioner
CREATE POLICY "materials_enrolled" ON materials FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = materials.course_id
    AND enrollments.student_id = auth.uid()
    AND enrollments.status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

-- Meddelanden: avsändare och mottagare ser sina egna
CREATE POLICY "messages_own" ON messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_update_read" ON messages FOR UPDATE
  USING (recipient_id = auth.uid());

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

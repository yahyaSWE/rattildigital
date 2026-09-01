-- Individuella, återkommande lektioner vid sidan av befintliga gruppkurser.

CREATE TABLE IF NOT EXISTS public.teacher_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weekday SMALLINT CHECK (weekday BETWEEN 1 AND 7),
  specific_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  lesson_duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (lesson_duration_minutes BETWEEN 15 AND 240),
  buffer_minutes INTEGER NOT NULL DEFAULT 5 CHECK (buffer_minutes BETWEEN 0 AND 60),
  time_zone TEXT NOT NULL DEFAULT 'Europe/Stockholm',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((weekday IS NOT NULL) <> (specific_date IS NOT NULL)),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS teacher_availability_teacher_idx
  ON public.teacher_availability(teacher_id, is_active);

CREATE TABLE IF NOT EXISTS public.teacher_availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((start_time IS NULL AND end_time IS NULL) OR (start_time IS NOT NULL AND end_time > start_time))
);

CREATE INDEX IF NOT EXISTS teacher_availability_exceptions_teacher_idx
  ON public.teacher_availability_exceptions(teacher_id, exception_date);

CREATE TABLE IF NOT EXISTS public.individual_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  area TEXT NOT NULL CHECK (area IN ('quran_reading', 'tajweed', 'quran_memorization', 'arabic_language')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  experience TEXT,
  alternative_time_request TEXT,
  requested_sessions_per_week INTEGER CHECK (requested_sessions_per_week BETWEEN 1 AND 7),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS individual_applications_open_email_teacher_area_idx
  ON public.individual_applications(teacher_id, area, lower(email))
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.individual_application_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.individual_applications(id) ON DELETE CASCADE,
  availability_id UUID REFERENCES public.teacher_availability(id) ON DELETE SET NULL,
  weekday SMALLINT CHECK (weekday BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  rank SMALLINT NOT NULL CHECK (rank BETWEEN 1 AND 3),
  UNIQUE(application_id, rank)
);

CREATE TABLE IF NOT EXISTS public.individual_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID UNIQUE REFERENCES public.individual_applications(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  area TEXT NOT NULL CHECK (area IN ('quran_reading', 'tajweed', 'quran_memorization', 'arabic_language')),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 15 AND 240),
  buffer_minutes INTEGER NOT NULL DEFAULT 5 CHECK (buffer_minutes BETWEEN 0 AND 60),
  meeting_link TEXT,
  time_zone TEXT NOT NULL DEFAULT 'Europe/Stockholm',
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  price_sek INTEGER NOT NULL DEFAULT 0 CHECK (price_sek >= 0),
  payment_status TEXT NOT NULL DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS individual_bookings_teacher_idx
  ON public.individual_bookings(teacher_id, status);
CREATE INDEX IF NOT EXISTS individual_bookings_student_idx
  ON public.individual_bookings(student_id, status);

CREATE TABLE IF NOT EXISTS public.individual_booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.individual_bookings(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  UNIQUE(booking_id, weekday, start_time)
);

CREATE TABLE IF NOT EXISTS public.individual_lesson_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.individual_bookings(id) ON DELETE CASCADE,
  original_date DATE NOT NULL,
  replacement_start TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('rescheduled', 'cancelled')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id, original_date)
);

ALTER TABLE public.teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_application_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_booking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_lesson_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "individual_bookings_participant_read" ON public.individual_bookings;
CREATE POLICY "individual_bookings_participant_read" ON public.individual_bookings FOR SELECT TO authenticated
USING (
  student_id = auth.uid() OR teacher_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "individual_slots_participant_read" ON public.individual_booking_slots;
CREATE POLICY "individual_slots_participant_read" ON public.individual_booking_slots FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.individual_bookings b
  WHERE b.id = booking_id AND (b.student_id = auth.uid() OR b.teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
));

DROP POLICY IF EXISTS "individual_exceptions_participant_read" ON public.individual_lesson_exceptions;
CREATE POLICY "individual_exceptions_participant_read" ON public.individual_lesson_exceptions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.individual_bookings b
  WHERE b.id = booking_id AND (b.student_id = auth.uid() OR b.teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
));

GRANT SELECT ON public.individual_bookings, public.individual_booking_slots, public.individual_lesson_exceptions TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_individual_application(
  p_application_id UUID,
  p_student_id UUID,
  p_duration_minutes INTEGER,
  p_buffer_minutes INTEGER,
  p_meeting_link TEXT,
  p_starts_on DATE,
  p_slots JSONB,
  p_reviewer_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_row public.individual_applications%ROWTYPE;
  booking_id UUID;
  slot JSONB;
  candidate_weekday SMALLINT;
  candidate_start TIME;
  candidate_end TIME;
BEGIN
  SELECT * INTO app_row FROM public.individual_applications
  WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'APPLICATION_NOT_FOUND'; END IF;
  IF app_row.status <> 'pending' THEN RAISE EXCEPTION 'APPLICATION_ALREADY_REVIEWED'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(app_row.teacher_id::TEXT, 0));

  FOR slot IN SELECT * FROM jsonb_array_elements(p_slots)
  LOOP
    candidate_weekday := (slot->>'weekday')::SMALLINT;
    candidate_start := (slot->>'start_time')::TIME;
    candidate_end := candidate_start + make_interval(mins => p_duration_minutes + p_buffer_minutes);
    IF EXISTS (
      SELECT 1 FROM public.individual_bookings b
      JOIN public.individual_booking_slots s ON s.booking_id = b.id
      WHERE b.teacher_id = app_row.teacher_id AND b.status = 'active'
        AND s.weekday = candidate_weekday
        AND candidate_start < s.start_time + make_interval(mins => b.duration_minutes + b.buffer_minutes)
        AND s.start_time < candidate_end
    ) THEN
      RAISE EXCEPTION 'INDIVIDUAL_SLOT_CONFLICT';
    END IF;
  END LOOP;

  INSERT INTO public.individual_bookings (
    application_id, student_id, teacher_id, area, duration_minutes,
    buffer_minutes, meeting_link, starts_on
  ) VALUES (
    app_row.id, p_student_id, app_row.teacher_id, app_row.area,
    p_duration_minutes, p_buffer_minutes, p_meeting_link, p_starts_on
  ) RETURNING id INTO booking_id;

  INSERT INTO public.individual_booking_slots (booking_id, weekday, start_time)
  SELECT booking_id, (value->>'weekday')::SMALLINT, (value->>'start_time')::TIME
  FROM jsonb_array_elements(p_slots);

  UPDATE public.individual_applications
  SET status = 'approved', reviewed_at = NOW(), reviewed_by = p_reviewer_id
  WHERE id = app_row.id;
  RETURN booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_individual_application(UUID, UUID, INTEGER, INTEGER, TEXT, DATE, JSONB, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_individual_application(UUID, UUID, INTEGER, INTEGER, TEXT, DATE, JSONB, UUID) TO service_role;

-- Atomisk, Stripe-fri aktivering av kursplats. Kursraden låses så att två
-- samtidiga godkännanden inte kan överboka den sista lediga platsen.

CREATE OR REPLACE FUNCTION public.claim_active_enrollment(
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
  locked_course public.courses%ROWTYPE;
  current_enrollment_id UUID;
  current_enrollment_status TEXT;
  active_count INTEGER;
BEGIN
  SELECT * INTO locked_course
  FROM public.courses
  WHERE id = p_course_id
    AND is_active = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'COURSE_NOT_ACTIVE';
  END IF;

  SELECT id, status
  INTO current_enrollment_id, current_enrollment_status
  FROM public.enrollments
  WHERE student_id = p_student_id
    AND course_id = p_course_id;

  IF current_enrollment_status = 'active' THEN
    RETURN QUERY SELECT current_enrollment_id, TRUE, FALSE, locked_course.max_participants;
    RETURN;
  END IF;

  SELECT count(*)::INTEGER INTO active_count
  FROM public.enrollments
  WHERE course_id = p_course_id
    AND status = 'active';

  capacity_expanded := FALSE;
  IF locked_course.max_participants IS NOT NULL
     AND active_count >= locked_course.max_participants THEN
    IF NOT p_expand_capacity THEN
      RAISE EXCEPTION 'COURSE_FULL';
    END IF;
    IF locked_course.max_participants IS DISTINCT FROM p_expected_max_participants THEN
      RAISE EXCEPTION 'CAPACITY_CHANGED';
    END IF;
    IF active_count > locked_course.max_participants THEN
      RAISE EXCEPTION 'COURSE_OVER_CAPACITY';
    END IF;

    UPDATE public.courses
    SET max_participants = max_participants + 1
    WHERE id = p_course_id;
    locked_course.max_participants := locked_course.max_participants + 1;
    capacity_expanded := TRUE;
  END IF;

  INSERT INTO public.enrollments (student_id, course_id, status)
  VALUES (p_student_id, p_course_id, 'active')
  ON CONFLICT (student_id, course_id)
  DO UPDATE SET status = 'active'
  RETURNING id INTO current_enrollment_id;

  RETURN QUERY
  SELECT current_enrollment_id, FALSE, capacity_expanded, locked_course.max_participants;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_active_enrollment(UUID, UUID, INTEGER, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_active_enrollment(UUID, UUID, INTEGER, BOOLEAN) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_active_enrollment(UUID, UUID, INTEGER, BOOLEAN) TO service_role;


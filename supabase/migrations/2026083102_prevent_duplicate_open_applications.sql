-- Kör efter att 2026083101 har verifierats. Migrationen stoppar utan att ändra
-- data om äldre öppna dubbletter finns; de måste då granskas manuellt.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.applications
    WHERE status <> 'rejected'
    GROUP BY course_id, lower(btrim(email))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Öppna dubblettansökningar finns. Granska dem innan unikt index skapas.';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS applications_one_open_per_course_email
  ON public.applications (course_id, lower(btrim(email)))
  WHERE status <> 'rejected';


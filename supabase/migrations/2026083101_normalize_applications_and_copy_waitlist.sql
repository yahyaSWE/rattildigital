-- Stripe-fritt ansökningsflöde: fullbokade kurser använder vanliga ansökningar.
-- Befintliga väntelistrader kopieras, men raderas INTE. Verifiera resultatet
-- innan den äldre tabellen senare avvecklas.

UPDATE public.applications
SET email = lower(btrim(email))
WHERE email IS DISTINCT FROM lower(btrim(email));

INSERT INTO public.applications (
  course_id,
  name,
  email,
  phone,
  experience,
  status,
  created_at
)
SELECT
  waitlist.course_id,
  waitlist.name,
  lower(btrim(waitlist.email)),
  waitlist.phone,
  waitlist.level_description,
  'pending',
  waitlist.created_at
FROM public.waitlist AS waitlist
WHERE NOT EXISTS (
  SELECT 1
  FROM public.applications AS application
  WHERE application.course_id = waitlist.course_id
    AND lower(btrim(application.email)) = lower(btrim(waitlist.email))
    AND application.status <> 'rejected'
);

-- Kör följande efter migrationen och jämför antalen innan någon gammal data raderas:
-- SELECT count(*) FROM public.waitlist;
-- SELECT count(*) FROM public.applications WHERE status = 'pending';


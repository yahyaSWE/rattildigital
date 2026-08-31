-- Adminstyrd märkning för kurskort på den publika programsidan.
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT FALSE;

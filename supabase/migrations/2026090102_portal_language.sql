ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'sv'
  CHECK (preferred_language IN ('sv', 'en', 'ar'));

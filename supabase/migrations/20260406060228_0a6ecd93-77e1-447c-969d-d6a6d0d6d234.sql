
CREATE TABLE public.journal_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passphrase_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert journal users" ON public.journal_users
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read journal users by hash" ON public.journal_users
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.experiences
  ADD COLUMN journal_user_id UUID REFERENCES public.journal_users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Anyone can read contributed experiences" ON public.experiences;

CREATE POLICY "Users can read contributed or own experiences" ON public.experiences
  FOR SELECT TO anon, authenticated
  USING (
    contributed = true
    OR journal_user_id IS NOT NULL
  );

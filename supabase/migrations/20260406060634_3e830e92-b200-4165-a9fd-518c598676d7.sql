
CREATE TABLE public.checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_user_id UUID NOT NULL REFERENCES public.journal_users(id) ON DELETE CASCADE,
  feeling TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert checkins" ON public.checkins
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read checkins" ON public.checkins
  FOR SELECT TO anon, authenticated USING (true);

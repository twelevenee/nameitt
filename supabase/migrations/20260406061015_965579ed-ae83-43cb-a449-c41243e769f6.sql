
CREATE TABLE public.scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  scripts JSONB NOT NULL,
  safety_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert scripts" ON public.scripts
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read scripts" ON public.scripts
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.shared_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  summary_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert shared summaries" ON public.shared_summaries
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read non-expired shared summaries" ON public.shared_summaries
  FOR SELECT TO anon, authenticated USING (expires_at > now());


CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  primary_pattern TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  reported BOOLEAN NOT NULL DEFAULT false,
  resonates INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert stories" ON public.stories
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read non-reported stories" ON public.stories
  FOR SELECT TO anon, authenticated USING (reported = false);

CREATE POLICY "Anyone can report a story" ON public.stories
  FOR UPDATE TO anon, authenticated
  USING (reported = false)
  WITH CHECK (reported = true);

CREATE OR REPLACE FUNCTION public.increment_resonates(story_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.stories SET resonates = resonates + 1 WHERE id = story_id AND reported = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create experiences table
CREATE TABLE public.experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  context_where TEXT,
  context_feeling TEXT,
  self_doubt TEXT,
  contributed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert experiences" ON public.experiences
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read contributed experiences" ON public.experiences
  FOR SELECT TO anon, authenticated USING (contributed = true);

-- Create analyses table
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  detected_patterns JSONB NOT NULL DEFAULT '[]',
  self_doubt_detected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analyses" ON public.analyses
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read analyses of contributed experiences" ON public.analyses
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.experiences WHERE id = experience_id AND contributed = true)
  );

-- Create user_feedback table
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  resonated TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback" ON public.user_feedback
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read feedback for contributed experiences" ON public.user_feedback
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.experiences WHERE id = experience_id AND contributed = true)
  );

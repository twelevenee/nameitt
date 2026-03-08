
-- Drop restrictive INSERT policies and recreate as permissive
DROP POLICY "Anyone can insert experiences" ON public.experiences;
DROP POLICY "Anyone can read contributed experiences" ON public.experiences;
DROP POLICY "Anyone can insert analyses" ON public.analyses;
DROP POLICY "Anyone can read analyses of contributed experiences" ON public.analyses;
DROP POLICY "Anyone can insert feedback" ON public.user_feedback;
DROP POLICY "Anyone can read feedback for contributed experiences" ON public.user_feedback;

-- Experiences: permissive policies
CREATE POLICY "Anyone can insert experiences" ON public.experiences
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read contributed experiences" ON public.experiences
  FOR SELECT TO anon, authenticated USING (contributed = true);

CREATE POLICY "Anyone can update contributed flag" ON public.experiences
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Analyses: permissive policies
CREATE POLICY "Anyone can insert analyses" ON public.analyses
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read analyses of contributed experiences" ON public.analyses
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.experiences WHERE id = experience_id AND contributed = true)
  );

-- User feedback: permissive policies
CREATE POLICY "Anyone can insert feedback" ON public.user_feedback
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read feedback for contributed experiences" ON public.user_feedback
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.experiences WHERE id = experience_id AND contributed = true)
  );

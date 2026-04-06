DROP POLICY "Anyone can update contributed flag" ON public.experiences;

CREATE POLICY "Anyone can set contributed to true" ON public.experiences
  FOR UPDATE TO anon, authenticated
  USING (contributed = false)
  WITH CHECK (contributed = true);
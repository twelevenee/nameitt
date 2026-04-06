
CREATE OR REPLACE FUNCTION public.increment_resonates(story_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.stories SET resonates = resonates + 1 WHERE id = story_id AND reported = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS story_type TEXT NOT NULL DEFAULT 'user';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS secondary_pattern TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS contains_sensitive_content BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS sensitive_content_type TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS source_note TEXT;
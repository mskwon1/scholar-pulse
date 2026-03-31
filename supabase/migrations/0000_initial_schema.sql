-- 1. Create sent_papers table (Used by Backend Python Agent)
CREATE TABLE IF NOT EXISTS public.sent_papers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    doi TEXT,
    topic TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Enable RLS for sent_papers 
-- (Backend uses Secret Key which bypasses RLS, so no specific policies needed here for now)
ALTER TABLE public.sent_papers ENABLE ROW LEVEL SECURITY;

-- 2. Create user_config table (Used by Next.js Frontend)
CREATE TABLE IF NOT EXISTS public.user_config (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Enable RLS for user_config
ALTER TABLE public.user_config ENABLE ROW LEVEL SECURITY;

-- Frontend RLS Policies for user_config (Protecting user data)
CREATE POLICY "Users can view their own config"
ON public.user_config FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own config"
ON public.user_config FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own config"
ON public.user_config FOR UPDATE
USING (auth.uid() = user_id);

-- Optional: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_config_updated_at
BEFORE UPDATE ON public.user_config
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

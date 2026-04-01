-- 1. Create a Cache for Papers fetched and evaluated by AI
CREATE TABLE IF NOT EXISTS public.papers_cache (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT,
    abstract TEXT,
    authors JSONB,
    publication_date TEXT,
    citation_count INTEGER DEFAULT 0,
    journal TEXT,
    sjr_rank TEXT,
    doi TEXT,
    
    -- AI Generated Content
    summary JSONB,
    novelty JSONB,
    impact JSONB,
    keywords JSONB,

    analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.papers_cache ENABLE ROW LEVEL SECURITY;
-- Only the backend via Service Role Key mutates this, so RLS is fine as-is.

-- 2. Create user-specific tracking table mapping users to papers
CREATE TABLE IF NOT EXISTS public.user_sent_papers (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    paper_id TEXT REFERENCES public.papers_cache(id) ON DELETE CASCADE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    PRIMARY KEY (user_id, paper_id)
);

ALTER TABLE public.user_sent_papers ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own sent history if they log into the dashboard
CREATE POLICY "Users can view their sent history"
ON public.user_sent_papers FOR SELECT
USING (auth.uid() = user_id);

-- 3. RENAME legacy global sent_papers table avoiding conflict
ALTER TABLE IF EXISTS public.sent_papers RENAME TO _sent_papers_legacy;

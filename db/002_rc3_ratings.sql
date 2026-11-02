-- v1.0.0-rc.3 — 2026-11-02: RC2-ENH-001. Approval required before live execution.
-- Additive only. No existing row is enriched or rewritten by this migration.
BEGIN;
ALTER TABLE public.queue ADD COLUMN IF NOT EXISTS tmdb_rating NUMERIC;
ALTER TABLE public.queue ADD COLUMN IF NOT EXISTS tmdb_vote_count BIGINT;
ALTER TABLE public.queue ADD COLUMN IF NOT EXISTS ratings_fetched_at TIMESTAMPTZ;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.queue'::regclass AND conname = 'queue_tmdb_rating_range') THEN
  ALTER TABLE public.queue ADD CONSTRAINT queue_tmdb_rating_range CHECK (tmdb_rating >= 0 AND tmdb_rating <= 10);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.queue'::regclass AND conname = 'queue_tmdb_votes_range') THEN
  ALTER TABLE public.queue ADD CONSTRAINT queue_tmdb_votes_range CHECK (tmdb_vote_count >= 0);
 END IF;
END $$;
COMMIT;

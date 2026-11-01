-- v1.0.0-rc.2 — 2026-10-30: approved permanent history, saved-title search, no watched status.
-- v1.0.0-rc.1 — 2026-10-30: additive migration, preserves existing rows.
BEGIN;
CREATE TABLE IF NOT EXISTS queue (
 id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL,
 release_year INTEGER, streaming_service TEXT, imdb_rating NUMERIC,
 rotten_tomatoes_rating INTEGER, cast_members TEXT, added_by TEXT,
 created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE queue ADD COLUMN IF NOT EXISTS tmdb_id BIGINT;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS media_type TEXT;
ALTER TABLE queue ALTER COLUMN created_at SET DEFAULT now();
-- Stop rather than discard old duplicates; inspect and resolve them before retrying.
CREATE UNIQUE INDEX IF NOT EXISTS queue_metadata_identity ON queue (media_type, tmdb_id);
CREATE UNIQUE INDEX IF NOT EXISTS queue_legacy_identity ON queue
 (lower(btrim(title)), lower(btrim(type)), COALESCE(release_year, -1));
CREATE TABLE IF NOT EXISTS queue_profiles (
 browser_id UUID PRIMARY KEY, name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100)
);
COMMIT;

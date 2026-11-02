/* v1.0.0-rc.3 — 2026-11-02: RC3-DEF-002 pin enrichment to isolated RC.3 branch. */
/* v1.0.0-rc.3 — RC2-GAP-001. No HTTP mutation endpoint or automatic backfill. */
import { createHash } from 'node:crypto';
export const PREVIEW_BRANCH = 'br-jolly-block-awtflt20';
export const PREVIEW_HOSTS = [
  'ep-twilight-moon-awbt5uj7.c-12.us-east-1.aws.neon.tech',
  'ep-twilight-moon-awbt5uj7-pooler.c-12.us-east-1.aws.neon.tech',
];
export function assertPreview(env) {
  const url = new URL(env.DATABASE_URL || 'invalid:');
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !PREVIEW_HOSTS.includes(url.hostname) || url.pathname !== '/neondb' || env.ENRICHMENT_SCOPE !== PREVIEW_BRANCH || env.VERCEL_ENV === 'production') {
    throw new Error('Enrichment requires the pinned isolated Preview database and explicit scope.');
  }
}
export function digest(plan) { return createHash('sha256').update(JSON.stringify(plan)).digest('hex'); }
const fields = ['imdb_rating', 'rotten_tomatoes_rating', 'tmdb_rating', 'tmdb_vote_count'];
export function missingRatings(row, ratings) {
  const patch = {};
  for (const field of fields) if (row[field] == null && ratings[field] != null) patch[field] = ratings[field];
  return patch;
}
export function validatePlan(plan, approval, env) {
  assertPreview(env);
  if (env.ENRICHMENT_WRITE_APPROVED !== PREVIEW_BRANCH || digest(plan) !== approval) throw new Error('An explicitly approved unchanged plan is required.');
  if (plan.version !== 1 || plan.branch !== PREVIEW_BRANCH || !Array.isArray(plan.rows) || plan.rows.length > 100 || !Number.isFinite(Date.parse(plan.createdAt)) || Date.now() - Date.parse(plan.createdAt) > 86400000 || Date.parse(plan.createdAt) > Date.now() + 60000) throw new Error('Invalid or expired plan.');
  const ids = new Set();
  for (const row of plan.rows) {
    if (!/^[1-9]\d{0,18}$/.test(String(row.id)) || ids.has(String(row.id)) || !/^[a-f0-9]{32}$/.test(row.fingerprint) || !row.patch || !Object.keys(row.patch).length) throw new Error('Invalid plan row.');
    ids.add(String(row.id));
    for (const [key, value] of Object.entries(row.patch)) {
      if (!fields.includes(key) || typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (key === 'rotten_tomatoes_rating' && (!Number.isInteger(value) || value > 100)) || (['tmdb_rating', 'imdb_rating'].includes(key) && value > 10) || (key === 'tmdb_vote_count' && !Number.isSafeInteger(value))) throw new Error('Invalid rating patch.');
    }
  }
}

// Every update is null-only and checks the fingerprint of the ENTIRE original row.
// IDs, timestamps, names and existing metadata are never assignments.
export const UPDATE_SQL = `UPDATE public.queue AS q SET
 imdb_rating = COALESCE(q.imdb_rating, $1::numeric),
 rotten_tomatoes_rating = COALESCE(q.rotten_tomatoes_rating, $2::integer),
 tmdb_rating = COALESCE(q.tmdb_rating, $3::numeric),
 tmdb_vote_count = COALESCE(q.tmdb_vote_count, $4::bigint),
 ratings_fetched_at = COALESCE(q.ratings_fetched_at, $5::timestamptz)
 WHERE q.id = $6::bigint AND md5(to_jsonb(q)::text) = $7 RETURNING q.id`;
export function updateParameters(row, time) {
  return [row.patch.imdb_rating ?? null, row.patch.rotten_tomatoes_rating ?? null, row.patch.tmdb_rating ?? null, row.patch.tmdb_vote_count ?? null, time, String(row.id), row.fingerprint];
}

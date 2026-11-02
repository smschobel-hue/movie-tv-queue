/* v1.0.0-rc.3 — RC2-GAP-001. Operator-only, dry-run by default. */
import { readFile, writeFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { omdbRatings, tmdbRatings } from '../lib/ratings.mjs';
import { assertPreview, PREVIEW_BRANCH, digest, missingRatings, validatePlan, UPDATE_SQL, updateParameters } from '../lib/enrichment.mjs';

async function main() {
  const args = process.argv.slice(2);
  const arg = name => args.find(a => a.startsWith(name + '='))?.slice(name.length + 1);
  const apply = args.includes('--apply');
  const allowed = ['--apply', '--plan=', '--approve-plan=', '--output=', '--limit='];
  if (args.some(a => !allowed.some(p => p.endsWith('=') ? a.startsWith(p) : a === p))) throw new Error('Unknown argument.');
  assertPreview(process.env);
  const sql = neon(process.env.DATABASE_URL);
  if (apply) {
    if (!arg('--plan') || !arg('--approve-plan')) throw new Error('Supply a reviewed plan and SHA-256 approval.');
    const plan = JSON.parse(await readFile(arg('--plan'), 'utf8'));
    validatePlan(plan, arg('--approve-plan'), process.env);
    let updated = 0;
    // Per-row optimistic concurrency: stale entries are skipped, never overwritten.
    // A retry of the same plan skips rows already updated; reports partial completion.
    for (const row of plan.rows) {
      const result = await sql.query(UPDATE_SQL, updateParameters(row, plan.createdAt));
      updated += result.length;
    }
    console.log(JSON.stringify({ mode: 'apply', updated, skipped: plan.rows.length - updated }));
    return;
  }
  if (arg('--plan') || arg('--approve-plan')) throw new Error('Plan input is for --apply only.');
  const limit = Number(arg('--limit') || 25);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !arg('--output')) throw new Error('Supply --output and --limit=1..100.');
  if (!process.env.OMDB_API_KEY || !process.env.TMDB_READ_ACCESS_TOKEN) throw new Error('Both provider credentials are required for planning.');
  const rows = await sql.query(`SELECT q.*, md5(to_jsonb(q)::text) AS fingerprint FROM public.queue q
    WHERE q.tmdb_id IS NOT NULL AND q.media_type IN ('movie', 'tv') AND
    (q.imdb_rating IS NULL OR q.rotten_tomatoes_rating IS NULL OR q.tmdb_rating IS NULL OR q.tmdb_vote_count IS NULL)
    ORDER BY q.id LIMIT $1`, [limit]);
  const plan = { version: 1, branch: PREVIEW_BRANCH, createdAt: new Date().toISOString(), rows: [] };
  let skipped = 0;
  for (const row of rows) {
    const response = await fetch(`https://api.themoviedb.org/3/${row.media_type}/${row.tmdb_id}?append_to_response=external_ids`, {
      headers: { Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}` }, signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) { skipped++; continue; }
    const details = await response.json();
    if (String(details.id) !== String(row.tmdb_id)) { skipped++; continue; }
    const omdb = await omdbRatings({ title: row.title, year: row.release_year, mediaType: row.media_type, imdbId: details.imdb_id || details.external_ids?.imdb_id });
    const tmdb = tmdbRatings(details);
    const patch = missingRatings(row, { imdb_rating: omdb.imdbRating, rotten_tomatoes_rating: omdb.rottenTomatoesRating, tmdb_rating: tmdb.tmdbRating, tmdb_vote_count: tmdb.tmdbVoteCount });
    if (Object.keys(patch).length) plan.rows.push({ id: String(row.id), fingerprint: row.fingerprint, patch });
    else skipped++;
  }
  await writeFile(arg('--output'), JSON.stringify(plan, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ mode: 'dry-run', candidates: rows.length, proposed: plan.rows.length, skipped, approvalDigest: digest(plan) }));
}
main().catch(() => { console.error('Enrichment stopped. Check scope, credentials, arguments, schema and provider availability; secrets are not logged. Review possible partial completion before retrying.'); process.exitCode = 1; });

# Movie & TV Queue v1.0.0-rc.3

Development candidate based on RC.2 commit `001e6829e3eb136b7740490f33377fba6cf1338f`.
No live migration, enrichment or production release is part of this implementation.

## Changes — newest first

- **RC.3, November 2, 2026:** RC2-DEF-001/002 introduces a shared server-side OMDb ratings client, fixed-code sanitized diagnostics and expanded contract tests. RC2-DEF-003 wires custom-artwork derivatives into favicon, Apple touch metadata and the PWA manifest while preserving `app/Icon.png` exactly. RC2-GAP-001 adds an operator-only, bounded dry-run/approved-plan enrichment CLI. RC2-ENH-001 adds a separately labelled TMDB score/count and nullable additive schema.
- **RC.2, October 30–November 1:** saved names in Neon, canonical TMDB title selection, duplicate protection, shared manual removal, saved-title search, timestamps, five/all display, refresh polling, profile outage recovery, and scoped PostCSS 8.5.32 security override.
- **RC.1 / earlier:** initial shared queue and release packaging. Original RC.2 reference and acceptance evidence remain in REQUIREMENTS.md and docs/RC3-PLAN.md.

## Local verification

Use Node.js 22 or 24. Run `npm ci`, `npm test`, `npm run build`, and `npm audit`. Tests use mocks and embedded PostgreSQL/PGlite only, never a live DATABASE_URL. Production-mode compilation can run without credentials. `npm run icons:generate` deterministically creates icon derivatives using sharp and verifies the immutable original hash first.

## Preview configuration and release gate

Required server secrets: `DATABASE_URL` for the intended isolated branch and `TMDB_READ_ACCESS_TOKEN`. `OMDB_API_KEY` is required to satisfy the IMDb/Rotten Tomatoes requirements when the provider has data; addition can still succeed when OMDb is unavailable. No real credentials belong in source, plans, logs or browser code. `.env.example` lists blank names only.

At implementation inspection, OMDB_API_KEY was absent in Vercel. TMDB_READ_ACCESS_TOKEN was Preview-scoped. DATABASE_URL had a Production value and a separate RC.2-specific Preview value; **no RC.3-specific DATABASE_URL existed**. Configure RC.3 only with its explicitly approved isolated connection; never copy Production's database URL or the legacy shared POSTGRES_* values.

The new insert requires `db/002_rc3_ratings.sql`. Do not add titles on RC.3 until the migration has been approved/applied to its isolated Preview database and its DATABASE_URL verified. The migration adds only nullable `tmdb_rating`, `tmdb_vote_count`, `ratings_fetched_at` plus constraints; it does not populate existing rows. Old RC.2 readers remain compatible. Read docs/RC3-PLAN.md before any live migration or enrichment. No automatic migration/backfill occurs in build, startup or API GET.

Pushing release/v1.0.0-rc.3 may trigger Vercel's existing Git Preview integration. This is not a Production promotion and does not execute SQL scripts. Any automatic Preview is not accepted until the migration/configuration gates are complete. No manual deployment or promotion is included.

## Ratings and errors

IMDb (/10) and Rotten Tomatoes (%) come from OMDb; TMDB (/10 with vote count) is independently labelled. A zero TMDB score with positive votes is valid; zero votes or absent values display Not available. Missing ratings never borrow another provider's score. Ratings are snapshots at insertion; there is no scheduled refresh. OMDb lookups prefer IMDb ID, otherwise canonical title/year/media type. Availability, especially series-level Rotten Tomatoes, must be verified live after credentials are configured.

Server diagnostics use `ratings_lookup` with provider `omdb` and one of: missing_configuration, authentication_failure, rate_limit, timeout, network_error, provider_error, invalid_response, not_found, ratings_unavailable, partial. Successful lookup returns ok. Logs do not include keys, URLs, response bodies, titles or raw exceptions. Existing queue and profile error handling remains generic to clients.

## Enrichment safety

`npm run enrich:preview -- --output=enrichment-plans/plan.json --limit=25` is dry-run by default; even planning needs separate operational approval and securely injected environment. The CLI pins `neondb` on `preview-v1-rc2` (br-odd-frost-aw9xkps2) and its exact endpoint allowlist, rejects Production, requires `ENRICHMENT_SCOPE` equal to that branch ID and requires both provider credentials for planning. The plan contains only record IDs, full-row fingerprints and proposed missing rating values—not credentials or user names.

Application requires `--apply --plan=... --approve-plan=<reviewed SHA-256>` plus `ENRICHMENT_WRITE_APPROVED=br-odd-frost-aw9xkps2`. These switches are safeguards, not authorization. Plans expire after 24 hours, cap at 100 records, permit rating fields only, fill nulls only, and skip any row changed since planning. Writes are per-row; errors may leave partial completion. Stop and review before retrying. Reapplying an unchanged plan skips already-updated rows. Never use the CLI against a different endpoint without reviewing/changing the allowlist and tests.

## Icons and installation

The exact original is `app/Icon.png` (capital I), SHA-256 `907a6c130c28fec666f623e9e31fc07c43e7d0f41aaa0052acae055ad4b2de04`. It stays unchanged; public PNG/ICO derivatives are referenced explicitly in metadata and manifest. No reliance on automatic discovery of the capitalized file. Apple touch declarations cover 180/167/152 px, favicon covers 16/32/48, manifest covers 192/512. iPhone/iPad: Safari Share → Add to Home Screen; verify correct artwork and standalone launch in A09/A18. Preview authentication and browser caches require actual device checks; do not disable protection automatically. Offline support/service worker is not implemented.

## Known scope and rollback

Names are labels, not authentication; shared removal has no user roles. Existing queue/profile behavior is preserved. For application rollback, restore the RC.2 deployment with the additive columns left in place. For enrichment rollback, use an approved isolated-branch restore/snapshot strategy described in docs/RC3-PLAN.md; do not delete/re-add queue records or reset Production. See VALIDATION.md for actual completed checks and acceptance limits.

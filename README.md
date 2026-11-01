# Movie & TV Queue v1.0.0-rc.2

Release candidate — October 30, 2026. Complete replacements for the changed files,
plus schema migration, icons, requirements traceability, and acceptance checks.
Not yet accepted or deployed. Original ZIP is preserved unchanged.

## Compared with the October 29 two-file ZIP

- Retained the correct original queue import: ../../../lib/db (root-level lib/db.js).
  Initial review incorrectly flagged this path; production compilation corrected that assessment.
- Added database-enforced duplicate protection, including concurrent additions.
- Added approved shared removal with confirmation and timestamps.
- Removed watched status per approved change; entries remain indefinitely until removed.
- Added saved-title search across the entire queue before applying five/all display.
- Added Neon name storage with an opaque HttpOnly browser cookie; removed localStorage.
- Retained title search/confirmation, canonical metadata, US streaming, and ratings.
- Sorts by creation time with ID tie-breaker; shows five first and all on Show More.
- Added automatic shared-list refresh on focus and every 30 seconds.
- Added request validation, origin checks, external-fetch timeouts, and error handling.
- Added full database helper, root layout, migration, home-screen assets, and release headers.

Approved removal/history/search policies are recorded in REQUIREMENTS.md.

## Installation in the existing GitHub repository

1. Create a review branch from the current main branch and retain the previous commit for rollback.
2. Download/extract this package. Copy app/, lib/, public/, db/, tests/, REQUIREMENTS.md,
   ACCEPTANCE.md, VALIDATION.md, SHA256SUMS.txt, .env.example, .gitignore, and this README into the repository. These are complete replacement files.
   Do not delete other repository files or upload the ZIP as application code.
3. Reconcile package.json with the repository and include this candidate’s updated package-lock.json. The runtime dependency ranges are unchanged; this candidate adds npm test and development-only PGlite and React test-renderer dependencies. Run npm ci to reproduce the tested install. The repository currently has no lockfile. The project needs next, react, react-dom,
   and @neondatabase/serverless. If the Neon package is absent, run
   `npm install @neondatabase/serverless` and commit package.json and its lockfile.
   Validation dependency versions, when available, are recorded in VALIDATION.md;
   this package does not silently replace the repository's dependency baseline.
4. Before migration, make a Neon branch/snapshot. Run db/001_v1.sql in Neon SQL Editor
   against the database intended for this deployment. It adds columns/indexes/table;
   it does not delete or rewrite existing queue entries. Run once before deploying.
5. If a unique-index error stops the transaction, run ROLLBACK, inspect duplicate groups
   using db/check_duplicates.sql, and resolve them deliberately before retrying.
   No automatic deletion of duplicates is included.
6. In Vercel set server-only DATABASE_URL, TMDB_READ_ACCESS_TOKEN, and OMDB_API_KEY
   for the intended environment. Use .env.example only as a list of variable names.
   Do not commit real .env files. TMDB is required for search; OMDb is optional but
   without it IMDb/Rotten Tomatoes will show Not available.
7. Run `npm ci`, `npm test`, `npm run build`, and the
   acceptance checks in ACCEPTANCE.md on a Vercel preview. Review and merge only
   after acceptance, then test the production deployment.
8. On iPhone/iPad open the HTTPS URL in Safari, use Share → Add to Home Screen,
   and open the icon. Home-screen launch is supported; offline use is not implemented.

## Database compatibility and rollback

The INSERT uses title, type, release_year, streaming_service, imdb_rating,
rotten_tomatoes_rating, cast_members, added_by plus new tmdb_id and media_type.
id and created_at rely on existing defaults; migration ensures the timestamp default.
The known schema uses a generated bigint id. If the actual id has no generator,
stop and repair that schema before installation.
Old rows keep their IDs/metadata and show missing fields as Not available.
Legacy TV values are assumed to be TV; review existing type spellings before migration.
To revert application code, deploy the previous commit. Leave additive schema in place;
do not drop tables/columns as part of code rollback. Database writes/removals require
snapshot restore or manual repair to reverse.

## Current release readiness

See VALIDATION.md for the November 1, 2026 local preparation results. All 25 automated checks and the production build pass. The GitHub branch release/v1.0.0-rc.2 exists but still matches main at 3d40d25c04a74f042219350bbf905fcdabc4e27a; these changes remain local. Live provider credentials, preview behavior, and mobile acceptance were not checked in this preparation. Security remediation pins Next.js’s PostCSS dependency to 8.5.32 through a scoped npm override. Next.js remains 15.5.28. All 25 checks and the production build pass after remediation; npm audit reports zero vulnerabilities. Keep the override and lockfile together when preparing the release branch.

Profile loading now has a 10-second request timeout. A failed profile request leaves all controls usable and displays a name-specific error. Users can enter a name and retry Save name; a delayed saved profile never overwrites a manually edited name. Queue and metadata operations still require their own working services.

The original GitHub file is app/Icon.png (capital I), preserved byte-for-byte. The lowercase app/icon.png spelling does not match the tracked path. Public home-screen icons are additional assets; retain the original file. App Router automatic lowercase icon discovery should not be assumed for this capitalized file.

## Limits

Historical October 30 work inspected live GitHub/Vercel configuration and Neon schema and migrated an isolated Neon branch. The November 1 preparation accessed GitHub read-only, changed only local files, and did not access or change a live database.
Names are labels, not authentication; group-wide mutation endpoints have no user roles.
External metadata and subscription availability may be unavailable or change. Provider
attribution is included in the footer; confirm provider branding/use requirements before
public distribution. Existing favicon/manifest routes may need reconciliation with these
public assets if the repository already defines alternatives.

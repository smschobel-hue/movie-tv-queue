# RC.3 operational approval plan — NOT EXECUTED

## Implementation baseline

RC.2 branch release/v1.0.0-rc.2 at 001e6829e3eb136b7740490f33377fba6cf1338f. RC.3 implementation branch release/v1.0.0-rc.3. Main must remain unchanged.

User-confirmed RC.2 passes: name persistence, queue persistence, TMDB searches, adding multiple TV series, LIFO ordering. These are partial A02/A03/A05/A12/A14 evidence; Show More/Less, sequential/concurrent duplicates, cancel/confirm deletion, hidden saved-title search and real-device icons still need acceptance. Old passes are not claims that RC.3 is deployed or accepted.

## Target requiring approval before live migration

Proposed target: Neon project falling-smoke-34175381, branch preview-v1-rc2, ID br-odd-frost-aw9xkps2, database neondb, endpoint ep-purple-fog-awwknv2v (or its pooled alias). This is the existing isolated test branch, NOT Neon main (br-sparkling-glitter-awtz8kbf / ep-crimson-darkness-aw226rxk). Approval should explicitly confirm reuse of this test branch or request a separate RC.3 test branch. A separate target requires a reviewed update of the enrichment allowlist; it must not be supplied as an unrestricted URL override.

Before any action: re-resolve Neon endpoint-to-branch mapping, verify RC.3 Vercel Preview DATABASE_URL points there, and record current schema and row IDs/counts. Do not expose credentials. Pause tester mutations for snapshot/verification windows by coordination, not an unapproved application/access-control change.

## Migration plan

1. Obtain explicit approval for the exact target and db/002_rc3_ratings.sql at the reviewed RC.3 commit.
2. Create an isolated-branch snapshot/restore point with separately approved backup action, or approved test-branch copy. Record recovery point ID and ensure restore is possible before proceeding.
3. Read current queue schema and fingerprint protected fields. Run only 002_rc3_ratings.sql in a transaction via the direct connection. Do not rerun 001 on a live database unless separately needed/reviewed.
4. Verify three nullable columns, range constraints, unchanged IDs/counts/created_at/added_by/existing metadata, and a clean rerun in an isolated test copy. Existing rows should have null new values.
5. Test the RC.3 Preview only after credential scoping and migration are verified; mutations need approved fixtures. Verify RC.2 compatibility with additive columns.

Rollback: roll back the transaction on migration failure. After commit, prefer application rollback to RC.2 and leave the harmless additive columns in place. Do not drop columns with new data/writers. Any schema reversal or branch restore is a separate reviewed action; never touch Neon main.

## Enrichment plan and safeguards

Separate approval is required even after migration. Do not run a live dry-run or apply operation as part of deployment. With approval, use the pinned target, secret-injected provider credentials, bounded limit (initially 3–25), and an ignored enrichment-plans path. Inspect proposed IDs/fields and its digest. No names, keys or whole records are written to the plan.

Apply only the reviewed unchanged plan within 24 hours, with explicit write acknowledgment and approval digest. Only null IMDb/RT/TMDB score/count fields can be filled. Existing rating values and all IDs, title/type/year, cast, streaming metadata, added_by and created_at are preserved. ratings_fetched_at is new bookkeeping and is filled only if null. Every row must match its original full-row fingerprint; changed rows are skipped. Missing canonical TMDB identities are not guessed and require separate review. Unavailable scores remain null. No delete/re-add, automatic refresh or public enrichment endpoint.

Writes are per-row and may partially complete on failure. Compare the plan IDs, counts and before/after snapshots before retrying. Verification: unchanged protected-field fingerprints/counts/order, known new values, unavailable nulls, duplicate invariants and idempotent repeat behavior. Reconcile concurrent skips without overwriting user changes.

Rollback: before apply, capture an approved isolated recovery point and coordinate an exclusive tester window. If enrichment must be undone, prefer a reviewed targeted null-restoration plan for exactly the fields originally null and actually changed, guarded by current-value checks; or restore the isolated recovery point if no later valid test changes would be lost. Both require separate approval. A restore is not automatic and may otherwise erase subsequent tester changes. Never restore/reset Production or delete/re-add records to refresh metadata.

## Outstanding setup and acceptance

OMDB_API_KEY was absent at the implementation configuration check; provide it securely in Vercel Preview only. RC.3 lacks its own DATABASE_URL override, while RC.2 has one. Preview-wide TMDB_READ_ACCESS_TOKEN exists. Do not reuse inherited production-pointing POSTGRES_* values.

A16 live ratings/error cases, A17 approved enrichment and A18 device icons, plus A19 TMDB values, remain pending. No provider coverage claims follow from mocked tests. Do not promote a Preview or merge to main under this authorization.

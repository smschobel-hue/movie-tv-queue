# Validation — v1.0.0-rc.3, November 2, 2026

## Local results

- Baseline: RC.2 001e6829e3eb136b7740490f33377fba6cf1338f. Working branch release/v1.0.0-rc.3 starts from this exact commit.
- Runtime Node.js 22.23.4 / npm 10.9.9. Next.js remains 15.5.28; React/React DOM 19.3.1. Scoped Next.js PostCSS override remains 8.5.32. sharp 0.35.5 is an explicit development dependency for deterministic icon generation.
- npm test: PASS, **50 checks**: 11 queue API, 4 profile API, 6 RC.2 embedded PostgreSQL, 6 component tests (including 4 original profile recovery regressions), 15 ratings/provider diagnostics, 4 enrichment safeguards/preservation, 3 icon, 1 RC.3 migration. The original 25 checks remain passing.
- npm run build: PASS. Compiles home page and both APIs with DATABASE_URL, OMDB_API_KEY and TMDB_READ_ACCESS_TOKEN removed from the build environment.
- npm audit: PASS, zero vulnerabilities at every severity.
- Local production server: home page and all 9 declared manifest/icon URLs return 200 with correct HTML/manifest/PNG/ICO content types; static response bytes equal the generated files. No API mutation or live database call was made by this smoke check.
- Generated HTML contains the expected favicon and Apple touch links with sizes/types. Browser page bundle contains no OMDB_API_KEY or TMDB_READ_ACCESS_TOKEN references.
- Original app/Icon.png SHA-256 matches RC.2 exactly: 907a6c130c28fec666f623e9e31fc07c43e7d0f41aaa0052acae055ad4b2de04. Pixel-level derivative checks and 16/32/48 ICO entry decoding pass. Apple derivative visually inspected.
- Secret scan and upload SHA-256 manifest exclude dependencies, .next, .git, enrichment plans/receipts and real environment files. The only environment-style deliverable is .env.example, with empty assignments. Synthetic test credentials are clearly fixture strings and are not live secrets.

## What is not accepted yet

- No live schema migration or enrichment was executed. Migration and update SQL were tested only against in-memory PGlite fixtures. See docs/RC3-PLAN.md for target, safeguards, rollback and verification approval gates.
- No live OMDb call was made; OMDB_API_KEY was missing at the Vercel metadata inspection. Provider availability, including series-level Rotten Tomatoes, remains unverified.
- No RC.3-specific DATABASE_URL was configured. RC.2 has a branch-specific isolated connection; the production value and shared legacy database variables must not be copied blindly. Configure only after the intended RC.3 test target is approved.
- No Vercel environment variable or Production setting was changed. No manual deployment or promotion initiated. A release-branch push may automatically create a Git Preview; inspect its status after push and do not confuse build readiness with database/API acceptance.
- The new insert requires approved migration 002 before adding titles on Preview. Missing schema/configuration is a deployment prerequisite, not a reason to run scripts automatically.
- Real Safari/iPhone/iPad Home Screen acceptance, live provider/error cases and controlled enrichment remain pending. Existing Show More/Less, duplicate and manual-delete manual acceptance cases also remain open.
- React test-renderer emits a deprecation warning and Node VM modules emit an experimental warning. These are tooling notices, not npm audit vulnerabilities.
- Enrichment is deliberately per-row; a connection error may leave partial completion. Changed rows skip via full-row fingerprints. Review before/after evidence and coordinate test writers before approving rollback or retries.

## Record disposition

RC2-DEF-001/002/003, RC2-GAP-001 and RC2-ENH-001 are implemented in source and covered locally, but not closed as live acceptance. No issue IDs were renumbered. FR-023 is the new independent TMDB-rating requirement authorized by the RC.3 request. Original RC.2 user-confirmed passes remain documented without expanding their scope.

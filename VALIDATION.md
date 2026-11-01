# Validation — v1.0.0-rc.2

## Local preparation — November 1, 2026

- Runtime: Node.js 22.23.4 (official darwin-arm64 archive, SHA-256 verified), npm 10.9.9.
- Dependencies installed locally; updated package-lock.json records the exact install. The lockfile resolves Next.js 15.5.28 and React/React DOM 19.3.1 within the unchanged runtime dependency ranges.
- Added development dependency @electric-sql/pglite 0.5.14. This is embedded PostgreSQL, not SQLite; database tests use only in-memory instances and no DATABASE_URL.
- Added react-test-renderer 19.3.1 (pinned to match installed React) for component regressions and an npm test command.
- npm test: PASS, 25 checks (11 queue API, 4 profile API, 6 embedded PostgreSQL, 4 component regressions).
- Component regressions cover rejected network requests, HTTP failure, invalid JSON, retrying Save name after each failure, and preserving manual input when a delayed profile response arrives.
- npm run build: PASS on Next.js 15.5.28; page and both API routes compile. Database/provider credentials removed from build environment; no live database used.
- app/Icon.png preserved from GitHub commit 3d40d25c04a74f042219350bbf905fcdabc4e27a; Git blob SHA-1 verified as 3675664b9fee06794fa604963deb12f9c01936c2.
- GitHub release/v1.0.0-rc.2 exists and matches main at the above commit. No commit, push, merge, or deployment performed.
- SHA256SUMS.txt regenerated for deliverable source, assets, tests, and documentation (excluding itself, installed dependencies, and build output).

## Remaining risks and acceptance

- npm audit after security remediation: PASS, zero vulnerabilities at every severity. A scoped package.json override sets next -> postcss to exactly 8.5.32; package-lock.json is regenerated. This resolves the prior high PostCSS and inherited moderate Next.js findings without changing Next.js 15.5.28. The registry lists 15.5.28 as the newest stable Next.js 15 release. No major framework upgrade was applied.
- All 25 automated checks and the production build were rerun and passed with the override. npm ls confirms next@15.5.28 -> postcss@8.5.32 (overridden), without dependency errors.
- The override substitutes Next.js’s pinned transitive dependency. Compatibility is verified for this candidate’s automated tests/build; future framework upgrades and CSS changes should retest it. Live browser/mobile acceptance remains pending.
- React test-renderer is deprecated; tests currently pass. API mocks use experimental Node VM modules and emit the corresponding warning.
- Unit/component tests and embedded PostgreSQL checks do not validate live Neon, TMDB, OMDb, deployed cookies/origin handling, or actual mobile/browser behavior.
- No provider credentials were added or checked. DATABASE_URL and TMDB_READ_ACCESS_TOKEN are required for live use; OMDB_API_KEY is optional for ratings.
- Names remain labels, not authentication. Shared mutations have no user roles.
- The additive database migration must be tested against an isolated copy of the intended schema. Existing duplicate rows can prevent its unique indexes from being created; no duplicates are automatically deleted.
- Run ACCEPTANCE.md on an isolated database and preview before production. Production database and application were untouched.

## Historical context — October 30

The previous report recorded local passing checks, an isolated Neon migration, GitHub branch creation blocked by 403, and no preview deployment. Branch existence was subsequently verified November 1; the old 403 is not a current branch-status claim. Historical credential/configuration observations have not been revalidated.

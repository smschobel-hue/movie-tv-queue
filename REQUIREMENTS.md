# Movie & TV Queue — requirements traceability

Version: v1.0.0-rc.2, October 30, 2026. Implements the retrieved SRS v1.0 baseline;
this is a traceability transcription, not a new user-approved baseline.
Permanent IDs are preserved. Do not renumber or delete IDs when requirements change.

## Approved change control — October 30, 2026

FR-008: Any visitor with access may remove a title after explicit confirmation.
FR-009: Withdrawn by Steve; watched status is not tracked. ID retained for history.
FR-021: Search saved titles across the complete queue, including entries beyond the five displayed. Search is separate from adding a title and preserves newest-first ordering.
FR-022: Retain entries indefinitely. No automatic expiry or removal; only explicit user removal deletes an entry.

Remembered names are per browser/device, not authenticated identities. Clearing cookies resets
that browser's association; names remain in Neon. No localStorage or sessionStorage is used.
This release does not add login, role authorization, or a membership limit. A public URL is accessible to anyone who has it.

## Functional requirements

| ID | Requirement | Implementation / review status |
|---|---|---|
| FR-001 | Shared queue for five | Shared queue table/API; no login or membership enforcement |
| FR-002 | Remembered name | Profile API + Neon queue_profiles; opaque browser cookie |
| FR-003 | Title-only input | page search form; name entered separately |
| FR-004 | Persistent shared queue | lib/db.js + queue API |
| FR-005 | Five newest first | created_at DESC, id DESC + slice(0,5) |
| FR-006 | Show More/Less | page toggles all/five |
| FR-007 | Prevent duplicates | metadata and normalized legacy unique indexes + HTTP 409 |
| FR-008 | Remove titles | DELETE + browser confirmation; shared policy approved |
| FR-009 | Withdrawn: watched status | No watched control or PATCH endpoint; ID preserved |
| FR-010 | Automatic movie/TV search | TMDB multi-search |
| FR-011 | Matching-title selection | explicit selection before insertion |
| FR-012 | Identify Movie/TV Series | TMDB media type stored as Movie/TV |
| FR-013 | Release year | TMDB date to release_year |
| FR-014 | IMDb rating | OMDb; unavailable shown explicitly |
| FR-015 | Rotten Tomatoes rating | OMDb; unavailable shown explicitly |
| FR-016 | Cast | first eight TMDB cast names |
| FR-017 | US subscription streaming | TMDB watch/providers US flatrate |
| FR-018 | Added-by user | added_by displayed |
| FR-019 | Add timestamp | created_at default and local date/time display |
| FR-020 | Unavailable data | Not available labels |

| FR-021 | Search saved titles | Entire fetched queue filtered by case-insensitive title before five/all slicing |
| FR-022 | Retain entry history | No expiry jobs or automatic removal; DELETE requires explicit user action |

## Technical requirements

| ID | Requirement | Implementation / review status |
|---|---|---|
| TR-001 | Next.js/React | replacement app router components |
| TR-002 | Neon PostgreSQL | lib/db.js and additive SQL migration |
| TR-003 | GitHub source/version history | replacement files supplied; commit still required |
| TR-004 | Vercel production deployment | deployment still required |
| TR-005 | iPhone/iPad/desktop | responsive form; device acceptance pending |
| TR-006 | iPhone home-screen installation | manifest/icons/Apple metadata; device acceptance pending |
| TR-007 | Credentials server-side | server routes read environment variables only |
| TR-008 | Validation/error handling | server validation, parameter binding, timeouts, generic errors |
| TR-009 | Newest-first release notes | comment headers in JS, SQL, tests; JSON/PNG cannot contain comments |
| TR-010 | Complete replacement files | all changed source files supplied in full |
| TR-011 | Change comparisons and acceptance tests | README comparison + tests/API suite + ACCEPTANCE.md |

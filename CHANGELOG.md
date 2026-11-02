# Release history

## v1.0.0-rc.3 — November 2, 2026

- RC2-DEF-001: shared OMDb server-only lookup with secure environment configuration; existing missing live key reported rather than committed.
- RC2-DEF-002: sanitized status codes for missing config, authentication/quota, provider/network/timeouts, malformed responses, no result and absent/partial ratings.
- RC2-DEF-003: immutable original custom artwork plus deterministic favicon, 180/167/152 Apple touch and 192/512 manifest derivatives; explicit metadata and stable manifest identity/scope.
- RC2-GAP-001: operator-only bounded enrichment plans, pinned isolated target, digest/expiry approval, null-only writes and full-row concurrency safeguards. No backfill run.
- RC2-ENH-001 / FR-023: separately labelled TMDB score/count and additive nullable schema. IMDb/RT remain independent.
- Existing RC.2 tests retained, additional provider, component, icon, migration and enrichment tests included. Operational gates documented in docs/RC3-PLAN.md.

## v1.0.0-rc.2 — October 30–November 1, 2026

Shared persistent queue, name persistence, canonical title search and confirmation, duplicate prevention, saved-title search, manual removal, LIFO ordering, metadata and unavailable fallback, auto refresh, profile outage recovery, PostCSS security override. Historical acceptance: user confirmed name/queue persistence, TMDB search, multiple-series addition and LIFO; remaining scenarios were not accepted by implication.

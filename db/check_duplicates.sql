-- v1.0.0-rc.2 — 2026-10-30: approved permanent history, saved-title search, no watched status.
-- v1.0.0-rc.1 — 2026-10-30: read-only legacy duplicate report.
SELECT lower(btrim(title)) AS title_key, lower(btrim(type)) AS type_key,
 COALESCE(release_year, -1) AS year_key, count(*) AS entries,
 array_agg(id ORDER BY id) AS ids
FROM queue GROUP BY 1, 2, 3 HAVING count(*) > 1;

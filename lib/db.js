/*
 * Movie & TV Queue — v1.0.0-rc.2 — 2026-10-30
 * Release history (newest first):
 * v1.0.0-rc.2 — 2026-10-30: approved permanent history, saved-title search, no watched status.
 * v1.0.0-rc.1: Complete replacement; SRS traceability in REQUIREMENTS.md.
 * 2026-10-29: Original two-file replacement ZIP; unversioned, no embedded history.
 */
import { neon } from "@neondatabase/serverless";
// Lazy initialization allows builds without production secrets.
export function sql(strings, ...values) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(process.env.DATABASE_URL)(strings, ...values);
}

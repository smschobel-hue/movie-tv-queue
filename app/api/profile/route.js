/*
 * Movie & TV Queue — v1.0.0-rc.2 — 2026-10-30
 * Release history (newest first):
 * v1.0.0-rc.2 — 2026-10-30: approved permanent history, saved-title search, no watched status.
 * v1.0.0-rc.1: Complete replacement; SRS traceability in REQUIREMENTS.md.
 * 2026-10-29: Original two-file replacement ZIP; unversioned, no embedded history.
 */
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { sql } from "../../../lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cookieName = "movie_queue_browser";
async function browserId(create) {
  const jar = await cookies();
  const saved = jar.get(cookieName)?.value;
  if (saved && /^[a-f0-9-]{36}$/.test(saved)) return saved;
  if (!create) return null;
  const id = randomUUID();
  jar.set(cookieName, id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 31536000 });
  return id;
}
export async function GET() {
  try {
    const id = await browserId(true);
    const rows = await sql`SELECT name FROM queue_profiles WHERE browser_id = ${id}`;
    return Response.json({ name: rows[0]?.name || "" });
  } catch (error) { console.error("Profile load failed", error); return Response.json({ error: "Unable to load your saved name" }, { status: 500 }); }
}
export async function PUT(request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Request origin rejected" }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 100) return Response.json({ error: "Name must contain 1–100 characters" }, { status: 400 });
  try {
    const id = await browserId(true);
    await sql`INSERT INTO queue_profiles (browser_id, name) VALUES (${id}, ${name}) ON CONFLICT (browser_id) DO UPDATE SET name = EXCLUDED.name`;
    return Response.json({ name });
  } catch (error) { console.error("Profile save failed", error); return Response.json({ error: "Unable to save your name" }, { status: 500 }); }
}

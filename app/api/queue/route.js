/*
 * Movie & TV Queue — v1.0.0-rc.2 — 2026-10-30
 * Release history (newest first):
 * v1.0.0-rc.2 — 2026-10-30: approved permanent history, saved-title search, no watched status.
 * v1.0.0-rc.1: Complete replacement; SRS traceability in REQUIREMENTS.md.
 * 2026-10-29: Original two-file replacement ZIP; unversioned, no embedded history.
 */
import { sql } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TMDB_BASE = "https://api.themoviedb.org/3";

function errorResponse(message, status) {
  return Response.json({ error: message }, { status });
}

async function tmdb(path, params = {}) {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) throw new Error("TMDB_READ_ACCESS_TOKEN is not configured");
  const url = new URL(`${TMDB_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
    cache: "no-store", signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`TMDb request failed (${response.status})`);
  return response.json();
}

function normalizeMatch(item) {
  const type = item.media_type;
  const date = type === "movie" ? item.release_date : item.first_air_date;
  return {
    tmdbId: item.id,
    mediaType: type,
    title: type === "movie" ? item.title : item.name,
    year: date ? Number(date.slice(0, 4)) || null : null,
    overview: item.overview || "",
  };
}

async function searchMatches(title) {
  const data = await tmdb("/search/multi", { query: title, include_adult: "false" });
  return (data.results || [])
    .filter((item) => (item.media_type === "movie" || item.media_type === "tv") && item.id)
    .map(normalizeMatch)
    .slice(0, 12);
}

async function getOmdbDetails(title, year, type, imdbId) {
  const key = process.env.OMDB_API_KEY;
  if (!key) return null;
  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", key);
  if (imdbId) {
    url.searchParams.set("i", imdbId);
  } else {
    url.searchParams.set("t", title);
    if (year) url.searchParams.set("y", String(year));
    url.searchParams.set("type", type === "movie" ? "movie" : "series");
  }
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12000) });
    if (!response.ok) return null;
    const data = await response.json();
    return data.Response === "True" ? data : null;
  } catch (error) {
    console.warn("OMDb lookup unavailable:", error);
    return null;
  }
}

function parseRating(value) {
  if (!value || value === "N/A") return null;
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : null;
}

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM queue ORDER BY created_at DESC NULLS LAST, id DESC`;
    return Response.json(rows);
  } catch (error) {
    console.error("GET /api/queue failed:", error);
    return errorResponse("Failed to load queue", 500);
  }
}

export async function POST(request) {
  try {
    if (!sameOrigin(request)) return errorResponse("Request origin rejected", 403);
    let body;
    try { body = await request.json(); } catch { return errorResponse("Invalid JSON", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return errorResponse("Invalid request", 400);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const addedBy = typeof body.addedBy === "string" ? body.addedBy.trim() : "";
    if (!title || !addedBy) return errorResponse("Name and title are required", 400);
    if (title.length > 250 || addedBy.length > 100) return errorResponse("Name or title is too long", 400);

    if ((!Number.isSafeInteger(body.tmdbId) || body.tmdbId <= 0) || !["movie", "tv"].includes(body.mediaType)) {
      const matches = await searchMatches(title);
      if (!matches.length) return errorResponse("No matching movie or TV series was found", 404);
      // Always ask the user to confirm the intended title, including when only one match exists.
      return Response.json({ needsSelection: true, matches });
    }

    const mediaType = body.mediaType;
    const tmdbId = body.tmdbId;
    const details = await tmdb(`/${mediaType}/${tmdbId}`, {
      append_to_response: "credits,watch/providers,external_ids",
    });
    if (!details.id || details.id !== tmdbId) return errorResponse("Selected title was not found", 404);

    const canonicalTitle = mediaType === "movie" ? details.title : details.name;
    const date = mediaType === "movie" ? details.release_date : details.first_air_date;
    const releaseYear = date ? Number.parseInt(date.slice(0, 4), 10) || null : null;
    const castMembers = (details.credits?.cast || [])
      .slice(0, 8)
      .map((person) => person.name)
      .filter(Boolean)
      .join(", ") || null;
    // TMDb provider information is region-specific. Use US availability by default.
    const usProviders = details["watch/providers"]?.results?.US;
    const providers = usProviders?.flatrate || [];
    const streamingService = [...new Set(providers.map((p) => p.provider_name).filter(Boolean))].join(", ") || null;

    const imdbId = mediaType === "movie" ? details.imdb_id : details.external_ids?.imdb_id;
    const omdb = await getOmdbDetails(canonicalTitle, releaseYear, mediaType, imdbId);
    const imdbRating = parseRating(omdb?.imdbRating);
    const rtEntry = omdb?.Ratings?.find((r) => r.Source === "Rotten Tomatoes");
    const rottenTomatoesRating = rtEntry ? parseRating(rtEntry.Value) : null;

    // Unique metadata identity enforces duplicate prevention under concurrent requests.
    // Expression index also protects legacy rows with no TMDb identifier.
    const rows = await sql`
      INSERT INTO queue (
        title, type, release_year, streaming_service,
        imdb_rating, rotten_tomatoes_rating, cast_members, added_by, tmdb_id, media_type
      ) VALUES (
        ${canonicalTitle}, ${mediaType === "tv" ? "TV" : "Movie"},
        ${releaseYear}, ${streamingService},
        ${imdbRating}, ${rottenTomatoesRating}, ${castMembers}, ${addedBy}, ${tmdbId}, ${mediaType}
      ) ON CONFLICT DO NOTHING RETURNING *
    `;
    if (!rows.length) return errorResponse("This title is already in the queue", 409);
    return Response.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/queue failed:", error);
    return errorResponse("Failed to search for or add the title. Check server logs and API configuration.", 500);
  }
}

// FR-008: explicit shared removal only; entries never expire automatically.
function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
async function removeEntry(request) {
  if (!sameOrigin(request)) return errorResponse("Request origin rejected", 403);
  let body;
  try { body = await request.json(); } catch { return errorResponse("Invalid JSON", 400); }
  const id = String(body?.id ?? "");
  if (!/^[1-9]\d{0,18}$/.test(id)) return errorResponse("Invalid title ID", 400);
  try {
    const rows = await sql`DELETE FROM queue WHERE id = ${id} RETURNING id`;
    if (!rows.length) return errorResponse("Title not found", 404);
    return Response.json(rows[0]);
  } catch (error) {
    console.error("Queue mutation failed", error);
    return errorResponse("Unable to update the shared queue", 500);
  }
}
export async function DELETE(request) { return removeEntry(request); }

/* v1.0.0-rc.3 — 2026-11-02: RC2-DEF-001/002, RC2-ENH-001. */
// This module is used only by the server route and the offline enrichment CLI.
export function tmdbRatings(details) {
  const votes = details.vote_count;
  const score = details.vote_average;
  return {
    tmdbRating: Number.isSafeInteger(votes) && votes > 0 && typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 10 ? score : null,
    tmdbVoteCount: Number.isSafeInteger(votes) && votes >= 0 ? votes : null,
  };
}

function numberRating(value, max, percent = false) {
  if (typeof value !== 'string' || !new RegExp(percent ? '^\\d+(?:\\.\\d+)?%$' : '^\\d+(?:\\.\\d+)?$').test(value)) return null;
  const number = Number(value.replace('%', ''));
  return number >= 0 && number <= max ? (percent ? Math.round(number) : number) : null;
}

export async function omdbRatings({ title, year, mediaType, imdbId }, {
  env = process.env, fetchImpl = fetch, log = (event) => console.warn('ratings_lookup', event),
} = {}) {
  const result = (status, imdbRating = null, rottenTomatoesRating = null) => {
    // Fixed codes only: never log provider URLs, response bodies, titles or errors.
    if (status !== 'ok') log({ provider: 'omdb', status });
    return { status, imdbRating, rottenTomatoesRating };
  };
  if (!env.OMDB_API_KEY?.trim()) return result('missing_configuration');
  const url = new URL('https://www.omdbapi.com/');
  url.searchParams.set('apikey', env.OMDB_API_KEY);
  if (imdbId && /^tt\d+$/.test(imdbId)) url.searchParams.set('i', imdbId);
  else {
    url.searchParams.set('t', title);
    if (year) url.searchParams.set('y', String(year));
    url.searchParams.set('type', mediaType === 'tv' ? 'series' : 'movie');
  }
  let response;
  try { response = await fetchImpl(url, { cache: 'no-store', signal: AbortSignal.timeout(12000) }); }
  catch (error) { return result(['TimeoutError', 'AbortError'].includes(error?.name) ? 'timeout' : 'network_error'); }
  if ([401, 403].includes(response.status)) return result('authentication_failure');
  if (response.status === 429) return result('rate_limit');
  if (!response.ok) return result('provider_error');
  let data;
  try { data = await response.json(); } catch (error) { return result(['TimeoutError', 'AbortError'].includes(error?.name) ? 'timeout' : 'invalid_response'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return result('invalid_response');
  if (data.Response === 'False') {
    const error = String(data.Error || '');
    if (/limit|quota/i.test(error)) return result('rate_limit');
    if (/api.?key|unauthori[sz]ed|activat/i.test(error)) return result('authentication_failure');
    if (/not found|no result/i.test(error)) return result('not_found');
    return result('provider_error');
  }
  if (data.Response !== 'True') return result('invalid_response');
  const imdbRating = numberRating(data.imdbRating, 10);
  const rt = Array.isArray(data.Ratings) ? data.Ratings.find(r => r.Source === 'Rotten Tomatoes') : null;
  const rottenTomatoesRating = numberRating(rt?.Value, 100, true);
  return result(imdbRating === null && rottenTomatoesRating === null ? 'ratings_unavailable' : imdbRating === null || rottenTomatoesRating === null ? 'partial' : 'ok', imdbRating, rottenTomatoesRating);
}

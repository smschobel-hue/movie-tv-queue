/*
 * Movie & TV Queue — v1.0.0-rc.2 — 2026-10-30
 * Release history (newest first):
 * v1.0.0-rc.2 — 2026-10-30: approved permanent history, saved-title search, no watched status.
 * v1.0.0-rc.1: Complete replacement; SRS traceability in REQUIREMENTS.md.
 * 2026-10-29: Original two-file replacement ZIP; unversioned, no embedded history.
 */
"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [queue, setQueue] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [savedSearch, setSavedSearch] = useState("");
  const [matches, setMatches] = useState([]);
  const nameEdited = useRef(false);
  const [nameStatus, setNameStatus] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/profile", { cache: "no-store", signal: AbortSignal.timeout(10000) }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load your name");
      if (active && !nameEdited.current) setName(data.name || "");
    }).catch(() => { if (active) setNameStatus("Unable to load your saved name. Enter your name to continue; you can try Save name again."); });
    loadQueue();
    const refresh = () => { if (document.visibilityState === "visible") loadQueue(); };
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  async function saveName() {
    if (!name.trim()) return setNameStatus("Enter your name.");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save name");
      setNameStatus("Name saved.");
    } catch (error) { setNameStatus(error.message); }
  }

  async function loadQueue() {
    try {
      const response = await fetch("/api/queue", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load queue");
      setQueue(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to load the shared queue.");
    }
  }

  function handleNameChange(event) {
    nameEdited.current = true;
    setName(event.target.value);
    setNameStatus("");
  }

  async function removeTitle(item) {
    if (!window.confirm(`Remove "${item.title}" from everyone's queue?`)) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/queue", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: String(item.id) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update title");
      await loadQueue();
      setMessage("Title removed.");
    } catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }

  async function sendRequest(payload) {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to add title");
      if (data.needsSelection) {
        setMatches(data.matches || []);
        if (!data.matches?.length) setMessage("No matches found.");
        return;
      }
      setMatches([]);
      setTitle("");
      setShowAll(false);
      setMessage("Added successfully.");
      await loadQueue();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return setMessage("Please enter your name first.");
    if (!title.trim()) return setMessage("Please enter a movie or TV series title.");
    setMatches([]);
    sendRequest({ title: title.trim(), addedBy: name.trim() });
  }

  function chooseMatch(match) {
    if (!name.trim()) return setMessage("Please enter your name first.");
    sendRequest({
      title: match.title,
      addedBy: name.trim(),
      tmdbId: match.tmdbId,
      mediaType: match.mediaType,
    });
  }

  const filteredQueue = queue.filter((item) => item.title.toLocaleLowerCase().includes(savedSearch.trim().toLocaleLowerCase()));
  const displayedQueue = showAll ? filteredQueue : filteredQueue.slice(0, 5);
  const inputStyle = { width: "100%", boxSizing: "border-box", padding: 12, fontSize: 16 };
  const buttonStyle = { padding: "12px 20px", fontSize: 16, cursor: "pointer" };
  const field = (item, snake, camel) => item[snake] ?? item[camel] ?? null;
  const showValue = (value) => value === null || value === undefined || value === "" ? "Not available" : value;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Movie &amp; TV Queue</h1>
      <p>Add a movie or TV series to our shared watch list.</p>
      <section style={{ background: "#f5f5f5", padding: 20, borderRadius: 10, marginBottom: 25 }}>
        <label htmlFor="user-name" style={{ display: "block", fontWeight: "bold", marginBottom: 6 }}>Your name</label>
        <input id="user-name" type="text" value={name} onChange={handleNameChange} placeholder="Enter your name" maxLength={100} style={{ ...inputStyle, marginBottom: 18 }} />
        <button type="button" onClick={saveName} style={buttonStyle}>Save name</button>
        <p role="status">{nameStatus}</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="media-title" style={{ display: "block", fontWeight: "bold", marginBottom: 6 }}>Movie or TV series</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input id="media-title" type="text" value={title} onChange={(e) => { setTitle(e.target.value); setMatches([]); }} placeholder="Enter title" maxLength={250} style={{ ...inputStyle, flex: "1 1 300px", width: "auto" }} />
            <button type="submit" disabled={loading} style={buttonStyle}>{loading ? "Searching..." : "Search"}</button>
          </div>
        </form>
        {message && <p role="status" style={{ fontWeight: "bold" }}>{message}</p>}
        {matches.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <h2 style={{ fontSize: 20 }}>Choose the correct title</h2>
            <p>Confirm the movie or TV series before adding it.</p>
            {matches.map((match) => (
              <div key={`${match.mediaType}-${match.tmdbId}`} style={{ background: "white", padding: 12, marginBottom: 10, borderRadius: 8, border: "1px solid #ddd" }}>
                <strong>{match.title} {match.year ? `(${match.year})` : ""}</strong>
                <div>{match.mediaType === "tv" ? "TV series" : "Movie"}</div>
                {match.overview && <p style={{ margin: "8px 0" }}>{match.overview}</p>}
                <button type="button" disabled={loading} onClick={() => chooseMatch(match)} style={buttonStyle}>Add this title</button>
              </div>
            ))}
          </div>
        )}
      </section>
      <h2>Queue</h2>
      <p>Titles remain until a user removes them. Removals apply to everyone. The list refreshes every 30 seconds.</p>
      <label htmlFor="saved-search" style={{ display: "block", fontWeight: "bold", marginBottom: 6 }}>Search saved titles</label>
      <input id="saved-search" type="search" value={savedSearch} onChange={(event) => { setSavedSearch(event.target.value); setShowAll(false); }} placeholder="Find a title in the entire queue" style={inputStyle} />
      <p role="status">Showing {displayedQueue.length} of {filteredQueue.length} {savedSearch.trim() ? "matching titles" : "saved titles"}.</p>
      {displayedQueue.length === 0 ? <p>{queue.length ? "No saved titles match your search." : "No titles have been added yet."}</p> : displayedQueue.map((item, index) => {
        const year = field(item, "release_year", "year");
        const cast = field(item, "cast_members", "cast");
        const rt = field(item, "rotten_tomatoes_rating", "rottenTomatoesRating");
        return (
          <article key={item.id || `${item.title}-${index}`} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <h3 style={{ marginTop: 0 }}>{item.title}{year ? ` (${year})` : ""}</h3>
            <p><strong>Type:</strong> {showValue(item.type)}</p>
            <p><strong>Streaming (US subscription):</strong> {showValue(field(item, "streaming_service", "streamingService"))}</p>
            <p><strong>IMDb:</strong> {showValue(field(item, "imdb_rating", "imdbRating"))}</p>
            <p><strong>Rotten Tomatoes:</strong> {rt === null ? "Not available" : `${rt}%`}</p>
            <p><strong>Cast:</strong> {showValue(Array.isArray(cast) ? cast.join(", ") : cast)}</p>
            <p style={{ marginBottom: 0 }}><strong>Added by:</strong> {showValue(field(item, "added_by", "addedBy"))}</p>
            <p><strong>Added:</strong> {item.created_at ? new Date(item.created_at).toLocaleString() : "Not available"}</p>
            <button type="button" disabled={loading} onClick={() => removeTitle(item)} style={buttonStyle}>Remove</button>
          </article>
        );
      })}
      {filteredQueue.length > 5 && <button type="button" onClick={() => setShowAll(!showAll)} style={buttonStyle}>{showAll ? "Show Less" : "Show More"}</button>}
      <footer><p>Movie &amp; TV Queue v1.0.0-rc.2</p>
        <p>Movie data: TMDB. Streaming availability: JustWatch via TMDB. Ratings: OMDb.</p>
      </footer>
    </main>
  );
}

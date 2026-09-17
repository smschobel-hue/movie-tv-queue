"use client";

import { useEffect, useState } from "react";

export default function Home() {

  const [queue, setQueue] = useState([]);

  const [loaded, setLoaded] = useState(false);

  const [title, setTitle] = useState("");

  const [type, setType] = useState("Movie");

  const [year, setYear] = useState("");

  const [service, setService] = useState("");

  const [addedBy, setAddedBy] = useState("");

  // Load the shared queue from Neon

  useEffect(() => {

    async function loadQueue() {

      try {

        const response = await fetch("/api/queue");

        if (!response.ok) {

          throw new Error("Unable to load queue");

        }

        const data = await response.json();

        setQueue(data);

      } catch (error) {

        console.error("Error loading queue:", error);

      } finally {

        setLoaded(true);

      }

    }

    // Keep each person's name saved on their own device

    const savedName = localStorage.getItem("movie-tv-user-name");

    if (savedName) {

      setAddedBy(savedName);

    }

    loadQueue();

  }, []);

  // Save user name on this device

  useEffect(() => {

    if (addedBy) {

      localStorage.setItem("movie-tv-user-name", addedBy);

    }

  }, [addedBy]);

  async function addItem(e) {

    e.preventDefault();

    if (!title.trim() || !addedBy.trim()) {

      return;

    }

    try {

      const response = await fetch("/api/queue", {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify({

          title: title.trim(),

          type,

          year: year.trim(),

          service: service.trim(),

          addedBy: addedBy.trim(),

        }),

      });

      if (!response.ok) {

        throw new Error("Unable to add item");

      }

      const newItem = await response.json();

      // Newest item appears first

      setQueue((currentQueue) => [newItem, ...currentQueue]);

      setTitle("");

      setYear("");

      setService("");

    } catch (error) {

      console.error("Error adding item:", error);

      alert("The item could not be added. Please try again.");

    }

  }

  return (

    <main

      style={{

        maxWidth: "700px",

        margin: "40px auto",

        padding: "20px",

        fontFamily: "Arial, sans-serif",

      }}

    >

      <h1>Movie & TV Queue</h1>

      <form onSubmit={addItem}>

        <div style={{ marginBottom: "12px" }}>

          <label>

            Your name

            <br />

            <input

              value={addedBy}

              onChange={(e) => setAddedBy(e.target.value)}

              placeholder="Your name"

              style={{ width: "100%", padding: "8px" }}

            />

          </label>

        </div>

        <div style={{ marginBottom: "12px" }}>

          <label>

            Title

            <br />

            <input

              value={title}

              onChange={(e) => setTitle(e.target.value)}

              placeholder="Movie or TV title"

              style={{ width: "100%", padding: "8px" }}

            />

          </label>

        </div>

        <div style={{ marginBottom: "12px" }}>

          <label>

            Type

            <br />

            <select

              value={type}

              onChange={(e) => setType(e.target.value)}

              style={{ width: "100%", padding: "8px" }}

            >

              <option value="Movie">Movie</option>

              <option value="TV">TV</option>

            </select>

          </label>

        </div>

        <div style={{ marginBottom: "12px" }}>

          <label>

            Release year

            <br />

            <input

              value={year}

              onChange={(e) => setYear(e.target.value)}

              placeholder="2026"

              style={{ width: "100%", padding: "8px" }}

            />

          </label>

        </div>

        <div style={{ marginBottom: "12px" }}>

          <label>

            Streaming service

            <br />

            <input

              value={service}

              onChange={(e) => setService(e.target.value)}

              placeholder="Netflix, Prime Video, etc."

              style={{ width: "100%", padding: "8px" }}

            />

          </label>

        </div>

        <button

          type="submit"

          style={{

            padding: "10px 18px",

            fontSize: "16px",

            cursor: "pointer",

          }}

        >

          Add to Queue

        </button>

      </form>

      <hr style={{ margin: "30px 0" }} />

      <h2>Queue</h2>

      {!loaded ? (

        <p>Loading queue...</p>

      ) : queue.length === 0 ? (

        <p>No movies or TV shows in the queue yet.</p>

      ) : (

        queue.map((item) => (

          <div

            key={item.id}

            style={{

              border: "1px solid #ccc",

              borderRadius: "8px",

              padding: "14px",

              marginBottom: "12px",

            }}

          >

            <h3 style={{ margin: "0 0 8px 0" }}>{item.title}</h3>

            <div>

              {item.type}

              {item.year ? ` • ${item.year}` : ""}

            </div>

            {item.service && <div>Streaming: {item.service}</div>}

            <div>Added by: {item.addedBy}</div>

          </div>

        ))

      )}

    </main>

  );

}

"use client";

import { useEffect, useState } from "react";

export default function Home() {

  const [name, setName] = useState("");

  const [title, setTitle] = useState("");

  const [queue, setQueue] = useState([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [showAll, setShowAll] = useState(false);

  useEffect(() => {

    const savedName = localStorage.getItem("movie-tv-user-name");

    if (savedName) setName(savedName);

    loadQueue();

  }, []);

  async function loadQueue() {

    try {

      const response = await fetch("/api/queue", {

        cache: "no-store",

      });

      if (!response.ok) {

        throw new Error("Unable to load queue");

      }

      const data = await response.json();

      setQueue(Array.isArray(data) ? data : data.items || []);

    } catch (error) {

      console.error(error);

      setMessage("Unable to load the shared queue.");

    }

  }

  function handleNameChange(event) {

    const value = event.target.value;

    setName(value);

    localStorage.setItem("movie-tv-user-name", value);

  }

  async function handleSubmit(event) {

    event.preventDefault();

    if (!name.trim()) {

      setMessage("Please enter your name first.");

      return;

    }

    if (!title.trim()) {

      setMessage("Please enter a movie or TV series title.");

      return;

    }

    setLoading(true);

    setMessage("");

    try {

      const response = await fetch("/api/queue", {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify({

          title: title.trim(),

          addedBy: name.trim(),

        }),

      });

      const data = await response.json();

      if (!response.ok) {

        throw new Error(data.error || "Unable to add title");

      }

      /*

        If the API finds more than one possible match

        (for example a movie and TV series with the same name),

        it can return:

        {

          needsSelection: true,

          matches: [...]

        }

        We will build the selection screen next.

      */

      if (data.needsSelection) {

        setMessage(

          "More than one match was found. Selection screen coming next."

        );

        return;

      }

      setTitle("");

      setMessage("Added successfully.");

      setShowAll(false);

      await loadQueue();

    } catch (error) {

      console.error(error);

      setMessage(error.message || "Something went wrong.");

    } finally {

      setLoading(false);

    }

  }

  const displayedQueue = showAll ? queue : queue.slice(0, 5);

  return (

    <main

      style={{

        maxWidth: "900px",

        margin: "0 auto",

        padding: "30px 20px",

        fontFamily: "Arial, sans-serif",

      }}

    >

      <h1 style={{ marginBottom: "8px" }}>Movie & TV Queue</h1>

      <p style={{ marginTop: 0, color: "#555" }}>

        Add a movie or TV series to our shared watch list.

      </p>

      <div

        style={{

          background: "#f5f5f5",

          padding: "20px",

          borderRadius: "10px",

          marginBottom: "25px",

        }}

      >

        <label

          style={{

            display: "block",

            fontWeight: "bold",

            marginBottom: "6px",

          }}

        >

          Your name

        </label>

        <input

          type="text"

          value={name}

          onChange={handleNameChange}

          placeholder="Enter your name"

          style={{

            width: "100%",

            boxSizing: "border-box",

            padding: "12px",

            fontSize: "16px",

            marginBottom: "18px",

          }}

        />

        <form onSubmit={handleSubmit}>

          <label

            style={{

              display: "block",

              fontWeight: "bold",

              marginBottom: "6px",

            }}

          >

            Movie or TV series

          </label>

          <div

            style={{

              display: "flex",

              gap: "10px",

              flexWrap: "wrap",

            }}

          >

            <input

              type="text"

              value={title}

              onChange={(event) => setTitle(event.target.value)}

              placeholder="Enter title"

              style={{

                flex: "1 1 300px",

                padding: "12px",

                fontSize: "16px",

              }}

            />

            <button

              type="submit"

              disabled={loading}

              style={{

                padding: "12px 22px",

                fontSize: "16px",

                cursor: loading ? "default" : "pointer",

              }}

            >

              {loading ? "Searching..." : "Add"}

            </button>

          </div>

        </form>

        {message && (

          <p

            style={{

              marginBottom: 0,

              marginTop: "15px",

              fontWeight: "bold",

            }}

          >

            {message}

          </p>

        )}

      </div>

      <h2>Queue</h2>

      {displayedQueue.length === 0 ? (

        <p>No titles have been added yet.</p>

      ) : (

        displayedQueue.map((item, index) => (

          <div

            key={item.id || `${item.title}-${index}`}

            style={{

              border: "1px solid #ddd",

              borderRadius: "10px",

              padding: "16px",

              marginBottom: "14px",

            }}

          >

            <h3 style={{ marginTop: 0, marginBottom: "8px" }}>

              {item.title}

              {item.year ? ` (${item.year})` : ""}

            </h3>

            <p>

              <strong>Type:</strong>{" "}

              {item.type || item.titleType || "Not available"}

            </p>

            <p>

              <strong>Streaming:</strong>{" "}

              {item.streamingService ||

                item.streamingServices ||

                "Not available"}

            </p>

            <p>

              <strong>IMDb:</strong>{" "}

              {item.imdbRating ?? "Not available"}

            </p>

            <p>

              <strong>Rotten Tomatoes:</strong>{" "}

              {item.rottenTomatoesRating ?? "Not available"}

            </p>

            <p>

              <strong>Cast:</strong>{" "}

              {Array.isArray(item.cast)

                ? item.cast.join(", ")

                : item.cast || "Not available"}

            </p>

            <p style={{ marginBottom: 0 }}>

              <strong>Added by:</strong>{" "}

              {item.addedBy || "Unknown"}

            </p>

          </div>

        ))

      )}

      {queue.length > 5 && (

        <button

          onClick={() => setShowAll(!showAll)}

          style={{

            padding: "10px 18px",

            fontSize: "16px",

            cursor: "pointer",

          }}

        >

          {showAll ? "Show Less" : "Show More"}

        </button>

      )}

    </main>

  );

}

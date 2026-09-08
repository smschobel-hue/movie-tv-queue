"use client";

import { useEffect, useState } from "react";

const starterQueue = [

  {

    id: 1,

    title: "The Godfather",

    type: "Movie",

    year: "1972",

    service: "Paramount+",

    addedBy: "Steve",

  },

  {

    id: 2,

    title: "Breaking Bad",

    type: "TV",

    year: "2008",

    service: "Netflix",

    addedBy: "Steve",

  },

];

export default function Home() {

  const [queue, setQueue] = useState([]);

  const [loaded, setLoaded] = useState(false);

  const [title, setTitle] = useState("");

  const [type, setType] = useState("Movie");

  const [year, setYear] = useState("");

  const [service, setService] = useState("");

  const [addedBy, setAddedBy] = useState("");

  // Load saved queue and saved user name

  useEffect(() => {

    const savedQueue = localStorage.getItem("movie-tv-queue");

    const savedName = localStorage.getItem("movie-tv-user-name");

    if (savedQueue) {

      try {

        setQueue(JSON.parse(savedQueue));

      } catch {

        setQueue(starterQueue);

      }

    } else {

      setQueue(starterQueue);

    }

    if (savedName) {

      setAddedBy(savedName);

    }

    setLoaded(true);

  }, []);

  // Save queue whenever it changes

  useEffect(() => {

    if (loaded) {

      localStorage.setItem("movie-tv-queue", JSON.stringify(queue));

    }

  }, [queue, loaded]);

  // Save the user's name on this device

  useEffect(() => {

    if (loaded && addedBy.trim()) {

      localStorage.setItem("movie-tv-user-name", addedBy.trim());

    }

  }, [addedBy, loaded]);

  function addItem(event) {

    event.preventDefault();

    if (!addedBy.trim()) {

      alert("Please enter your name.");

      return;

    }

    if (!title.trim()) {

      alert("Please enter a movie or TV title.");

      return;

    }

    const newItem = {

      id: Date.now(),

      title: title.trim(),

      type,

      year: year.trim(),

      service: service.trim(),

      addedBy: addedBy.trim(),

    };

    setQueue((currentQueue) => [newItem, ...currentQueue]);

    // Clear title information, but keep the person's name

    setTitle("");

    setType("Movie");

    setYear("");

    setService("");

  }

  function removeItem(id) {

    setQueue((currentQueue) =>

      currentQueue.filter((item) => item.id !== id)

    );

  }

  if (!loaded) {

    return null;

  }

  return (

    <main style={styles.page}>

      <div style={styles.container}>

        <h1 style={styles.heading}>🎬 Movie & TV Queue</h1>

        <p style={styles.subtitle}>

          Add movies and TV shows everyone wants to watch.

        </p>

        <form onSubmit={addItem} style={styles.form}>

          <input

            style={styles.input}

            type="text"

            placeholder="Your name"

            value={addedBy}

            onChange={(event) => setAddedBy(event.target.value)}

          />

          <input

            style={styles.input}

            type="text"

            placeholder="Movie or TV title"

            value={title}

            onChange={(event) => setTitle(event.target.value)}

          />

          <select

            style={styles.input}

            value={type}

            onChange={(event) => setType(event.target.value)}

          >

            <option value="Movie">Movie</option>

            <option value="TV">TV Series</option>

          </select>

          <input

            style={styles.input}

            type="text"

            placeholder="Year (optional)"

            value={year}

            onChange={(event) => setYear(event.target.value)}

          />

          <input

            style={styles.input}

            type="text"

            placeholder="Where to watch (optional)"

            value={service}

            onChange={(event) => setService(event.target.value)}

          />

          <button style={styles.addButton} type="submit">

            Add to Queue

          </button>

        </form>

        <h2 style={styles.queueHeading}>

          Watch Queue ({queue.length})

        </h2>

        {queue.length === 0 ? (

          <div style={styles.empty}>

            The queue is empty. Add something to watch!

          </div>

        ) : (

          <div style={styles.queue}>

            {queue.map((item, index) => (

              <div key={item.id} style={styles.card}>

                <div style={styles.number}>{index + 1}</div>

                <div style={styles.details}>

                  <h3 style={styles.title}>{item.title}</h3>

                  <div style={styles.meta}>

                    {item.type}

                    {item.year ? ` • ${item.year}` : ""}

                  </div>

                  {item.service && (

                    <div style={styles.service}>

                      Watch on: {item.service}

                    </div>

                  )}

                  <div style={styles.addedBy}>

                    Added by: {item.addedBy || "Unknown"}

                  </div>

                </div>

                <button

                  style={styles.removeButton}

                  onClick={() => removeItem(item.id)}

                >

                  Remove

                </button>

              </div>

            ))}

          </div>

        )}

      </div>

    </main>

  );

}

const styles = {

  page: {

    minHeight: "100vh",

    background: "#f4f6f8",

    padding: "30px 16px",

    fontFamily: "Arial, sans-serif",

  },

  container: {

    maxWidth: "850px",

    margin: "0 auto",

  },

  heading: {

    marginBottom: "5px",

    fontSize: "36px",

  },

  subtitle: {

    marginTop: "0",

    marginBottom: "25px",

    fontSize: "18px",

  },

  form: {

    background: "white",

    padding: "20px",

    borderRadius: "12px",

    marginBottom: "30px",

    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",

    display: "grid",

    gap: "12px",

  },

  input: {

    padding: "14px",

    fontSize: "17px",

    borderRadius: "8px",

    border: "1px solid #bbb",

  },

  addButton: {

    padding: "14px",

    fontSize: "18px",

    fontWeight: "bold",

    border: "none",

    borderRadius: "8px",

    background: "#1677ff",

    color: "white",

    cursor: "pointer",

  },

  queueHeading: {

    fontSize: "26px",

  },

  queue: {

    display: "grid",

    gap: "14px",

  },

  card: {

    background: "white",

    padding: "18px",

    borderRadius: "12px",

    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",

    display: "flex",

    alignItems: "center",

    gap: "16px",

  },

  number: {

    fontSize: "24px",

    fontWeight: "bold",

    minWidth: "30px",

  },

  details: {

    flex: 1,

  },

  title: {

    margin: "0 0 6px 0",

    fontSize: "22px",

  },

  meta: {

    fontSize: "16px",

    color: "#555",

    marginBottom: "5px",

  },

  service: {

    fontSize: "16px",

    marginBottom: "5px",

  },

  addedBy: {

    fontSize: "15px",

    fontWeight: "bold",

  },

  removeButton: {

    padding: "10px 14px",

    border: "none",

    borderRadius: "7px",

    background: "#d9342b",

    color: "white",

    fontSize: "15px",

    cursor: "pointer",

  },

  empty: {

    background: "white",

    padding: "25px",

    borderRadius: "12px",

    textAlign: "center",

    fontSize: "18px",

  },

};

import { useState } from "react";
import "./App.css";

const items = [
  { icon: "▶️", title: "Explore videos", desc: "Watch and discover media" },
  { icon: "📚", title: "Your library", desc: "Keep your media together" },
  { icon: "🌐", title: "Language dubbing", desc: "Understand media in your language" },
];

export default function App() {
  const [page, setPage] = useState("Home");
  const [file, setFile] = useState("");
  const [message, setMessage] = useState("");

  return (
    <main className="voicebox">
      <header className="vb-header">
        <div className="vb-brand"><span className="vb-logo">V</span><span>VoiceBox</span></div>
        <span className="vb-tag">Media without language barriers</span>
      </header>

      <nav className="vb-nav">
        {["Home", "Library", "Upload", "Dubbing"].map(n =>
          <button key={n} className={page === n ? "selected" : ""} onClick={() => {setPage(n); setMessage("");}}>{n}</button>
        )}
      </nav>

      {page === "Home" && <>
        <section className="vb-hero">
          <span className="vb-eyebrow">WELCOME TO VOICEBOX</span>
          <h1>Every voice.<br/>Every language.</h1>
          <p>Discover videos, audio and documents in one simple place.</p>
          <button className="vb-primary" onClick={() => setPage("Library")}>Explore library →</button>
          <div className="vb-orb">🎧</div>
        </section>
        <div className="vb-heading"><h2>Explore VoiceBox</h2><span>Made for everyone</span></div>
        <section className="vb-cards">
          {items.map(i => <article className="vb-card" key={i.title}>
            <div className="vb-icon">{i.icon}</div><h3>{i.title}</h3><p>{i.desc}</p>
            <button className="vb-secondary" onClick={() => setPage(i.title === "Your library" ? "Library" : i.title === "Language dubbing" ? "Dubbing" : "Library")}>Open</button>
          </article>)}
        </section>
      </>}

      {page === "Library" && <section className="vb-panel">
        <h1>Your media library</h1><p>Videos, audio, PDFs and images will appear here.</p>
        <div className="vb-empty">📂<h3>Your library starts here</h3><p>Upload media to begin. Real file storage is not connected yet.</p><button className="vb-primary" onClick={() => setPage("Upload")}>＋ Choose media</button></div>
      </section>}

      {page === "Upload" && <section className="vb-panel">
        <h1>Upload your media</h1><p>Choose a video, audio file, PDF or image from your device.</p>
        <label className="vb-upload"><span>☁️</span><strong>Choose a file</strong><input type="file" accept="video/*,audio/*,application/pdf,image/*" onChange={e => {setFile(e.target.files?.[0]?.name || "");setMessage("");}}/><small>{file || "Video · Audio · PDF · Images"}</small></label>
        <p className="vb-note">This preview can select a file, but server upload and permanent storage are not connected yet.</p>
        <button className="vb-primary" onClick={() => setMessage(file ? "File selected. Actual upload will be enabled when storage is connected." : "Please choose a file first.")}>Continue</button>
        {message && <p className="vb-message">{message}</p>}
      </section>}

      {page === "Dubbing" && <section className="vb-panel">
        <h1>Language dubbing</h1><p>Make media easier to understand.</p>
        <label>Original language<select><option>Auto detect (planned)</option><option>English</option><option>Hindi</option><option>Urdu</option></select></label>
        <label>Target language<select><option>Hindi</option><option>English</option><option>Urdu</option></select></label>
        <p className="vb-note">Speech recognition, translation and voice dubbing still need to be connected.</p>
        <button className="vb-primary" onClick={() => setMessage("The dubbing engine is not connected yet.")}>Prepare dubbing</button>
        {message && <p className="vb-message">{message}</p>}
      </section>}

      <footer className="vb-footer">VOICEBOX · EARLY BUILD</footer>
    </main>
  );
}

import { useState } from "react";
import "./App.css";

type Page = "Home" | "Library" | "Upload" | "Dubbing";

export default function App() {
  const [page, setPage] = useState<Page>("Home");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function upload() {
    if (!file) {
      setMessage("पहले अपने डिवाइस से फ़ाइल चुनें।");
      return;
    }
    const data = new FormData();
    data.append("file", file);
    setMessage("फ़ाइल अपलोड हो रही है...");
    try {
      const response = await fetch("/api/uploads", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "अपलोड असफल हुआ।");
      setMessage("अपलोड सफल: " + result.filename);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "अपलोड असफल हुआ।");
    }
  }

  return (
    <main className="voicebox">
      <header className="vb-header">
        <div className="vb-logo">▶ VoiceBox</div>
        <p>हर आवाज़, हर भाषा</p>
      </header>
      <nav className="vb-nav">
        {(["Home", "Library", "Upload", "Dubbing"] as Page[]).map((item) => (
          <button key={item} className={page === item ? "active" : ""} onClick={() => { setPage(item); setMessage(""); }}>
            {{Home:"होम", Library:"लाइब्रेरी", Upload:"अपलोड", Dubbing:"डबिंग"}[item]}
          </button>
        ))}
      </nav>

      {page === "Home" && (
        <section className="vb-hero">
          <span className="vb-tag">आपका मीडिया, आपकी भाषा</span>
          <h1>देखें, सुनें और समझें।</h1>
          <p>वीडियो, ऑडियो, PDF और तस्वीरों के लिए एक जगह।</p>
          <button className="vb-primary" onClick={() => setPage("Upload")}>अपना मीडिया जोड़ें →</button>
          <div className="vb-features">
            <article><span>🎬</span><h3>वीडियो</h3><p>अपने वीडियो व्यवस्थित करें।</p></article>
            <article><span>📚</span><h3>लाइब्रेरी</h3><p>अपनी मीडिया फ़ाइलों की जगह।</p></article>
            <article><span>🌐</span><h3>भाषा डबिंग</h3><p>भविष्य के भाषा टूल का प्रवेश।</p></article>
          </div>
        </section>
      )}

      {page === "Library" && (
        <section className="vb-panel">
          <h1>आपकी लाइब्रेरी</h1>
          <p>अपलोड की गई फ़ाइलों को यहाँ दिखाने के लिए स्थायी लाइब्रेरी और डेटाबेस जोड़ना अगला चरण है।</p>
          <button className="vb-primary" onClick={() => setPage("Upload")}>फ़ाइल अपलोड करें</button>
        </section>
      )}

      {page === "Upload" && (
        <section className="vb-panel">
          <h1>अपना मीडिया अपलोड करें</h1>
          <p>अपने फ़ोन या कंप्यूटर से वीडियो, ऑडियो, PDF या तस्वीर चुनें।</p>
          <label className="vb-upload">
            <span>＋ फ़ाइल चुनने के लिए यहाँ दबाएँ</span>
            <input type="file" accept="video/*,audio/*,application/pdf,image/*" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setMessage(""); }} />
          </label>
          {file && <p>चुनी गई फ़ाइल: <strong>{file.name}</strong></p>}
          <button className="vb-primary" onClick={upload}>अपलोड करें</button>
          <p className="vb-note">अपलोड के लिए बैकएंड सर्वर चालू होना चाहिए।</p>
          {message && <p className="vb-message">{message}</p>}
        </section>
      )}

      {page === "Dubbing" && (
        <section className="vb-panel">
          <h1>भाषा डबिंग</h1>
          <p>अपनी पसंद की भाषा में मीडिया समझने की सुविधा।</p>
          <label>मूल भाषा
            <select><option>अपने आप पहचानें</option><option>हिंदी</option><option>English</option><option>اردو</option></select>
          </label>
          <label>लक्ष्य भाषा
            <select><option>हिंदी</option><option>English</option><option>اردو</option></select>
          </label>
          <p className="vb-note">वास्तविक ट्रांसक्रिप्शन और आवाज़ में डबिंग इंजन अभी कनेक्ट नहीं है।</p>
        </section>
      )}
      <footer className="vb-footer">VOICEBOX · शुरुआती संस्करण</footer>
    </main>
  );
}

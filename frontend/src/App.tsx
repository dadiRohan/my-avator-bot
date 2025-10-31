// src/App.tsx
import React, { useEffect, useState, Suspense } from "react";
import Avatar from "./Avatar";

/* --------------------------------------------------------------
   Tiny error‑boundary – keeps the whole UI alive if the avatar crashes
   -------------------------------------------------------------- */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    console.error("❌ Avatar crashed:", error, info);
  }
  render() {
    return this.state.hasError ? (
      <div style={{ padding: "2rem", color: "#f88" }}>
        <h2>⚠️ Avatar failed to load</h2>
        <p>Open the browser console (F12) for the exact error.</p>
      </div>
    ) : (
      this.props.children
    );
  }
}

/* --------------------------------------------------------------
   Main UI
   -------------------------------------------------------------- */
export default function App() {
  /* --------‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑‑ */
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [question, setQuestion] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [visemes, setVisemes] = useState<Array<{ time: number; value: string }>>([]);
  const [status, setStatus] = useState("🟢 Idle");

  /* ---------------------------------------------------------
     1️⃣  Open a **plain** WebSocket to the FastAPI endpoint
     --------------------------------------------------------- */
  useEffect(() => {
    // Use IPv4 (127.0.0.1) – on Windows it avoids the rare localhost‑IPv6 issue.
    const socket = new WebSocket("ws://127.0.0.1:8000/ws");

    socket.onopen = () => {
      console.log("✅ WS opened");
      setStatus("✅ Connected to backend");
    };
    socket.onclose = (ev) => {
      console.warn("⚪ WS closed", ev);
      setStatus("⚪ Disconnected");
    };
    socket.onerror = (ev) => {
      console.error("❌ WS error", ev);
      setStatus("❌ WebSocket error");
    };
    socket.onmessage = (ev) => {
      // The server sends a JSON string for every answer.
      try {
        const payload = JSON.parse(ev.data);
        console.log("🔁 WS payload →", payload);
        setAudioUrl(payload.audioUrl);
        setVisemes(payload.visemes);
        setStatus("🔊 Received reply");
      } catch (e) {
        console.error("⚠️ Failed to parse WS message:", e);
      }
    };

    setWs(socket);
    // Clean‑up when the component unmounts
    return () => socket.close();
  }, []);

  /* ---------------------------------------------------------
     2️⃣  Send a question when the user clicks “Send”
     --------------------------------------------------------- */
  const ask = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("WS not ready – cannot send");
      setStatus("⚠️ Not connected yet");
      return;
    }
    if (!question.trim()) return;

    console.log("➡️ Sending:", question.trim());
    ws.send(question.trim());

    setStatus("⏳ Sending…");
    setQuestion("");
    setAudioUrl("");
    setVisemes([]);
  };

  /* ---------------------------------------------------------
     3️⃣  Play the audio as soon as the MP3 URL appears
     --------------------------------------------------------- */
  const audioRef = React.useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current
        .play()
        .catch((e) => console.warn("Audio play error:", e));
    }
  }, [audioUrl]);

  /* ---------------------------------------------------------
     4️⃣  Render the page
     --------------------------------------------------------- */
  return (
    <div style={{ height: "100vh", background: "#111", color: "#eee" }}>
      {/* ----- 3‑D avatar (wrapped in Suspense + ErrorBoundary) ----- */}
      <Suspense fallback={<div style={{ padding: "2rem" }}>⏳ Loading avatar…</div>}>
        <ErrorBoundary>
          {/* ✅ Change the model URL if you stored a different GLB locally.
              Example: "/my-avatar.glb" if you placed it in frontend/public/ */}
          {/* <Avatar
            modelUrl="/models/duck.glb"   // <-- note the leading slash (served from /public)
            visemes={visemes}
          /> */}
          <Avatar
            modelUrl="https://models.readyplayer.me/69047c3fbb57bea51a088b9f.glb"
            visemes={visemes}
          />
        </ErrorBoundary>
      </Suspense>

      {/* ----- chat input ----- */}
      <div
        className="chat"
        style={{
          position: "absolute",
          bottom: "1rem",
          left: "1rem",
          right: "1rem",
          display: "flex",
          gap: "0.5rem",
        }}>
        <input
          placeholder="Ask the avatar anything…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          style={{ flex: 1, padding: "0.5rem", fontSize: "1rem" }}
        />
        <button onClick={ask} style={{ padding: "0.5rem 1rem" }}>
          Send
        </button>
      </div>

      {/* ----- status banner (top‑left) ----- */}
      <div
        style={{
          position: "absolute",
          top: "0.5rem",
          left: "1rem",
          background: "rgba(0,0,0,0.6)",
          padding: "0.4rem 0.8rem",
          borderRadius: "4px",
          fontFamily: "monospace",
        }}>
        {status}
      </div>

      {/* ----- hidden audio element (only for playback) ----- */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} crossOrigin="anonymous" />
      )}
    </div>
  );
}

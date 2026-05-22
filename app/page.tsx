"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HOST_SESSION_KEY } from "@/lib/host-auth";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [tab, setTab] = useState<"join" | "host" | "resume">("join");
  const [hostName, setHostName] = useState("");
  const [hostCode, setHostCode] = useState("");
  const [hostPassword, setHostPassword] = useState("");
  const [resumeCode, setResumeCode] = useState("");
  const [resumePassword, setResumePassword] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [playerNickname, setPlayerNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function saveHostSession(code: string, password: string) {
    sessionStorage.setItem(HOST_SESSION_KEY(code), password);
  }

  async function handleHost() {
    if (!hostName.trim()) return setError("Enter a game name");
    if (!hostPassword.trim() || hostPassword.length < 4) {
      return setError("Set a host password (at least 4 characters)");
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: hostName.trim(),
        code: hostCode.trim() || undefined,
        password: hostPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) return (setError(data.error), setLoading(false));
    saveHostSession(data.code, hostPassword);
    router.push(`/room/${data.code}`);
  }

  async function handleResume() {
    if (!resumeCode.trim() || !resumePassword) {
      return setError("Enter room code and host password");
    }
    setLoading(true);
    setError("");
    const code = resumeCode.trim().toUpperCase();
    const res = await fetch("/api/rooms/host", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, password: resumePassword }),
    });
    const data = await res.json();
    if (!res.ok) return (setError(data.error), setLoading(false));
    saveHostSession(code, resumePassword);
    router.push(`/room/${code}`);
  }

  async function handleJoin() {
    if (!joinCode.trim() || !playerEmail.trim() || !playerNickname.trim()) {
      return setError("Enter email, nickname, and room code");
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomCode: joinCode.trim().toUpperCase(),
        email: playerEmail.trim(),
        nickname: playerNickname.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) return (setError(data.error), setLoading(false));
    router.push(`/play/${data.roomCode}/${data.id}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-x-hidden checkered">
      {/* Background gradient */}
      <div
        className="font-malam absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,69,0,0.18) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="relative py-2">
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
              style={{
                fontSize: "clamp(7rem, 28vw, 11rem)",
                lineHeight: 1,
                opacity: 0.45,
                zIndex: 0,
              }}
              aria-hidden
            >
              🍕
            </div>
            <div
              className="relative leading-none"
              style={{
                zIndex: 1,
                textShadow: "0 4px 20px rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.5)",
              }}
            >
              <h1
                className="font-malam uppercase tracking-wider m-0"
                style={{ color: "var(--pizza-orange)", fontSize: "clamp(3rem, 18vw, 5rem)", lineHeight: 0.9 }}
              >
                Pizza
              </h1>
              <h2
                className="font-malam tracking-widest uppercase m-0 -mt-1"
                style={{ color: "var(--pizza-cream)", fontSize: "clamp(3rem, 18vw, 5rem)", lineHeight: 0.9 }}
              >
                Bingo
              </h2>
            </div>
          </div>
          <p className="text-xs tracking-widest mt-2 uppercase" style={{ color: "var(--pizza-muted)" }}>
            Global Pizza Party · Multiplayer
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex mb-6" style={{ border: "2px solid var(--pizza-border)" }}>
          {(["join", "host", "resume"] as const).map((t, i) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className="font-malam flex-1 py-3 text-sm tracking-widest uppercase transition-all"
              style={{
                fontSize: "0.95rem",
                background: tab === t ? "var(--pizza-orange)" : "transparent",
                color: tab === t ? "#fff" : "var(--pizza-muted)",
                borderLeft: i > 0 ? "2px solid var(--pizza-border)" : undefined,
              }}
            >
              {t === "join" ? "Join" : t === "host" ? "Host" : "Resume"}
            </button>
          ))}
        </div>

        {/* Forms */}
        <div className="card-surface p-6 space-y-4">
          {tab === "join" ? (
            <>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                  Email
                </label>
                <input
                  className="input-pizza"
                  type="email"
                  placeholder="you@example.com"
                  value={playerEmail}
                  onChange={(e) => setPlayerEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                  Nickname
                </label>
                <input
                  className="input-pizza"
                  placeholder="e.g. Satoshi Pizza"
                  value={playerNickname}
                  onChange={(e) => setPlayerNickname(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                  Room Code
                </label>
                <input
                  className="input-pizza uppercase"
                  placeholder="e.g. PIZZA9"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
              </div>
              <button
                className="btn-primary w-full justify-center"
                onClick={handleJoin}
                disabled={loading}
              >
                {loading ? "Joining..." : "🍕 Join Bingo"}
              </button>
            </>
          ) : tab === "host" ? (
            <>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                  Game / Event Name
                </label>
                <input
                  className="input-pizza"
                  placeholder="e.g. Global Pizza Party NYC"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                  Room Code <span className="normal-case">(optional)</span>
                </label>
                <input
                  className="input-pizza uppercase"
                  placeholder="Auto-generated if empty"
                  value={hostCode}
                  onChange={(e) => setHostCode(e.target.value.toUpperCase())}
                  maxLength={8}
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                  Host Password
                </label>
                <input
                  className="input-pizza"
                  type="password"
                  placeholder="Save this to resume hosting"
                  value={hostPassword}
                  onChange={(e) => setHostPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleHost()}
                />
              </div>
              <button
                className="btn-primary w-full justify-center"
                onClick={handleHost}
                disabled={loading}
              >
                {loading ? "Creating..." : "🎉 Create Room"}
              </button>
              <p className="text-xs text-center" style={{ color: "var(--pizza-muted)" }}>
                Use Resume with your code + password if you leave this page.
              </p>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                  Room Code
                </label>
                <input
                  className="input-pizza uppercase"
                  placeholder="e.g. PIZZA9"
                  value={resumeCode}
                  onChange={(e) => setResumeCode(e.target.value.toUpperCase())}
                  maxLength={8}
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                  Host Password
                </label>
                <input
                  className="input-pizza"
                  type="password"
                  placeholder="Password you set when creating"
                  value={resumePassword}
                  onChange={(e) => setResumePassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResume()}
                />
              </div>
              <button
                className="btn-primary w-full justify-center"
                onClick={handleResume}
                disabled={loading}
              >
                {loading ? "Opening..." : "📺 Resume Host Dashboard"}
              </button>
            </>
          )}

          {error && (
            <p className="text-sm text-center" style={{ color: "var(--pizza-red)" }}>
              ⚠ {error}
            </p>
          )}
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: "var(--pizza-muted)" }}>
          Pizza Bingo · globalpizza.party
        </p>
      </div>
    </main>
  );
}

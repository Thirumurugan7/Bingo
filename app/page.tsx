"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [tab, setTab] = useState<"join" | "host">("join");
  const [hostName, setHostName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleHost() {
    if (!hostName.trim()) return setError("Enter a game name");
    setLoading(true);
    setError("");
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: hostName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) return (setError(data.error), setLoading(false));
    router.push(`/room/${data.code}`);
  }

  async function handleJoin() {
    if (!joinCode.trim() || !playerName.trim()) return setError("Enter your name and room code");
    setLoading(true);
    setError("");
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode: joinCode.trim().toUpperCase(), name: playerName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) return (setError(data.error), setLoading(false));
    router.push(`/play/${data.roomCode}/${data.id}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-x-hidden checkered">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,69,0,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🍕</div>
          <h1
            className="uppercase tracking-wider"
            style={{ fontFamily: "Bebas Neue, cursive", color: "var(--pizza-orange)", fontSize: "clamp(3rem, 18vw, 5rem)" }}
          >
            PizzaDAO
          </h1>
          <h2
            className="tracking-widest uppercase"
            style={{ fontFamily: "Bebas Neue, cursive", color: "var(--pizza-cream)", fontSize: "clamp(2rem, 10vw, 3rem)" }}
          >
            Bingo
          </h2>
          <p className="text-xs tracking-widest mt-2 uppercase" style={{ color: "var(--pizza-muted)" }}>
            Global Pizza Party · Multiplayer
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex mb-6" style={{ border: "2px solid var(--pizza-border)" }}>
          <button
            onClick={() => { setTab("join"); setError(""); }}
            className="flex-1 py-3 text-sm tracking-widest uppercase transition-all"
            style={{
              fontFamily: "Bebas Neue, cursive",
              fontSize: "1.1rem",
              background: tab === "join" ? "var(--pizza-orange)" : "transparent",
              color: tab === "join" ? "#fff" : "var(--pizza-muted)",
            }}
          >
            Join Game
          </button>
          <button
            onClick={() => { setTab("host"); setError(""); }}
            className="flex-1 py-3 text-sm tracking-widest uppercase transition-all"
            style={{
              fontFamily: "Bebas Neue, cursive",
              fontSize: "1.1rem",
              background: tab === "host" ? "var(--pizza-orange)" : "transparent",
              color: tab === "host" ? "#fff" : "var(--pizza-muted)",
              borderLeft: "2px solid var(--pizza-border)",
            }}
          >
            Host Game
          </button>
        </div>

        {/* Forms */}
        <div className="card-surface p-6 space-y-4">
          {tab === "join" ? (
            <>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                  Your Name
                </label>
                <input
                  className="input-pizza"
                  placeholder="e.g. Satoshi Pizza"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
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
                  maxLength={6}
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
          ) : (
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
            </>
          )}

          {error && (
            <p className="text-sm text-center" style={{ color: "var(--pizza-red)" }}>
              ⚠ {error}
            </p>
          )}
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: "var(--pizza-muted)" }}>
          By PizzaDAO · globalpizza.party
        </p>
      </div>
    </main>
  );
}

"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    if (!name.trim()) return setError("Enter your name");
    setLoading(true);
    setError("");
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode: code.toUpperCase(), name: name.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    router.push(`/play/${data.roomCode}/${data.id}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center checkered">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,69,0,0.18) 0%, transparent 70%)" }}
      />
      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🍕</div>
          <h1
            className="text-6xl uppercase tracking-wider"
            style={{ fontFamily: "Bebas Neue, cursive", color: "var(--pizza-orange)" }}
          >
            Join Game
          </h1>
          <div
            className="text-3xl tracking-widest mt-2"
            style={{ fontFamily: "Bebas Neue, cursive", color: "var(--pizza-gold)" }}
          >
            {code.toUpperCase()}
          </div>
        </div>

        <div className="card-surface p-6 space-y-4">
          <div>
            <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
              Your Name
            </label>
            <input
              className="input-pizza"
              placeholder="e.g. Satoshi Pizza"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
          </div>
          <button className="btn-primary w-full justify-center" onClick={handleJoin} disabled={loading}>
            {loading ? "Joining..." : "🎉 Get My Bingo Card"}
          </button>
          {error && (
            <p className="text-sm text-center" style={{ color: "var(--pizza-red)" }}>⚠ {error}</p>
          )}
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: "var(--pizza-muted)" }}>
          Global Pizza Party · PizzaDAO
        </p>
      </div>
    </main>
  );
}

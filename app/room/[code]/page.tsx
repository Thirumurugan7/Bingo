"use client";

import { useEffect, useState, useCallback, use } from "react";
import QRCode from "qrcode";
import { HOST_SESSION_KEY } from "@/lib/host-auth";

type Quest = { id: string; title: string; description: string; url: string | null };
type Player = {
  id: string;
  name: string;
  email?: string;
  number: number;
  hasBingo: boolean;
  crossedOff: string;
  connections: { target: { name: string; number: number } }[];
  questCompletions: { quest: Quest }[];
};
type Room = {
  id: string;
  code: string;
  name: string;
  status: string;
  requiresHostPassword?: boolean;
  players: Player[];
  quests: Quest[];
};

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [room, setRoom] = useState<Room | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [hostPassword, setHostPassword] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [gatePassword, setGatePassword] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState("");
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [questTitle, setQuestTitle] = useState("");
  const [questDescription, setQuestDescription] = useState("");
  const [questUrl, setQuestUrl] = useState("");
  const [questSaving, setQuestSaving] = useState(false);
  const [questError, setQuestError] = useState("");

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join/${code}` : "";

  const fetchRoom = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}`);
    if (!res.ok) return null;
    const data: Room = await res.json();
    setRoom(data);
    return data;
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = sessionStorage.getItem(HOST_SESSION_KEY(code));
      const data = await fetchRoom();
      if (cancelled) return;
      if (!data?.requiresHostPassword) {
        setHostPassword(stored ?? "");
      } else if (stored) {
        setHostPassword(stored);
      }
      setAuthChecked(true);
    })();
    return () => { cancelled = true; };
  }, [code, fetchRoom]);

  useEffect(() => {
    if (!authChecked || hostPassword === null) return;
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [fetchRoom, hostPassword, authChecked]);

  async function unlockHost() {
    if (!gatePassword) return setGateError("Enter your host password");
    setGateLoading(true);
    setGateError("");
    const res = await fetch("/api/rooms/host", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.toUpperCase(), password: gatePassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setGateError(data.error ?? "Invalid password");
      setGateLoading(false);
      return;
    }
    sessionStorage.setItem(HOST_SESSION_KEY(code), gatePassword);
    setHostPassword(gatePassword);
    setGateLoading(false);
  }

  useEffect(() => {
    if (!joinUrl) return;
    QRCode.toDataURL(joinUrl, { width: 280, margin: 2, color: { dark: "#0a0a0a", light: "#fff3e0" } })
      .then(setQrUrl)
      .catch(console.error);
  }, [joinUrl]);

  async function handleAddQuest() {
    if (!questTitle.trim() || !questDescription.trim()) {
      return setQuestError("Title and description required");
    }
    setQuestSaving(true);
    setQuestError("");
    const res = await fetch(`/api/rooms/${code}/quests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: hostPassword,
        title: questTitle.trim(),
        description: questDescription.trim(),
        url: questUrl.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setQuestError(data.error ?? "Failed to add quest");
      setQuestSaving(false);
      return;
    }
    setRoom(data);
    setQuestTitle("");
    setQuestDescription("");
    setQuestUrl("");
    setShowAddQuest(false);
    setQuestSaving(false);
  }

  async function handleStart() {
    if (room?.requiresHostPassword && !hostPassword) return setError("Host password required");
    setStarting(true);
    setError("");
    const res = await fetch(`/api/rooms/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: hostPassword }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setStarting(false); return; }
    setRoom(data);
    fetchRoom();
    setStarting(false);
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍕</div>
          <p className="font-malam text-xl tracking-widest uppercase" style={{color: "var(--pizza-muted)" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (hostPassword === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--pizza-black)" }}>
        <div className="card-surface p-6 w-full max-w-sm space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🔐</div>
            <h1 className="font-malam text-2xl uppercase tracking-widest" style={{ color: "var(--pizza-orange)" }}>
              Host Access
            </h1>
            <p className="text-xs mt-2 uppercase tracking-widest" style={{ color: "var(--pizza-muted)" }}>
              Room {code.toUpperCase()}
            </p>
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
              Host Password
            </label>
            <input
              className="input-pizza"
              type="password"
              placeholder="Password from when you created the room"
              value={gatePassword}
              onChange={(e) => setGatePassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlockHost()}
            />
          </div>
          {gateError && (
            <p className="text-sm text-center" style={{ color: "var(--pizza-red)" }}>⚠ {gateError}</p>
          )}
          <button className="btn-primary w-full justify-center" onClick={unlockHost} disabled={gateLoading}>
            {gateLoading ? "Checking..." : "Unlock Dashboard"}
          </button>
          <p className="text-xs text-center" style={{ color: "var(--pizza-muted)" }}>
            Or use Resume on the home page with your code + password.
          </p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍕</div>
          <p className="font-malam text-xl tracking-widest uppercase" style={{color: "var(--pizza-muted)" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  const bingoWinners = (room.players ?? []).filter((p) => p.hasBingo);

  return (
    <main className="min-h-screen p-4 md:p-8" style={{ background: "var(--pizza-black)" }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🍕</span>
              <h1
                className="font-malam uppercase tracking-wide"
                style={{color: "var(--pizza-orange)", fontSize: "clamp(1.8rem, 8vw, 3rem)" }}
              >
                Host Dashboard
              </h1>
            </div>
            <p className="text-sm" style={{ color: "var(--pizza-muted)" }}>
              {room.name}
            </p>
          </div>
          <div className="text-right">
            <div
              className="font-malam font-bold tracking-widest"
              style={{color: "var(--pizza-gold)", fontSize: "clamp(1.5rem, 8vw, 2.5rem)" }}
            >
              {code}
            </div>
            <div
              className="font-malam text-xs tracking-widest uppercase px-2 py-1 inline-block mt-1"
              style={{
                background: room.status === "active" ? "rgba(255,69,0,0.2)" : "rgba(136,136,136,0.2)",
                color: room.status === "active" ? "var(--pizza-orange)" : "var(--pizza-muted)",
                border: `1px solid ${room.status === "active" ? "var(--pizza-orange)" : "var(--pizza-border)"}` }}
            >
              {room.status === "waiting" ? "⏳ Waiting" : room.status === "active" ? "🔥 Live" : "✅ Ended"}
            </div>
          </div>
        </div>

        {/* Bingo alert */}
        {bingoWinners.length > 0 && (
          <div
            className="mb-6 p-4 text-center"
            style={{
              background: "rgba(255,179,0,0.15)",
              border: "2px solid var(--pizza-gold)" }}
          >
            <div className="text-4xl mb-1">🎉</div>
            <div
              className="font-malam text-2xl uppercase tracking-widest"
              style={{color: "var(--pizza-gold)" }}
            >
              BINGO! {bingoWinners.map((w) => w.name).join(", ")} won!
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* QR Code panel */}
          <div className="card-surface p-5 flex flex-col items-center">
            <h2
              className="font-malam text-xl uppercase tracking-widest mb-4 w-full"
              style={{color: "var(--pizza-cream)" }}
            >
              Scan to Join
            </h2>
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Join QR"
                className="w-full max-w-[220px]"
                style={{ imageRendering: "crisp-edges" }}
              />
            ) : (
              <div className="w-full max-w-[220px] aspect-square flex items-center justify-center" style={{ background: "var(--pizza-surface)" }}>
                <span style={{ color: "var(--pizza-muted)" }}>...</span>
              </div>
            )}
            <div
              className="font-malam mt-4 text-3xl text-center tracking-widest font-bold"
              style={{color: "var(--pizza-gold)" }}
            >
              {code}
            </div>
            <p className="font-mono text-xs mt-2 text-center break-all" style={{ color: "var(--pizza-muted)" }}>
              {joinUrl}
            </p>
          </div>

          {/* Players list */}
          <div className="card-surface p-5 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2
                className="font-malam text-xl uppercase tracking-widest"
                style={{color: "var(--pizza-cream)" }}
              >
                Players ({room.players.length})
              </h2>
              {room.status === "waiting" && (
                <button
                  className="font-malam btn-primary py-2 px-4 text-base"
                  onClick={handleStart}
                  disabled={starting || room.players.length < 2}
                  style={{ opacity: room.players.length < 2 ? 0.5 : 1 }}
                >
                  {starting ? "Starting..." : "🚀 Start Game"}
                </button>
              )}
            </div>
            {error && (
              <p className="text-sm mb-3" style={{ color: "var(--pizza-red)" }}>⚠ {error}</p>
            )}
            {room.players.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-5xl mb-3">👀</div>
                <p className="text-sm tracking-widest uppercase" style={{ color: "var(--pizza-muted)" }}>
                  Waiting for players to join...
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {room.players.map((player) => {
                  const crossedOff: number[] = JSON.parse(player.crossedOff || "[]");
                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3"
                      style={{
                        background: player.hasBingo ? "rgba(255,179,0,0.1)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${player.hasBingo ? "var(--pizza-gold)" : "var(--pizza-border)"}` }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="font-malam text-xl font-bold w-10 h-10 flex items-center justify-center"
                          style={{background: "var(--pizza-orange)",
                            color: "#fff",
                          }}
                        >
                          {player.number}
                        </span>
                        <div>
                          <div className="font-malam font-bold text-sm" style={{ color: "var(--pizza-cream)" }}>
                            {player.name} {player.hasBingo && "🏆"}
                          </div>
                          {player.email && (
                            <div className="text-xs truncate max-w-[180px]" style={{ color: "var(--pizza-muted)" }}>
                              {player.email}
                            </div>
                          )}
                          <div className="text-xs" style={{ color: "var(--pizza-muted)" }}>
                            {player.connections.length} connections · {crossedOff.length} crossed off
                          </div>
                        </div>
                      </div>
                      <div className="text-xs" style={{ color: "var(--pizza-muted)" }}>
                        {player.questCompletions.length} quests
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quests */}
        <div className="mt-6 card-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2
              className="font-malam text-xl uppercase tracking-widest"
              style={{color: "var(--pizza-cream)" }}
            >
              Quests ({room.quests.length})
            </h2>
            <button
              type="button"
              className="font-malam py-2 px-4 text-sm tracking-widest uppercase"
              style={{
                border: "2px solid var(--pizza-orange)",
                color: "var(--pizza-orange)",
                background: showAddQuest ? "rgba(255,69,0,0.15)" : "transparent",
              }}
              onClick={() => {
                setShowAddQuest((v) => !v);
                setQuestError("");
              }}
            >
              {showAddQuest ? "Cancel" : "+ Add Quest"}
            </button>
          </div>

          {showAddQuest && (
            <div
              className="mb-4 p-4 space-y-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--pizza-border)" }}
            >
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                  Title
                </label>
                <input
                  className="input-pizza"
                  placeholder="e.g. Take a group photo"
                  value={questTitle}
                  onChange={(e) => setQuestTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                  Description
                </label>
                <input
                  className="input-pizza"
                  placeholder="What players need to do"
                  value={questDescription}
                  onChange={(e) => setQuestDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                  Link <span className="normal-case">(optional)</span>
                </label>
                <input
                  className="input-pizza"
                  placeholder="https://..."
                  value={questUrl}
                  onChange={(e) => setQuestUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddQuest()}
                />
              </div>
              {questError && (
                <p className="text-sm" style={{ color: "var(--pizza-red)" }}>⚠ {questError}</p>
              )}
              <button
                type="button"
                className="btn-primary py-2 px-4"
                onClick={handleAddQuest}
                disabled={questSaving}
              >
                {questSaving ? "Adding..." : "Add Quest"}
              </button>
            </div>
          )}

          {room.quests.length === 0 ? (
            <p className="text-sm tracking-widest uppercase text-center py-6" style={{ color: "var(--pizza-muted)" }}>
              No quests yet — add one for players to complete
            </p>
          ) : (
            <div className="font-mono grid grid-cols-1 md:grid-cols-2 gap-3">
              {room.quests.map((q) => (
                <div
                  key={q.id}
                  className="p-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--pizza-border)" }}
                >
                  <div className="font-bold text-sm" style={{ color: "var(--pizza-gold)" }}>
                    {q.title}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--pizza-muted)" }}>
                    {q.description}
                  </div>
                  {q.url && (
                    <p className="text-xs mt-2 truncate" style={{ color: "var(--pizza-orange)" }}>
                      {q.url}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

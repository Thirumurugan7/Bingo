"use client";

import { useEffect, useState, useCallback, use } from "react";
import QRCode from "qrcode";

type Quest = { id: string; title: string; description: string; url: string | null };
type Connection = { target: { id: string; name: string; number: number }; note: string };
type QuestCompletion = { quest: Quest };
type Room = { id: string; code: string; name: string; status: string };
type Player = {
  id: string;
  name: string;
  number: number;
  bingoCard: string;
  crossedOff: string;
  hasBingo: boolean;
  room: Room & { quests: Quest[] };
  connections: Connection[];
  questCompletions: QuestCompletion[];
};

type Modal = "connect" | "quests" | "card" | null;

export default function PlayPage({ params }: { params: Promise<{ code: string; playerId: string }> }) {
  const { code, playerId } = use(params);
  const [player, setPlayer] = useState<Player | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [myQr, setMyQr] = useState("");
  const [targetNumber, setTargetNumber] = useState("");
  const [note, setNote] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [connectSuccess, setConnectSuccess] = useState("");
  const [questLoading, setQuestLoading] = useState<string | null>(null);
  const [justBingo, setJustBingo] = useState(false);

  const fetchPlayer = useCallback(async () => {
    const res = await fetch(`/api/players/${playerId}`);
    if (!res.ok) return;
    const data: Player = await res.json();
    setPlayer((prev) => {
      if (prev && !prev.hasBingo && data.hasBingo) setJustBingo(true);
      return data;
    });
  }, [playerId]);

  useEffect(() => {
    fetchPlayer();
    const interval = setInterval(fetchPlayer, 3000);
    return () => clearInterval(interval);
  }, [fetchPlayer]);

  useEffect(() => {
    if (!player) return;
    const label = `${player.name} — #${player.number}`;
    QRCode.toDataURL(label, { width: 200, margin: 1, color: { dark: "#0a0a0a", light: "#fff3e0" } })
      .then(setMyQr)
      .catch(() => {});
  }, [player?.number, player?.name]);

  async function handleConnect() {
    setConnecting(true);
    setConnectError("");
    setConnectSuccess("");
    const res = await fetch("/api/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, targetNumber: Number(targetNumber), note }),
    });
    const data = await res.json();
    setConnecting(false);
    if (!res.ok) { setConnectError(data.error); return; }
    setConnectSuccess(`✓ Crossed off #${targetNumber}! ${data.hasBingo ? "🎉 BINGO!" : ""}`);
    setTargetNumber("");
    setNote("");
    fetchPlayer();
  }

  async function handleQuestComplete(questId: string) {
    setQuestLoading(questId);
    const res = await fetch("/api/quests/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, questId }),
    });
    setQuestLoading(null);
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    fetchPlayer();
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3">🍕</div>
          <p className="tracking-widest uppercase" style={{ fontFamily: "Bebas Neue, cursive", color: "var(--pizza-muted)" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  const card: number[][] = player.bingoCard ? JSON.parse(player.bingoCard) : [];
  const crossedOff: number[] = player.crossedOff ? JSON.parse(player.crossedOff) : [];
  const crossedSet = new Set([...crossedOff, 0]);
  const completedQuestIds = new Set(player.questCompletions.map((qc) => qc.quest.id));
  const waiting = player.room.status === "waiting";

  return (
    <main
      style={{
        background: "var(--pizza-black)",
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      {/* Bingo celebration overlay */}
      {justBingo && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={() => setJustBingo(false)}
        >
          <div className="text-8xl mb-4">🎉</div>
          <div
            className="text-7xl uppercase tracking-wider text-center"
            style={{ fontFamily: "Bebas Neue, cursive", color: "var(--pizza-gold)" }}
          >
            BINGO!
          </div>
          <p className="mt-4 text-lg" style={{ color: "var(--pizza-cream)" }}>
            You got bingo, {player.name}! 🍕
          </p>
          <p className="mt-8 text-sm" style={{ color: "var(--pizza-muted)" }}>tap to dismiss</p>
        </div>
      )}

      {/* Header — fixed at top */}
      <div
        className="flex-shrink-0 px-4 py-3 flex items-center justify-between"
        style={{ background: "var(--pizza-dark)", borderBottom: "1px solid var(--pizza-border)" }}
      >
        <div className="min-w-0 flex-1 mr-3">
          <div
            className="uppercase tracking-widest truncate"
            style={{ fontFamily: "Bebas Neue, cursive", color: "var(--pizza-orange)", fontSize: "clamp(1.2rem, 6vw, 1.8rem)" }}
          >
            🍕 PizzaDAO Bingo
          </div>
          <div className="text-xs truncate" style={{ color: "var(--pizza-muted)" }}>
            {player.room.name} · {code}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div
            className="font-bold"
            style={{ fontFamily: "Bebas Neue, cursive", color: "var(--pizza-gold)", fontSize: "clamp(1.5rem, 8vw, 2.2rem)" }}
          >
            #{player.number}
          </div>
          <div className="text-xs" style={{ color: "var(--pizza-muted)" }}>{player.name}</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <div className="w-full max-w-lg mx-auto px-3 pt-4 pb-4 space-y-4">

        {/* Waiting state */}
        {waiting && (
          <div
            className="p-4 text-center"
            style={{ background: "rgba(255,179,0,0.08)", border: "1px solid var(--pizza-gold)" }}
          >
            <div className="text-2xl mb-1">⏳</div>
            <div
              className="text-lg uppercase tracking-widest"
              style={{ fontFamily: "Bebas Neue, cursive", color: "var(--pizza-gold)" }}
            >
              Waiting for host to start
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--pizza-muted)" }}>
              Your number is <strong style={{ color: "var(--pizza-orange)" }}>#{player.number}</strong> — share it with others!
            </p>
          </div>
        )}

        {/* My Card — identity */}
        <div className="card-surface p-4">
          <h2
            className="text-xs tracking-widest uppercase mb-3"
            style={{ color: "var(--pizza-muted)", fontFamily: "Bebas Neue, cursive", fontSize: "0.9rem" }}
          >
            My Player Card
          </h2>
          <div className="flex items-center gap-3">
            <div
              className="flex-shrink-0 flex items-center justify-center font-bold"
              style={{
                fontFamily: "Bebas Neue, cursive",
                background: "var(--pizza-orange)",
                color: "#fff",
                fontSize: "clamp(1.6rem, 7vw, 2.5rem)",
                width: "clamp(52px, 14vw, 68px)",
                height: "clamp(52px, 14vw, 68px)",
              }}
            >
              {player.number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate" style={{ color: "var(--pizza-cream)", fontFamily: "Bebas Neue, cursive", fontSize: "clamp(1.2rem, 5vw, 1.6rem)", letterSpacing: "0.05em" }}>
                {player.name}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--pizza-muted)" }}>
                {crossedOff.length} crossed · {player.connections.length} connections
              </div>
              {player.hasBingo && (
                <div
                  className="text-xs mt-1 inline-block px-2 py-0.5"
                  style={{ background: "var(--pizza-gold)", color: "#000", fontFamily: "Bebas Neue, cursive", letterSpacing: "0.1em" }}
                >
                  🏆 BINGO WINNER
                </div>
              )}
            </div>
            {myQr && (
              <img src={myQr} alt="My QR" className="flex-shrink-0" style={{ width: "clamp(48px, 12vw, 60px)", height: "clamp(48px, 12vw, 60px)", border: "2px solid var(--pizza-border)" }} />
            )}
          </div>
        </div>

        {/* Bingo Card */}
        {card.length > 0 && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-xs tracking-widest uppercase"
                style={{ color: "var(--pizza-muted)", fontFamily: "Bebas Neue, cursive", fontSize: "0.9rem" }}
              >
                My Bingo Card
              </h2>
              {player.hasBingo && (
                <span
                  className="text-sm px-3 py-1 bingo-win"
                  style={{ background: "var(--pizza-gold)", color: "#000", fontFamily: "Bebas Neue, cursive" }}
                >
                  🏆 BINGO!
                </span>
              )}
            </div>

            {/* Column headers */}
            <div className="bingo-grid mb-1">
              {["B", "I", "N", "G", "O"].map((l) => (
                <div
                  key={l}
                  className="text-center font-bold py-1"
                  style={{ fontFamily: "Bebas Neue, cursive", color: "var(--pizza-orange)", fontSize: "clamp(0.9rem, 4vw, 1.2rem)", letterSpacing: "0.1em" }}
                >
                  {l}
                </div>
              ))}
            </div>

            <div className="bingo-grid">
              {card.flat().map((num, idx) => {
                const isCenter = idx === 12;
                const isCrossed = crossedSet.has(num);
                return (
                  <div
                    key={idx}
                    className={`bingo-cell ${isCenter ? "free" : isCrossed ? "crossed stamp-in" : ""}`}
                  >
                    {isCenter ? (
                      <span style={{ fontSize: "clamp(1rem, 4vw, 1.4rem)" }}>🍕</span>
                    ) : isCrossed ? (
                      <>
                        <span style={{ fontSize: "clamp(0.9rem, 4vw, 1.3rem)" }}>🍅</span>
                        <span style={{ fontSize: "clamp(0.55rem, 2.5vw, 0.7rem)", color: "rgba(255,255,255,0.7)", fontWeight: "bold" }}>{num}</span>
                      </>
                    ) : (
                      <span
                        style={{ fontFamily: "Bebas Neue, cursive", color: "var(--pizza-cream)", fontSize: "clamp(1rem, 4.5vw, 1.4rem)" }}
                      >
                        {num}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs mt-3 text-center" style={{ color: "var(--pizza-muted)" }}>
              Find players with these numbers · Connect to cross off
            </p>
          </div>
        )}

        {/* Connections list */}
        {player.connections.length > 0 && (
          <div className="card-surface p-5">
            <h2
              className="text-xs tracking-widest uppercase mb-3"
              style={{ color: "var(--pizza-muted)", fontFamily: "Bebas Neue, cursive", fontSize: "0.9rem" }}
            >
              My Connections ({player.connections.length})
            </h2>
            <div className="space-y-2">
              {player.connections.map((conn) => (
                <div
                  key={conn.target.id}
                  className="flex items-start gap-3 p-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--pizza-border)" }}
                >
                  <span
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-sm font-bold"
                    style={{ background: "var(--pizza-orange)", color: "#fff", fontFamily: "Bebas Neue, cursive" }}
                  >
                    {conn.target.number}
                  </span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "var(--pizza-cream)" }}>
                      {conn.target.name}
                    </div>
                    <div className="text-xs mt-0.5 italic" style={{ color: "var(--pizza-muted)" }}>
                      "{conn.note}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      </div>{/* end scrollable content */}

      {/* Action bar — always visible at bottom */}
      <div
        className="flex-shrink-0 flex gap-3"
        style={{
          background: "var(--pizza-dark)",
          borderTop: "1px solid var(--pizza-border)",
          padding: "0.75rem 1rem",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <button
          className="btn-primary flex-1 justify-center py-3"
          onClick={() => { setModal("connect"); setConnectError(""); setConnectSuccess(""); }}
          disabled={waiting}
          style={{ opacity: waiting ? 0.5 : 1 }}
        >
          🤝 Connect
        </button>
        <button
          className="btn-secondary flex-1 py-3"
          onClick={() => setModal("quests")}
          disabled={waiting}
          style={{ opacity: waiting ? 0.5 : 1 }}
        >
          ⚡ Quests
        </button>
      </div>

      {/* Connect Modal */}
      {modal === "connect" && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.8)", padding: "0 0 env(safe-area-inset-bottom)" }}
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="modal-sheet card-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2
                className="text-2xl uppercase tracking-widest"
                style={{ fontFamily: "Bebas Neue, cursive", color: "var(--pizza-orange)" }}
              >
                🤝 Connect with Someone
              </h2>
              <button onClick={() => setModal(null)} style={{ color: "var(--pizza-muted)" }}>✕</button>
            </div>
            <p className="text-xs" style={{ color: "var(--pizza-muted)" }}>
              Find a person with a number on your card → ask their number → write something about them
            </p>
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                Their Player Number
              </label>
              <input
                className="input-pizza"
                type="number"
                min={1}
                max={75}
                placeholder="e.g. 42"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "var(--pizza-muted)" }}>
                Write something about them 🍕
              </label>
              <textarea
                className="input-pizza resize-none"
                rows={3}
                placeholder="e.g. Building the coolest L2 rollup, loves pepperoni..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <button
              className="btn-primary w-full justify-center"
              onClick={handleConnect}
              disabled={connecting || !targetNumber || !note.trim()}
            >
              {connecting ? "Connecting..." : "✅ Connect & Cross Off"}
            </button>
            {connectError && (
              <p className="text-sm text-center" style={{ color: "var(--pizza-red)" }}>⚠ {connectError}</p>
            )}
            {connectSuccess && (
              <p className="text-sm text-center font-bold" style={{ color: "var(--pizza-gold)" }}>{connectSuccess}</p>
            )}
          </div>
        </div>
      )}

      {/* Quests Modal */}
      {modal === "quests" && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.8)", padding: "0 0 env(safe-area-inset-bottom)" }}
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="modal-sheet card-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2
                className="text-2xl uppercase tracking-widest"
                style={{ fontFamily: "Bebas Neue, cursive", color: "var(--pizza-orange)" }}
              >
                ⚡ Quests
              </h2>
              <button onClick={() => setModal(null)} style={{ color: "var(--pizza-muted)" }}>✕</button>
            </div>
            <p className="text-xs" style={{ color: "var(--pizza-muted)" }}>
              Complete quests to get wild-card crosses on your bingo card
            </p>
            <div className="space-y-3">
              {player.room.quests.map((quest) => {
                const done = completedQuestIds.has(quest.id);
                return (
                  <div
                    key={quest.id}
                    className="p-4"
                    style={{
                      background: done ? "rgba(255,179,0,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${done ? "var(--pizza-gold)" : "var(--pizza-border)"}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div
                          className="font-bold text-sm"
                          style={{ color: done ? "var(--pizza-gold)" : "var(--pizza-cream)" }}
                        >
                          {done ? "✅ " : "⚡ "}{quest.title}
                        </div>
                        <div className="text-xs mt-1" style={{ color: "var(--pizza-muted)" }}>
                          {quest.description}
                        </div>
                        {quest.url && !done && (
                          <a
                            href={quest.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs mt-1 inline-block underline"
                            style={{ color: "var(--pizza-orange)" }}
                          >
                            Open link →
                          </a>
                        )}
                      </div>
                      {!done && (
                        <button
                          className="flex-shrink-0 btn-primary py-2 px-3 text-sm"
                          style={{ fontFamily: "Bebas Neue, cursive", fontSize: "0.85rem" }}
                          onClick={() => handleQuestComplete(quest.id)}
                          disabled={questLoading === quest.id}
                        >
                          {questLoading === quest.id ? "..." : "Done"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

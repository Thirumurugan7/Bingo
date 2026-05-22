import { NextRequest, NextResponse } from "next/server";
import {
  getRoomWithDetails,
  getRoomWithPlayers,
  updatePlayer,
  updateRoom,
  verifyRoomHost,
} from "@/lib/db";
import { generateBingoCard } from "@/lib/bingo";

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { password } = await req.json().catch(() => ({}));

  const roomCode = code.toUpperCase();
  const authorized = await verifyRoomHost(roomCode, password ? String(password) : "");
  if (!authorized) {
    return NextResponse.json({ error: "Invalid host password" }, { status: 401 });
  }

  const room = await getRoomWithPlayers(roomCode);

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status !== "waiting") return NextResponse.json({ error: "Already started" }, { status: 400 });
  if (room.players.length < 2) return NextResponse.json({ error: "Need at least 2 players" }, { status: 400 });

  const playerNumbers = room.players.map((p) => p.number);

  await Promise.all(
    room.players.map((player) => {
      const card = generateBingoCard(playerNumbers, player.number);
      return updatePlayer(player.id, {
        bingoCard: JSON.stringify(card),
        crossedOff: "[]",
      });
    })
  );

  await updateRoom(room.id, { status: "active" });

  const full = await getRoomWithDetails(code.toUpperCase());

  return NextResponse.json(full);
}

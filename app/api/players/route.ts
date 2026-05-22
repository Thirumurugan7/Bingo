import { NextRequest, NextResponse } from "next/server";
import { createPlayer, findPlayerByRoomAndEmail, getRoomWithPlayers } from "@/lib/db";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const { roomCode, email, nickname, name } = await req.json();
  const displayName = (nickname ?? name)?.trim();
  const rawEmail = email?.trim();

  if (!roomCode || !displayName || !rawEmail) {
    return NextResponse.json({ error: "Room code, email, and nickname required" }, { status: 400 });
  }
  if (!isValidEmail(rawEmail)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const room = await getRoomWithPlayers(roomCode.toUpperCase());

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status === "ended") return NextResponse.json({ error: "Game has ended" }, { status: 400 });

  const normalizedEmail = normalizeEmail(rawEmail);
  const existing = await findPlayerByRoomAndEmail(room.id, normalizedEmail);
  if (existing) {
    return NextResponse.json({ error: "This email has already joined this room" }, { status: 409 });
  }

  const usedNumbers = new Set(room.players.map((p) => p.number));
  let number = Math.floor(Math.random() * 75) + 1;
  while (usedNumbers.has(number)) {
    number = Math.floor(Math.random() * 75) + 1;
  }

  const player = await createPlayer({
    roomId: room.id,
    name: displayName,
    email: normalizedEmail,
    number,
  });

  return NextResponse.json({ ...player, roomCode: room.code });
}

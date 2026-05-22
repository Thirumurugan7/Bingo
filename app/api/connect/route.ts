import { NextRequest, NextResponse } from "next/server";
import {
  createConnection,
  findConnection,
  findPlayerById,
  findPlayerByRoomAndNumber,
  updatePlayer,
} from "@/lib/db";
import { checkBingo } from "@/lib/bingo";

export async function POST(req: NextRequest) {
  const { playerId, targetNumber, note } = await req.json();
  if (!playerId || !targetNumber || !note?.trim()) {
    return NextResponse.json({ error: "playerId, targetNumber, and note required" }, { status: 400 });
  }

  const player = await findPlayerById(playerId);
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const target = await findPlayerByRoomAndNumber(player.roomId, Number(targetNumber));
  if (!target) return NextResponse.json({ error: "No player with that number in this room" }, { status: 404 });
  if (target.id === playerId) return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 });

  const existing = await findConnection(playerId, target.id);
  if (existing) return NextResponse.json({ error: "Already connected with this player" }, { status: 400 });

  const card: number[][] = JSON.parse(player.bingoCard || "[]");
  const crossedOff: number[] = JSON.parse(player.crossedOff || "[]");

  const cardFlat = card.flat();
  if (!cardFlat.includes(target.number)) {
    return NextResponse.json({ error: "That number is not on your bingo card" }, { status: 400 });
  }

  await createConnection({ playerId, targetId: target.id, note: note.trim() });

  const newCrossedOff = [...new Set([...crossedOff, target.number])];
  const hasBingo = card.length > 0 ? checkBingo(card, newCrossedOff) : false;

  const updated = await updatePlayer(playerId, {
    crossedOff: JSON.stringify(newCrossedOff),
    hasBingo,
  });

  return NextResponse.json({ success: true, crossedOff: newCrossedOff, hasBingo: updated.hasBingo });
}

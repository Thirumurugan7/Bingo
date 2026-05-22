import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBingo } from "@/lib/bingo";

export async function POST(req: NextRequest) {
  const { playerId, targetNumber, note } = await req.json();
  if (!playerId || !targetNumber || !note?.trim()) {
    return NextResponse.json({ error: "playerId, targetNumber, and note required" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const target = await prisma.player.findFirst({
    where: { roomId: player.roomId, number: Number(targetNumber) },
  });
  if (!target) return NextResponse.json({ error: "No player with that number in this room" }, { status: 404 });
  if (target.id === playerId) return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 });

  // check if already connected
  const existing = await prisma.connection.findUnique({
    where: { playerId_targetId: { playerId, targetId: target.id } },
  });
  if (existing) return NextResponse.json({ error: "Already connected with this player" }, { status: 400 });

  const card: number[][] = JSON.parse(player.bingoCard || "[]");
  const crossedOff: number[] = JSON.parse(player.crossedOff || "[]");

  const cardFlat = card.flat();
  if (!cardFlat.includes(target.number)) {
    return NextResponse.json({ error: "That number is not on your bingo card" }, { status: 400 });
  }

  await prisma.connection.create({
    data: { playerId, targetId: target.id, note: note.trim() },
  });

  const newCrossedOff = [...new Set([...crossedOff, target.number])];
  const hasBingo = card.length > 0 ? checkBingo(card, newCrossedOff) : false;

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { crossedOff: JSON.stringify(newCrossedOff), hasBingo },
  });

  return NextResponse.json({ success: true, crossedOff: newCrossedOff, hasBingo: updated.hasBingo });
}

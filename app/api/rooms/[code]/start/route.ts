import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBingoCard } from "@/lib/bingo";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: { players: true },
  });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status !== "waiting") return NextResponse.json({ error: "Already started" }, { status: 400 });
  if (room.players.length < 2) return NextResponse.json({ error: "Need at least 2 players" }, { status: 400 });

  const playerNumbers = room.players.map((p: { number: number }) => p.number);

  await Promise.all(
    room.players.map((player: { id: string; number: number }) => {
      const card = generateBingoCard(playerNumbers, player.number);
      return prisma.player.update({
        where: { id: player.id },
        data: { bingoCard: JSON.stringify(card), crossedOff: "[]" },
      });
    })
  );

  await prisma.room.update({
    where: { id: room.id },
    data: { status: "active" },
  });

  const full = await prisma.room.findUnique({
    where: { id: room.id },
    include: {
      players: {
        orderBy: { number: "asc" },
        include: {
          connections: { include: { target: { select: { id: true, name: true, number: true } } } },
          questCompletions: { include: { quest: true } },
        },
      },
      quests: true,
    },
  });

  return NextResponse.json(full);
}

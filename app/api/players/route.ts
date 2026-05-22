import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { roomCode, name } = await req.json();
  if (!roomCode || !name) return NextResponse.json({ error: "roomCode and name required" }, { status: 400 });

  const room = await prisma.room.findUnique({
    where: { code: roomCode.toUpperCase() },
    include: { players: true },
  });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status === "ended") return NextResponse.json({ error: "Game has ended" }, { status: 400 });

  const usedNumbers = new Set(room.players.map((p: { number: number }) => p.number));
  let number = Math.floor(Math.random() * 75) + 1;
  while (usedNumbers.has(number)) {
    number = Math.floor(Math.random() * 75) + 1;
  }

  const player = await prisma.player.create({
    data: {
      roomId: room.id,
      name: name.trim(),
      number,
    },
  });

  return NextResponse.json({ ...player, roomCode: room.code });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      room: { include: { quests: true } },
      connections: {
        include: { target: { select: { id: true, name: true, number: true } } },
      },
      questCompletions: { include: { quest: true } },
    },
  });

  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });
  return NextResponse.json(player);
}

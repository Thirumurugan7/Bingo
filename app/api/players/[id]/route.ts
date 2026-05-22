import { NextRequest, NextResponse } from "next/server";
import { getPlayerWithDetails } from "@/lib/db";
import { maskBingoCard } from "@/lib/bingo";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const player = await getPlayerWithDetails(id);

  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const card: number[][] = JSON.parse(player.bingoCard || "[]");
  const crossedOff: number[] = JSON.parse(player.crossedOff || "[]");
  const maskedCard = maskBingoCard(card, crossedOff);

  return NextResponse.json({ ...player, bingoCard: JSON.stringify(maskedCard) });
}

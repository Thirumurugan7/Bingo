import { NextRequest, NextResponse } from "next/server";
import { getPlayerWithDetails } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const player = await getPlayerWithDetails(id);

  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });
  return NextResponse.json(player);
}

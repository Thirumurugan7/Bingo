import { NextRequest, NextResponse } from "next/server";
import { getRoomWithDetails } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const room = await getRoomWithDetails(code.toUpperCase());

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  const { hostPasswordHash, ...publicRoom } = room as typeof room & { hostPasswordHash?: string | null };
  return NextResponse.json({
    ...publicRoom,
    requiresHostPassword: Boolean(hostPasswordHash),
  });
}

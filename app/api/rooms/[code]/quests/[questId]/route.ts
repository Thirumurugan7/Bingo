import { NextRequest, NextResponse } from "next/server";
import { deleteQuest, findRoomByCode, getRoomWithDetails, verifyRoomHost } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; questId: string }> }
) {
  const { code, questId } = await params;
  const { password } = await req.json();

  const roomCode = code.toUpperCase();
  const authorized = await verifyRoomHost(roomCode, password ? String(password) : "");
  if (!authorized) {
    return NextResponse.json({ error: "Invalid host password" }, { status: 401 });
  }

  const room = await findRoomByCode(roomCode);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const deleted = await deleteQuest(questId, room.id);
  if (!deleted) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  const full = await getRoomWithDetails(roomCode);
  return NextResponse.json(full);
}

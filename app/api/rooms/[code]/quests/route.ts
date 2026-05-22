import { NextRequest, NextResponse } from "next/server";
import { createQuest, findRoomByCode, getRoomWithDetails, verifyRoomHost } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { password, title, description, url } = await req.json();

  const roomCode = code.toUpperCase();
  const authorized = await verifyRoomHost(roomCode, password ? String(password) : "");
  if (!authorized) {
    return NextResponse.json({ error: "Invalid host password" }, { status: 401 });
  }

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Title and description required" }, { status: 400 });
  }

  const room = await findRoomByCode(roomCode);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  await createQuest({
    roomId: room.id,
    title: String(title).trim(),
    description: String(description).trim(),
    url: url ? String(url).trim() : null,
  });

  const full = await getRoomWithDetails(roomCode);
  return NextResponse.json(full);
}

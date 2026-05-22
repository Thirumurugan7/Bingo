import { NextRequest, NextResponse } from "next/server";
import { findRoomByCode, verifyRoomHost } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { code, password } = await req.json();
  if (!code || !password) {
    return NextResponse.json({ error: "Room code and password required" }, { status: 400 });
  }

  const roomCode = String(code).trim().toUpperCase();
  const room = await findRoomByCode(roomCode);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const ok = await verifyRoomHost(roomCode, String(password));
  if (!ok) return NextResponse.json({ error: "Invalid password" }, { status: 401 });

  return NextResponse.json({ code: room.code, name: room.name, status: room.status });
}

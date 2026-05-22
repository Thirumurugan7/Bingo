import { NextRequest, NextResponse } from "next/server";
import {
  createQuestCompletion,
  findPlayerById,
  findQuestByIdAndRoom,
  findQuestCompletion,
  updatePlayer,
} from "@/lib/db";
import { checkBingo } from "@/lib/bingo";

export async function POST(req: NextRequest) {
  const { playerId, questId } = await req.json();
  if (!playerId || !questId) return NextResponse.json({ error: "playerId and questId required" }, { status: 400 });

  const player = await findPlayerById(playerId);
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const quest = await findQuestByIdAndRoom(questId, player.roomId);
  if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  const existing = await findQuestCompletion(questId, playerId);
  if (existing) return NextResponse.json({ error: "Quest already completed" }, { status: 400 });

  await createQuestCompletion(questId, playerId);

  const card: number[][] = JSON.parse(player.bingoCard || "[]");
  const crossedOff: number[] = JSON.parse(player.crossedOff || "[]");
  const crossedSet = new Set(crossedOff);

  const flatCard = card.flat().filter((n) => n !== 0 && !crossedSet.has(n));
  let newCrossedOff = crossedOff;
  let wildNumber: number | null = null;

  if (flatCard.length > 0) {
    wildNumber = flatCard[0];
    newCrossedOff = [...new Set([...crossedOff, wildNumber])];
  }

  const hasBingo = card.length > 0 ? checkBingo(card, newCrossedOff) : false;

  await updatePlayer(playerId, {
    crossedOff: JSON.stringify(newCrossedOff),
    hasBingo,
  });

  return NextResponse.json({ success: true, wildNumber, crossedOff: newCrossedOff, hasBingo });
}

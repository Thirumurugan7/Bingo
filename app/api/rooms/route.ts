import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRoomCode } from "@/lib/bingo";

const DEFAULT_QUESTS = [
  {
    title: "Follow PizzaDAO on X",
    description: "Follow @thepizzadao on Twitter/X and take a screenshot",
    url: "https://twitter.com/thepizzadao",
  },
  {
    title: "Join Pizza DAO Discord",
    description: "Join the PizzaDAO Discord server",
    url: "https://discord.gg/pizzadao",
  },
  {
    title: "Share #GlobalPizzaParty",
    description: "Post a photo at this event with #GlobalPizzaParty",
    url: "https://twitter.com/intent/tweet?text=%23GlobalPizzaParty",
  },
  {
    title: "Visit globalpizza.party",
    description: "Check out the Global Pizza Party website and sign up",
    url: "https://globalpizza.party",
  },
];

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const code = generateRoomCode();

  const room = await prisma.room.create({
    data: {
      code,
      name,
      quests: {
        create: DEFAULT_QUESTS,
      },
    },
    include: { quests: true },
  });

  return NextResponse.json(room);
}

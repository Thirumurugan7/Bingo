import { NextRequest, NextResponse } from "next/server";
import { createRoom, findRoomByCode } from "@/lib/db";
import { generateRoomCode } from "@/lib/bingo";
import { hashPassword } from "@/lib/host-auth";

const CODE_PATTERN = /^[A-Z0-9]{4,8}$/;

const DEFAULT_QUESTS = [
  {
    title: "Follow the Host on X",
    description: "Follow @fabianferno on Twitter/X — x.com/fabianferno",
    url: "https://x.com/fabianferno",
  },
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
  const { name, code: rawCode, password } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!password || String(password).length < 4) {
    return NextResponse.json({ error: "Host password must be at least 4 characters" }, { status: 400 });
  }

  const code = rawCode
    ? String(rawCode).trim().toUpperCase()
    : generateRoomCode();

  if (!CODE_PATTERN.test(code)) {
    return NextResponse.json(
      { error: "Room code must be 4–8 letters or numbers" },
      { status: 400 }
    );
  }

  const existing = await findRoomByCode(code);
  if (existing) return NextResponse.json({ error: "Room code already taken" }, { status: 409 });

  const room = await createRoom({
    code,
    name,
    hostPasswordHash: hashPassword(String(password)),
    quests: DEFAULT_QUESTS,
  });

  return NextResponse.json(room);
}

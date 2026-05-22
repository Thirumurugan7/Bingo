import { ObjectId, WithId } from "mongodb";
import { verifyPassword } from "@/lib/host-auth";
import { getDb } from "@/lib/mongodb";

export type RoomDoc = {
  code: string;
  name: string;
  status: string;
  hostPasswordHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PlayerDoc = {
  roomId: string;
  name: string;
  email?: string;
  number: number;
  bingoCard: string;
  crossedOff: string;
  hasBingo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ConnectionDoc = {
  playerId: string;
  targetId: string;
  note: string;
  createdAt: Date;
};

export type QuestDoc = {
  roomId: string;
  title: string;
  description: string;
  url?: string | null;
  createdAt: Date;
};

export type QuestCompletionDoc = {
  questId: string;
  playerId: string;
  createdAt: Date;
};

type IdDoc = { id: string };

function toId<T extends Record<string, unknown>>(doc: WithId<T>): T & IdDoc {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest } as unknown as T & IdDoc;
}

function parseId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid id");
  }
  return new ObjectId(id);
}

export async function createRoom(data: {
  code: string;
  name: string;
  hostPasswordHash: string;
  quests: Omit<QuestDoc, "roomId" | "createdAt">[];
}) {
  const db = await getDb();
  const now = new Date();

  const roomResult = await db.collection<RoomDoc>("rooms").insertOne({
    code: data.code,
    name: data.name,
    status: "waiting",
    hostPasswordHash: data.hostPasswordHash,
    createdAt: now,
    updatedAt: now,
  });

  const roomId = roomResult.insertedId.toString();

  const quests =
    data.quests.length > 0
      ? await db
          .collection<QuestDoc>("quests")
          .insertMany(
            data.quests.map((quest) => ({
              roomId,
              title: quest.title,
              description: quest.description,
              url: quest.url ?? null,
              createdAt: now,
            }))
          )
          .then((result) =>
            Object.values(result.insertedIds).map((id, index) => ({
              id: id.toString(),
              roomId,
              ...data.quests[index],
              createdAt: now,
            }))
          )
      : [];

  return {
    id: roomId,
    code: data.code,
    name: data.name,
    status: "waiting",
    createdAt: now,
    updatedAt: now,
    quests,
  };
}

export async function findRoomByCode(code: string) {
  const db = await getDb();
  const room = await db.collection<RoomDoc>("rooms").findOne({ code: code.toUpperCase() });
  if (!room) return null;
  return toId(room);
}

export async function verifyRoomHost(code: string, password: string): Promise<boolean> {
  const db = await getDb();
  const room = await db.collection<RoomDoc>("rooms").findOne({ code: code.toUpperCase() });
  if (!room) return false;
  if (!room.hostPasswordHash) return true;
  return verifyPassword(password, room.hostPasswordHash);
}

export async function findRoomById(id: string) {
  const db = await getDb();
  const room = await db.collection<RoomDoc>("rooms").findOne({ _id: parseId(id) });
  if (!room) return null;
  return toId(room);
}

export async function updateRoom(id: string, data: Partial<Pick<RoomDoc, "status">>) {
  const db = await getDb();
  await db.collection<RoomDoc>("rooms").updateOne(
    { _id: parseId(id) },
    { $set: { ...data, updatedAt: new Date() } }
  );
}

export async function findQuestsByRoomId(roomId: string) {
  const db = await getDb();
  const quests = await db.collection<QuestDoc>("quests").find({ roomId }).toArray();
  return quests.map(toId);
}

export async function createQuest(data: {
  roomId: string;
  title: string;
  description: string;
  url?: string | null;
}) {
  const db = await getDb();
  const now = new Date();

  const result = await db.collection<QuestDoc>("quests").insertOne({
    roomId: data.roomId,
    title: data.title,
    description: data.description,
    url: data.url?.trim() || null,
    createdAt: now,
  });

  return {
    id: result.insertedId.toString(),
    roomId: data.roomId,
    title: data.title,
    description: data.description,
    url: data.url?.trim() || null,
    createdAt: now,
  };
}

export async function findPlayersByRoomId(roomId: string) {
  const db = await getDb();
  const players = await db
    .collection<PlayerDoc>("players")
    .find({ roomId })
    .sort({ number: 1 })
    .toArray();
  return players.map(toId);
}

export async function findPlayerByRoomAndEmail(roomId: string, email: string) {
  const db = await getDb();
  const player = await db.collection<PlayerDoc>("players").findOne({ roomId, email });
  if (!player) return null;
  return toId(player);
}

export async function createPlayer(data: {
  roomId: string;
  name: string;
  email: string;
  number: number;
}) {
  const db = await getDb();
  const now = new Date();

  const result = await db.collection<PlayerDoc>("players").insertOne({
    roomId: data.roomId,
    name: data.name,
    email: data.email,
    number: data.number,
    bingoCard: "[]",
    crossedOff: "[]",
    hasBingo: false,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: result.insertedId.toString(),
    ...data,
    bingoCard: "[]",
    crossedOff: "[]",
    hasBingo: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function findPlayerById(id: string) {
  const db = await getDb();
  const player = await db.collection<PlayerDoc>("players").findOne({ _id: parseId(id) });
  if (!player) return null;
  return toId(player);
}

export async function findPlayerByRoomAndNumber(roomId: string, number: number) {
  const db = await getDb();
  const player = await db.collection<PlayerDoc>("players").findOne({ roomId, number });
  if (!player) return null;
  return toId(player);
}

export async function updatePlayer(
  id: string,
  data: Partial<Pick<PlayerDoc, "bingoCard" | "crossedOff" | "hasBingo">>
) {
  const db = await getDb();
  await db.collection<PlayerDoc>("players").updateOne(
    { _id: parseId(id) },
    { $set: { ...data, updatedAt: new Date() } }
  );

  const updated = await findPlayerById(id);
  if (!updated) throw new Error("Player not found after update");
  return updated;
}

export async function findConnection(playerId: string, targetId: string) {
  const db = await getDb();
  const connection = await db.collection<ConnectionDoc>("connections").findOne({ playerId, targetId });
  if (!connection) return null;
  return toId(connection);
}

export async function createConnection(data: { playerId: string; targetId: string; note: string }) {
  const db = await getDb();
  const now = new Date();

  await db.collection<ConnectionDoc>("connections").insertOne({
    ...data,
    createdAt: now,
  });
}

export async function findConnectionsByPlayerIds(playerIds: string[]) {
  if (playerIds.length === 0) return [];

  const db = await getDb();
  const connections = await db
    .collection<ConnectionDoc>("connections")
    .find({ playerId: { $in: playerIds } })
    .toArray();

  const targetIds = [...new Set(connections.map((c) => c.targetId))];
  const targets =
    targetIds.length > 0
      ? await db
          .collection<PlayerDoc>("players")
          .find({ _id: { $in: targetIds.map(parseId) } })
          .toArray()
      : [];

  const targetMap = new Map(
    targets.map((target) => [
      target._id.toString(),
      { id: target._id.toString(), name: target.name, number: target.number },
    ])
  );

  return connections.map((connection) => ({
    ...toId(connection),
    target: targetMap.get(connection.targetId) ?? null,
  }));
}

export async function findQuestByIdAndRoom(questId: string, roomId: string) {
  const db = await getDb();
  const quest = await db.collection<QuestDoc>("quests").findOne({
    _id: parseId(questId),
    roomId,
  });
  if (!quest) return null;
  return toId(quest);
}

export async function findQuestCompletion(questId: string, playerId: string) {
  const db = await getDb();
  const completion = await db.collection<QuestCompletionDoc>("questCompletions").findOne({
    questId,
    playerId,
  });
  if (!completion) return null;
  return toId(completion);
}

export async function createQuestCompletion(questId: string, playerId: string) {
  const db = await getDb();
  const now = new Date();

  await db.collection<QuestCompletionDoc>("questCompletions").insertOne({
    questId,
    playerId,
    createdAt: now,
  });
}

export async function findQuestCompletionsByPlayerIds(playerIds: string[]) {
  if (playerIds.length === 0) return [];

  const db = await getDb();
  const completions = await db
    .collection<QuestCompletionDoc>("questCompletions")
    .find({ playerId: { $in: playerIds } })
    .toArray();

  const questIds = [...new Set(completions.map((c) => c.questId))];
  const quests =
    questIds.length > 0
      ? await db
          .collection<QuestDoc>("quests")
          .find({ _id: { $in: questIds.map(parseId) } })
          .toArray()
      : [];

  const questMap = new Map(quests.map((quest) => [quest._id.toString(), toId(quest)]));

  return completions.map((completion) => ({
    ...toId(completion),
    quest: questMap.get(completion.questId) ?? null,
  }));
}

export async function getRoomWithDetails(code: string) {
  const room = await findRoomByCode(code);
  if (!room) return null;

  const [players, quests] = await Promise.all([
    findPlayersByRoomId(room.id),
    findQuestsByRoomId(room.id),
  ]);

  const playerIds = players.map((p) => p.id);
  const [connections, questCompletions] = await Promise.all([
    findConnectionsByPlayerIds(playerIds),
    findQuestCompletionsByPlayerIds(playerIds),
  ]);

  const connectionsByPlayer = new Map<string, typeof connections>();
  for (const connection of connections) {
    const list = connectionsByPlayer.get(connection.playerId) ?? [];
    list.push(connection);
    connectionsByPlayer.set(connection.playerId, list);
  }

  const completionsByPlayer = new Map<string, typeof questCompletions>();
  for (const completion of questCompletions) {
    const list = completionsByPlayer.get(completion.playerId) ?? [];
    list.push(completion);
    completionsByPlayer.set(completion.playerId, list);
  }

  return {
    ...room,
    players: players.map((player) => ({
      ...player,
      connections: connectionsByPlayer.get(player.id) ?? [],
      questCompletions: completionsByPlayer.get(player.id) ?? [],
    })),
    quests,
  };
}

export async function getPlayerWithDetails(id: string) {
  const player = await findPlayerById(id);
  if (!player) return null;

  const [room, quests, connections, questCompletions] = await Promise.all([
    findRoomById(player.roomId),
    findQuestsByRoomId(player.roomId),
    findConnectionsByPlayerIds([player.id]),
    findQuestCompletionsByPlayerIds([player.id]),
  ]);

  if (!room) return null;

  return {
    ...player,
    room: { ...room, quests },
    connections,
    questCompletions,
  };
}

export async function getRoomWithPlayers(code: string) {
  const room = await findRoomByCode(code);
  if (!room) return null;

  const players = await findPlayersByRoomId(room.id);
  return { ...room, players };
}

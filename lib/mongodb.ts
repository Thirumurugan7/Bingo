import { Db, MongoClient } from "mongodb";

const DB_NAME = "pizza-bingo";

const globalForMongo = globalThis as unknown as {
  mongoClient: MongoClient | null;
  mongoClientPromise: Promise<MongoClient> | null;
};

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (process.env.NODE_ENV === "production") {
    if (!globalForMongo.mongoClientPromise) {
      globalForMongo.mongoClientPromise = MongoClient.connect(uri);
    }
    return globalForMongo.mongoClientPromise;
  }

  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(uri);
    globalForMongo.mongoClientPromise = globalForMongo.mongoClient.connect();
  }

  return globalForMongo.mongoClientPromise!;
}

let indexesEnsured = false;

async function ensureIndexes(db: Db) {
  if (indexesEnsured) return;
  indexesEnsured = true;

  await Promise.all([
    db.collection("rooms").createIndex({ code: 1 }, { unique: true }),
    db.collection("players").createIndex({ roomId: 1, number: 1 }, { unique: true }),
    db.collection("connections").createIndex({ playerId: 1, targetId: 1 }, { unique: true }),
    db.collection("questCompletions").createIndex({ questId: 1, playerId: 1 }, { unique: true }),
    db.collection("quests").createIndex({ roomId: 1 }),
    db.collection("players").createIndex({ roomId: 1 }),
    db.collection("players").createIndex({ roomId: 1, email: 1 }, { unique: true, sparse: true }),
  ]);
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db(DB_NAME);
  await ensureIndexes(db);
  return db;
}

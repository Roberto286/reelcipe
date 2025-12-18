import { MongoClient, Db } from "mongodb";

let cachedDb: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = Deno.env.get("MONGODB_URI");
  const dbName = Deno.env.get("MONGODB_DB");

  try {
    const client = new MongoClient(uri);
    await client.connect();

    cachedDb = client.db(dbName);
    console.log(`✅ Connected to MongoDB: ${dbName}`);

    return cachedDb;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

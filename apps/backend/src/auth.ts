import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const MONGODB_URI = Deno.env.get("MONGODB_URI");
const DB_NAME = "reelcipe";

// Create MongoDB client
const client = new MongoClient(MONGODB_URI);
await client.connect();
const db = client.db(DB_NAME);

export const auth = betterAuth({
  // Use default adapter configuration to avoid transactions on standalone MongoDB
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      refreshCache: true, // Automatic refresh token rotation
    },
  },
  advanced: {
    generateId: false, // Use MongoDB _id
  },
});

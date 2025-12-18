import { session, Telegraf } from "npm:telegraf";
import { message } from "npm:telegraf/filters";
import { handleMessage } from "./handlers.js";
import { initDb } from "./db.js";
import express from "npm:express";
import {
  createNewUser,
  findUserByTelegramId,
  updateUserByTelegramId,
} from "./db.js";

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  console.log(
    `env variable "BOT_TOKEN" should have a value. (check your .env file)`
  );
  process.exit(1);
}

const bot = new Telegraf(botToken);

bot.use(session());

bot.use((ctx, next) => {
  if (!ctx.session) ctx.session = {};
  return next();
});

bot.on(message("text"), handleMessage);

const server = express();
server.use(express.json());

// Called when user registers via frontend (from Telegram)
server.post("/user-registered", (req, res) => {
  const { telegramId, telegram_username, userId, session_token, language } =
    req.body;

  // Validate required fields
  if (!telegramId || !telegram_username || !userId) {
    return res.status(400).send("Missing required fields");
  }

  // Default language if not provided
  const userLanguage = language || "it";

  try {
    // Save to DB
    createNewUser({
      telegramId,
      username: telegram_username,
      userId,
      session_token: session_token || "",
      language: userLanguage,
    });

    res.status(200).send("User registered successfully");
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal server error");
  }
});

// Called when user logs in via frontend (from Telegram)
server.post("/user-logged-in", (req, res) => {
  const { telegramId, telegram_username, userId, session_token, language } =
    req.body;

  // Validate required fields
  if (!telegramId || !telegram_username || !userId) {
    return res.status(400).send("Missing required fields");
  }

  // Default language if not provided
  const userLanguage = language || "it";

  try {
    // Check if user exists
    const existingUser = findUserByTelegramId(telegramId);
    if (existingUser) {
      // Update existing user
      updateUserByTelegramId(telegramId, {
        session_token: session_token || "",
        userId,
      });
      res.status(200).send("User session updated successfully");
    } else {
      // Create new user
      createNewUser({
        telegramId,
        username: telegram_username,
        userId,
        session_token: session_token || "",
        language: userLanguage,
      });
      res.status(200).send("User created and session saved successfully");
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal server error");
  }
});

server.listen(8001, () => {
  console.log(`HTTP server listening on port 8001`);
});

bot.launch(() => {
  initDb();
  console.log("Bot started!");
});

import { session, Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { handleMessage } from "./handlers.js";
import { initDb } from "./db.js";
import express from "express";

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
    console.log(
        `env variable "BOT_TOKEN" should have a value. (check your .env file)`,
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

server.post("/user-registered", (req, res) => {
    const { telegramId, username, supabaseUserId, refresh_token, language } =
        req.body;

    // Validate required fields
    if (!telegramId || !username || !supabaseUserId || !refresh_token) {
        return res.status(400).send("Missing required fields");
    }

    // Default language if not provided
    const userLanguage = language || "it";

    try {
        // Save to DB
        createNewUser({
            telegramId,
            username,
            supabaseUserId,
            refresh_token,
            language: userLanguage,
        });

        res.status(200).send("User registered successfully");
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Internal server error");
    }
});

const port = 8001;
server.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
});

bot.launch(() => {
    initDb();
    console.log("Bot started!");
});

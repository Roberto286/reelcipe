import { session, Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { handleMessage } from "./handlers.js";
import { initDb } from "./db.js";

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

bot.launch(() => {
    initDb();
    console.log("Bot started!");
});

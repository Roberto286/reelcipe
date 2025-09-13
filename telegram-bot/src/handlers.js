import { isUrl } from "./functions.js";
import { Markup } from "telegraf";
import { OPENRECIPE_FE_BASEURL, RECIPE_GENERATOR_BASE_URL } from "./config.js";
import { findUserByTelegramId } from "./db.js";

export async function handleMessage(ctx) {
    const isAuthenticated = await handleAuthentication(ctx);

    if (!isAuthenticated) {
        return inviteToLogin(ctx);
    }

    const textMessage = ctx.update.message.text;
    const withoutQueryString = textMessage.split("?")[0];

    if (textMessage.startsWith("/")) {
        return await handleCommand(ctx, textMessage);
    }

    if (!isUrl(withoutQueryString)) {
        await ctx.reply("Il messaggio inviato non è un url valido");
        return;
    }

    const recipeGeneratorResponse = await fetch(
        RECIPE_GENERATOR_BASE_URL + "/recipe",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                url: withoutQueryString,
            }),
        },
    );
    if (!recipeGeneratorResponse.ok) {
        await ctx.reply(
            `Errore nel generare la ricetta: ${recipeGeneratorResponse.statusText}`,
        );
        return;
    }

    const recipe = (await recipeGeneratorResponse.json())?.result?.data;

    if (!recipe) {
        await ctx.reply("Non sono riuscito a generare la ricetta");
        return;
    }

    await ctx.replyWithMarkdown(recipe);
}

async function handleCommand(ctx, command) {
    switch (command) {
        case "/start":
            await ctx.reply("Benvenuto nel bot di OpenRecipe");
            break;
        case "/login":
            inviteToLogin(ctx);
            break;
        default:
            await ctx.reply("Comando non riconosciuto");
            break;
    }
}

async function handleAuthentication(ctx) {
    if (ctx.session.access_token) {
        await fetch();
    }
    const user = findUserByTelegramId(ctx.from.id);
    console.log("user :>> ", user);

    return !!user;
}

async function inviteToLogin(ctx) {
    if (OPENRECIPE_FE_BASEURL.startsWith("http://")) {
        await ctx.reply(
            `Accedi al servizio: ${OPENRECIPE_FE_BASEURL}/login`,
        );
    } else {
        await ctx.reply(
            "Accedi al servizio",
            Markup.inlineKeyboard([
                Markup.button.login(
                    "Accedi con Telegram",
                    `${OPENRECIPE_FE_BASEURL}/login`,
                ),
            ]),
        );
    }
}

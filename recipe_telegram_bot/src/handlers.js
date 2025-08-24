import { isUrl } from "./functions.js";

import { RECIPE_GENERATOR_BASE_URL } from "./config.js";
export async function handleMessage(ctx) {
    const textMessage = ctx.update.message.text;
    const withoutQueryString = textMessage.split("?")[0];

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

import { isUrl } from "./functions.js";
import { Markup } from "npm:telegraf";
import { OPENRECIPE_FE_BASEURL, RECIPE_GENERATOR_BASE_URL } from "./config.js";
import { findUserByTelegramId, updateUserByTelegramId } from "./db.js";

const AUTH_SERVICE_URL = "http://auth-service:8000";

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
    }
  );
  if (!recipeGeneratorResponse.ok) {
    await ctx.reply(
      `Errore nel generare la ricetta: ${recipeGeneratorResponse.statusText}`
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
  const telegramId = ctx.from.id.toString();
  const user = findUserByTelegramId(telegramId);
  console.log("🚀 ~ handleAuthentication ~ user:", user);
  if (!user) {
    return false;
  }

  let accessToken = ctx.session?.access_token;
  if (!accessToken && user.access_token) {
    ctx.session.access_token = user.access_token;
    accessToken = user.access_token;
  }
  console.log("accessToken :>> ", accessToken);

  let isValid = false;

  if (accessToken) {
    // Validate access_token
    try {
      const response = await fetch(
        `${AUTH_SERVICE_URL}/session/validate-and-refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: accessToken,
          }),
        }
      );

      if (response.ok) {
        isValid = true;
        console.log("Access token valid");
      } else {
        console.log("Access token invalid or expired");
      }
    } catch (error) {
      console.error("Error validating access token:", error);
    }
  }

  if (!isValid && user.refresh_token) {
    // Try to refresh using refresh_token
    try {
      const refreshResponse = await fetch(
        `${AUTH_SERVICE_URL}/session/validate-and-refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: user.refresh_token,
          }),
        }
      );

      if (refreshResponse.ok) {
        const tokenData = await refreshResponse.json();
        const { access_token, refresh_token } = tokenData;
        // Update session with new access_token
        ctx.session.access_token = access_token;
        // Update DB with new tokens
        updateUserByTelegramId(telegramId, {
          access_token,
          refresh_token,
        });
        isValid = true;
        console.log("Token refreshed successfully");
      } else {
        console.log("Refresh token invalid");
        // Optionally clear invalid tokens from DB
        // updateUserByTelegramId(telegramId, { access_token: null, refresh_token: null });
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
  }

  if (!isValid) {
    delete ctx.session.access_token;
  }

  return isValid;
}

async function inviteToLogin(ctx) {
  const telegramId = ctx.from.id;
  const username = ctx.from.username || "";
  const loginUrl = `${OPENRECIPE_FE_BASEURL}/login?telegram_id=${telegramId}&telegram_username=${username}`;

  if (OPENRECIPE_FE_BASEURL.startsWith("http://")) {
    await ctx.reply(`Accedi al servizio: ${loginUrl}`);
  } else {
    await ctx.reply(
      "Accedi al servizio",
      Markup.inlineKeyboard([
        Markup.button.login("Accedi con Telegram", loginUrl),
      ])
    );
  }
}

import { isUrl } from "./functions.js";
import { Markup } from "npm:telegraf";
import { OPENRECIPE_FE_BASEURL, RECIPE_GENERATOR_BASE_URL } from "./config.js";
import { findUserByTelegramId, updateUserByTelegramId } from "./db.js";

const BACKEND_URL = "http://backend:8000";

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
        session_token: ctx.session?.session_token,
        user_id: ctx.session?.user_id,
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

  let sessionToken = ctx.session?.session_token;
  if (!sessionToken && user.session_token) {
    ctx.session.session_token = user.session_token;
    ctx.session.user_id = user.userId;
    sessionToken = user.session_token;
  }
  console.log("sessionToken :>> ", sessionToken);

  let isValid = false;

  if (sessionToken) {
    // Validate session with Better Auth backend
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/get-session`, {
        method: "GET",
        headers: {
          Cookie: `better_auth.session_token=${sessionToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.session && data.user) {
          isValid = true;
          ctx.session.user_id = data.user.id;
          console.log("Session valid for user:", data.user.id);
        }
      } else {
        console.log("Session invalid or expired");
      }
    } catch (error) {
      console.error("Error validating session:", error);
    }
  }

  if (!isValid) {
    delete ctx.session.session_token;
    delete ctx.session.user_id;
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

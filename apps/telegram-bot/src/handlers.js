import { isUrl } from "./functions.js";
import { Markup } from "npm:telegraf";
import { REELCIPE_FE_BASEURL, RECIPE_GENERATOR_BASE_URL } from "./config.js";
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
    let errorDetail = recipeGeneratorResponse.statusText;
    try {
      const errorData = await recipeGeneratorResponse.json();
      if (errorData?.error) {
        errorDetail = errorData.error;
      }
    } catch (e) {
      // ignore parse errors
    }
    console.error("Recipe generator error:", errorDetail);
    await ctx.reply(
      `Errore nel generare la ricetta: ${errorDetail}`
    );
    return;
  }

  const recipeResult = await recipeGeneratorResponse.json();
  console.log("Recipe generator response:", JSON.stringify(recipeResult));
  const recipeId = recipeResult?.result?.recipeId;

  if (!recipeId) {
    console.error("No recipeId in response:", recipeResult);
    await ctx.reply("Non sono riuscito a generare la ricetta");
    return;
  }

  // Fetch the full recipe from backend
  const recipeResponse = await fetch(`${BACKEND_URL}/api/recipes/${recipeId}`, {
    headers: {
      Authorization: `Bearer ${ctx.session?.session_token}`,
    },
  });

  if (!recipeResponse.ok) {
    const errorText = await recipeResponse.text();
    console.error("Failed to fetch recipe:", {
      status: recipeResponse.status,
      statusText: recipeResponse.statusText,
      body: errorText,
      recipeId,
    });
    await ctx.reply("Non è stato possibile recuperare la ricetta");
    return;
  }

  const recipe = await recipeResponse.json();
  
  // Format recipe for display
  const formattedRecipe = formatRecipeForDisplay(recipe);
  await ctx.replyWithMarkdown(formattedRecipe);
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
  if (!user) {
    return false;
  }

  let sessionToken = ctx.session?.session_token;
  if (!sessionToken && user.session_token) {
    ctx.session.session_token = user.session_token;
    ctx.session.user_id = user.userId;
    sessionToken = user.session_token;
  }

  let isValid = false;

  if (sessionToken) {
    // Validate session with Better Auth backend
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/get-session`, {
        method: "GET",
        headers: {
          Cookie: `better-auth.session_token=${sessionToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.session && data.user) {
          isValid = true;
          ctx.session.user_id = data.user.id;
        }
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
  const loginUrl = `${REELCIPE_FE_BASEURL}/login?telegram_id=${telegramId}&telegram_username=${username}`;

  if (REELCIPE_FE_BASEURL.startsWith("http://")) {
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

function formatRecipeForDisplay(recipe) {
  let text = `*${recipe.title || "Ricetta senza titolo"}*\n\n`;
  
  if (recipe.description) {
    text += `${recipe.description}\n\n`;
  }
  
  text += `*Ingredienti:*\n`;
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    recipe.ingredients.forEach(ing => {
      text += `• ${ing.name}`;
      if (ing.quantity && ing.unit) {
        text += ` - ${ing.quantity} ${ing.unit}`;
      }
      text += `\n`;
    });
  }
  
  text += `\n*Preparazione:*\n`;
  if (recipe.method && recipe.method.length > 0) {
    recipe.method.forEach(step => {
      text += `${step.stepNumber}. ${step.text}\n`;
    });
  }
  
  return text;
}

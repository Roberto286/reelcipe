import {
  systemPrompt,
  recipeGeneratorUserPrompt,
  replacePlaceholders,
} from "./prompts.js";

export async function generateRecipe(
  recipeText,
  { description, comments, ingredients }
) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const API_URL = "https://api.openai.com/v1/responses";

  const MODEL = "gpt-5-nano";

  const formattedIngredients = ingredients?.length
    ? `## Extracted ingredients to use in the recipe (do not modify them):\n${ingredients
        .map(
          (i) =>
            `- ${i.quantità} ${i.ingrediente}${
              i.stimata ? " (estimated quantity)" : ""
            }`
        )
        .join("\n")}\n\n`
    : "";

  const userPrompt = replacePlaceholders(recipeGeneratorUserPrompt, {
    formattedIngredients,
    recipeText,
    description: description || "",
    comments: comments || "",
  });
  const requestBody = {
    model: MODEL,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API Error: ${response.status} - ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    const data = await response.json();

    const jsonResponse = data.output
      .find((o) => o.type === "message")
      .content.find((c) => c.type === "output_text").text;

    // Parse the JSON response
    let recipe;
    try {
      recipe = JSON.parse(jsonResponse);
    } catch (parseError) {
      throw new Error("Failed to parse AI response as JSON");
    }

    // Metadata for debugging/monitoring
    const metadata = {
      model: data.model,
      usage: data.usage,
    };

    return {
      recipe,
      metadata,
    };
  } catch (error) {
    console.error("Error generating recipe:", error);

    // Specific error handling
    if (error.message.includes("rate limit")) {
      throw new Error("OpenAI rate limit reached. Try again in a few minutes.");
    }

    if (error.message.includes("quota")) {
      throw new Error("OpenAI quota exhausted. Check your account.");
    }

    if (error.message.includes("401")) {
      throw new Error("Invalid OpenAI API Key.");
    }

    throw error;
  }
}

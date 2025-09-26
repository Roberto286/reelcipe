import { systemPrompt } from "./prompts.js";

export async function generateRecipe(
  recipeText,
  { description, comments, ingredients }
) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const API_URL = "https://api.openai.com/v1/chat/completions";

  // Modello consigliato per costo/performance
  const MODEL = "gpt-4o-mini"; // Miglior rapporto qualità/prezzo

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

  const userPrompt = `
${formattedIngredients}Transform this transcription into a complete recipe following the specified markdown schema:

REEL TRANSCRIPTION:
${recipeText}

${description ? `INSTAGRAM REEL DESCRIPTION: ${description}` : ""}
${comments ? `INSTAGRAM REEL COMMENTS: ${comments}` : ""}

**IMPORTANT**:
- Use exactly the ingredients provided above in the 🥘 Ingredients section.
- Do not modify them. Do not add new ones.
- If other ingredients appear in the text, ignore them.
- If some quantities are estimated, leave them indicated as "(estimated quantity)".
- Include in the 💡 Tips any variants or substitutions from the comments.
`;
  const requestBody = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 2000,
    temperature: 0.1,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
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

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid OpenAI response");
    }

    const jsonResponse = data.choices[0].message.content.trim();

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
      finishReason: data.choices[0].finish_reason,
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

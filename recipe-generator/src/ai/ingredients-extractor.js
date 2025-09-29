import {
  ingredientsExtractorUserPrompt,
  ingredientsExtractorSystemPrompt,
  replacePlaceholders,
} from "./prompts.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function extractIngredients(
  recipeText,
  { description, comments }
) {
  const prompt = replacePlaceholders(ingredientsExtractorUserPrompt, {
    recipeText,
    description: description || "",
    comments: comments || "",
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: ingredientsExtractorSystemPrompt,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      top_p: 1,
      max_tokens: 1000,
    }),
  });

  const json = await res.json();
  console.log("json :>> ", json);
  const content = json.choices?.[0]?.message?.content;

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error("Errore nel parsing JSON:", err);
    return null;
  }
}

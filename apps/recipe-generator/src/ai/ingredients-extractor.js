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

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5-nano",
      input: [
        {
          role: "system",
          content: ingredientsExtractorSystemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const json = await res.json();
  console.log("json :>> ", json);
  const content = json.output
    .find((o) => o.type === "message")
    .content.find((c) => c.type === "output_text").text;

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error("Errore nel parsing JSON:", err);
    return null;
  }
}

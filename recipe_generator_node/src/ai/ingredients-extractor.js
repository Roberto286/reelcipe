const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function extractIngredients(
  recipeText,
  { description, comments },
) {
  const prompt = `
Il tuo compito è leggere una trascrizione e trovare **ingredienti e quantità** specificate.

## Istruzioni:
- Rispondi in formato JSON: [{"ingrediente": "...", "quantità": "..."}]
- Se la quantità è **stimata** perché mancante o vaga, aggiungi "stimata": true
- Non includere istruzioni o testo extra, solo JSON
- Se trovi lo stesso ingrediente con più varianti (es. "olio" e "olio extravergine"), considera il più preciso

### Esempio Output:
[
  { "ingrediente": "latte", "quantità": "200 ml" },
  { "ingrediente": "zucchero", "quantità": "2 cucchiai" },
  { "ingrediente": "olio extravergine d'oliva", "quantità": "30 ml", "stimata": true }
]

---

### TESTO DA ANALIZZARE:

[TRASCRIZIONE]
${recipeText}

[DESCRIZIONE]
${description}

[COMMENTI]
${comments}
`;

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
          content:
            "Sei un assistente che estrae ingredienti e quantità da ricette in italiano. Rispondi sempre in JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      top_p: 1,
      max_tokens: 1000,
    }),
  });

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error("Errore nel parsing JSON:", err);
    return null;
  }
}

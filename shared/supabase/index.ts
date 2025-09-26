import { createClient } from "jsr:@supabase/supabase-js@2";
import type { GeneratedRecipe } from "../types/index.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

export async function saveGeneratedRecipe(
  recipe: GeneratedRecipe,
  url: string,
  accessToken: string
) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  // Insert recipe
  const { data: recipeData, error: recipeError } = await supabase
    .from("recipe")
    .insert({
      title: recipe.title,
      defaultServes: recipe.defaultServes,
      downloadedFrom: url,
      rating: 0,
    })
    .select();

  if (recipeError || !recipeData || recipeData.length === 0) {
    throw new Error(
      `Recipe insert failed: ${recipeError?.message || "No data returned"}`
    );
  }

  const recipeId = recipeData[0].id;

  // Insert ingredients
  if (recipe.ingredients.length > 0) {
    const { error: ingredientsError } = await supabase
      .from("ingredient")
      .insert(
        recipe.ingredients.map((ing) => ({
          recipeId,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
        }))
      );

    if (ingredientsError) {
      console.error("Ingredients insert error:", ingredientsError);
    }
  }

  // Insert method steps
  if (recipe.method.length > 0) {
    const { error: methodError } = await supabase.from("method").insert(
      recipe.method.map((step) => ({
        recipeId,
        text: step.text,
        stepNumber: step.stepNumber,
      }))
    );

    if (methodError) {
      console.error("Method insert error:", methodError);
    }
  }

  // Insert tags
  for (const tagName of recipe.tags) {
    const { data: tagData, error: tagError } = await supabase
      .from("tag")
      .upsert({ name: tagName }, { onConflict: "name" })
      .select()
      .single();

    if (tagError) {
      console.error("Tag upsert error:", tagError);
      continue;
    }

    const { error: linkError } = await supabase
      .from("recipe_tag")
      .insert({ recipeId, tagId: tagData.id });

    if (linkError) {
      console.error("Recipe-tag link error:", linkError);
    }
  }

  return recipeId;
}

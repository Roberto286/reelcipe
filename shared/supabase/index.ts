import { createClient } from "jsr:@supabase/supabase-js@2";
import type { GeneratedRecipe, Recipe } from "../types/index.ts";

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
      default_serves: recipe.defaultServes,
      downloaded_from: url,
      image_url: "https://placehold.co/400",
      rating: 1,
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
          recipe_id: recipeId,
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
        recipe_id: recipeId,
        text: step.text,
        step_number: step.stepNumber,
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
      .insert({ recipe_id: recipeId, tag_id: tagData.id });

    if (linkError) {
      console.error("Recipe-tag link error:", linkError);
    }
  }

  return recipeId;
}

export async function getRecipes(): Promise<Recipe[]> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Fetch data from recipe_details_view
  const { data: viewData, error: viewError } = await supabase
    .from("recipe_details_view")
    .select("*");

  if (viewError) throw viewError;

  // Fetch created_at from recipe table
  const { data: recipeData, error: recipeError } = await supabase
    .from("recipe")
    .select("id, created_at");

  if (recipeError) throw recipeError;

  const recipeMap = new Map<number, string>(
    recipeData?.map((r: { id: number; created_at: string }) => [
      r.id,
      r.created_at,
    ]) || []
  );

  // Fetch cookbooks
  const { data: cookbookData, error: cookbookError } = await supabase
    .from("cookbook_recipe")
    .select("recipe_id, cookbook(id, name)");

  if (cookbookError) throw cookbookError;

  const cookbookMap = new Map<number, { id: number; name: string }[]>();
  for (const cr of cookbookData || []) {
    if (!cookbookMap.has(cr.recipe_id)) cookbookMap.set(cr.recipe_id, []);
    cookbookMap.get(cr.recipe_id)!.push(cr.cookbook);
  }

  // Aggregate data into Recipe objects
  const recipesMap = new Map<number, Recipe>();
  for (const row of viewData || []) {
    const id = row.recipe_id;
    if (!recipesMap.has(id)) {
      recipesMap.set(id, {
        id,
        title: row.recipe_title,
        rating: row.rating,
        defaultServes: row.default_serves,
        downloadedFrom: row.downloaded_from,
        imageUrl: row.image_url,
        createdAt: recipeMap.get(id) ?? "",
        cookbooks: cookbookMap.get(id) || [],
        method: [],
        tags: [],
        ingredients: [],
      });
    }

    const recipe = recipesMap.get(id)!;

    // Add ingredient if present
    if (row.ingredient_id) {
      const ing = {
        id: row.ingredient_id,
        recipeId: id,
        name: row.ingredient_name,
        quantity: row.ingredient_quantity,
        unit: row.ingredient_unit,
      };
      if (!recipe.ingredients.some((i) => i.id === ing.id))
        recipe.ingredients.push(ing);
    }

    // Add method step if present
    if (row.method_id) {
      const meth = {
        id: row.method_id,
        recipeId: id,
        text: row.method_text,
        stepNumber: row.step_number,
      };
      if (!recipe.method.some((m) => m.id === meth.id))
        recipe.method.push(meth);
    }

    // Add tag if present
    if (row.tag_id) {
      const tag = {
        id: row.tag_id,
        name: row.tag_name,
      };
      if (!recipe.tags.some((t) => t.id === tag.id)) recipe.tags.push(tag);
    }
  }

  return Array.from(recipesMap.values());
}

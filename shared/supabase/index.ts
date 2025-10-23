import { createClient } from "jsr:@supabase/supabase-js@2";
import type { Rating } from "../index.ts";
import type { GeneratedRecipe, Recipe } from "../types/index.ts";
import type { Database } from "./supabase.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

export async function saveGeneratedRecipe(
  recipe: GeneratedRecipe,
  url: string,
  accessToken: string,
  userId: string
) {
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
      image_url: recipe.thumbnailUrl || "https://placehold.co/400",
      rating: 1,
      user_id: userId,
    })
    .select();

  if (recipeError) {
    console.error("Recipe insert error details:", recipeError);
    throw new Error(`Recipe insert failed: ${recipeError.message}`);
  }

  if (!recipeData || recipeData.length === 0) {
    console.error("Recipe insert succeeded but no data returned");
    throw new Error("Recipe insert failed: No data returned");
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
    // First, try to find existing tag
    let { data: existingTag, error: selectError } = await supabase
      .from("tag")
      .select("id")
      .eq("name", tagName)
      .single();

    let tagId: number;

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 is "not found"
      console.error("Tag select error:", selectError);
      continue;
    }

    if (existingTag) {
      tagId = existingTag.id;
    } else {
      // Insert new tag
      const { data: newTag, error: insertError } = await supabase
        .from("tag")
        .insert({ name: tagName })
        .select("id")
        .single();

      if (insertError) {
        console.error("Tag insert error:", insertError);
        continue;
      }

      tagId = newTag.id;
    }

    const { error: linkError } = await supabase
      .from("recipe_tag")
      .insert({ recipe_id: recipeId, tag_id: tagId });

    if (linkError) {
      console.error("Recipe-tag link error:", linkError);
    }
  }

  return recipeId;
}

export async function getRecipes(accessToken?: string): Promise<Recipe[]> {
  const supabase = accessToken
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      })
    : createClient<Database>(supabaseUrl, supabaseAnonKey);

  // Fetch all data from recipe_details_view
  const { data: viewData, error: viewError } = await supabase
    .from("recipe_details_view")
    .select("*");

  if (viewError) throw viewError;

  // Aggregate data into Recipe objects
  const recipesMap = new Map<number, Recipe>();
  for (const row of viewData || []) {
    const id = row.recipe_id;
    if (!id) continue; // Skip invalid rows

    if (!recipesMap.has(id)) {
      recipesMap.set(id, {
        id,
        title: row.recipe_title || "",
        rating: (row.rating as Rating) || 0,
        defaultServes: row.default_serves || 0,
        downloadedFrom: row.downloaded_from || "",
        imageUrl: row.image_url || "",
        createdAt: row.created_at || "",
        cookbooks: [],
        method: [],
        tags: [],
        ingredients: [],
      });
    }

    const recipe = recipesMap.get(id)!;

    // Add cookbook if present
    if (row.cookbook_id && row.cookbook_name) {
      const cb = {
        id: row.cookbook_id,
        name: row.cookbook_name,
      };
      if (!recipe.cookbooks.some((c) => c.id === cb.id))
        recipe.cookbooks.push(cb);
    }

    // Add ingredient if present
    if (row.ingredient_id) {
      const ing = {
        id: row.ingredient_id,
        recipeId: id,
        name: row.ingredient_name || "",
        quantity: row.ingredient_quantity || 0,
        unit: row.ingredient_unit || "",
      };
      if (!recipe.ingredients.some((i) => i.id === ing.id))
        recipe.ingredients.push(ing);
    }

    // Add method step if present
    if (row.method_id) {
      const meth = {
        id: row.method_id,
        recipeId: id,
        text: row.method_text || "",
        stepNumber: row.method_step || 0,
      };
      if (!recipe.method.some((m) => m.id === meth.id))
        recipe.method.push(meth);
    }

    // Add tag if present
    if (row.tag_id) {
      const tag = {
        id: row.tag_id,
        name: row.tag_name || "",
      };
      if (!recipe.tags.some((t) => t.id === tag.id)) recipe.tags.push(tag);
    }
  }

  return Array.from(recipesMap.values());
}

export async function getRecipe(id: number, accessToken?: string) {
  const supabase = accessToken
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      })
    : createClient<Database>(supabaseUrl, supabaseAnonKey);

  // Fetch data from recipe_details_view filtered by recipe_id
  const { data: viewData, error: viewError } = await supabase
    .from("recipe_details_view")
    .select("*")
    .eq("recipe_id", id);

  if (viewError) throw viewError;

  if (!viewData || viewData.length === 0) {
    return null; // Recipe not found
  }

  // Aggregate data into Recipe object
  const recipe: Recipe = {
    id,
    title: viewData[0].recipe_title || "",
    rating: (viewData[0].rating as Rating) || 0,
    defaultServes: viewData[0].default_serves || 0,
    downloadedFrom: viewData[0].downloaded_from || "",
    imageUrl: viewData[0].image_url || "",
    createdAt: viewData[0].created_at || "",
    cookbooks: [],
    method: [],
    tags: [],
    ingredients: [],
  };

  for (const row of viewData) {
    // Add cookbook if present
    if (row.cookbook_id && row.cookbook_name) {
      const cb = {
        id: row.cookbook_id,
        name: row.cookbook_name,
      };
      if (!recipe.cookbooks.some((c) => c.id === cb.id))
        recipe.cookbooks.push(cb);
    }

    // Add ingredient if present
    if (row.ingredient_id) {
      const ing = {
        id: row.ingredient_id,
        recipeId: id,
        name: row.ingredient_name || "",
        quantity: row.ingredient_quantity || 0,
        unit: row.ingredient_unit || "",
      };
      if (!recipe.ingredients.some((i) => i.id === ing.id))
        recipe.ingredients.push(ing);
    }

    // Add method step if present
    if (row.method_id) {
      const meth = {
        id: row.method_id,
        recipeId: id,
        text: row.method_text || "",
        stepNumber: row.method_step || 0,
      };
      if (!recipe.method.some((m) => m.id === meth.id))
        recipe.method.push(meth);
    }

    // Add tag if present
    if (row.tag_id) {
      const tag = {
        id: row.tag_id,
        name: row.tag_name || "",
      };
      if (!recipe.tags.some((t) => t.id === tag.id)) recipe.tags.push(tag);
    }
  }

  // Sort method steps by stepNumber
  recipe.method.sort((a, b) => a.stepNumber - b.stepNumber);

  return recipe;
}

export async function updateRecipe(
  id: number,
  updates: Partial<
    Pick<Recipe, "title" | "defaultServes" | "method" | "ingredients" | "tags">
  >,
  accessToken: string
): Promise<void> {
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  // Update recipe basic info
  if (updates.title !== undefined || updates.defaultServes !== undefined) {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.defaultServes !== undefined)
      updateData.default_serves = updates.defaultServes;

    const { error: recipeError } = await supabase
      .from("recipe")
      .update(updateData)
      .eq("id", id);

    if (recipeError) {
      console.error("Recipe update error:", recipeError);
      throw new Error(`Recipe update failed: ${recipeError.message}`);
    }
  }

  // Update ingredients if provided
  if (updates.ingredients !== undefined) {
    // Delete existing ingredients
    const { error: deleteError } = await supabase
      .from("ingredient")
      .delete()
      .eq("recipe_id", id);

    if (deleteError) {
      console.error("Ingredients delete error:", deleteError);
      throw new Error(`Ingredients delete failed: ${deleteError.message}`);
    }

    // Insert new ingredients
    if (updates.ingredients.length > 0) {
      const { error: insertError } = await supabase.from("ingredient").insert(
        updates.ingredients.map((ing) => ({
          recipe_id: id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
        }))
      );

      if (insertError) {
        console.error("Ingredients insert error:", insertError);
        throw new Error(`Ingredients insert failed: ${insertError.message}`);
      }
    }
  }

  // Update method steps if provided
  if (updates.method !== undefined) {
    // Delete existing method steps
    const { error: deleteError } = await supabase
      .from("method")
      .delete()
      .eq("recipe_id", id);

    if (deleteError) {
      console.error("Method delete error:", deleteError);
      throw new Error(`Method delete failed: ${deleteError.message}`);
    }

    // Insert new method steps
    if (updates.method.length > 0) {
      const { error: insertError } = await supabase.from("method").insert(
        updates.method.map((step) => ({
          recipe_id: id,
          text: step.text,
          step_number: step.stepNumber,
        }))
      );

      if (insertError) {
        console.error("Method insert error:", insertError);
        throw new Error(`Method insert failed: ${insertError.message}`);
      }
    }
  }

  // Update tags if provided
  if (updates.tags !== undefined) {
    // Delete existing tag links
    const { error: deleteError } = await supabase
      .from("recipe_tag")
      .delete()
      .eq("recipe_id", id);

    if (deleteError) {
      console.error("Recipe-tag delete error:", deleteError);
      throw new Error(`Recipe-tag delete failed: ${deleteError.message}`);
    }

    // Insert new tag links
    for (const tag of updates.tags) {
      // Find or create tag
      let { data: existingTag, error: selectError } = await supabase
        .from("tag")
        .select("id")
        .eq("name", tag.name)
        .single();

      let tagId: number;

      if (selectError && selectError.code !== "PGRST116") {
        console.error("Tag select error:", selectError);
        continue;
      }

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const { data: newTag, error: insertError } = await supabase
          .from("tag")
          .insert({ name: tag.name })
          .select("id")
          .single();

        if (insertError) {
          console.error("Tag insert error:", insertError);
          continue;
        }

        tagId = newTag.id;
      }

      const { error: linkError } = await supabase
        .from("recipe_tag")
        .insert({ recipe_id: id, tag_id: tagId });

      if (linkError) {
        console.error("Recipe-tag link error:", linkError);
      }
    }
  }
}

export async function insertUserLanguage(
  userId: string,
  language: string,
  accessToken: string
): Promise<void> {
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    language,
  });

  if (error) {
    console.error("User language upsert error:", error);
    throw new Error(`User language upsert failed: ${error.message}`);
  }
}

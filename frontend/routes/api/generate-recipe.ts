import { define } from "../../utils.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

interface GeneratedRecipe {
  title: string;
  defaultServes: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  method: Array<{
    text: string;
    stepNumber: number;
  }>;
  tags: string[];
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const form = await ctx.req.formData();
      const url = form.get("url");

      if (!url) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/?error=${encodeURIComponent("'url' is required")}`,
          },
        });
      }

      // Generate recipe
      const response = await fetch("http://recipe-generator:8000/recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/?error=${encodeURIComponent(
              `Recipe generation failed: ${errorText}`
            )}`,
          },
        });
      }

      const data = await response.json();
      const recipe: GeneratedRecipe = data.result.data;
      console.log("data :>> ", data);
      // Validate recipe data
      if (
        !recipe.title ||
        !recipe.defaultServes ||
        !recipe.ingredients?.length
      ) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/?error=${encodeURIComponent(
              "Invalid recipe data received"
            )}`,
          },
        });
      }

      // Get tokens from cookie
      const accessToken = ctx.req.headers
        .get("cookie")
        ?.match(/access_token=([^;]+)/)?.[1];
      const refreshToken = ctx.req.headers
        .get("cookie")
        ?.match(/refresh_token=([^;]+)/)?.[1];

      if (!accessToken) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/?error=${encodeURIComponent("Not authenticated")}`,
          },
        });
      }

      // Validate and refresh token via auth-service
      const authResponse = await fetch(
        "http://auth-service:8000/session/validate-and-refresh",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
          }),
        }
      );

      if (!authResponse.ok) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/?error=${encodeURIComponent("Session invalid")}`,
          },
        });
      }

      const authData = await authResponse.json();
      const validToken = authData.token;

      // Set the session on the client
      await supabase.auth.setSession({
        access_token: validToken,
        refresh_token: authData.refresh_token || refreshToken,
      });

      // Insert recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipe")
        .insert({
          title: recipe.title,
          default_serves: recipe.defaultServes,
          downloaded_from: url,
          rating: 0,
        })
        .select()
        .single();
      console.log("recipeData, recipeError :>> ", recipeData, recipeError);

      if (recipeError) {
        console.error("Recipe insert error:", recipeError);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/?error=${encodeURIComponent("Failed to save recipe")}`,
          },
        });
      }

      const recipeId = recipeData.id;

      // Insert ingredients
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

      // Insert method steps
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

      return new Response(null, {
        status: 302,
        headers: {
          Location: `/?message=${encodeURIComponent(
            "Recipe generated and saved successfully"
          )}&recipeId=${recipeId}`,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/?error=${encodeURIComponent("Internal server error")}`,
        },
      });
    }
  },
});

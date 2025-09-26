import { define } from "../../utils.ts";
import {
  createErrorRedirect,
  createSuccessRedirect,
  GeneratedRecipe,
  saveGeneratedRecipe,
} from "shared";

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

      // Validate recipe data
      if (
        !recipe.title ||
        !recipe.defaultServes ||
        !recipe.ingredients?.length
      ) {
        return createErrorRedirect("Invalid recipe data received");
      }

      // Get tokens and user_id from cookie
      const accessToken = ctx.req.headers
        .get("cookie")
        ?.match(/access_token=([^;]+)/)?.[1];
      const refreshToken = ctx.req.headers
        .get("cookie")
        ?.match(/refresh_token=([^;]+)/)?.[1];
      const userId = ctx.req.headers
        .get("cookie")
        ?.match(/user_id=([^;]+)/)?.[1];

      if (!accessToken || !userId) {
        return createErrorRedirect("Not authenticated");
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
        return createErrorRedirect("Session invalid");
      }

      const authData = await authResponse.json();
      const validToken = authData.token;

      // Save recipe using shared function
      const recipeId = await saveGeneratedRecipe(
        recipe,
        url as string,
        validToken,
        userId
      );

      return createSuccessRedirect(
        "Recipe generated and saved successfully",
        recipeId
      );
    } catch (error) {
      console.error("Error:", error);
      return createErrorRedirect("Internal server error");
    }
  },
});

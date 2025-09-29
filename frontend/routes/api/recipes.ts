import { define } from "../../utils.ts";
import { createErrorRedirect, createSuccessRedirect } from "shared";

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

      // Check if authenticated
      if (!ctx.state.authenticated || !ctx.state.user) {
        return createErrorRedirect("Not authenticated");
      }

      const userId = ctx.state.user.id;

      // Get access_token from cookie
      const accessToken = ctx.req.headers
        .get("cookie")
        ?.match(/access_token=([^;]+)/)?.[1];

      if (!accessToken) {
        return createErrorRedirect("Access token missing");
      }

      const validToken = accessToken;

      // Generate and save recipe
      const response = await fetch("http://recipe-generator:8000/recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          access_token: validToken,
          user_id: userId,
        }),
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

      const recipeId = data.result.recipeId;

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

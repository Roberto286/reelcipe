import { define } from "../../../utils.ts";
import { createErrorRedirect, createSuccessRedirect } from "@reelcipe/shared";

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
      const sessionToken = ctx.state.session?.token;

      if (!sessionToken) {
        return createErrorRedirect("Session token missing");
      }

      // Generate and save recipe
      const response = await fetch("http://recipe-generator:3000/recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          session_token: sessionToken,
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

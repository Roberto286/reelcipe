import http from "node:http";
import {
  sendBadRequest,
  sendMethodNotAllowed,
  sendNotFound,
  sendUnauthorized,
} from "./http/responses.js";
import { extractBodyFromRequest } from "./lib/extract-body-from-request.js";
import { mockRecipe } from "./mock-recipe.js";
import { startRecipeGeneration } from "./recipe/processor.js";

const PORT = process.env.PORT || 3000;
const REQUIRED_ENV_VARIABLES = ["OPENAI_API_KEY", "SUPABASE_ANON_KEY"];

checkEnv();

const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

http
  .createServer(async (req, res) => {
    if (req.method !== "POST") {
      return sendMethodNotAllowed(res, req.method);
    }
    if (req.url !== "/recipe") {
      return sendNotFound(res, req.url);
    }

    let body;
    try {
      body = await extractBodyFromRequest(req);
    } catch (e) {
      console.error(e);
      return sendBadRequest(res, "body is not a valid JSON");
    }
    const url = body?.url;
    const accessToken = body?.access_token;
    const userId = body?.user_id;
    if (!url) {
      return sendBadRequest(res, "'url' is required");
    }
    if (!accessToken || !userId) {
      return sendUnauthorized(res, "Authentication required");
    }

    // Development mode: return mock data
    // if (process.env.NODE_ENV === "development") {
    //   res.writeHead(200, { "Content-Type": "application/json" });
    //   res.end(
    //     JSON.stringify({
    //       message: "Recipe generated successfully!",
    //       result: {
    //         data: mockRecipe,
    //       },
    //     })
    //   );
    //   return;
    // }

    let recipeId;
    try {
      recipeId = await startRecipeGeneration(url, accessToken, userId);
    } catch (e) {
      console.log("e :>> ", e);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Recipe generated and saved successfully!",
        result: {
          recipeId,
        },
      })
    );
  })
  .listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
  });

function checkEnv() {
  const notValidVars = REQUIRED_ENV_VARIABLES.filter((v) => {
    const envVariable = process.env[v];
    return (
      envVariable === null || envVariable === undefined || envVariable === ""
    );
  });

  if (notValidVars?.length) {
    console.error(
      `Following environment variables: 
      ${notValidVars.join(
        "\n "
      )}\nare required in order to use the program.\nMake sure to set them in your .env file`
    );
    process.exit(1);
  }
}

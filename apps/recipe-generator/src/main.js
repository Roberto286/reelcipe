import http from "node:http";
import {
  sendBadRequest,
  sendMethodNotAllowed,
  sendNotFound,
  sendUnauthorized,
} from "./http/responses.js";
import { extractBodyFromRequest } from "./lib/extract-body-from-request.js";
import { startRecipeGeneration } from "./recipe/processor.js";

const PORT = 3000;
const REQUIRED_ENV_VARIABLES = ["OPENAI_API_KEY"];

checkEnv();

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
    const sessionToken = body?.session_token;
    const userId = body?.user_id;
    if (!url) {
      return sendBadRequest(res, "'url' is required");
    }
    if (!sessionToken || !userId) {
      return sendUnauthorized(res, "Authentication required");
    }

    let recipeId;
    try {
      recipeId = await startRecipeGeneration(url, sessionToken, userId);
    } catch (e) {
      console.error("Recipe generation failed:", e.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message || "Internal Server Error" }));
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

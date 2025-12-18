import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { connectDB } from "./src/utils/db.ts";
import { auth } from "./src/auth.ts";
import recipeRoutes from "./src/routes/recipes.ts";
import tagRoutes from "./src/routes/tags.ts";
import cookbookRoutes from "./src/routes/cookbooks.ts";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3500", "http://frontend:5173"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposeHeaders: ["Set-Cookie"],
  })
);

// Health check
app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "Reelcipe Backend API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", async (c) => {
  try {
    // Test MongoDB connection
    const db = await connectDB();
    await db.admin().ping();
    return c.json({ status: "healthy", database: "connected" });
  } catch (error) {
    return c.json({ status: "unhealthy", error: String(error) }, 500);
  }
});

// Better Auth routes - handle all /api/auth/* requests
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

// Routes
app.route("/api/recipes", recipeRoutes);
app.route("/api/tags", tagRoutes);
app.route("/api/cookbooks", cookbookRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json(
    {
      error: err.message || "Internal Server Error",
    },
    500
  );
});

const port = parseInt(Deno.env.get("PORT") || "8000");

console.log(`🔥 Server is running on http://localhost:${port}`);

Deno.serve({ port }, app.fetch);

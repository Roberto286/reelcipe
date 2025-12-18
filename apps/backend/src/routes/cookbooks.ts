import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { connectDB } from "../utils/db.ts";
import { authMiddleware } from "../middleware/auth.ts";
import type { Cookbook, CookbookRecipe } from "../types/index.ts";

const cookbooks = new Hono();

// GET /api/cookbooks - List user's cookbooks
cookbooks.get("/", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const db = await connectDB();

    const cookbooksList = await db
      .collection<Cookbook>("cookbooks")
      .find({ user_id: new ObjectId(userId) })
      .sort({ created_at: -1 })
      .toArray();

    return c.json({ cookbooks: cookbooksList });
  } catch (error) {
    console.error("Get cookbooks error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/cookbooks - Create new cookbook
cookbooks.post("/", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const { name } = await c.req.json();

    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    const db = await connectDB();

    const cookbook: Cookbook = {
      name,
      user_id: new ObjectId(userId),
      created_at: new Date(),
    };

    const result = await db
      .collection<Cookbook>("cookbooks")
      .insertOne(cookbook);

    return c.json(
      {
        message: "Cookbook created successfully",
        cookbook_id: result.insertedId,
      },
      201
    );
  } catch (error) {
    console.error("Create cookbook error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/cookbooks/:id/recipes - Get recipes in a cookbook
cookbooks.get("/:id/recipes", authMiddleware, async (c) => {
  try {
    const cookbookId = c.req.param("id");
    const userId = c.get("userId");
    const db = await connectDB();

    // Verify cookbook belongs to user
    const cookbook = await db.collection<Cookbook>("cookbooks").findOne({
      _id: new ObjectId(cookbookId),
      user_id: new ObjectId(userId),
    });

    if (!cookbook) {
      return c.json({ error: "Cookbook not found" }, 404);
    }

    // Get recipes in cookbook
    const cookbookRecipes = await db
      .collection<CookbookRecipe>("cookbook_recipes")
      .find({ cookbook_id: new ObjectId(cookbookId) })
      .toArray();

    const recipeIds = cookbookRecipes.map((cr) => cr.recipe_id);
    const recipesList = await db
      .collection("recipes")
      .find({ _id: { $in: recipeIds } })
      .toArray();

    return c.json({ recipes: recipesList });
  } catch (error) {
    console.error("Get cookbook recipes error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/cookbooks/:id/recipes - Add recipe to cookbook
cookbooks.post("/:id/recipes", authMiddleware, async (c) => {
  try {
    const cookbookId = c.req.param("id");
    const userId = c.get("userId");
    const { recipe_id } = await c.req.json();

    if (!recipe_id) {
      return c.json({ error: "recipe_id is required" }, 400);
    }

    const db = await connectDB();

    // Verify cookbook belongs to user
    const cookbook = await db.collection<Cookbook>("cookbooks").findOne({
      _id: new ObjectId(cookbookId),
      user_id: new ObjectId(userId),
    });

    if (!cookbook) {
      return c.json({ error: "Cookbook not found" }, 404);
    }

    // Check if already exists
    const existing = await db
      .collection<CookbookRecipe>("cookbook_recipes")
      .findOne({
        cookbook_id: new ObjectId(cookbookId),
        recipe_id: new ObjectId(recipe_id),
      });

    if (existing) {
      return c.json({ error: "Recipe already in cookbook" }, 409);
    }

    const cookbookRecipe: CookbookRecipe = {
      cookbook_id: new ObjectId(cookbookId),
      recipe_id: new ObjectId(recipe_id),
      created_at: new Date(),
    };

    await db
      .collection<CookbookRecipe>("cookbook_recipes")
      .insertOne(cookbookRecipe);

    return c.json({ message: "Recipe added to cookbook successfully" }, 201);
  } catch (error) {
    console.error("Add recipe to cookbook error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /api/cookbooks/:id/recipes/:recipeId - Remove recipe from cookbook
cookbooks.delete("/:id/recipes/:recipeId", authMiddleware, async (c) => {
  try {
    const cookbookId = c.req.param("id");
    const recipeId = c.req.param("recipeId");
    const userId = c.get("userId");
    const db = await connectDB();

    // Verify cookbook belongs to user
    const cookbook = await db.collection<Cookbook>("cookbooks").findOne({
      _id: new ObjectId(cookbookId),
      user_id: new ObjectId(userId),
    });

    if (!cookbook) {
      return c.json({ error: "Cookbook not found" }, 404);
    }

    await db.collection("cookbook_recipes").deleteOne({
      cookbook_id: new ObjectId(cookbookId),
      recipe_id: new ObjectId(recipeId),
    });

    return c.json({ message: "Recipe removed from cookbook successfully" });
  } catch (error) {
    console.error("Remove recipe from cookbook error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /api/cookbooks/:id - Delete cookbook
cookbooks.delete("/:id", authMiddleware, async (c) => {
  try {
    const cookbookId = c.req.param("id");
    const userId = c.get("userId");
    const db = await connectDB();

    const cookbook = await db.collection<Cookbook>("cookbooks").findOne({
      _id: new ObjectId(cookbookId),
      user_id: new ObjectId(userId),
    });

    if (!cookbook) {
      return c.json({ error: "Cookbook not found" }, 404);
    }

    await Promise.all([
      db.collection("cookbooks").deleteOne({ _id: new ObjectId(cookbookId) }),
      db
        .collection("cookbook_recipes")
        .deleteMany({ cookbook_id: new ObjectId(cookbookId) }),
    ]);

    return c.json({ message: "Cookbook deleted successfully" });
  } catch (error) {
    console.error("Delete cookbook error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default cookbooks;

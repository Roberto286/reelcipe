import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { connectDB } from "../utils/db.ts";
import { authMiddleware } from "../middleware/auth.ts";
import type { Recipe, Ingredient, Method } from "../types/index.ts";

const recipes = new Hono();

// GET /api/recipes - List all recipes with pagination
recipes.get("/", authMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const skip = (page - 1) * limit;
    const userId = c.get("userId");

    const db = await connectDB();
    const recipesCol = db.collection<Recipe>("recipes");

    const [recipesList, total] = await Promise.all([
      recipesCol
        .find({ user_id: new ObjectId(userId) })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      recipesCol.countDocuments({ user_id: new ObjectId(userId) }),
    ]);

    return c.json({
      recipes: recipesList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get recipes error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/recipes/:id - Get recipe with ingredients and methods
recipes.get("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const db = await connectDB();

    const recipe = await db.collection<Recipe>("recipes").findOne({
      _id: new ObjectId(id),
      user_id: new ObjectId(userId),
    });

    if (!recipe) {
      return c.json({ error: "Recipe not found" }, 404);
    }

    const [ingredients, methods] = await Promise.all([
      db
        .collection<Ingredient>("ingredients")
        .find({ recipe_id: new ObjectId(id) })
        .toArray(),
      db
        .collection<Method>("methods")
        .find({ recipe_id: new ObjectId(id) })
        .sort({ step_number: 1 })
        .toArray(),
    ]);

    return c.json({
      ...recipe,
      ingredients,
      methods,
    });
  } catch (error) {
    console.error("Get recipe error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/recipes - Create new recipe
recipes.post("/", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const {
      title,
      image_url,
      downloaded_from,
      default_serves,
      rating,
      ingredients,
      methods,
    } = body;

    if (!title || !image_url) {
      return c.json({ error: "Title and image_url are required" }, 400);
    }

    const db = await connectDB();

    // Create recipe
    const recipe: Recipe = {
      title,
      image_url,
      downloaded_from: downloaded_from || "",
      default_serves: default_serves || 2,
      rating: rating || 0,
      user_id: new ObjectId(userId),
      created_at: new Date(),
    };

    const recipeResult = await db
      .collection<Recipe>("recipes")
      .insertOne(recipe);
    const recipeId = recipeResult.insertedId;

    // Create ingredients
    if (ingredients && Array.isArray(ingredients)) {
      const ingredientDocs = ingredients.map((ing: any) => ({
        recipe_id: recipeId,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
      }));
      await db.collection<Ingredient>("ingredients").insertMany(ingredientDocs);
    }

    // Create methods
    if (methods && Array.isArray(methods)) {
      const methodDocs = methods.map((method: any, index: number) => ({
        recipe_id: recipeId,
        step_number: method.step_number || index + 1,
        text: method.text,
        created_at: new Date(),
      }));
      await db.collection<Method>("methods").insertMany(methodDocs);
    }

    return c.json(
      {
        message: "Recipe created successfully",
        recipe_id: recipeId,
      },
      201
    );
  } catch (error) {
    console.error("Create recipe error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /api/recipes/:id - Update recipe
recipes.patch("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const updates = await c.req.json();
    const db = await connectDB();

    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.user_id;
    delete updates.created_at;

    const result = await db
      .collection<Recipe>("recipes")
      .updateOne(
        { _id: new ObjectId(id), user_id: new ObjectId(userId) },
        { $set: updates }
      );

    if (result.matchedCount === 0) {
      return c.json({ error: "Recipe not found" }, 404);
    }

    return c.json({ message: "Recipe updated successfully" });
  } catch (error) {
    console.error("Update recipe error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /api/recipes/:id - Delete recipe
recipes.delete("/:id", authMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const db = await connectDB();

    const recipeId = new ObjectId(id);

    // Delete recipe and related data
    await Promise.all([
      db
        .collection("recipes")
        .deleteOne({ _id: recipeId, user_id: new ObjectId(userId) }),
      db.collection("ingredients").deleteMany({ recipe_id: recipeId }),
      db.collection("methods").deleteMany({ recipe_id: recipeId }),
      db.collection("recipe_tags").deleteMany({ recipe_id: recipeId }),
      db.collection("cookbook_recipes").deleteMany({ recipe_id: recipeId }),
    ]);

    return c.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Delete recipe error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default recipes;

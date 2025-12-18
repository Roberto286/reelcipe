import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { connectDB } from "../utils/db.ts";
import { authMiddleware } from "../middleware/auth.ts";
import type { Tag, RecipeTag } from "../types/index.ts";

const tags = new Hono();

// GET /api/tags - List all tags
tags.get("/", authMiddleware, async (c) => {
  try {
    const db = await connectDB();
    const tagsList = await db
      .collection<Tag>("tags")
      .find({})
      .sort({ name: 1 })
      .toArray();

    return c.json({ tags: tagsList });
  } catch (error) {
    console.error("Get tags error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/tags - Create new tag
tags.post("/", authMiddleware, async (c) => {
  try {
    const { name } = await c.req.json();

    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    const db = await connectDB();
    const tagsCol = db.collection<Tag>("tags");

    // Check if tag already exists
    const existingTag = await tagsCol.findOne({ name: name.toLowerCase() });
    if (existingTag) {
      return c.json(
        { error: "Tag already exists", tag_id: existingTag._id },
        409
      );
    }

    const tag: Tag = {
      name: name.toLowerCase(),
      created_at: new Date(),
    };

    const result = await tagsCol.insertOne(tag);

    return c.json(
      {
        message: "Tag created successfully",
        tag_id: result.insertedId,
      },
      201
    );
  } catch (error) {
    console.error("Create tag error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/tags/recipe/:recipeId - Get tags for a recipe
tags.get("/recipe/:recipeId", authMiddleware, async (c) => {
  try {
    const recipeId = c.req.param("recipeId");
    const db = await connectDB();

    const recipeTags = await db
      .collection<RecipeTag>("recipe_tags")
      .find({ recipe_id: new ObjectId(recipeId) })
      .toArray();

    const tagIds = recipeTags.map((rt) => rt.tag_id);
    const tagsList = await db
      .collection<Tag>("tags")
      .find({ _id: { $in: tagIds } })
      .toArray();

    return c.json({ tags: tagsList });
  } catch (error) {
    console.error("Get recipe tags error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/tags/recipe/:recipeId - Add tag to recipe
tags.post("/recipe/:recipeId", authMiddleware, async (c) => {
  try {
    const recipeId = c.req.param("recipeId");
    const { tag_id } = await c.req.json();

    if (!tag_id) {
      return c.json({ error: "tag_id is required" }, 400);
    }

    const db = await connectDB();
    const recipeTagsCol = db.collection<RecipeTag>("recipe_tags");

    // Check if already exists
    const existing = await recipeTagsCol.findOne({
      recipe_id: new ObjectId(recipeId),
      tag_id: new ObjectId(tag_id),
    });

    if (existing) {
      return c.json({ error: "Tag already added to recipe" }, 409);
    }

    const recipeTag: RecipeTag = {
      recipe_id: new ObjectId(recipeId),
      tag_id: new ObjectId(tag_id),
      created_at: new Date(),
    };

    await recipeTagsCol.insertOne(recipeTag);

    return c.json({ message: "Tag added to recipe successfully" }, 201);
  } catch (error) {
    console.error("Add recipe tag error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /api/tags/recipe/:recipeId/:tagId - Remove tag from recipe
tags.delete("/recipe/:recipeId/:tagId", authMiddleware, async (c) => {
  try {
    const recipeId = c.req.param("recipeId");
    const tagId = c.req.param("tagId");
    const db = await connectDB();

    await db.collection("recipe_tags").deleteOne({
      recipe_id: new ObjectId(recipeId),
      tag_id: new ObjectId(tagId),
    });

    return c.json({ message: "Tag removed from recipe successfully" });
  } catch (error) {
    console.error("Remove recipe tag error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default tags;

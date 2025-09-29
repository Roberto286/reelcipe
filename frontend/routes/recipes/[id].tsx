import { define } from "../../utils.ts";
import { Head } from "fresh/runtime";
import { useEffect, useState } from "preact/hooks";
import { getRecipe, type Recipe } from "../../../shared/types/index.ts";
import { getCookies } from "jsr:@std/http/cookie";

interface Data {
  recipe?: Recipe;
  error?: string;
}

export const handler = define.handlers(async (ctx) => {
  const recipeId = +ctx.params.id;
  const accessToken = (getCookies(ctx.req.headers)).access_token;
  console.log("accessToken :>> ", accessToken);
  const recipe = await getRecipe(recipeId, accessToken);
  if (!recipe) {
    return { data: { recipe: undefined, error: "Recipe not found" } };
  }
  return { data: { recipe, error: undefined } };
});

export default define.page<typeof handler>(
  function RecipeDetail({ data }) {
    const { recipe: initialRecipe, error: initialError } = data;
    const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe || null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialError || null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form state for editing
    const [editForm, setEditForm] = useState({
      title: recipe?.title || "",
      description: "", // Not in current data, placeholder
      ingredients: recipe?.ingredients.map((ing) =>
        `${ing.quantity} ${ing.unit} ${ing.name}`
      ).join("\n") || "",
      instructions: recipe?.method.map((step) =>
        step.text
      ).join("\n\n") || "",
      prepTime: recipe?.prepTime || 0,
      cookTime: recipe?.cookTime || 0,
      servings: recipe?.defaultServes || 1,
      difficulty: recipe?.difficulty || "Medium" as const,
    });

    // Update form when recipe loads
    useEffect(() => {
      if (recipe) {
        setEditForm({
          title: recipe.title,
          description: "",
          ingredients: recipe.ingredients.map((ing) =>
            `${ing.quantity} ${ing.unit} ${ing.name}`
          ).join("\n"),
          instructions: recipe.method.map((step) => step.text).join("\n\n"),
          prepTime: recipe.prepTime || 0,
          cookTime: recipe.cookTime || 0,
          servings: recipe.defaultServes,
          difficulty: recipe.difficulty || "Medium",
        });
      }
    }, [recipe]);

    const handleEditToggle = () => {
      setIsEditing(!isEditing);
      setError(null);
      setSuccessMessage(null);
    };

    const handleCancel = () => {
      setIsEditing(false);
      setError(null);
      setSuccessMessage(null);
      // Reset form to original values
      if (recipe) {
        setEditForm({
          title: recipe.title,
          description: "",
          ingredients: recipe.ingredients.map((ing) =>
            `${ing.quantity} ${ing.unit} ${ing.name}`
          ).join("\n"),
          instructions: recipe.method.map((step) => step.text).join("\n\n"),
          prepTime: recipe.prepTime || 0,
          cookTime: recipe.cookTime || 0,
          servings: recipe.defaultServes,
          difficulty: recipe.difficulty || "Medium",
        });
      }
    };

    const handleSave = async () => {
      if (!recipe) return;

      // Basic validation
      if (!editForm.title.trim()) {
        setError("Title is required");
        return;
      }
      if (editForm.servings <= 0) {
        setError("Servings must be greater than 0");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Parse ingredients
        const ingredients = editForm.ingredients.split("\n")
          .filter((line) => line.trim())
          .map((line, index) => {
            const parts = line.trim().split(/\s+/);
            const quantity = parseFloat(parts[0]) || 0;
            const unit = parts[1] || "";
            const name = parts.slice(2).join(" ") || line;
            return { id: index + 1, recipeId: recipe.id, name, quantity, unit };
          });

        // Parse instructions
        const method = editForm.instructions.split("\n\n")
          .filter((step) => step.trim())
          .map((text, index) => ({
            id: index + 1,
            recipeId: recipe.id,
            text: text.trim(),
            stepNumber: index + 1,
          }));

        const updateData = {
          title: editForm.title.trim(),
          defaultServes: editForm.servings,
          ingredients,
          method,
          tags: recipe.tags, // Keep existing tags for now
        };

        const response = await fetch(`/api/recipes/${recipe.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update recipe");
        }

        // Update local state
        setRecipe({
          ...recipe,
          title: editForm.title.trim(),
          defaultServes: editForm.servings,
          ingredients,
          method,
        });

        setSuccessMessage("Recipe updated successfully!");
        setIsEditing(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update recipe",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (error && !recipe) {
      return (
        <div class="min-h-screen bg-base-200 flex items-center justify-center">
          <div class="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      );
    }

    if (!recipe) {
      return (
        <div class="min-h-screen bg-base-200 flex items-center justify-center">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      );
    }

    return (
      <div class="min-h-screen bg-base-200">
        <Head>
          <title>{recipe.title} - Openrecipes</title>
        </Head>

        <div class="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumb */}
          <nav class="mb-6">
            <div class="text-sm breadcrumbs">
              <ul>
                <li>
                  <a href="/">Home</a>
                </li>
                <li>
                  <a href="/recipes">Recipes</a>
                </li>
                <li>{recipe.title}</li>
              </ul>
            </div>
          </nav>

          {/* Success/Error Messages */}
          {successMessage && (
            <div class="alert alert-success mb-6">
              <span>{successMessage}</span>
            </div>
          )}
          {error && (
            <div class="alert alert-error mb-6">
              <span>{error}</span>
            </div>
          )}

          {/* Main Card */}
          <div class="card bg-base-100 shadow-xl">
            <figure class="aspect-video">
              <img
                src={`/api/image-proxy?url=${
                  encodeURIComponent(recipe.imageUrl)
                }`}
                alt={recipe.title}
                class="w-full h-full object-cover"
              />
            </figure>

            <div class="card-body">
              {/* Header */}
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h1 class="card-title text-3xl mb-2">{recipe.title}</h1>
                  <div class="flex items-center gap-4 text-sm text-base-content/70">
                    <span>⭐ {recipe.rating}/5</span>
                    <span>👥 {recipe.defaultServes} servings</span>
                    {recipe.prepTime && (
                      <span>⏱️ Prep: {recipe.prepTime}min</span>
                    )}
                    {recipe.cookTime && (
                      <span>🍳 Cook: {recipe.cookTime}min</span>
                    )}
                    {recipe.difficulty && <span>📊 {recipe.difficulty}</span>}
                  </div>
                </div>
                <button
                  class="btn btn-primary"
                  onClick={handleEditToggle}
                  disabled={isLoading}
                >
                  {isEditing ? "Cancel Edit" : "Edit"}
                </button>
              </div>

              {/* Tags */}
              <div class="flex flex-wrap gap-2 mb-6">
                {recipe.tags.map((tag) => (
                  <div key={tag.id} class="badge badge-outline">{tag.name}</div>
                ))}
              </div>

              {/* Content */}
              {isEditing
                ? (
                  /* Edit Form */
                  <div class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div class="form-control">
                        <label class="label">
                          <span class="label-text">Title</span>
                        </label>
                        <input
                          type="text"
                          class="input input-bordered"
                          value={editForm.title}
                          onInput={(e) =>
                            setEditForm({
                              ...editForm,
                              title: e.currentTarget.value,
                            })}
                        />
                      </div>

                      <div class="form-control">
                        <label class="label">
                          <span class="label-text">Servings</span>
                        </label>
                        <input
                          type="number"
                          class="input input-bordered"
                          min="1"
                          value={editForm.servings}
                          onInput={(e) =>
                            setEditForm({
                              ...editForm,
                              servings: parseInt(e.currentTarget.value) || 1,
                            })}
                        />
                      </div>

                      <div class="form-control">
                        <label class="label">
                          <span class="label-text">Prep Time (minutes)</span>
                        </label>
                        <input
                          type="number"
                          class="input input-bordered"
                          min="0"
                          value={editForm.prepTime}
                          onInput={(e) =>
                            setEditForm({
                              ...editForm,
                              prepTime: parseInt(e.currentTarget.value) || 0,
                            })}
                        />
                      </div>

                      <div class="form-control">
                        <label class="label">
                          <span class="label-text">Cook Time (minutes)</span>
                        </label>
                        <input
                          type="number"
                          class="input input-bordered"
                          min="0"
                          value={editForm.cookTime}
                          onInput={(e) =>
                            setEditForm({
                              ...editForm,
                              cookTime: parseInt(e.currentTarget.value) || 0,
                            })}
                        />
                      </div>

                      <div class="form-control">
                        <label class="label">
                          <span class="label-text">Difficulty</span>
                        </label>
                        <select
                          class="select select-bordered"
                          value={editForm.difficulty}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              difficulty: e.currentTarget.value as
                                | "Easy"
                                | "Medium"
                                | "Hard",
                            })}
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">
                          Ingredients (one per line: quantity unit name)
                        </span>
                      </label>
                      <textarea
                        class="textarea textarea-bordered h-32"
                        value={editForm.ingredients}
                        onInput={(e) =>
                          setEditForm({
                            ...editForm,
                            ingredients: e.currentTarget.value,
                          })}
                      />
                    </div>

                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">
                          Instructions (separate steps with blank lines)
                        </span>
                      </label>
                      <textarea
                        class="textarea textarea-bordered h-48"
                        value={editForm.instructions}
                        onInput={(e) =>
                          setEditForm({
                            ...editForm,
                            instructions: e.currentTarget.value,
                          })}
                      />
                    </div>

                    <div class="flex gap-4">
                      <button
                        class="btn btn-primary"
                        onClick={handleSave}
                        disabled={isLoading}
                      >
                        {isLoading
                          ? (
                            <span class="loading loading-spinner loading-sm">
                            </span>
                          )
                          : "Save"}
                      </button>
                      <button
                        class="btn btn-ghost"
                        onClick={handleCancel}
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )
                : (
                  /* Display Mode */
                  <div class="space-y-6">
                    {/* Ingredients */}
                    <div>
                      <h2 class="text-xl font-semibold mb-3">Ingredients</h2>
                      <ul class="list-disc list-inside space-y-1">
                        {recipe.ingredients.map((ingredient) => (
                          <li key={ingredient.id}>
                            {ingredient.quantity} {ingredient.unit}{" "}
                            {ingredient.name}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Instructions */}
                    <div>
                      <h2 class="text-xl font-semibold mb-3">Instructions</h2>
                      <ol class="list-decimal list-inside space-y-3">
                        {recipe.method.map((step) => (
                          <li key={step.id} class="text-base-content/80">
                            {step.text}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Additional Info */}
                    <div class="text-sm text-base-content/60">
                      <p>Downloaded from: {recipe.downloadedFrom}</p>
                      <p>
                        Created:{" "}
                        {new Date(recipe.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export type Rating = 0 | 1 | 2 | 3 | 4 | 5;

export type Ingredient = {
  id: number;
  recipeId: Recipe["id"];
  name: string;
  quantity: number;
  unit: string;
};

export type Recipe = {
  id: number;
  title: string;
  rating: Rating;
  defaultServes: number;
  downloadedFrom: string;
  cookbooks: Pick<Cookbook, "id" | "name">[];
  imageUrl: string;
  method: Method[];
  tags: Pick<Tag, "id" | "name">[];
  createdAt: string;
};

export type Recipes = Pick<Recipe, "id" | "title" | "imageUrl">[];

export type Cookbook = {
  id: number;
  name: string;
  recipes: Pick<Recipe, "id" | "title">[];
};

export type Method = {
  id: number;
  text: string;
  recipeId: Recipe["id"];
  stepNumber: number;
};

export type Tag = {
  id: number;
  name: string;
  recipes: Pick<Recipe, "id" | "title">[];
};

export interface GeneratedRecipe {
  title: string;
  defaultServes: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  method: Array<{
    text: string;
    stepNumber: number;
  }>;
  tags: string[];
}

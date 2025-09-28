import { Recipe } from "shared";

export type RecipeDashboard = Pick<
  Recipe,
  "id" | "imageUrl" | "title" | "rating" | "defaultServes" | "tags"
>;

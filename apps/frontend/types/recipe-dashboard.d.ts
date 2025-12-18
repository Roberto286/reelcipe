import { Recipe } from "@reelcipe/shared";

export type RecipeDashboard = Pick<
  Recipe,
  "id" | "imageUrl" | "title" | "rating" | "defaultServes" | "tags"
>;

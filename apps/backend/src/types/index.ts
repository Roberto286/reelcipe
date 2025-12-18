import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  email: string;
  password_hash: string;
  language?: string;
  created_at: Date;
}

export interface Recipe {
  _id?: ObjectId;
  title: string;
  image_url: string;
  downloaded_from: string;
  default_serves: number;
  rating: number;
  user_id: ObjectId;
  created_at: Date;
}

export interface Ingredient {
  _id?: ObjectId;
  recipe_id: ObjectId;
  name: string;
  quantity: number;
  unit: string;
}

export interface Method {
  _id?: ObjectId;
  recipe_id: ObjectId;
  step_number: number;
  text: string;
  created_at: Date;
}

export interface Tag {
  _id?: ObjectId;
  name: string;
  created_at: Date;
}

export interface RecipeTag {
  _id?: ObjectId;
  recipe_id: ObjectId;
  tag_id: ObjectId;
  created_at: Date;
}

export interface Cookbook {
  _id?: ObjectId;
  name: string;
  user_id: ObjectId;
  created_at: Date;
}

export interface CookbookRecipe {
  _id?: ObjectId;
  cookbook_id: ObjectId;
  recipe_id: ObjectId;
  created_at: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface RefreshToken {
  _id?: ObjectId;
  user_id: ObjectId;
  token: string;
  created_at: Date;
  last_used: Date;
}

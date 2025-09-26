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

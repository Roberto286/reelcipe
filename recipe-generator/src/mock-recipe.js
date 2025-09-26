export const mockRecipe = {
  title: "Almond Ricotta",
  defaultServes: 4,
  ingredients: [
    { name: "almonds", quantity: 200, unit: "grams" },
    { name: "water", quantity: 1, unit: "liter" },
    { name: "lemon juice", quantity: 40, unit: "grams" },
    { name: "salt", quantity: 1, unit: "pinch" },
  ],
  method: [
    {
      text: "Soak the almonds in cold water for 4-5 hours or in boiling water for 30-40 minutes.",
      stepNumber: 1,
    },
    {
      text: "After soaking, rinse the almonds and blend them with 500 ml of water until smooth.",
      stepNumber: 2,
    },
    {
      text: "Add another 500 ml of water to the blended mixture.",
      stepNumber: 3,
    },
    {
      text: "Heat the mixture on the stove, but turn off the heat before it boils.",
      stepNumber: 4,
    },
    {
      text: "Pour the mixture into a glass bowl, add the lemon juice, stir, and cover.",
      stepNumber: 5,
    },
    {
      text: "Let it sit for about 30 minutes to curdle.",
      stepNumber: 6,
    },
    {
      text: "Place a cloth that doesn't smell of detergent over a colander and pour the curdled mixture to drain.",
      stepNumber: 7,
    },
    { text: "Add a pinch of salt and mix well.", stepNumber: 8 },
    {
      text: "Transfer to a ricotta mold to drain any remaining whey.",
      stepNumber: 9,
    },
    {
      text: "Serve as desired, but do not call it ricotta.",
      stepNumber: 10,
    },
  ],
  tags: ["vegan", "dairy-free", "easy", "30-minutes"],
};

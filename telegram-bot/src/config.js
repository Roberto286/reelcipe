export const RECIPE_GENERATOR_BASE_URL = process.env.RUNNER === "docker"
    ? process.env.RECIPE_GENERATOR_BASE_URL_DOCKER
    : process.env.RECIPE_GENERATOR_BASE_URL_LOCAL;

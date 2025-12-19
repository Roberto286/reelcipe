import { extractIngredients } from "../ai/ingredients-extractor.js";
import { generateRecipe } from "../ai/recipe-generator.js";
import { transcribeAudio } from "../ai/transcriber.js";
import { extractAudioFrom } from "../audio/processor.js";
import { Status } from "../enum/status.enum.js";
import { downloadVideo } from "../video/processor.js";

export async function startRecipeGeneration(url, sessionToken, userId) {
  const videoInfo = await downloadVideo(url);

  if (videoInfo.status === Status.ERROR) {
    throw new Error("Video downloading failed");
  }

  const audioFilePath = await extractAudioFrom(videoInfo.filepath);

  if (!audioFilePath) {
    throw new Error("Audio extracting failed");
  }

  const { status, transcribedAudio } = await transcribeAudio(audioFilePath);
  if (status === Status.ERROR || !transcribedAudio) {
    throw new Error("Audio transcription failed");
  }
  const { description, comments } = videoInfo.metadata;

  const ingredients = await extractIngredients(transcribedAudio, {
    description,
    comments,
  });

  const { recipe, metadata } = await generateRecipe(transcribedAudio, {
    description,
    comments,
    ingredients,
  });

  const generatedRecipe = {
    ...recipe,
    thumbnailUrl: videoInfo.metadata.thumbnailUrl,
  };

  // Save recipe to database via backend API
  const recipeId = await saveGeneratedRecipe(
    generatedRecipe,
    url,
    sessionToken,
    userId
  );

  return recipeId;
}

export async function saveGeneratedRecipe(
  generatedRecipe,
  url,
  sessionToken,
  userId
) {
  const backendUrl = process.env.BACKEND_URL || "http://backend:8000";

  const response = await fetch(`${backendUrl}/api/recipes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({
      ...generatedRecipe,
      downloadedFrom: url,
      userId: userId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save recipe: ${response.statusText}`);
  }

  const data = await response.json();
  return data.id;
}

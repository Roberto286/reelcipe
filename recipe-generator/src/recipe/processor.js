import { extractIngredients } from "../ai/ingredients-extractor.js";
import { generateRecipe } from "../ai/recipe-generator.js";
import { transcribeAudio } from "../ai/transcriber.js";
import { extractAudioFrom } from "../audio/processor.js";
import { Status } from "../enum/status.enum.js";
import { downloadVideo } from "../video/processor.js";

export async function startRecipeGeneration(url) {
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

  console.log("recipe, metadata :>> ", recipe, metadata);

  return recipe;
}

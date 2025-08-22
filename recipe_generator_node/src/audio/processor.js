import { spawnAsync } from "../lib/spawn-async.js";

export async function extractAudioFrom(videoPath) {
  //Anche qui non avevo sbatti di riscrivere la logica per estrarre l'audio allora ho importato lo script in python
  const { stdout } = await spawnAsync("python", [
    "-u",
    "src/audio/extractor.py",
    videoPath,
  ]);
  const audioFilePath = extractAudioFilePathFrom(stdout);

  return audioFilePath;
}

function extractAudioFilePathFrom(stdout) {
  const startIndex = stdout.indexOf("%SFP");
  const endIndex = stdout.indexOf("%EFP");
  return stdout.substring(startIndex + 4, endIndex);
}

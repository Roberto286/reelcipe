import { Status } from "../enum/status.enum.js";
import { spawnAsync } from "../lib/spawn-async.js";

export async function downloadVideo(url) {
  const { stdout } = await spawnAsync("python3", [
    "-u",
    "src/video/downloader.py",
    url,
  ]);
  //Non avevo sbatti di implementare il download del video in node quindi ho importato il downloader dalla versione in python e lo richiamiamo da qui

  const downloadedVideoInfo = JSON.parse(stdout);

  if (downloadedVideoInfo.status === Status.ERROR) {
    return { status: downloadedVideoInfo.status };
  }
  return {
    status: Status.SUCCESS,
    metadata: extractMetadataFrom(downloadedVideoInfo),
    filepath: downloadedVideoInfo.filepath,
  };
}

function extractMetadataFrom(info) {
  return {
    description: info.description,
    id: info.display_id,
    comments: info.comments.map(({ author, text }) => ({
      author,
      text,
    })),
  };
}

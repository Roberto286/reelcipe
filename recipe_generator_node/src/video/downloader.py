import sys
import os
import yt_dlp
import json

url = sys.argv[1] if len(sys.argv) > 1 else None

def download_video(url, output_path="files/videos") -> dict:
    """
    Downloads a video from the given url and saves it to the specified output path.

    Args:
      url (str): The url of the video to download.
      output_path (str): The path where the downloaded video will be saved. Defaults to "files/videos".

    Returns:
      dict: A dictionary containing downloaded video's info.

    Examples:
      >>> download_video("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
      {'status': 'success', 'metadata': {'title': 'Rick Astley - Never Gonna Give You Up (Video)', 'description': 'Rick Astley\'s official music video for “Never Gonna Give You Up” Listen to Rick Astley: https://RickAstley.lnk.to/_listenYD Subscribe to the official Rick As...'}, 'filepath': 'files/videos/dQw4w9WgXcQ.mp4'}
    """
    if not os.path.exists(output_path):
        os.makedirs(output_path)

    ydl_opts = {
        "format": "best",
        "outtmpl": os.path.join(output_path, "%(id)s.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "noprogress": True
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=True)
            # Get the output file path
            filename = ydl.prepare_filename(info)
            info["filepath"] = filename
            return json.dumps(info)
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}

print(download_video(url))
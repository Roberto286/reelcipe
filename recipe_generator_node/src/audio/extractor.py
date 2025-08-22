from moviepy import VideoFileClip

import os
from pathlib import Path
import subprocess
import sys

video_path = sys.argv[1] if len(sys.argv) > 1 else None

def extract_audio_from_video(video_path: str, output_path="files/audios") -> str:
    """
    Extracts audio from a video file, cleans it using ffmpeg, and saves it to the specified output path.

    Args:
        video_path (str): Path to the input video file.
        output_path (str): Path where the extracted audio will be saved.

    Returns:
        str: Path to the saved and cleaned audio file.
    """

    if not os.path.exists(output_path):
        os.makedirs(output_path)

    # Load the video file
    video = VideoFileClip(video_path)

    # Extract audio
    audio = video.audio

    # Save the raw audio file
    raw_audio_file_path = f"{output_path}/{Path(video_path).stem}_raw.mp3"
    audio.write_audiofile(raw_audio_file_path)

    # Clean the audio using ffmpeg
    cleaned_audio_file_path = f"{output_path}/{Path(video_path).stem}.mp3"
    ffmpeg_cmd = [
        "ffmpeg",
        "-y",  # Overwrite output files without asking
        "-hide_banner",
        "-loglevel",
        "panic",
        "-i",
        raw_audio_file_path,
        "-ac",
        "1",
        "-ar",
        "16000",
        cleaned_audio_file_path,
    ]
    subprocess.run(ffmpeg_cmd, check=True)

    # Remove the raw audio file
    os.remove(raw_audio_file_path)

    # Close the video and audio objects
    video.close()
    audio.close()

    return f"%SFP{cleaned_audio_file_path}%EFP" #Aggiungo dei placeholder per estrarre poi il path  

print(extract_audio_from_video(video_path)) 
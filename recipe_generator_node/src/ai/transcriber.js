import { createReadStream } from "node:fs";
import axios from "axios";
import FormData from "form-data";
import { Status } from "../enum/status.enum.js";

export async function transcribeAudio(audioFilePath) {
  const form = new FormData();

  form.append("file", createReadStream(audioFilePath));
  form.append("model", "whisper-1");

  try {
    const res = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      form,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...form.getHeaders(),
        },
      },
    );

    return {
      status: Status.SUCCESS,
      transcribedAudio: res.data.text,
    };
  } catch (err) {
    console.error("Errore:", err.response?.data || err.message);
    return {
      status: Status.ERROR,
      message: err.response?.data || err.message,
    };
  }
}

import "server-only";
import OpenAI from "openai";

let client: OpenAI | null = null;

/** Cliente de OpenAI (GPT-4o Vision + Whisper). Solo servidor. */
export function getOpenAI(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta OPENAI_API_KEY en el entorno.");
  }
  client = new OpenAI({ apiKey });
  return client;
}

export const VISION_MODEL = "gpt-4o";
export const WHISPER_MODEL = "whisper-1";

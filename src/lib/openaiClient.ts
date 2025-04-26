import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[MCP ERROR] OpenAI API Key is missing!");
      throw new Error("OpenAI API Key is missing!");
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.error("[MCP DEBUG] OpenAI client initialized successfully.");
  }
  return openaiInstance;
}

import { config } from "../config";
import { AiProvider } from "./types";
import { openAiProvider } from "./providers/openai.provider";
import { anthropicProvider } from "./providers/anthropic.provider";
import { geminiProvider } from "./providers/gemini.provider";
import { groqProvider } from "./providers/groq.provider";
import { mockProvider } from "./providers/mock.provider";

export function getAiProvider(): AiProvider {
  switch (config.AI_PROVIDER) {
    case "openai":
      return openAiProvider;
    case "anthropic":
      return anthropicProvider;
    case "gemini":
      return geminiProvider;
    case "groq":
      return groqProvider;
    case "mock":
      return mockProvider;
    default: {
      const exhaustiveCheck: never = config.AI_PROVIDER;
      throw new Error(`Unknown AI_PROVIDER: ${exhaustiveCheck}`);
    }
  }
}

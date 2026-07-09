import OpenAI from "openai";
import { config } from "../../config";
import { buildSystemPrompt, buildUserPrompt } from "../prompts";
import { AiProvider, CrmBatchResponseSchema, RawRow } from "../types";

/**
 * Groq hosts open-weight models (Llama, Gemma, ...) behind an API that's
 * intentionally OpenAI-compatible, so the same `openai` SDK works here —
 * only the base URL and key change. This is the option worth reaching for
 * if you want $0: no payment method required, generous free-tier limits.
 *
 * One real difference from the OpenAI/Anthropic/Gemini providers: this uses
 * plain `json_object` mode, not a strict schema. Groq's compatibility layer
 * doesn't reliably guarantee OpenAI's newer strict `json_schema` structured
 * outputs, so nothing here assumes the response is already well-formed —
 * it's parsed and then run through the same Zod validation every provider
 * goes through (see extraction.service.ts), and a malformed response is
 * treated as a normal failure, which the existing per-batch retry already
 * handles. The prompt's explicit envelope instruction is what's actually
 * carrying the schema for this provider, not an API-level guarantee.
 */
let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: config.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return client;
}

export const groqProvider: AiProvider = {
  name: "groq",

  async extractBatch(rows: RawRow[], startIndex: number) {
    const completion = await getClient().chat.completions.create({
      model: config.GROQ_MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(rows, startIndex) },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Groq returned an empty response for this batch.");
    }

    const json: unknown = JSON.parse(content);
    const validated = CrmBatchResponseSchema.parse(json);
    return validated.records;
  },
};

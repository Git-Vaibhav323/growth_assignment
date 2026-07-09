import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config";
import { buildSystemPrompt, buildUserPrompt } from "../prompts";
import {
  AiProvider,
  CRM_STATUS_VALUES,
  CrmBatchResponseSchema,
  DATA_SOURCE_VALUES,
  RawRow,
} from "../types";

const CRM_FIELD_KEYS = [
  "row_index",
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
] as const;

const EXTRACT_TOOL_NAME = "submit_crm_batch";

/**
 * Claude doesn't have a "strict json_schema" response mode the way OpenAI
 * does, so structured output is produced by forcing a single, specific tool
 * call (tool_choice) whose input_schema is the shape we want. This is the
 * standard, reliable pattern for structured extraction with Claude models.
 */
const extractTool: Anthropic.Tool = {
  name: EXTRACT_TOOL_NAME,
  description: "Submit the extracted GrowEasy CRM records for this batch of CSV rows.",
  input_schema: {
    type: "object",
    properties: {
      records: {
        type: "array",
        items: {
          type: "object",
          properties: {
            row_index: { type: "integer" },
            created_at: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            country_code: { type: "string" },
            mobile_without_country_code: { type: "string" },
            company: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            country: { type: "string" },
            lead_owner: { type: "string" },
            crm_status: { type: "string", enum: [...CRM_STATUS_VALUES] },
            crm_note: { type: "string" },
            data_source: { type: "string", enum: [...DATA_SOURCE_VALUES, ""] },
            possession_time: { type: "string" },
            description: { type: "string" },
          },
          required: [...CRM_FIELD_KEYS],
        },
      },
    },
    required: ["records"],
  },
};

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  return client;
}

export const anthropicProvider: AiProvider = {
  name: "anthropic",

  async extractBatch(rows: RawRow[], startIndex: number) {
    const message = await getClient().messages.create({
      model: config.ANTHROPIC_MODEL,
      max_tokens: 8192,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: buildUserPrompt(rows, startIndex) }],
      tools: [extractTool],
      tool_choice: { type: "tool", name: EXTRACT_TOOL_NAME },
    });

    const toolUseBlock = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    if (!toolUseBlock) {
      throw new Error("Claude did not return a tool call for this batch.");
    }

    const validated = CrmBatchResponseSchema.parse(toolUseBlock.input);
    return validated.records;
  },
};

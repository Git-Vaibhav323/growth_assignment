import OpenAI from "openai";
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

/**
 * Hand-written (not derived from the zod schema) so it exactly matches the
 * subset of JSON Schema that OpenAI's strict mode accepts: every property
 * listed in `required`, `additionalProperties: false` at every object level.
 * The zod schema in ai/types.ts remains the source of truth for *validating*
 * whatever comes back — this is what shapes what comes back in the first
 * place.
 */
const crmBatchJsonSchema = {
  name: "crm_batch_extraction",
  strict: true,
  schema: {
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
          additionalProperties: false,
        },
      },
    },
    required: ["records"],
    additionalProperties: false,
  },
} as const;

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  return client;
}

export const openAiProvider: AiProvider = {
  name: "openai",

  async extractBatch(rows: RawRow[], startIndex: number) {
    const completion = await getClient().chat.completions.create({
      model: config.OPENAI_MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(rows, startIndex) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: crmBatchJsonSchema,
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned an empty response for this batch.");
    }

    const json: unknown = JSON.parse(content);
    const validated = CrmBatchResponseSchema.parse(json);
    return validated.records;
  },
};

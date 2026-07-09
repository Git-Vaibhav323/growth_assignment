import { GoogleGenAI, Type } from "@google/genai";
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

// Gemini's schema format is OpenAPI-flavored, not plain JSON Schema: types
// are the uppercase `Type` enum, and an enum constraint needs both
// `format: "enum"` and `enum: [...]` together (`enum` alone is ignored).
const stringField = { type: Type.STRING };
const crmRecordSchema = {
  type: Type.OBJECT,
  properties: {
    row_index: { type: Type.INTEGER },
    created_at: stringField,
    name: stringField,
    email: stringField,
    country_code: stringField,
    mobile_without_country_code: stringField,
    company: stringField,
    city: stringField,
    state: stringField,
    country: stringField,
    lead_owner: stringField,
    crm_status: { type: Type.STRING, format: "enum", enum: [...CRM_STATUS_VALUES] },
    crm_note: stringField,
    data_source: { type: Type.STRING, format: "enum", enum: [...DATA_SOURCE_VALUES, ""] },
    possession_time: stringField,
    description: stringField,
  },
  required: [...CRM_FIELD_KEYS],
  propertyOrdering: [...CRM_FIELD_KEYS],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: { records: { type: Type.ARRAY, items: crmRecordSchema } },
  required: ["records"],
};

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  return client;
}

export const geminiProvider: AiProvider = {
  name: "gemini",

  async extractBatch(rows: RawRow[], startIndex: number) {
    const response = await getClient().models.generateContent({
      model: config.GEMINI_MODEL,
      contents: buildUserPrompt(rows, startIndex),
      config: {
        systemInstruction: buildSystemPrompt(),
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response for this batch.");
    }

    const json: unknown = JSON.parse(text);
    const validated = CrmBatchResponseSchema.parse(json);
    return validated.records;
  },
};

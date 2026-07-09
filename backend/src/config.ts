import "dotenv/config";
import { z } from "zod";

/**
 * All runtime configuration is validated once, at boot. If something required
 * is missing or malformed, the process exits immediately with a clear message
 * instead of failing confusingly later, mid-request.
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Comma-separated list of allowed frontend origins for CORS.
  // e.g. "http://localhost:3000,http://localhost:3001"
  FRONTEND_URL: z.string().default("http://localhost:3000,http://localhost:3001"),

  // "mock" needs no API key and is the default so the project runs out of the
  // box. Switch to "openai" or "anthropic" (with the matching key) for real
  // AI-powered extraction — see README.md.
  AI_PROVIDER: z.enum(["openai", "anthropic", "gemini", "groq", "mock"]).default("mock"),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),

  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5"),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),

  // How many CSV rows are sent to the AI model per request.
  BATCH_SIZE: z.coerce.number().int().positive().default(20),
  // How many batches are allowed to be in flight at once.
  AI_CONCURRENCY: z.coerce.number().int().positive().default(3),
  // Retries per batch before it's marked as failed (rows in it are skipped
  // with a reason, the rest of the import continues).
  AI_MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),

  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("\n❌ Invalid environment variables:\n");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error("\nCheck backend/.env against backend/.env.example and try again.\n");
  process.exit(1);
}

export const config = parsed.data;

// A provider selection without its key would only fail once the first CSV is
// uploaded. Fail at boot instead, where it's obvious.
if (config.AI_PROVIDER === "openai" && !config.OPENAI_API_KEY) {
  console.error("\n❌ AI_PROVIDER=openai but OPENAI_API_KEY is not set. Add it to backend/.env.\n");
  process.exit(1);
}
if (config.AI_PROVIDER === "anthropic" && !config.ANTHROPIC_API_KEY) {
  console.error("\n❌ AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set. Add it to backend/.env.\n");
  process.exit(1);
}
if (config.AI_PROVIDER === "gemini" && !config.GEMINI_API_KEY) {
  console.error("\n❌ AI_PROVIDER=gemini but GEMINI_API_KEY is not set. Add it to backend/.env.\n");
  process.exit(1);
}
if (config.AI_PROVIDER === "groq" && !config.GROQ_API_KEY) {
  console.error("\n❌ AI_PROVIDER=groq but GROQ_API_KEY is not set. Add it to backend/.env.\n");
  process.exit(1);
}

export type AppConfig = typeof config;

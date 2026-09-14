import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ML_API_BASE_URL: z.string().url().default("http://localhost:8000"),
  ML_API_TIMEOUT_MS: z.string().default("5000").transform((val) => parseInt(val, 10)),
  DB_PATH: z.string().default("./data/ew_scheduler.db"),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
  USE_MOCK_ML: z.string().default("true").transform((val) => val.toLowerCase() === "true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  mlApiBaseUrl: parsed.data.ML_API_BASE_URL,
  mlApiTimeoutMs: parsed.data.ML_API_TIMEOUT_MS,
  dbPath: parsed.data.DB_PATH,
  frontendOrigin: parsed.data.FRONTEND_ORIGIN,
  useMockMl: parsed.data.USE_MOCK_ML,
};

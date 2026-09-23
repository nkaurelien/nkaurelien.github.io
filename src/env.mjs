import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Type-safe, validated environment variables (t3-env).
 *
 * Incremental adoption: this currently covers the RAG chat pipeline
 * (LLM providers + Postgres/pgvector). Other vars (Firebase…) still read
 * process.env directly and can be migrated here over time.
 *
 * - `emptyStringAsUndefined: true` turns `FOO=""` into `undefined`, so an
 *   empty key doesn't masquerade as "set" (the exact trap we hit earlier).
 * - Set `SKIP_ENV_VALIDATION=1` to bypass validation (e.g. Docker builds).
 */
export const env = createEnv({
  server: {
    // LLM providers — both optional; the chat route requires at least one at runtime.
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    GEMINI_API_KEY: z.string().min(1).optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
    GEMINI_API_PROJET: z.string().optional(),
    // Default LLM for the RAG chat when the request doesn't specify one.
    CHAT_LLM_PROVIDER: z.enum(['claude', 'gemini']).default('gemini'),
    // Postgres + pgvector (Neon) — URL poolée pour le RAG et Prisma.
    DATABASE_URL: z.string().startsWith('postgres'),
  },
  client: {},
  // Next.js only bundles explicitly-referenced env vars, so map each one.
  runtimeEnv: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GEMINI_API_PROJET: process.env.GEMINI_API_PROJET,
    CHAT_LLM_PROVIDER: process.env.CHAT_LLM_PROVIDER,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

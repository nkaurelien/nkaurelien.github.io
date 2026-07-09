import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Type-safe, validated environment variables (t3-env).
 *
 * Incremental adoption: this currently covers the RAG chat pipeline
 * (LLM providers + Supabase). Other vars (Firebase, Prisma…) still read
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
  },
  client: {
    // Supabase (used by the RAG route + client). URL-validated + required.
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  },
  // Next.js only bundles explicitly-referenced env vars, so map each one.
  runtimeEnv: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GEMINI_API_PROJET: process.env.GEMINI_API_PROJET,
    CHAT_LLM_PROVIDER: process.env.CHAT_LLM_PROVIDER,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { anthropic } from '@genkit-ai/anthropic';
import { createClient } from '@supabase/supabase-js';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';
import { env } from '@/env';

// 1. Initialize Supabase Client
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Initialize Genkit — only register a provider when its API key is present.
// (The Anthropic plugin throws at construction if no key, which would crash the
//  whole route even when you only intend to use Gemini.)
const geminiApiKey = env.GEMINI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY;
const anthropicApiKey = env.ANTHROPIC_API_KEY;

const plugins = [];
// LLM provider registry — each entry lazily builds a Genkit model reference.
const LLM_PROVIDERS = {};

if (geminiApiKey) {
  plugins.push(googleAI({ apiKey: geminiApiKey }));
  LLM_PROVIDERS.gemini = {
    label: 'Gemini',
    model: () => googleAI.model('gemini-2.5-flash'),
  };
}

if (anthropicApiKey) {
  plugins.push(anthropic({ apiKey: anthropicApiKey }));
  LLM_PROVIDERS.claude = {
    label: 'Claude',
    model: () => anthropic.model('claude-sonnet-4-6'),
  };
}

const ai = genkit({ plugins });

const AVAILABLE_PROVIDERS = Object.keys(LLM_PROVIDERS);

// Default provider: honour CHAT_LLM_PROVIDER when its key is configured,
// otherwise fall back to the first available provider.
const DEFAULT_PROVIDER = LLM_PROVIDERS[env.CHAT_LLM_PROVIDER] ? env.CHAT_LLM_PROVIDER : AVAILABLE_PROVIDERS[0];

// Resolve a requested provider name to a valid registry key, falling back to the default.
const resolveProviderKey = requested => (LLM_PROVIDERS[requested] ? requested : DEFAULT_PROVIDER);

// Stream a completion, trying each provider in order. If a provider fails BEFORE
// emitting any token (503/overload/auth/credit errors), transparently fall back to
// the next available provider. Once tokens have started flowing we can't switch, so a
// mid-stream failure is surfaced as an error. If every provider fails before producing
// output, a friendly message is streamed instead of leaving the UI broken.
const streamWithFallback = async (writer, { providerKeys, systemPrompt, genkitMessages }) => {
  const textId = 'text-0';
  let started = false;
  let lastError;

  for (const key of providerKeys) {
    const provider = LLM_PROVIDERS[key];
    if (!provider) continue;
    try {
      console.log(`[Genkit BFF] Trying provider: ${provider.label}...`);
      const responseStream = await ai.generateStream({
        model: provider.model(),
        system: systemPrompt,
        messages: genkitMessages,
      });

      let fullText = '';
      for await (const chunk of responseStream.stream) {
        if (chunk.text) {
          if (!started) {
            writer.write({ type: 'text-start', id: textId });
            started = true;
          }
          fullText += chunk.text;
          writer.write({ type: 'text-delta', id: textId, delta: chunk.text });
        }
      }

      if (started) writer.write({ type: 'text-end', id: textId });
      console.log(`[Genkit BFF] ${provider.label} responded (${fullText.length} chars).`);
      return; // success
    } catch (err) {
      lastError = err;
      console.error(`[Genkit BFF] ${provider.label} failed: ${err?.message || err}`);
      if (started) {
        // Partial output already sent — cannot cleanly switch providers.
        writer.write({ type: 'text-end', id: textId });
        throw err; // surfaced to the client via onError
      }
      // Nothing emitted yet → try the next provider.
    }
  }

  // Every provider failed before producing output — stream a graceful message.
  console.error(`[Genkit BFF] All providers failed. Last error: ${lastError?.message || lastError}`);
  const fallbackMsg =
    "Désolé, l'assistant est momentanément indisponible (forte demande sur le service d'IA). Merci de réessayer dans quelques instants.";
  writer.write({ type: 'text-start', id: textId });
  writer.write({ type: 'text-delta', id: textId, delta: fallbackMsg });
  writer.write({ type: 'text-end', id: textId });
};

// 3. Initialize LangChain Embeddings provider (matching our database vector size 384)
const embeddings = new HuggingFaceTransformersEmbeddings({
  model: 'Xenova/all-MiniLM-L6-v2',
});

export const runtime = 'nodejs'; // Use nodejs environment to allow ONNX runtime execution

// Extract text from a raw content value (string, or array of string/{text} parts)
const contentToText = value => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map(part => {
        if (!part) return '';
        if (typeof part === 'string') return part;
        if (typeof part === 'object') return part.text || '';
        return '';
      })
      .join('');
  }
  return '';
};

// Safely extract text from a message in either format:
// - legacy `{ content: string | array }`
// - Vercel AI SDK v5 UI message `{ parts: [{ type: 'text', text }] }`
const getMessageText = message => {
  if (!message) return '';
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return contentToText(message);
  if (message.content !== undefined && message.content !== null) return contentToText(message.content);
  if (Array.isArray(message.parts)) {
    return message.parts.map(part => (part && part.type === 'text' ? part.text || '' : '')).join('');
  }
  return '';
};

export async function POST(req) {
  try {
    const { messages, provider: requestedProvider } = await req.json();
    if (AVAILABLE_PROVIDERS.length === 0) {
      return new Response(JSON.stringify({ error: 'No LLM provider configured. Set GEMINI_API_KEY and/or ANTHROPIC_API_KEY.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Ordered list of providers to try: the active one first, then the others as fallbacks.
    const activeKey = resolveProviderKey(requestedProvider);
    const providerKeys = [activeKey, ...AVAILABLE_PROVIDERS.filter(k => k !== activeKey)];
    const latestMessageText = getMessageText(messages[messages.length - 1]);

    let context = '';

    if (latestMessageText.trim().length > 0) {
      console.log(`[Genkit BFF] Calculating query embedding for: "${latestMessageText}"`);
      // Compute 384-dim embedding for user query
      const queryVector = await embeddings.embedQuery(latestMessageText);

      console.log('[Genkit BFF] Querying matching embeddings in Supabase...');
      // Run similarity match on pgvector
      const { data: documents, error } = await supabase.rpc('match_embeddings', {
        query_embedding: `[${queryVector.join(',')}]`,
        match_threshold: 0.15,
        match_count: 5,
      });

      if (error) {
        console.error('[Genkit BFF] Supabase RPC error:', error);
      } else if (documents && documents.length > 0) {
        console.log(`[Genkit BFF] Found ${documents.length} matching content chunks.`);
        context = documents.map(doc => `- Context (from ${doc.slug || 'profile'}): ${doc.text_chunk}`).join('\n\n');
      } else {
        console.log('[Genkit BFF] No matching context chunks found.');
      }
    }

    // 4. Construct System Prompt
    const systemPrompt = `Tu es "Jamila", l'assistante IA d'Astrid-Aurélien NKUMBE ENONGENE (Aurélien). Aurélien est un Développeur'Ops fullstack polyvalent avec plus de 7 ans d'expérience dans le DevSecOps, SysOps, la Data et l'IA.
Tu réponds aux questions des visiteurs (recruteurs, confrères, clients) sur son parcours, ses compétences et ses projets de manière professionnelle, chaleureuse, humble mais confiante.
Réponds de préférence dans la même langue que la question de l'utilisateur (français ou anglais).

Utilise UNIQUEMENT les informations de contexte fournies ci-dessous pour répondre aux questions concernant Aurélien. Si le contexte ne contient pas l'information demandée, réponds poliment que tu ne disposes pas de cette information précise mais propose de parler de son parcours général ou redirige-les vers sa page contact.

Voici les informations sur lui (contexte récupéré de ses projets et de son histoire) :
==================================
${context || "Aucune information contextuelle spécifique trouvée en base de données. Réponds de façon générale sur le profil de développeur d'Aurélien."}
==================================`;

    // 5. Convert messages to Genkit format, skipping any empty ones
    // (empty text parts are rejected by the Anthropic/Genkit plugin).
    const genkitMessages = messages
      .map(m => {
        let role = 'user';
        if (m.role === 'assistant') role = 'model';
        if (m.role === 'system') role = 'system';
        return { role, text: getMessageText(m) };
      })
      .filter(m => m.text.trim().length > 0)
      .map(m => ({ role: m.role, content: [{ text: m.text }] }));

    // 6. Bridge Genkit to the Vercel AI SDK UI Message Stream protocol, with provider
    // fallback. The client (useChat) needs a text part framed as text-start -> text-delta -> text-end;
    // streamWithFallback handles that and transparently retries on another provider if the
    // first one fails before producing output (e.g. Gemini 503 / Claude credit or auth errors).
    console.log(`[Genkit BFF] Provider order: ${providerKeys.join(' -> ')}`);
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        await streamWithFallback(writer, { providerKeys, systemPrompt, genkitMessages });
      },
      onError: error => {
        // Only reached if a provider fails MID-stream (after partial output).
        console.error('[Genkit BFF] Stream error (mid-stream):', error);
        return error instanceof Error ? error.message : String(error);
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    console.error('Error in /api/chat route:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

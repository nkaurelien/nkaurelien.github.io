import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { chatFlow } from '@/genkit/chatFlow';
import { AVAILABLE_PROVIDERS } from '@/genkit/ai';
import { getMessageText } from '@/genkit/messages';

export const runtime = 'nodejs'; // ONNX runtime (embeddings) nécessite Node.
// Marge pour le cold start (1er appel télécharge le modèle d'embedding ~90 Mo dans /tmp).
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { messages = [], provider } = await req.json();

    if (AVAILABLE_PROVIDERS.length === 0) {
      return new Response(JSON.stringify({ error: 'No LLM provider configured. Set GEMINI_API_KEY and/or ANTHROPIC_API_KEY.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Construit l'input du flow depuis les messages Vercel AI SDK (format `parts`).
    const query = getMessageText(messages[messages.length - 1]);
    const history = messages
      .slice(0, -1)
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', text: getMessageText(m) }))
      .filter(m => m.text.trim().length > 0);

    // Exécute le flow Genkit (RAG + génération + fallback) en streaming.
    const { stream: flowStream } = chatFlow.stream({ query, provider, history });

    // Bridge le flux texte du flow vers le protocole UI Message Stream (v5) de useChat :
    // text-start -> text-delta(s) -> text-end.
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const textId = 'text-0';
        let started = false;
        for await (const chunk of flowStream) {
          if (typeof chunk === 'string' && chunk.length > 0) {
            if (!started) {
              writer.write({ type: 'text-start', id: textId });
              started = true;
            }
            writer.write({ type: 'text-delta', id: textId, delta: chunk });
          }
        }
        if (started) writer.write({ type: 'text-end', id: textId });
      },
      onError: error => {
        console.error('[Genkit BFF] Stream error:', error);
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

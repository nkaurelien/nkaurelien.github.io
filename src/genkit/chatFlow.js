import { z } from 'genkit';
import { ai, providerOrder, AVAILABLE_PROVIDERS, generateWithFallback, A2UI_ENABLED } from './ai';
import { retrieveContext, buildSystemPrompt, A2UI_GUIDANCE } from './rag';
import { JAMILA_TOOLS } from './tools';

/**
 * chatFlow — pipeline RAG de l'assistante "Jamila", testable indépendamment
 * dans le Genkit Developer UI (onglet Flows).
 *
 * Input minimal : { "query": "Quels sont les projets IA d'Aurélien ?" }
 * Optionnel     : { "provider": "gemini" | "claude", "history": [{role, text}] }
 *
 * Streame le texte token par token (streamSchema) et renvoie la réponse complète.
 */
export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      query: z.string().describe("La question de l'utilisateur"),
      provider: z.enum(['gemini', 'claude']).optional().describe('Provider LLM à privilégier (sinon défaut + fallback)'),
      history: z
        .array(z.object({ role: z.enum(['user', 'model']), text: z.string() }))
        .optional()
        .describe('Historique de conversation (tours précédents)'),
    }),
    outputSchema: z.string(),
    // Texte (string) ou surface A2UI ({ a2ui: envelopes[] }) quand CHAT_A2UI=1.
    streamSchema: z.union([z.string(), z.object({ a2ui: z.array(z.any()) })]),
  },
  async (input, { sendChunk }) => {
    if (AVAILABLE_PROVIDERS.length === 0) {
      throw new Error('Aucun provider LLM configuré (GEMINI_API_KEY et/ou ANTHROPIC_API_KEY).');
    }

    // 1. Récupération du contexte (RAG)
    const context = await retrieveContext(input.query);
    const systemPrompt = buildSystemPrompt(context) + (A2UI_ENABLED ? A2UI_GUIDANCE : '');

    // 2. Construction des messages Genkit (historique + question courante)
    const history = (input.history || []).filter(m => m.text && m.text.trim().length > 0);
    const genkitMessages = [...history.map(m => ({ role: m.role, content: [{ text: m.text }] })), { role: 'user', content: [{ text: input.query }] }];

    // 3. Génération streamée avec fallback entre providers (+ outils blog, boucle gérée par Genkit)
    const providerKeys = providerOrder(input.provider);
    let fullText = '';
    for await (const chunk of generateWithFallback({ providerKeys, systemPrompt, genkitMessages, tools: JAMILA_TOOLS })) {
      if (typeof chunk === 'string') fullText += chunk;
      sendChunk(chunk);
    }

    return fullText;
  }
);

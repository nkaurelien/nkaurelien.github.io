import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { anthropic } from '@genkit-ai/anthropic';

// Lecture directe de process.env (et non @/env) pour rester utilisable AUSSI en
// standalone (genkit start -- tsx src/genkit/dev.mjs), hors du runtime Next.

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

const plugins = [];
// Registre des providers LLM — chaque entrée construit une référence de modèle Genkit.
// On n'enregistre un provider que si sa clé est présente (le plugin Anthropic jette
// à la construction sans clé).
export const LLM_PROVIDERS = {};

if (geminiApiKey) {
  plugins.push(googleAI({ apiKey: geminiApiKey }));
  LLM_PROVIDERS.gemini = { label: 'Gemini', model: () => googleAI.model('gemini-2.5-flash') };
  // Secours même clé : le quota gratuit Gemini est compté PAR MODÈLE (20 req/jour
  // pour gemini-2.5-flash), un autre modèle a donc son propre quota.
  LLM_PROVIDERS['gemini-lite'] = { label: 'Gemini Flash-Lite', model: () => googleAI.model('gemini-3.5-flash-lite') };
}

if (anthropicApiKey) {
  plugins.push(anthropic({ apiKey: anthropicApiKey }));
  LLM_PROVIDERS.claude = { label: 'Claude', model: () => anthropic.model('claude-sonnet-4-6') };
}

export const ai = genkit({ plugins });

export const AVAILABLE_PROVIDERS = Object.keys(LLM_PROVIDERS);

// Provider par défaut : CHAT_LLM_PROVIDER si sa clé est configurée, sinon le 1er dispo.
const DEFAULT_PROVIDER = LLM_PROVIDERS[process.env.CHAT_LLM_PROVIDER] ? process.env.CHAT_LLM_PROVIDER : AVAILABLE_PROVIDERS[0];

export const resolveProviderKey = requested => (LLM_PROVIDERS[requested] ? requested : DEFAULT_PROVIDER);

// Ordre d'essai : provider actif d'abord, puis les autres en secours.
export const providerOrder = requested => {
  const active = resolveProviderKey(requested);
  return [active, ...AVAILABLE_PROVIDERS.filter(k => k !== active)];
};

// Génère en streamant, avec fallback entre providers. Émet des événements :
// - { type: 'text', text } : morceau de réponse ;
// - { type: 'tool', name, input } : appel d'outil décidé par le modèle (affiché en direct
//   dans le chat). Les outils sont en lecture seule : rejouer un appel après bascule est sans risque.
// - Si un provider échoue AVANT d'émettre un token de texte (503/crédit/auth) -> on bascule.
// - Après le 1er token émis, un échec est propagé (throw) — on ne peut plus switcher.
// - Si tous échouent avant tout output, un message convivial est streamé.
export async function* generateWithFallback({ providerKeys, systemPrompt, genkitMessages, tools }) {
  let started = false;
  let lastError;

  for (const key of providerKeys) {
    const provider = LLM_PROVIDERS[key];
    if (!provider) continue;
    try {
      const responseStream = await ai.generateStream({
        model: provider.model(),
        system: systemPrompt,
        messages: genkitMessages,
        tools,
      });
      const seenTools = new Set();
      for await (const chunk of responseStream.stream) {
        for (const { toolRequest } of chunk.toolRequests || []) {
          // Un même appel peut revenir dans plusieurs morceaux : dédoublonné par ref / nom + arguments.
          const key = toolRequest.ref || `${toolRequest.name}:${JSON.stringify(toolRequest.input)}`;
          if (seenTools.has(key)) continue;
          seenTools.add(key);
          yield { type: 'tool', name: toolRequest.name, input: toolRequest.input ?? {} };
        }
        if (chunk.text) {
          started = true;
          yield { type: 'text', text: chunk.text };
        }
      }
      return; // succès
    } catch (err) {
      lastError = err;
      console.error(`[genkit] ${provider.label} failed: ${err?.message || err}`);
      if (started) throw err; // mid-stream : impossible de basculer proprement
      // sinon : provider suivant
    }
  }

  console.error(`[genkit] all providers failed. Last error: ${lastError?.message || lastError}`);
  yield {
    type: 'text',
    text: "Désolé, l'assistant est momentanément indisponible (forte demande sur le service d'IA). Merci de réessayer dans quelques instants.",
  };
}

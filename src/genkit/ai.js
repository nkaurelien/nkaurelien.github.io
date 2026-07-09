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

// Génère en streamant du TEXTE brut, avec fallback entre providers.
// - Si un provider échoue AVANT d'émettre un token (503/crédit/auth) -> on bascule.
// - Après le 1er token émis, un échec est propagé (throw) — on ne peut plus switcher.
// - Si tous échouent avant tout output, un message convivial est streamé.
export async function* generateWithFallback({ providerKeys, systemPrompt, genkitMessages }) {
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
      });
      for await (const chunk of responseStream.stream) {
        if (chunk.text) {
          started = true;
          yield chunk.text;
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
  yield "Désolé, l'assistant est momentanément indisponible (forte demande sur le service d'IA). Merci de réessayer dans quelques instants.";
}

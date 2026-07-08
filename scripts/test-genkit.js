const fs = require('fs');
const path = require('path');
const { genkit } = require('genkit');
const { googleAI, gemini15Flash } = require('@genkit-ai/google-genai');

// 1. Load environment variables from .env.local for standalone Node execution
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^['"]|['"]$/g, '');
      }
    }
  });
  console.log('◇ Loaded env from .env.local');
}

// 2. Resolve Gemini API Key
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY not found in env.');
  process.exit(1);
}

// Ensure the standard Genkit environment variable is set
process.env.GEMINI_API_KEY = apiKey;

console.log('Initializing Genkit with googleAI plugin...');
const ai = genkit({
  plugins: [googleAI({ apiKey })],
});

async function run() {
  console.log('Sending prompt to gemini-1.5-flash via Genkit...');
  try {
    const response = await ai.generate({
      model: googleAI.model('gemini-flash-latest'),
      prompt: 'Explique le concept de RAG (Retrieval-Augmented Generation) en une phrase poétique.',
    });

    console.log('\n=== GENKIT RESPONSE ===');
    console.log(response.text);
    console.log('=======================\n');
  } catch (error) {
    console.error('Error running Genkit prompt:', error);
  }
}

run();

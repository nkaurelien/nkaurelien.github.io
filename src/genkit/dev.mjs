// Point d'entrée STANDALONE pour tester les flows dans le Genkit Developer UI,
// indépendamment de Next.js :
//
//   yarn genkit:flows
//   (= genkit start -- npx tsx --watch src/genkit/dev.mjs)
//
// On charge d'abord .env.local / .env, PUIS on importe le flow dynamiquement
// (ai.js lit process.env au chargement du module).
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

await import('./chatFlow.js');

console.log('[genkit:flows] chatFlow enregistré — ouvre le Developer UI (onglet Flows).');

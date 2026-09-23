// Copie les extraits du RAG de Jamila (tables vector_embeddings/content_entries)
// dans un Vector Store litellm-pgvector, puis lance une recherche de contrôle.
//
//   node infra/litellm-pgvector/seed-from-rag.mjs ["requête de test"]
//
// L'API exige des vecteurs calculés par LE MÊME modèle que celui qu'elle utilise
// pour les requêtes : on ré-embedde donc chaque extrait via le proxy LiteLLM.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const stackEnv = dotenv.parse(readFileSync(path.join(here, '.env')));
const appEnv = dotenv.parse(readFileSync(path.join(here, '../../.env.local')));

const API = 'http://localhost:8000';
const LITELLM = 'http://localhost:4000';
const MODEL = stackEnv.EMBEDDING_MODEL || 'all-minilm';
const STORE_NAME = process.env.STORE_NAME || 'jamila-rag';
const QUERY = process.argv[2] || 'Kubernetes DevSecOps';

const api = async (method, url, body, key = stackEnv.VECTOR_API_KEY) => {
  const res = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${await res.text()}`);
  return res.json();
};

const embed = async texts =>
  (await api('POST', `${LITELLM}/v1/embeddings`, { model: MODEL, input: texts }, stackEnv.LITELLM_MASTER_KEY)).data.map(
    d => d.embedding
  );

// 1. Extraits source (base du RAG, via l'URL poolée de l'app)
const db = new pg.Client({ connectionString: appEnv.DATABASE_URL });
await db.connect();
const { rows } = await db.query(
  `SELECT v.text_chunk, e.slug, s.category
     FROM vector_embeddings v
     JOIN content_entries e ON e.id = v.content_entry_id
     JOIN content_sections s ON s.id = e.section_id
    ORDER BY e.slug`
);
await db.end();
console.log(`${rows.length} extraits lus dans la base du RAG`);

// 2. Vector store (réutilisé s'il existe déjà : on repart de zéro en le recréant)
const stores = await api('GET', `${API}/v1/vector_stores?limit=100`);
let store = stores.data.find(s => s.name === STORE_NAME);
if (store) {
  console.log(`Store « ${STORE_NAME} » déjà présent (${store.id}) : ajout des extraits (pas de dédoublonnage côté API)`);
} else {
  store = await api('POST', `${API}/v1/vector_stores`, { name: STORE_NAME, metadata: { source: 'jamila-rag', model: MODEL } });
  console.log(`Store créé : ${store.id}`);
}

// 3. Ré-embedding via LiteLLM + insertion par lots
const BATCH = 16;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const vectors = await embed(batch.map(r => r.text_chunk));
  await api('POST', `${API}/v1/vector_stores/${store.id}/embeddings/batch`, {
    embeddings: batch.map((r, j) => ({
      content: r.text_chunk,
      embedding: vectors[j],
      metadata: { filename: r.slug, slug: r.slug, category: r.category },
    })),
  });
  console.log(`  ${Math.min(i + BATCH, rows.length)}/${rows.length} insérés`);
}

// 4. Recherche de contrôle (+ filtre sur les métadonnées)
for (const filters of [undefined, { category: 'PROJECT' }]) {
  const res = await api('POST', `${API}/v1/vector_stores/${store.id}/search`, { query: QUERY, limit: 4, filters });
  console.log(`\nRecherche « ${QUERY} »${filters ? ` avec filtre ${JSON.stringify(filters)}` : ''} :`);
  for (const r of res.data) console.log(`  ${r.score.toFixed(3)}  ${r.filename.padEnd(22)} ${r.content[0].text.slice(0, 70)}…`);
}

#!/usr/bin/env node
/**
 * Tests de fumée du site (pages, liens d'articles, serveur MCP, Jamila).
 *
 *   node scripts/smoke-test.mjs                                  # prod (https://nkaurelien.kamitbrains.fr)
 *   node scripts/smoke-test.mjs --base http://localhost:3000     # dev local
 *   node scripts/smoke-test.mjs --with-llm                       # + 1 question à Jamila (consomme du quota LLM)
 *   yarn test:smoke --base http://localhost:3000
 *
 * Sans --with-llm, AUCUN appel LLM : le quota Gemini gratuit est de 20 requêtes/jour/modèle.
 * Clé MCP : MCP_API_KEY_PRODUCTION pour la prod, MCP_API_KEY sinon (lues dans .env.local).
 * Code de sortie : 0 si tout passe, 1 sinon.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROD = 'https://nkaurelien.kamitbrains.fr';

const args = process.argv.slice(2);
const argValue = name => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const BASE = (argValue('--base') || PROD).replace(/\/$/, '');
const WITH_LLM = args.includes('--with-llm');
const TIMEOUT = 20_000;

// Clés lues dans .env.local sans dépendance (et sans jamais les afficher).
function readEnvLocal() {
  try {
    return Object.fromEntries(
      readFileSync(path.join(ROOT, '.env.local'), 'utf8')
        .split('\n')
        .map(l => l.match(/^([A-Z0-9_]+)=(.*)$/))
        .filter(Boolean)
        .map(([, k, v]) => [k, v.replace(/^"|"$/g, '')])
    );
  } catch {
    return {};
  }
}
const env = { ...readEnvLocal(), ...process.env };
const MCP_KEY = BASE === PROD ? env.MCP_API_KEY_PRODUCTION : env.MCP_API_KEY;

const results = [];
async function check(name, fn) {
  const started = Date.now();
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail, ms: Date.now() - started });
  } catch (err) {
    results.push({ name, ok: false, detail: err.message, ms: Date.now() - started });
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const req = (url, opts = {}) => fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT), ...opts });

// Slug web d'un article = nom de fichier sans extension ni préfixe de date (cf. src/lib/localArticles.js).
const articleSlugs = readdirSync(path.join(ROOT, 'datasources/articles'))
  .map(f => f.match(/^\d{4}-\d{2}-\d{2}-(.+)\.md$/))
  .filter(Boolean)
  .map(m => m[1]);

// ---------------------------------------------------------------- Pages
for (const p of ['/fr/', '/en/', '/fr/blog/', '/fr/chat/']) {
  await check(`page ${p}`, async () => {
    const r = await req(BASE + p);
    assert(r.status === 200, `HTTP ${r.status}`);
    return 'HTTP 200';
  });
}

// ------------------------------------------------ Liens d'articles (sans LLM)
// Les outils de Jamila renvoient /blog/<slug>/ : chaque article publié doit répondre 200.
await check(`liens d'articles (${articleSlugs.length})`, async () => {
  const broken = [];
  await Promise.all(
    articleSlugs.map(async slug => {
      const r = await req(`${BASE}/fr/blog/${slug}/`, { method: 'HEAD' });
      if (r.status !== 200) broken.push(`${slug} (${r.status})`);
    })
  );
  assert(broken.length === 0, `cassés : ${broken.join(', ')}`);
  return `${articleSlugs.length}/${articleSlugs.length} en 200`;
});

// ------------------------------------------------------------------ MCP
const MCP = `${BASE}/api/mcp/`;
const mcpHeaders = key => ({
  'content-type': 'application/json',
  accept: 'application/json, text/event-stream',
  ...(key ? { authorization: `Bearer ${key}` } : {}),
});
const rpc = (method, params, key = MCP_KEY, headers) =>
  req(MCP, { method: 'POST', headers: headers || mcpHeaders(key), body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });

await check('MCP GET (métadonnées)', async () => {
  const r = await req(MCP);
  assert(r.status === 200, `HTTP ${r.status}`);
  const j = await r.json();
  assert(j.tools?.length === 6, `${j.tools?.length} outils annoncés`);
  return `${j.transport}`;
});
await check('MCP sans clé -> 401', async () => {
  const r = await rpc('tools/list', undefined, null);
  // En dev sans MCP_API_KEY, l'endpoint est public : on le signale sans échouer.
  if (r.status === 200 && BASE !== PROD) return 'public (MCP_API_KEY non défini côté serveur)';
  assert(r.status === 401, `HTTP ${r.status} (attendu 401 : endpoint public ?)`);
  return 'HTTP 401';
});
await check('MCP sans Accept SSE -> 406', async () => {
  const r = await rpc('tools/list', undefined, MCP_KEY, { 'content-type': 'application/json', authorization: `Bearer ${MCP_KEY}` });
  assert(r.status === 406, `HTTP ${r.status}`);
  return 'HTTP 406';
});
await check('MCP tools/list + JSON Schema', async () => {
  assert(MCP_KEY, 'clé MCP absente de .env.local');
  const r = await rpc('tools/list');
  assert(r.status === 200, `HTTP ${r.status}`);
  const tools = (await r.json()).result.tools;
  assert(tools.length === 6, `${tools.length} outils`);
  const schema = tools.find(t => t.name === 'list_articles')?.inputSchema;
  assert(schema?.type === 'object' && schema.properties?.limit?.type === 'integer', 'inputSchema non conforme');
  return tools.map(t => t.name).join(', ');
});
await check('MCP validation des arguments', async () => {
  const r = await rpc('tools/call', { name: 'list_articles', arguments: { limit: 'abc' } });
  const j = await r.json();
  assert(j.result?.isError && /expected number/i.test(j.result.content[0].text), 'argument invalide accepté');
  return 'limit:"abc" refusé';
});
await check('MCP list_articles (dates ISO)', async () => {
  const r = await rpc('tools/call', { name: 'list_articles', arguments: { limit: 3 } });
  const articles = JSON.parse((await r.json()).result.content[0].text);
  assert(articles.length === 3, `${articles.length} articles`);
  const bad = articles.filter(a => a.date && !/^\d{4}-\d{2}-\d{2}$/.test(a.date));
  assert(bad.length === 0, `dates mal formatées : ${bad.map(a => a.date).join(', ')}`);
  return articles.map(a => a.date).join(', ');
});

// ------------------------------------------------------ Analytics Umami
// Le traceur envoie POST /stats/api/send : 308 (trailingSlash) puis rewrite vers Umami.
// Un identifiant de site factice fait répondre 400 par Umami lui-même, sans polluer
// les statistiques : 400 = la requête arrive bien jusqu'à Umami ; 404 = cassé (ex. le
// middleware de langue redirige vers /fr/stats/…).
await check('Umami POST /stats/api/send', async () => {
  const script = await req(`${BASE}/stats/script.js`);
  if (script.status === 404 && BASE !== PROD) return 'Umami non configuré ici (UMAMI_URL absent) : ignoré';
  assert(script.status === 200, `script.js HTTP ${script.status}`);
  const r = await req(`${BASE}/stats/api/send`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 (smoke-test)' },
    body: JSON.stringify({
      type: 'event',
      payload: { website: '00000000-0000-0000-0000-000000000000', hostname: 'smoke-test', url: '/', language: 'fr' },
    }),
  });
  assert(!r.url.includes('/fr/stats/'), `redirigé vers ${r.url} (middleware de langue)`);
  assert(r.status === 400, `HTTP ${r.status} (attendu 400 d'Umami pour un site factice)`);
  return 'script 200, envoi relayé jusqu\'à Umami (400 attendu pour un site factice)';
});

// ------------------------------------------------ Jamila (optionnel, LLM)
if (WITH_LLM) {
  await check('Jamila /api/chat (1 question)', async () => {
    const r = await req(`${BASE}/api/chat/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Aurélien a-t-il écrit sur Kaniko ? Titre et lien.' }] }],
      }),
      signal: AbortSignal.timeout(120_000),
    });
    assert(r.status === 200, `HTTP ${r.status}`);
    const text = (await r.text())
      .split('\n')
      .filter(l => l.startsWith('data: {'))
      .map(l => JSON.parse(l.slice(6)))
      .map(e => e.delta || '')
      .join('');
    assert(!/momentanément indisponible/.test(text), 'tous les LLM ont échoué (quota ?)');
    const links = [...text.matchAll(/\((\/[^)\s]+)\)/g)].map(m => m[1]);
    assert(links.length > 0, 'aucun lien dans la réponse');
    for (const l of links) {
      const lr = await req(BASE + l, { method: 'HEAD' });
      assert(lr.status === 200, `lien ${l} -> ${lr.status}`);
    }
    return `${text.length} car., liens OK : ${links.join(', ')}`;
  });
}

// --------------------------------------------------------------- Rapport
const failed = results.filter(r => !r.ok);
console.log(`\nTests de fumée — ${BASE}${WITH_LLM ? ' (avec LLM)' : ''}\n`);
for (const r of results) console.log(`${r.ok ? '✅' : '❌'} ${r.name.padEnd(34)} ${String(r.ms).padStart(5)} ms  ${r.detail}`);
console.log(`\n${results.length - failed.length}/${results.length} OK${failed.length ? ` — ${failed.length} échec(s)` : ''}`);
process.exit(failed.length ? 1 : 0);

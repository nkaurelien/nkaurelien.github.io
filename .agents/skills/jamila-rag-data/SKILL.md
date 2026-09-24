---
name: jamila-rag-data
description: >
  Operate the data layer of "Jamila" (the portfolio's RAG chat assistant): Postgres + pgvector on Neon,
  the embedding pipeline (scripts/import-projects.js, Xenova/all-MiniLM-L6-v2, vector(384)), and the
  retrieval in src/genkit/rag.js. Use this skill when: (1) re-seeding or recomputing embeddings after
  editing public/projects or datasources, (2) migrating the database to another Postgres host or
  restoring it, (3) rotating the database password or changing DATABASE_URL/DIRECT_URL (local, Vercel),
  (4) Jamila answers without profile context / RAG returns nothing, (5) changing the embedding model,
  chunking or match_embeddings, or (6) running the local pgvector Docker database.
---

# Jamila : données RAG (Postgres + pgvector)

Retour d'expérience complet (migration Supabase → Neon, pièges rencontrés) :
[references/retour-experience-2026-09-23.md](references/retour-experience-2026-09-23.md).

## Architecture

```
public/projects/{fr,en}/*.md ─┐                                   ┌─> rag.js retrieveContext()
datasources/**/*.md|*.txt ────┼─> scripts/import-projects.js ──> Postgres + pgvector ──┤   (match_embeddings, pg)
                              │   (chunk 600/120 + embeddings     (Neon prod /          └─> chatFlow (Genkit) -> /api/chat
                              │    all-MiniLM-L6-v2, dim 384)      Docker local)
datasources/articles/*.md ────┴─> aussi lus EN DIRECT par les outils Jamila (src/genkit/tools.js) et le MCP
```

| Élément | Où | Valeur |
|---|---|---|
| Base prod | Neon, projet `nkaurelien-portfolio`, Frankfurt, PG 18, pgvector 0.8.6 | `DATABASE_URL` (poolée, `-pooler`), `DIRECT_URL` (directe) |
| Base locale | `docker compose` service `db` (`pgvector/pgvector:pg18`) | `postgresql://portfolio:portfolio@localhost:5432/portfolio` |
| Schéma | `db/schema.sql` (v0) + `db/migrations/*.sql` (`make db-migrate`) | tables `content_sections`, `content_entries`, `vector_embeddings`, `tags`, `content_tags`, `schema_migrations` ; fonctions `match_embeddings` (code actuel) et `search_embeddings` (filtre jsonb) |
| Ingestion | `scripts/import-projects.js` (`make db-seed`, `make db-reseed`) | lit `DIRECT_URL` puis `DATABASE_URL` |
| Retrieval | `src/genkit/rag.js` | `pg` Pool (`max: 1`) sur `DATABASE_URL`, seuil 0.15, 8 extraits |

Les tables Prisma en CamelCase (`Profile`, `ContentEntry`, `VectorEmbedding`…), vides et inutilisées, sont supprimées par la migration `002`.

## Invariants à ne jamais casser

1. **Même modèle d'embedding des deux côtés** : `Xenova/all-MiniLM-L6-v2` dans `import-projects.js` ET `rag.js`.
   Des vecteurs de modèles différents ne sont pas comparables : la recherche renvoie du bruit, sans aucune erreur.
2. **Dimension 384** : `vector(384)` dans `db/schema.sql` et dans la signature de `match_embeddings`.
   Pour changer de modèle, il faut modifier les deux fichiers, changer la dimension de la colonne, puis relancer avec `REEMBED=1` sur **toutes** les entrées.
3. **Préfixe de métadonnées de chaque extrait**, qui fait partie du texte embeddé :
   projets → `Title: … Category: … Technologies: …` ; documents → `Source: <chemin relatif>. Title: … Section: Profile.`
   Si on le change, il faut tout réembedder, sinon les anciens et les nouveaux extraits ne se comparent plus de la même façon.
4. **Découpage** : `RecursiveCharacterTextSplitter({ chunkSize: 600, chunkOverlap: 120 })`.
5. **Slug = clé d'idempotence** : `content_entries.slug` est unique. Projets : nom du fichier. Documents : chemin relatif sans extension, en minuscules.
   `rag.js` joint `content_entries` pour afficher la source (`from koree`, `from about-me`).

## Migrations de schéma

- `db/migrations/NNN_*.sql` : chaque fichier est **transactionnel et idempotent**, et enregistre sa version dans `schema_migrations`.
  `make db-migrate` (DIRECT_URL de `.env.local`) ou `DB_URL=… make db-migrate`. Le conteneur local les applique au 1er démarrage (`db/init/02-migrations.sh`).
- `001` (non destructive, compatible avec le code d'avant) : `vector_embeddings.metadata jsonb` (slug, category, source, title) + `chunk_index` + `embedding_model` ;
  `content_entries.content_hash` (colonne générée, sha256 UTF-8, identique à Node) ; catégorie libre au format `^[A-Z][A-Z0-9_]*$` ;
  index sur les clés étrangères, GIN sur `metadata`, HNSW cosinus ; fonction `search_embeddings(vec, count, threshold, filter jsonb)` avec scan itératif.
- `002` : supprime les tables Prisma CamelCase, avec un garde-fou qui fait **échouer** la migration si l'une d'elles contient des lignes. Ensuite : `npx prisma db pull && npx prisma generate`.
- **Tester avant la prod** : conteneur jetable restauré depuis un dump frais, appliquer DEUX fois (idempotence), comparer `match_embeddings` avant/après
  (mêmes id, mêmes scores), vérifier le hash contre Node et le garde-fou de `002`. Procédure complète dans le REX.
- **Ordre de déploiement** : migration en prod d'abord, PUIS le code qui l'utilise (`import-projects.js` écrit `metadata`, `chunk_index`, `embedding_model`).

## Reproduire / recalculer les embeddings

```bash
# Local (base jetable)
make db-up                     # 1er démarrage : db/schema.sql appliqué automatiquement
DATABASE_URL=postgresql://portfolio:portfolio@localhost:5432/portfolio \
DIRECT_URL=postgresql://portfolio:portfolio@localhost:5432/portfolio make db-seed

# Prod (Neon) : utilise DIRECT_URL/DATABASE_URL de .env.local
make db-seed                   # ajoute seulement les entrées sans embeddings
make db-reseed                 # REEMBED=1 : recalcule TOUT (après un changement de modèle/préfixe/découpage)
```

- Le script est **idempotent** grâce à `content_hash` : un document est (ré)embeddé s'il est **nouveau** ou **modifié** (hash différent), ou si `REEMBED=1`. Sinon il est ignoré. Ses anciens vecteurs sont supprimés puis réinsérés.
- Au premier lancement, le modèle (~90 Mo) est téléchargé ; ensuite compter quelques secondes par extrait.
- Plus besoin de `make db-reseed` après une modification de contenu : `make db-seed` détecte le changement. `db-reseed` reste utile après un changement de modèle, de préfixe ou de découpage.

### Périmètre du RAG (décidé le 24/09/2026)

`scripts/import-projects.js` n'importe plus tout `datasources/` : liste explicite `RAG_DOCUMENTS`
(`about-me.md`, `story.md`) + les 8 projets de `public/projects/`. Les articles sont servis en direct par
les outils de Jamila ; les CV et la lettre de motivation dupliqueraient le profil (ton « candidature »).
Pour élargir : ajouter le chemin dans `RAG_DOCUMENTS`, puis `make db-seed`.

**Plafond par document** : `retrieveContext(query, { perDocument = 2 })` garde au plus 2 extraits par
document parmi 8×`matchCount` candidats, puis les 8 meilleurs. Sans lui, `about-me` (29 extraits) remplissait
tout le contexte et évinçait les fiches projets (mesuré : question « Koree » → 0 extrait `koree` sans plafond,
1 avec `perDocument = 2`). Le modèle all-MiniLM (surtout anglais) classe parfois mal les fiches projets face
à une question en français : c'est la limite suivante à traiter (modèle multilingue, réembedding complet).

## Vérifier

```bash
# Nombre d'extraits par entrée
node scripts/db-query.js "select e.slug, count(v.id)::int as chunks from content_entries e left join vector_embeddings v on v.content_entry_id=e.id group by e.slug order by e.slug"
```

```js
// Test de retrieval (fichier temporaire à la racine, lancé avec `npx tsx`)
import { config } from 'dotenv';
config({ path: '.env.local', override: true }); // override : voir « Pièges »
const { retrieveContext } = await import(process.cwd() + '/src/genkit/rag.js');
const ctx = await retrieveContext('Kubernetes DevSecOps');
console.log((ctx.match(/- Context/g) || []).length, 'extraits');
process.exit(0); // le Pool pg garde le process ouvert
```

De bout en bout (texte streamé de `/api/chat`, protocole UI Message Stream) :

```bash
curl -s -N -X POST http://localhost:3000/api/chat/ -H 'content-type: application/json' \
  -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"Sur quoi Aurélien a-t-il travaillé chez Koree ?"}]}]}' \
| python3 -c 'import sys,json; print("".join(json.loads(l[6:]).get("delta","") for l in sys.stdin if l.startswith("data: {")))'
```

Chaque question consomme 1 à 4 requêtes LLM, et **le quota Gemini gratuit est de 20 requêtes par jour et par modèle**. Limiter les tests de bout en bout.

## Migrer vers un autre Postgres

Procédure utilisée pour Supabase (PG 17) → Neon (PG 18). `pg_dump` doit être **de la même version majeure que la base source, ou plus récente**. On le lance depuis l'image Docker pour ne rien installer :

```bash
IMG=pgvector/pgvector:pg18; mkdir -p /tmp/mig
SRC='postgresql://…'   # connexion DIRECTE source
DST='postgresql://…'   # connexion DIRECTE cible (sans -pooler)

docker run --rm -v /tmp/mig:/out $IMG pg_dump "$SRC" --schema=public --schema-only \
  --no-owner --no-privileges --no-policies -f /out/schema.sql
docker run --rm -v /tmp/mig:/out $IMG pg_dump "$SRC" --schema=public --data-only \
  --no-owner --no-privileges -f /out/data.sql
sed -i '' -e '/^CREATE SCHEMA public;$/d' -e '/^COMMENT ON SCHEMA public IS/d' /tmp/mig/schema.sql
grep -v "ENABLE ROW LEVEL SECURITY" /tmp/mig/schema.sql > /tmp/mig/schema.clean.sql
echo 'CREATE EXTENSION IF NOT EXISTS vector;' > /tmp/mig/00-ext.sql

docker run --rm -v /tmp/mig:/out $IMG psql "$DST" -v ON_ERROR_STOP=1 --single-transaction \
  -f /out/00-ext.sql -f /out/schema.clean.sql -f /out/data.sql
```

Pièges :
- **`CREATE SCHEMA public` existe déjà** sur la cible : sans le `sed`, tout échoue. `--single-transaction` évite alors un import à moitié fait.
- **Politiques RLS Supabase** (`TO authenticated`, `anon`) : ces rôles n'existent pas ailleurs, d'où `--no-policies`. Le RLS est inutile ici : accès SQL direct avec le rôle propriétaire, sans API REST publique.
- **`vector` doit être créé AVANT le schéma.** Vérifier aussi dans quel schéma vit l'extension sur la source : `public.vector` chez nous. Sur un Supabase récent, elle peut être dans `extensions.`, et il faut alors réécrire les types.
- **Vérifier** : comparer `count(*)` table par table entre source et cible, puis tester `select count(*) from match_embeddings((select embedding_vector from vector_embeddings limit 1), 0.15, 8)`, qui doit renvoyer 8 résultats avec une similarité maximale de 1.000.

Basculer ensuite :
1. `.env.local` **et** `.env` (Prisma) : `DATABASE_URL` (poolée) et `DIRECT_URL` (directe). Garder l'ancienne valeur en commentaire jusqu'à la validation.
2. Vercel, en Production **et** Preview (en zsh, passer par une fonction : `V="npx vercel"; $V …` ne fonctionne pas) :
   ```bash
   vc() { npx -y vercel@latest "$@"; }
   for n in DATABASE_URL DIRECT_URL; do val=$(grep "^$n=" .env.local | cut -d= -f2- | tr -d '"')
     for e in production preview; do vc env rm $n $e -y; printf '%s' "$val" | vc env add $n $e; done; done
   ```
   Les valeurs sont stockées comme sensibles : `vercel env pull` affiche `[SENSITIVE]`. On vérifie donc par un déploiement.
3. Redéployer (push sur `main`), puis tester `/api/chat` en production avec une question de profil.

## Changer le mot de passe Neon

1. Neon → projet → **Connect** → **Reset password** (rôle `neondb_owner`). L'ancien mot de passe est invalidé tout de suite, et la production perd le RAG jusqu'au redéploiement.
2. Coller le mot de passe seul dans `.secrets/neon-password` (ignoré par git, `chmod 600`).
3. Remplacer le mot de passe **sans l'afficher**, dans les trois fichiers, depuis le fichier secret :
   ```bash
   python3 - <<'PY'
   import re
   pw = open('.secrets/neon-password').read().strip()
   for p in ['.env.local', '.env', 'infra/litellm-pgvector/.env']:
       s = open(p).read()
       open(p, 'w').write(re.sub(r'(postgresql://neondb_owner:)[^@]+(@)', lambda m: m.group(1) + pw + m.group(2), s))
   PY
   node scripts/db-query.js "select 1"
   ```
   Puis mettre à jour Vercel (étape 2 ci-dessus) et redéployer sans commit :
   `vc redeploy <url du dernier déploiement prod> --target production`.
   Relancer aussi la stack locale : `docker compose -f infra/litellm-pgvector/compose.yml up -d`.
4. Ne jamais afficher le mot de passe en clair (logs, sortie de commande, conversation).

## litellm-pgvector (API Vector Stores, en local)

`infra/litellm-pgvector/` : API « Vector Stores » compatible OpenAI (FastAPI + Prisma) derrière un proxy
LiteLLM → Ollama `all-minilm` (même modèle, 384 dimensions), sur la base Neon **dédiée** `litellm_vectors`.
Jamila ne l'utilise pas : c'est un banc d'essai en attendant un déploiement sur le serveur du site.
Modèle de données, limites (pas d'index, pas de DELETE) et pièges de configuration :
[infra/litellm-pgvector/README.md](../../../infra/litellm-pgvector/README.md).

## Dépannage

| Symptôme | Cause probable | Vérification / correctif |
|---|---|---|
| Jamila répond « je ne dispose pas de cette information » sur le profil | RAG vide : base injoignable, erreur avalée dans `rag.js` (`[rag] Postgres error`) | Test de retrieval ci-dessus ; `select 1` via `scripts/db-query.js` |
| `ENOTFOUND` / NXDOMAIN sur l'hôte de la base | Projet en pause/supprimé, ou DNS local | `dig @8.8.8.8` + `@1.1.1.1` avant de conclure (voir REX : faux diagnostic) |
| 8 extraits mais réponses hors sujet | Modèle ou dimension différents entre ingestion et requête | Invariants 1 à 3 ; `make db-reseed` |
| Première requête lente (~1 s) | Neon en veille (scale-to-zero) | Normal |
| « momentanément indisponible » | Tous les LLM ont échoué (quota Gemini, crédits Anthropic), sans lien avec la base | Logs `[genkit] … failed` |
| `db-seed` ne change rien | Slugs déjà embeddés | `make db-reseed` |

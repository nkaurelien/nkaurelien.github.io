# litellm-pgvector (local)

API **« Vector Stores » compatible OpenAI** au-dessus de Postgres + pgvector
([BerriAI/litellm-pgvector](https://github.com/BerriAI/litellm-pgvector), commit
figé `b553f84`). Branchée sur Neon, dans une **base dédiée `litellm_vectors`**,
séparée de la base `neondb` du RAG de Jamila.

```
Ollama (hôte, all-minilm, 384d) ◀── litellm (proxy :4000) ◀── vector-api (:8000) ──▶ Neon / litellm_vectors
```

`all-minilm` est **le même modèle** (all-MiniLM-L6-v2) que celui du RAG de Jamila
(`Xenova/all-MiniLM-L6-v2`), sans clé ni quota.

## Démarrer

```bash
ollama pull all-minilm                          # une fois
cp infra/litellm-pgvector/.env.example infra/litellm-pgvector/.env   # remplir (clés : openssl rand -hex 32)
docker compose -f infra/litellm-pgvector/compose.yml up -d --build
node infra/litellm-pgvector/seed-from-rag.mjs "Kubernetes DevSecOps"   # copie les 39 extraits du RAG + recherche test
```

Au démarrage, `vector-api` aligne `vector(N)` sur `EMBEDDING_DIMENSIONS`, crée
l'extension `vector`, puis lance `prisma db push` (idempotent) avant `uvicorn`.

## API (Bearer `VECTOR_API_KEY`)

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/v1/vector_stores` | Crée un store (`name`, `metadata`) |
| GET | `/v1/vector_stores?limit=&after=&before=` | Liste paginée |
| POST | `/v1/vector_stores/{id}/embeddings` | Ajoute un extrait **avec son vecteur** (`content`, `embedding`, `metadata`) |
| POST | `/v1/vector_stores/{id}/embeddings/batch` | Même chose, par lot |
| POST | `/v1/vector_stores/{id}/search` | `query` (embeddée côté serveur), `limit` ≤ 100, `filters` sur les métadonnées |
| GET | `/health` | Sans authentification |

```bash
K=$(grep '^VECTOR_API_KEY=' infra/litellm-pgvector/.env | cut -d= -f2-)
curl -s localhost:8000/v1/vector_stores/<id>/search -H "authorization: Bearer $K" \
  -H 'content-type: application/json' -d '{"query":"Fintech","limit":4,"filters":{"category":"PROJECT"}}'
```

## Modèle physique de données

```
vector_stores                                 embeddings
─────────────                                 ──────────
id              text  PK                 ┌──  id               text PK
name            text                     │    vector_store_id  text FK → vector_stores(id) ON DELETE CASCADE
metadata        jsonb                    │    content          text
file_counts     jsonb                    │    embedding        vector(384)
status          text  'completed'        │    metadata         jsonb
usage_bytes     int                      │    created_at       timestamp(3)
expires_after   jsonb                    │
expires_at / last_active_at / created_at │
```

**Ce qui est intéressant :**
- **Collections (stores)** : un même schéma sert plusieurs corpus indépendants
  (ex. `jamila-rag`, `articles`, `cv`). Chez nous, c'est
  `content_sections.category` qui joue ce rôle, avec un `CHECK` figé.
- **`metadata jsonb`** sur chaque extrait, filtrable à la recherche
  (`metadata->>clé = valeur`) : slug, catégorie, langue, date… sans migration de schéma.
  Chez nous, il faut une table ou une colonne par attribut.
- **Contrat OpenAI** (`/v1/vector_stores/.../search`) : un client OpenAI, ou LiteLLM
  lui-même via son registre de vector stores, peut l'utiliser tel quel. On peut
  changer de backend sans toucher au client.
- **Le modèle d'embedding est découplé** grâce au proxy LiteLLM. Pour passer
  d'Ollama à Gemini ou OpenAI, on modifie `litellm-config.yaml` + `EMBEDDING_DIMENSIONS`
  (voir la section commentée), puis on réembedde.
- **`ON DELETE CASCADE`** : supprimer un store supprime ses extraits.

**Limites constatées (à corriger avant un déploiement serveur) :**
- **Aucun index** hormis les clés primaires : pas d'index sur
  `embeddings.vector_store_id` (la clé étrangère), pas d'index HNSW sur `embedding`.
  Chaque recherche lit toute la table (négligeable à 39 lignes, pas à 100 000).
  À ajouter à la main (Prisma ne les gère pas pour le type `vector`) :
  ```sql
  CREATE INDEX IF NOT EXISTS embeddings_store_idx ON embeddings (vector_store_id);
  CREATE INDEX IF NOT EXISTS embeddings_hnsw_idx ON embeddings USING hnsw (embedding vector_cosine_ops);
  ```
  Un index GIN sur `metadata` n'aiderait pas : le filtre utilise `->>` et non `@>`.
- **Pas de suppression ni de mise à jour** dans l'API (ni `DELETE` ni `PUT`), et
  pas de dédoublonnage : relancer `seed-from-rag.mjs` sur le même store duplique
  les extraits. Pour nettoyer, passer par SQL
  (`DELETE FROM vector_stores WHERE name = '…'`, qui supprime aussi les extraits).
- **`expires_after` / `expires_at` ne sont jamais appliqués** : champs
  décoratifs, pour la compatibilité OpenAI. Seul `file_counts.completed` est incrémenté.
- **Score** = `1 - distance_cosinus / 2` (plage 0 à 1) : les valeurs sont plus
  resserrées que la similarité `1 - distance` du RAG de Jamila. Ne pas comparer
  les seuils d'une API à l'autre.
- **`prisma db push --accept-data-loss`** : changer `EMBEDDING_DIMENSIONS` sur une
  base remplie **supprime la colonne `embedding`**, donc tous les vecteurs.
  C'est voulu, car les anciens vecteurs n'ont plus de sens, mais il faut le savoir.
- **Dépôt peu actif** (dernier commit en décembre 2025), épinglé à un commit précis.

## Pièges de configuration (résolus dans ce compose)

| Erreur | Cause | Correctif |
|---|---|---|
| `LLM Provider NOT provided. You passed model=all-minilm` | vector-api appelle le proxy avec le SDK LiteLLM, qui exige un préfixe de fournisseur | `EMBEDDING__MODEL=openai/all-minilm` (le proxy est compatible OpenAI) |
| `encoding_format: base64 is not supported by ollama` | Le client OpenAI demande du base64 | `litellm_settings.drop_params: true` |
| `password authentication failed` au démarrage | Mot de passe Neon changé | Mettre à jour `VECTOR_DATABASE_URL` (voir le skill `jamila-rag-data`) |
| Tables absentes | Le dépôt ne crée rien au démarrage | `prisma db push` dans la `command` du service |

## Et ensuite

Pour déployer cette stack « sur le serveur du site » : il faut ajouter les deux
index ci-dessus, mettre l'API derrière le reverse proxy (Traefik) en HTTPS, et
remplacer Ollama local par un modèle d'embedding joignable depuis le serveur.
Aujourd'hui, Jamila (sur Vercel) n'utilise **pas** cette API : son RAG interroge
directement `match_embeddings` sur `neondb`.

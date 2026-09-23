# Retour d'expérience : 23 septembre 2026

Une session partie d'une revue de code du serveur MCP, qui s'est terminée par la
migration de la base RAG de Supabase vers Neon. Ce document est écrit pour
servir à la prochaine personne ou au prochain agent qui touchera à Jamila.

## Chronologie

| Étape | Commit | Résultat |
|---|---|---|
| Revue du MCP `/api/mcp` : validation absente, `inputSchema` = objet zod brut, `readArticle` trop permissif, code dupliqué | `c5df301` | Route passée sur le transport officiel du SDK (Streamable HTTP, sans état), registre d'outils partagé (`scripts/mcp/server.ts`) |
| MCP public en production | `509ab2e` + variable Vercel | `MCP_API_KEY` (clé de production distincte de la clé locale) : 401 sans clé |
| Dates d'articles `Wed Sep 16 2026 02:00:00 GM` | `1df8c7d` | gray-matter renvoie des objets `Date` : passage par `toISOString()` |
| Jamila n'avait pas accès au blog | `9ef4e9c` | 3 outils Genkit en lecture seule, appelés en direct (sans HTTP), avec `url` prête à l'emploi |
| A2UI (UI générative) | branche `feat/a2ui` | Derrière `CHAT_A2UI=1`, voir `src/genkit/A2UI.md` |
| Jamila « momentanément indisponible » | `1138782` | Secours `gemini-3.5-flash-lite` + Genkit 1.42 |
| RAG vide : hôte Supabase en NXDOMAIN | `806da5c` | Migration vers Neon (pg_dump/psql), `rag.js` passe à `pg`, Supabase retiré |
| Mot de passe Neon régénéré (fuite dans la conversation) | variables Vercel + redeploy | Coupure du RAG en prod entre la régénération et le redéploiement |
| Banc d'essai litellm-pgvector | `infra/litellm-pgvector/` | LiteLLM + Ollama `all-minilm` + base Neon `litellm_vectors` ; recherche OK, mêmes sources que le RAG |

## Causes racines

1. **Quota LLM** : l'offre gratuite de Gemini est limitée à **20 requêtes par jour et par modèle**
   (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`). Une question avec outils
   consomme 2 à 4 requêtes. Le secours Claude n'avait plus de crédits
   (`credit balance is too low`) : il n'y avait donc aucun vrai secours.
   Correctif : un deuxième modèle Gemini, qui a son propre quota. À terme : facturation
   Gemini ou crédits Anthropic.
2. **Genkit 1.39 et Gemini 3.5** : le plugin google-genai 1.39 envoie les réponses
   d'outils avec le rôle `function`, que Gemini 3.5 refuse (`Role 'function' is not
   supported`). Il a fallu passer en 1.42. Le problème ne se voit **qu'avec des outils** :
   un appel simple fonctionne.
3. **Supabase gratuit** : l'hôte de l'API (`<ref>.supabase.co`) a disparu du DNS alors
   que le Postgres restait joignable via le pooler partagé
   (`aws-0-eu-west-1.pooler.supabase.com`). `rag.js` avalait l'erreur et renvoyait
   un contexte vide : Jamila répondait sans aucun contexte, sans que rien ne plante.
4. **Supabase ne servait qu'à Postgres + pgvector** : l'authentification passe par
   Firebase, et ni le stockage ni le temps réel n'étaient utilisés. En sortir coûtait
   un appel `rpc` et une page de démo déjà cassée (`/todos`, table inexistante).

## Ce qui a bien marché

- **Traces Genkit** (`genkit flow:run` → `.genkit/traces/<id>`) : elles prouvent quels
  outils ont été appelés et avec quels arguments. Un premier `search_articles` avec une
  phrase entière ne trouvait rien (recherche par sous-chaîne), d'où la consigne
  « un seul mot-clé » dans la description de l'outil.
- **`pg_dump` / `psql` depuis l'image `pgvector/pgvector:pg18`** : rien à installer,
  et la version est ≥ à celle de la source.
- **`--single-transaction` + `ON_ERROR_STOP`** : le premier import a échoué
  (`CREATE SCHEMA public`) sans laisser de base à moitié remplie.
- **Comparer les nombres de lignes table par table**, puis faire un test
  `match_embeddings` sur la cible, avant de toucher à la configuration.
- **Tester dans un worktree séparé** (`feat/a2ui`) pour ne pas perturber le `yarn dev`
  en cours sur `main`.
- **Chrome headless + protocole DevTools** pour valider un rendu React et un clic sans
  consommer de quota LLM (page de test temporaire, jamais commitée).

## Erreurs commises, et leçons

| Erreur | Leçon |
|---|---|
| J'ai annoncé « le projet Supabase n'existe plus » sur la foi d'un seul NXDOMAIN | Vérifier avec plusieurs résolveurs (`dig @8.8.8.8`, `@1.1.1.1`, `@9.9.9.9`) **et** par une autre route (pooler) avant de conclure. Le NXDOMAIN était passager. |
| J'ai conclu qu'une réponse était tronquée à cause de `grep "^FLOW"` | `grep` ne garde que la 1re ligne d'une sortie sur plusieurs lignes. Afficher la sortie brute ou compter les caractères. |
| Mes tests enchaînés ont épuisé le quota Gemini de la **production** (même clé) | Tester sur un modèle au quota séparé, simuler hors LLM (rendu, SQL), et compter les requêtes avant de boucler. |
| `LLM_PROVIDERS.claude` était `undefined` en script | L'environnement du shell contenait `ANTHROPIC_API_KEY=` (vide) et dotenv **n'écrase pas** une variable existante : utiliser `config({ override: true })` dans les scripts de test. |
| `V="npx -y vercel@latest"; $V env …` → « command not found » | zsh ne découpe pas une variable en mots : passer par une fonction `vc() { npx -y vercel@latest "$@"; }`. |
| Suivi de déploiement basé sur l'âge affiché par `vercel ls` : ne s'est jamais arrêté | Suivre le statut GitHub du commit : `gh api repos/<repo>/commits/<sha>/status` (contexte « Vercel »). |
| Le mot de passe Neon a été collé dans la conversation | Le régénérer après la migration ; passer par `.secrets/` (ignoré par git) plutôt que par le chat. |

## Pièges techniques à retenir

- **Next.js `trailingSlash: true`** : `/api/mcp` → 308 → `/api/mcp/`. Claude Code suit la
  redirection, mais ce n'est pas garanti pour tous les clients MCP. Documenter l'URL avec le slash final.
- **MCP Streamable HTTP** : un POST sans `Accept: application/json, text/event-stream`
  renvoie 406 (conforme à la spécification). Un GET avec `Accept: text/event-stream`
  renvoie 405 en mode sans état. `notifications/initialized` renvoie 202.
- **Neon** : l'URL `-pooler` sert à l'application serverless, l'URL directe aux
  migrations et à pg_dump. Premier appel après une veille ≈ 0,6 à 1 s.
- **`pg` et `sslmode=require`** : avertissement sur la future sémantique libpq, sans
  conséquence aujourd'hui.
- **`next build` dans le dossier où tourne `yarn dev`** écrase `.next` : builder dans
  un worktree, ou laisser Vercel valider.
- **`npx skills add … --copy`** est ignoré en mode non interactif, et l'outil copie parfois
  dans `.claude/skills` au lieu de créer un lien : déplacer vers `.agents/skills`, puis `yarn link-skills`.
- **litellm-pgvector** : `EMBEDDING__MODEL` doit porter le préfixe `openai/` (le SDK LiteLLM exige
  un fournisseur), et le proxy doit avoir `drop_params: true` (Ollama refuse `encoding_format=base64`).
  L'API n'a ni index, ni DELETE, ni dédoublonnage (détails dans son README).
- **Fichier secret collé dans l'éditeur mais pas enregistré** : vérifier la taille (`longueur=0`)
  sans jamais afficher le contenu, avant de conclure que le mot de passe est en place.
- **Régénérer un mot de passe coupe la production** tant que Vercel n'est pas redéployé :
  préparer la commande de mise à jour AVANT de cliquer sur « Reset password ».

## Reste à faire (à la date du REX)

- [x] Régénérer le mot de passe Neon et mettre Vercel à jour (fait, RAG de prod vérifié).
- [ ] Supprimer les variables `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*` de Vercel, puis le projet Supabase après quelques jours.
- [ ] Trancher le périmètre du seed (articles, CV, lettre de motivation) avant le prochain `make db-seed`.
- [ ] Quota LLM durable (facturation Gemini ou crédits Anthropic).
- [ ] Rebaser `feat/a2ui` sur `main` (conflits sur Genkit dans `package.json`, `yarn.lock` et `ai.js`).
- [ ] Workflow GitHub « Lint & Format » en échec depuis plusieurs pushes (antérieur à cette session).

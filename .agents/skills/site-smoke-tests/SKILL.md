---
name: site-smoke-tests
description: >
  Test the portfolio site end to end after a change or a deployment: pages, blog article links,
  the MCP server (/api/mcp: auth, protocol, schemas, validation) and optionally Jamila (/api/chat).
  Use this skill when: (1) verifying a Vercel deployment or a local dev server works, (2) checking that
  MCP auth/validation or article URLs did not regress, (3) testing Jamila's answers and links without
  wasting the LLM quota, or (4) inspecting UI in a real browser (ego-browser / Chrome headless).
  For heavy or verbose runs, delegate to the `site-tester` agent.
---

# Tests de fumée du site

Script de référence : `scripts/smoke-test.mjs` (Node, aucune dépendance). Il est déterministe et
**n'appelle aucun LLM par défaut**.

```bash
yarn test:smoke                                    # production (https://nkaurelien.kamitbrains.fr)
yarn test:smoke --base http://localhost:3000       # dev local (yarn dev lancé)
yarn test:smoke --with-llm                         # + 1 question à Jamila (1 à 4 requêtes LLM)
```

Code de sortie 0 si tout passe, 1 sinon : utilisable tel quel en CI.

## Ce qui est vérifié

| Test | Attendu | Régression détectée |
|---|---|---|
| Pages `/fr/`, `/en/`, `/fr/blog/`, `/fr/chat/` | 200 | build ou déploiement cassé |
| Liens d'articles (1 par fichier `datasources/articles/YYYY-MM-DD-slug.md`) | tous en 200 sur `/fr/blog/<slug>/` | URL mal construite (préfixe de date, slug) dans les outils de Jamila ou le blog |
| MCP `GET /api/mcp/` | 200, 6 outils | route cassée |
| MCP sans clé | **401** en prod | endpoint redevenu public (`MCP_API_KEY` absent sur Vercel) |
| MCP sans `Accept: …, text/event-stream` | 406 | transport SDK remplacé |
| MCP `tools/list` | 6 outils, `inputSchema` en JSON Schema (`limit` = `integer`) | schémas zod renvoyés bruts |
| MCP `limit: "abc"` | `isError`, « expected number » | validation zod contournée |
| MCP `list_articles` | dates `YYYY-MM-DD` | bug `String(Date)` de gray-matter |
| Umami `POST /stats/api/send` (site factice) | 400 renvoyé **par Umami** (308 trailingSlash puis rewrite) | envoi redirigé vers `/fr/stats/…` (404) : le middleware de langue ne doit pas traiter `/stats` |
| `--with-llm` : Jamila | réponse sans « indisponible », liens `/blog/…` en 200 | quota LLM épuisé, RAG/outils cassés |

## Règles

- **Quota LLM** : l'offre gratuite de Gemini est à 20 requêtes/jour/modèle, partagée avec la production.
  N'utiliser `--with-llm` qu'une fois par vérification, jamais en boucle.
- **Clés** : le script lit `MCP_API_KEY_PRODUCTION` (prod) ou `MCP_API_KEY` (autre base) dans
  `.env.local`, sans jamais les afficher. Ne pas les passer en argument de ligne de commande.
- **URL** : toujours avec le slash final (`trailingSlash: true` → `/api/mcp` renvoie 308).
- **Après un push** : attendre le déploiement via le statut GitHub du commit
  (`gh api repos/nkaurelien/nkaurelien.github.io/commits/<sha>/status`, contexte « Vercel »),
  puis lancer `yarn test:smoke`.
- **En dev**, sans `MCP_API_KEY` défini côté serveur, l'endpoint est public : le test 401 le signale sans échouer.

## Conventions de sélecteurs et d'accessibilité

Les tests ciblent des attributs **stables** posés dans les composants, jamais le texte ou les classes Mantine
(`m_xxxx`, `mantine-…`, qui changent à chaque version) :

| Zone | Sélecteurs |
|---|---|
| Mise en page | `a.skip-link` `[data-testid=skip-link]` → `main#content[tabindex=-1]` `[data-testid=main-content]` |
| Navigation | `nav[aria-label]` `[data-testid=nav-main\|nav-mobile]`, liens `[data-testid=nav-link-<slug>]` + `aria-current="page"`, `[data-testid=nav-burger][aria-expanded]` |
| Blog | `h1#blog-title`, `[role=search]` + `input#blog-search[type=search]` (`<label for>`), `[data-testid=blog-tag][aria-pressed][data-tag]`, `[data-testid=blog-count][role=status]`, `ul[data-testid=blog-list] > li > [data-testid=blog-card][data-slug][data-source]` |
| Article | `article[data-testid=article][aria-labelledby=article-title]`, `h1#article-title`, `time[data-testid=article-date][datetime]`, `[data-testid=article-content]` |
| Chat | `form[data-testid=chat-form][aria-busy]`, `label[for=chat-input]` + `input#chat-input[name=message]` (aide via `description` Mantine), `button[data-testid=chat-send][aria-label]`, `ul[data-testid=chat-suggestions] > li > [data-testid=chat-suggestion]`, `[data-testid=chat-log][role=log][aria-busy]`, `article[data-testid=chat-message][data-role]`, `[data-testid=chat-feedback-up\|down][aria-pressed]`, `[data-testid=chat-copy]` |

Règles (guide `accessibility` de modern-web-guidance) à respecter pour tout nouveau composant :
- **un seul `h1` par page** ; landmarks `header`/`nav`/`main`/`footer` ; listes `ul`/`li` (+ `role="list"` si flex/grid, pour Safari) ;
- **tout bouton icône a un `aria-label`** (le `Tooltip` Mantine ne nomme pas) ; icônes décoratives `aria-hidden="true"` ; pas de bouton dans un lien ;
- **champs** : `<label for>` réel (pas seulement `placeholder`) ; avec Mantine, passer l'aide par `description` (il écrase `aria-describedby`) ;
- **états** par ARIA (`aria-pressed`, `aria-expanded`, `aria-current`, `aria-busy`), pas seulement par la couleur ;
- **contraste AA** : ne pas revenir à la teinte 6 de Mantine. `theme.primaryShade.light = 8`, et `globals.css` force `--mantine-color-dimmed`
  et `--mantine-color-<c>-light-color` en `:root:root[...]` (Mantine injecte ses variables à l'exécution, après la feuille globale).

## Vérification en vrai navigateur (`yarn test:ui`)

Les tests HTTP ne voient pas une page qui répond 200 mais **plante à l'écran**. `yarn test:ui`
(`scripts/ui-check.sh` → `scripts/ui-check.ego.mjs`) pilote **ego lite** (macOS) sans appel LLM :

| Contrôle | Échec si |
|---|---|
| **Audit axe-core** (WCAG 2.1 A/AA, injecté dans chaque page) | violation `serious` ou `critical` (`moderate`/`minor` = avertissement) |
| **Structure** | pas de `main#content`, ≠ 1 `h1`, `html` sans `lang`, 1er Tab ailleurs que sur le lien d'évitement |
| Exceptions JavaScript du site (CDP `Runtime.exceptionThrown`) | toute exception hors extensions du navigateur |
| Ressources du site en 4xx/5xx (CDP `Network.responseReceived`) | une requête vers l'origine du site échoue |
| `/fr/` | aucun titre rendu (écran blanc) |
| `/fr/blog/` | < 10 cartes ; recherche « kaniko » sans résultat ; tag cliqué sans `aria-pressed="true"` |
| 1er article local | pas de titre, < 1000 caractères, date sans `datetime` |
| `/fr/chat/` | < 4 suggestions, champ sans `<label>`, bouton d'envoi sans nom (rien n'est envoyé : pas de LLM) |
| Mobile 390 px | débordement horizontal, bouton de menu sans nom |

`console.error` n'est qu'un avertissement. Captures facultatives dans `/tmp/ui-check/` (elles peuvent
expirer si la fenêtre ego lite n'est pas au premier plan). ego-browser ne transmet pas l'environnement
au script : `ui-check.sh` y injecte `__BASE__` / `__OUT__`. L'extension interne d'ego lite lève
« No Listener: tabs:… » : ce bruit est filtré.

**Historique (24/09/2026)** : 1er passage → erreur React #418 (hydratation) sur `/fr/` et `/fr/blog/`, et envoi
Umami en 404 en prod (`/stats/api/send` → 308 → 307 `/fr/stats/api/send/`, le middleware de langue n'excluait pas `/stats`),
corrigé en excluant `stats` du matcher de `src/middleware.js` (le rewrite retire le slash final avant de relayer à Umami).
Audit axe initial : ~200 violations graves (contraste, boutons sans nom, images sans alt) → **0** après la passe
d'accessibilité. Les ressources `/stats/` sont rangées en avertissement (Umami absent en local).

Pour un rendu sans interface (CI, WebKit/Firefox), préférer `@playwright/test`.

## Aller plus loin (manuel)

- **Flow Genkit avec traces** (prouve quels outils ont été appelés) :
  `npx genkit --non-interactive flow:run chatFlow '{"query":"…"}' -- npx tsx src/genkit/dev.mjs`,
  puis lire `.genkit/traces/<traceId>`.
- **Données RAG** : voir le skill `jamila-rag-data` (retrieval, migrations, seed).

## Étendre

Ajouter un `await check('nom', async () => { …; return 'détail'; })` dans `scripts/smoke-test.mjs`.
Un test doit être rapide, sans LLM (sauf derrière `WITH_LLM`), et vérifier une régression réelle déjà rencontrée.

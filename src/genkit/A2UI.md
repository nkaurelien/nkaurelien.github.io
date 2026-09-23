# A2UI : UI générative pour Jamila (preview)

Branche `feat/a2ui`. Jamila peut afficher des **surfaces** interactives
(cartes, listes, boutons) en plus du texte, via le protocole
[A2UI](https://a2ui.org/) et le plugin Genkit `@genkit-ai/a2ui`.
Doc : <https://genkit.dev/docs/js/agents/a2ui/>.

**Désactivé par défaut.** Sans `CHAT_A2UI=1`, la branche se comporte comme `main`.

## Activer

```bash
# local
CHAT_A2UI=1 yarn dev

# Vercel (preview d'abord, puis production si validé)
vercel env add CHAT_A2UI preview   # valeur : 1
```

## Fonctionnement

```
Gemini ──> ai.generateStream({ tools, use: [a2ui()] })      src/genkit/ai.js
             │  le middleware a2ui() injecte le catalogue dans le prompt,
             │  extrait les blocs ```a2ui du modèle et les convertit en
             │  parts data `application/a2ui+json`
             ▼
chatFlow ── stream : string (texte) | { a2ui: envelopes[] } src/genkit/chatFlow.js
             ▼
/api/chat ─ texte -> text-delta ; surface -> part `data-a2ui` src/app/api/chat/route.js
             ▼
ChatBox ─── parts `data-a2ui` -> <A2uiMessage>               src/components/chat/
             ▼
A2uiMessage ─ MessageProcessor (@a2ui/web_core) + <A2uiSurface> (@a2ui/react)
              clic sur un Button -> action.name envoyé comme message du visiteur
```

- **Quand afficher une surface** : règles dans `A2UI_GUIDANCE` (`src/genkit/rag.js`),
  ajoutées au prompt système seulement si `CHAT_A2UI=1`. Une Card par élément
  (article, projet…) avec titre en lien markdown, date et résumé ; texte d'intro
  court sans répéter la liste ; Button uniquement pour des questions de suivi.
- **Thème** : les variables CSS `--a2ui-*` sont alignées sur Mantine (clair/sombre)
  dans `A2uiMessage.js`.
- **Historique** : la route ne renvoie au modèle que le texte des messages. Une
  surface déjà affichée n'est donc pas « vue » par le modèle au tour suivant ; les
  clics sur les boutons arrivent comme un message texte normal.

## Sécurité

L'UI vient du modèle, donc c'est du **contenu non fiable**. `validate` ne vérifie
que la structure et les noms de composants, pas les valeurs.

- Les `Text` passent par `@a2ui/markdown-it`, qui assainit le HTML. Testé : un
  `<img src=x onerror=…>` injecté dans un Text s'affiche en texte échappé et
  n'est pas exécuté.
- Le prompt interdit `Image` (pas de requêtes vers des domaines externes) et les
  champs de saisie `TextField`, `CheckBox` et `Slider` (aucune collecte de
  données). Ce n'est qu'une consigne : pour une vraie garantie, il faudrait
  ajouter un middleware après `a2ui()` qui filtre les composants, ou un catalogue
  personnalisé réduit (`loadCatalog`).
- Aucun outil d'écriture n'est exposé (`send_contact_message` reste réservé au
  serveur MCP authentifié).

## Dépendances ajoutées

| Paquet | Version | Note |
|---|---|---|
| `genkit`, `@genkit-ai/google-genai` | 1.39 → **1.42** | requis par `@genkit-ai/a2ui` |
| `@genkit-ai/anthropic` | 0.3 → **0.5** | peer `genkit ^1.42` |
| `genkit-cli` (dev) | → 1.42 | |
| `@genkit-ai/a2ui` | 0.5.0 | middleware serveur (preview) |
| `@a2ui/react`, `@a2ui/web_core`, `@a2ui/markdown-it` | 0.11 / 0.11 / 0.1 | rendu client |

`@a2ui/react` et `@a2ui/web_core` dépendent de **zod 3** alors que le projet est
en zod 4. Yarn leur installe une copie de zod 3 dans leur propre `node_modules`.
Il reste seulement un avertissement « incorrect peer dependency », sans impact
sur le zod 4 du projet.

## Ce qui a été testé

- **Serveur** (`gemini-3.5-flash-lite`, outils + `a2ui()`) : séquence
  `list_articles` → texte → surface (Card, Column, Text, Button) → texte.
  Les enveloppes arrivent bien en streaming.
- **Rendu** (Chrome headless, enveloppes au format du modèle) : les cartes
  s'affichent, les liens markdown deviennent des `<a href="/blog/…">`, le thème
  est appliqué, l'injection HTML est neutralisée.
- **Action** : un clic sur un Button remonte `action.name` au chat.
- **Build** : `next build` passe.

**Pas encore testé de bout en bout dans le navigateur avec un vrai modèle** :
le quota Gemini gratuit était épuisé pendant le développement (voir plus bas).

## Limites et risques

- **Preview** : l'API Agents et A2UI « peuvent casser entre versions mineures ».
  Il faut figer les versions et relire le changelog avant chaque mise à jour.
- **Pas de garantie qu'une surface soit produite** : c'est le modèle qui décide.
  Avec `gemini-2.5-flash`, certains tirages n'ont produit que du texte.
- **Coût en tokens** : le catalogue injecté dans le prompt système alourdit
  chaque requête.
- **Quota Gemini** : l'offre gratuite de `gemini-2.5-flash` est limitée à
  **20 requêtes par jour et par modèle** (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`).
  Une question avec outils consomme 2 à 4 requêtes. Le fournisseur de secours,
  Claude, n'a plus de crédits. Ce problème existe déjà sur `main`, il ne vient
  pas d'A2UI, mais il bloque les tests.

## Avant de fusionner

1. Régler le quota LLM : facturation Gemini, crédits Anthropic, ou modèle de
   secours au quota séparé (par ex. `gemini-3.5-flash-lite`).
2. Tester `/fr/chat/` avec `CHAT_A2UI=1`, en clair et en sombre, sur mobile.
3. Envisager un catalogue réduit (`loadCatalog`) sans Image ni champs de saisie,
   pour que les interdictions soient appliquées par le code et plus seulement
   par le prompt.
4. Activer d'abord `CHAT_A2UI=1` sur les previews Vercel, puis en production.

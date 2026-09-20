# Documentation des Articles & Guide de Rédaction Mermaid / LaTeX

Ce dossier contient l'ensemble des articles techniques publiés sur le blog.

---

## 🎨 Règles d'Écriture des Schémas Mermaid

Afin de garantir un rendu sans erreur et compatible avec Mermaid v12+ (`securityLevel: 'strict'`, `htmlLabels: true`), suivez scrupuleusement les règles ci-dessous lors de la rédaction de diagrammes ```mermaid``` dans vos articles `.md` :

### 1. 🛑 Libellés d'Arêtes : Toujours entourer de guillemets doubles `"..."`
Si un libellé de liaison contient des caractères spéciaux tels que des parenthèses `()`, des deux-points `:`, un `&` ou des espaces complexes, **il doit impérativement être entouré de guillemets doubles**. Sans quoi, le parser lexer de Mermaid plante (`Parse error ... got 'PS'`).

- ❌ **INCORRECT** :
  ```mermaid
  A -->|1. Push initial (staging)| B
  C -->|Port: 8080| D
  E -->|Contexte & Dockerfile| F
  ```

- ✅ **CORRECT** :
  ```mermaid
  A -->|"1. Push initial (staging)"| B
  C -->|"Port: 8080"| D
  E -->|"Contexte & Dockerfile"| F
  ```

---

### 2. ↩️ Saut de Ligne dans les Nœuds : Utiliser `<br/>` au lieu de `\n`
Depuis Mermaid v10+, le symbole de saut de ligne `\n` dans les libellés de nœuds est ignoré ou affiché en texte brut. Utilisez la balise HTML `<br/>` à la place.

- ❌ **INCORRECT** :
  ```mermaid
  KanikoPod["Kubernetes Job : Kaniko Executor\n(gcr.io/kaniko-project/executor)"]
  ```

- ✅ **CORRECT** :
  ```mermaid
  KanikoPod["Kubernetes Job : Kaniko Executor<br/>(gcr.io/kaniko-project/executor)"]
  ```

---

### 3. 🛡️ Échappement des Caractères HTML `<`
Comme `htmlLabels: true` est activé pour supporter le multiligne `<br/>`, un crochet ouvrant littéral `<` peut être interprété comme une balise HTML non fermée. Utilisez `&lt;`.

- ❌ **INCORRECT** :
  ```mermaid
  Node["Seuil < 100ms"]
  ```

- ✅ **CORRECT** :
  ```mermaid
  Node["Seuil &lt; 100ms"]
  ```

---

## 🧪 Architecture & Validation sous le Capot (`MermaidDiagram.js`)

Le composant React `src/components/blog/MermaidDiagram.js` gère le rendu avec les garanties suivantes :
1. **Validation préalable via `mermaid.parse(chart)`** : Valide le schéma silencieusement sans rien injecter dans le DOM. Si la syntaxe est invalide, l'article affiche un bloc de code brut avec l'intitulé `Schéma Mermaid` sans impacter le reste du site.
2. **Sérialisation des rendus (`renderQueue`)** : Évite les conflits d'état global si plusieurs diagrammes sont présents sur la même page.
3. **Identifiants nettoyés (`useId()`)** : Supprime les caractères spéciaux `:` générés par React pour éviter tout conflit avec les sélecteurs CSS.

---

## 📐 Rendu Formules Mathématiques LaTeX (KaTeX)

Le moteur de rendu supporte également les formules LaTeX en ligne et en bloc grâce à `remark-math` et `rehype-katex` :
- Formule en ligne : `$E = mc^2$`
- Formule en bloc :
  ```markdown
  $$
  \underbrace{\text{redis}}_{\text{1. Service}} \cdot \underbrace{\text{databases}}_{\text{2. Namespace}} \cdot \underbrace{\text{svc}}_{\text{3. Type d'objet}} \cdot \underbrace{\text{cluster.local}}_{\text{4. Racine DNS Cluster}}
  $$
  ```

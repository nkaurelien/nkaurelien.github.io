---
name: mermaid-articles
description: >
  Write and debug Mermaid diagrams and LaTeX math formulas in blog articles (datasources/articles/).
  Use this skill when: (1) creating a new technical blog article with Mermaid diagrams or KaTeX formulas,
  (2) editing existing articles in datasources/articles/, (3) troubleshooting Mermaid parse errors or
  text truncation in flowchart nodes, or (4) verifying diagram edge label quotes and line breaks.
---

# Mermaid Diagrams & LaTeX Formatting Skill for Blog Articles

## Core Rules for Mermaid Diagrams (v12+ Compatible)

When creating or modifying Mermaid diagrams inside markdown code blocks (```mermaid ... ```) in `datasources/articles/`:

### 1. Always Double-Quote Edge Labels
Any link label containing special characters like parentheses `()`, colons `:`, ampersands `&`, or numbers with dots MUST be wrapped in double quotes `"..."`.
- ❌ `A -->|1. Push initial (staging)| B`
- ✅ `A -->|"1. Push initial (staging)"| B`
- ✅ `C -->|"Port: 8080"| D`
- ✅ `E -->|"Contexte & Dockerfile"| F`

### 2. Use `<br/>` for Multiline Node Text
Do NOT use `\n` in node text string labels; `\n` is deprecated in Mermaid 10+ and causes text rendering truncation. Use HTML `<br/>`.
- ❌ `KanikoPod["Kubernetes Job : Kaniko Executor\n(gcr.io/kaniko-project/executor)"]`
- ✅ `KanikoPod["Kubernetes Job : Kaniko Executor<br/>(gcr.io/kaniko-project/executor)"]`

### 3. Escape `<` as `&lt;` Inside Node Text
Because `htmlLabels: true` is active for `<br/>` support, unescaped `<` is parsed as invalid HTML.
- ❌ `Node["Latency < 100ms"]`
- ✅ `Node["Latency &lt; 100ms"]`

---

## Component Architecture (`src/components/blog/MermaidDiagram.js`)

- Uses `mermaid.parse(chart)` before `render()` to catch syntax errors without writing dirty SVG nodes to `document.body`.
- Uses `renderQueue` to serialize async diagram renders across multiple components on the same page.
- Strips `:` from `useId()` so React IDs do not clash with Mermaid CSS selectors.
- Sets `securityLevel: 'strict'` and `flowchart: { htmlLabels: true, useMaxWidth: true, padding: 16 }`.

---

## LaTeX Formula Syntax

- Inline formulas: `$E = mc^2$`
- Block formulas:
  ```markdown
  $$
  \underbrace{\text{redis}}_{\text{1. Service}} \cdot \underbrace{\text{databases}}_{\text{2. Namespace}} \cdot \underbrace{\text{svc}}_{\text{3. Type d'objet}} \cdot \underbrace{\text{cluster.local}}_{\text{4. Racine DNS Cluster}}
  $$
  ```

---

## 🐋 Docker & Kubernetes Architecture Examples

For ready-to-use Docker Compose, Traefik, Kaniko, Crane, and Kubernetes FQDN Mermaid flowchart templates, consult [examples/docker-examples.md](file://.agents/skills/mermaid-articles/examples/docker-examples.md).

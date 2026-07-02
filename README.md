# nkaurelien.github.io

Site personnel / portfolio d'**Aurelien NKUMBE** — déployé sur GitHub Pages à l'adresse
[https://nkaurelien.github.io](https://nkaurelien.github.io).

## Stack

- **Next.js 15** (App Router, export statique)
- **Mantine 8** (UI)
- **next-intl** (i18n : `fr` / `en`)

## Développement

```bash
yarn install
yarn dev            # http://localhost:3000
yarn build          # export statique dans ./out
yarn lint           # ESLint
yarn format         # Prettier
```

## Contenu

Le contenu est piloté par des données par locale :

- `src/data/{fr,en}/` — profil, sections (hero, services, historique, compteurs…)
- `public/projects/{fr,en}/*.md` — projets (frontmatter YAML ; `*.md.off` = masqué)
- `public/img/` — visuels

## Déploiement

Automatique via GitHub Actions (`.github/workflows/deploy.yml`) à chaque push sur `main`.
Le site est servi à la racine (`basePath` vide). Pour un domaine personnalisé, ajouter
un fichier `public/CNAME`.

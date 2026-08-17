# ==========================================
# Justfile — Runner de commandes moderne
# ==========================================

# Recette par défaut : affiche toutes les commandes disponibles
default:
    @just --list

# Lance le serveur de développement local
dev:
    yarn dev

# Compile la version de production Next.js
build:
    yarn build

# Génère le CV PDF (cv.md -> public/cv.pdf) via Pandoc et Weasyprint
pdf:
    node scripts/build-pdf.js

# Formate le code source avec Prettier
format:
    yarn format

# Vérifie le code avec Next.js Lint
lint:
    yarn lint

# Applique le schéma SQL sur Supabase via Prisma
db-schema:
    npx prisma db execute --file ./supabase/create_embeddings_schema.sql

# Ingest les projets et génère les embeddings vectoriels dans Supabase
db-seed:
    node scripts/import-projects-supabase.js

# Force le re-calcul de TOUS les embeddings vectoriels
db-reseed:
    REEMBED=1 node scripts/import-projects-supabase.js

# Exécute une requête SQL sur Supabase (ex: just db-query "SELECT count(*) FROM vector_embeddings")
db-query query:
    node scripts/db-query.js "{{query}}"

# Ouvre Prisma Studio dans le navigateur
db-studio:
    npx prisma studio

# Introspecte la base de données distante dans prisma/schema.prisma
db-pull:
    npx prisma db pull

# Régénère le client Prisma local (src/generated/prisma)
db-generate:
    npx prisma generate

# Construit l'image Docker de production avec Pandoc & Weasyprint
docker-build:
    docker build -t nkaurelien-website:latest .

# Lance le conteneur en production via docker-compose
docker-up:
    docker compose up --build -d

.PHONY: dev build format pdf db-schema db-seed db-reseed db-query db-studio db-pull db-generate db-up db-down

# Start the local development server
dev:
	yarn dev

# Compile the production build
build:
	yarn build

# Format source files with Prettier
format:
	yarn format

# Generate PDF from cv.md
pdf:
	node scripts/build-pdf.js

# Apply the Postgres + pgvector schema (Neon / local Docker)
db-schema:
	npx prisma db execute --file ./db/schema.sql

# Seed the database with projects and generate vector embeddings
db-seed:
	node scripts/import-projects.js

# Force re-embedding of ALL projects/docs (recalcule même les entrées existantes)
db-reseed:
	REEMBED=1 node scripts/import-projects.js

# Send an SQL query to Postgres via Prisma (usage: make db-query Q="SELECT count(*) FROM vector_embeddings")
db-query:
	node scripts/db-query.js "$(Q)"

# Open Prisma Studio to browse/edit the database in the browser
db-studio:
	npx prisma studio

# Re-introspect the existing database schema into prisma/schema.prisma
db-pull:
	npx prisma db pull

# Regenerate the local Prisma Client (src/generated/prisma)
db-generate:
	npx prisma generate

# Build the production Docker image (including Pandoc & Weasyprint PDF generation)
docker-build:
	docker build -t nkaurelien-website:latest .

# Run the containerized app via docker-compose
docker-up:
	docker compose up --build -d

# Start the local Postgres + pgvector database (schema applied on first start)
db-up:
	docker compose up -d db

# Stop the local Postgres + pgvector database (data kept in the pgdata volume)
db-down:
	docker compose stop db

.PHONY: dev build format db-schema db-seed db-query db-studio db-pull db-generate

# Start the local development server
dev:
	yarn dev

# Compile the production build
build:
	yarn build

# Format source files with Prettier
format:
	yarn format

# Apply SQL schema migrations to the Supabase database
db-schema:
	npx prisma db execute --file ./supabase/create_embeddings_schema.sql

# Seed the Supabase database with projects and generate vector embeddings
db-seed:
	node scripts/import-projects-supabase.js

# Send an SQL query to Supabase via Prisma (usage: make db-query Q="SELECT count(*) FROM vector_embeddings")
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

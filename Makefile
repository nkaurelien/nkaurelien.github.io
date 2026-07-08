.PHONY: dev build format db-schema db-seed

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

#!/usr/bin/env sh
# Applique db/migrations/*.sql dans l'ordre (chaque fichier est idempotent et
# enregistre sa version dans schema_migrations).
#
#   make db-migrate                      # base de DIRECT_URL (.env.local), ex. Neon
#   DB_URL=postgresql://… make db-migrate      (base locale : hôte host.docker.internal)
#
# psql tourne dans l'image pgvector (rien à installer, même version que Neon).
set -eu
cd "$(dirname "$0")/.."

if [ -z "${DB_URL:-}" ]; then
  DB_URL=$(grep -E '^DIRECT_URL=' .env.local | cut -d= -f2- | tr -d '"')
fi
[ -n "$DB_URL" ] || { echo "DB_URL / DIRECT_URL introuvable" >&2; exit 1; }

for f in db/migrations/*.sql; do
  v=$(basename "$f" | cut -d_ -f1)
  echo "==> $f"
  docker run --rm -e PGOPTIONS="-c client_min_messages=warning" -v "$PWD/db/migrations:/migrations:ro" pgvector/pgvector:pg18 \
    psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "/migrations/$(basename "$f")"
  echo "    version $v OK"
done

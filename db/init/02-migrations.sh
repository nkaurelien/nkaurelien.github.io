#!/usr/bin/env bash
# Init du conteneur Postgres local (docker-entrypoint-initdb.d) : applique les
# migrations après db/schema.sql (01-schema.sql), au premier démarrage uniquement.
set -euo pipefail
for f in /migrations/*.sql; do
  echo "==> migration $(basename "$f")"
  PGOPTIONS="-c client_min_messages=warning" psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -q -f "$f"
done

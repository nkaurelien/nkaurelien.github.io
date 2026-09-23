#!/usr/bin/env sh
# Vérification d'interface et d'accessibilité (axe-core, WCAG 2.1 A/AA) en vrai navigateur
# via ego lite (macOS), sans appel LLM.
#
#   yarn test:ui                                  # production
#   yarn test:ui --base http://localhost:3000     # dev local
#
# Captures d'écran dans /tmp/ui-check/. Code de sortie 1 si un contrôle échoue.
set -eu
cd "$(dirname "$0")/.."

BASE=https://nkaurelien.kamitbrains.fr
[ "${1:-}" = "--base" ] && BASE=${2:?--base attend une URL}
BASE=${BASE%/}
OUT=/tmp/ui-check
mkdir -p "$OUT"

command -v ego-browser >/dev/null 2>&1 || { echo "ego-browser introuvable : installer ego lite (https://lite.ego.app/)" >&2; exit 2; }

# ego-browser ne transmet pas l'environnement au script : on injecte BASE et OUT.
LOG=$(mktemp)
AXE="$PWD/node_modules/axe-core/axe.min.js"
[ -f "$AXE" ] || { echo "axe-core absent : yarn install" >&2; exit 2; }
sed -e "s#__BASE__#$BASE#" -e "s#__OUT__#$OUT#" -e "s#__AXE__#$AXE#" scripts/ui-check.ego.mjs | ego-browser nodejs | tee "$LOG"
grep -q '^UI_RESULT=OK$' "$LOG"; STATUS=$?
rm -f "$LOG"
exit $STATUS

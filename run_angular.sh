#!/usr/bin/env bash
# Starts the Angular dev server and opens it in your browser.
set -e

cd "$(dirname "$0")"

# Angular 22 requires Node >=22.22.3, >=24.15.0, or >=26.0.0 specifically —
# checking only the major version isn't enough (e.g. v24.2.0 has major 24 but
# doesn't satisfy >=24.15.0). Use nvm's latest installed version if the
# currently active `node` doesn't actually satisfy one of these ranges.
node_version_ok() {
  local v major minor patch
  v="$(node -v 2>/dev/null | sed -E 's/^v//')"
  [ -z "$v" ] && return 1
  IFS='.' read -r major minor patch <<< "$v"
  if [ "$major" -ge 26 ]; then return 0; fi
  if [ "$major" -eq 24 ] && [ "$minor" -ge 15 ]; then return 0; fi
  if [ "$major" -eq 22 ] && { [ "$minor" -gt 22 ] || { [ "$minor" -eq 22 ] && [ "$patch" -ge 3 ]; }; }; then return 0; fi
  return 1
}

if ! node_version_ok; then
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1090
    source "$HOME/.nvm/nvm.sh"
    nvm use --lts >/dev/null 2>&1 || nvm install --lts >/dev/null
  fi
fi

if ! node_version_ok; then
  echo "Node.js >=22.22.3, >=24.15.0, or >=26.0.0 is required (found $(node -v 2>/dev/null || echo 'none'))." >&2
  echo "Install it with nvm: nvm install --lts && nvm use --lts" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm ci
fi

PORT=4200
URL="http://localhost:$PORT"

open_browser() {
  sleep 3
  if command -v open >/dev/null; then
    open "$URL"
  elif command -v xdg-open >/dev/null; then
    xdg-open "$URL"
  fi
}
open_browser &

echo "Starting MayfairTech website at $URL ..."
npx ng serve --port "$PORT"

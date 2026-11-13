#!/bin/bash
# One-time local setup for the web app and the API. Safe to re-run: existing env files and the
# Python virtualenv are left alone.
set -e
cd "$(dirname "$0")/.."

echo "Installing npm dependencies..."
npm install

echo "Setting up the API's Python environment..."
if [ ! -d packages/api/.venv ]; then
  python3 -m venv packages/api/.venv
fi
packages/api/.venv/bin/pip install -q -r packages/api/requirements.txt

echo "Creating env files from the examples (existing files are kept)..."
cp -n packages/api/.env.example packages/api/.env 2>/dev/null || true
cp -n packages/web/.env.example packages/web/.env.local 2>/dev/null || true

echo ""
echo "Done. Next:"
echo "  1. Put your HERE API key in packages/api/.env"
echo "  2. npm run dev:all   (API on :5000, web on :3000)"

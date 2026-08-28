#!/usr/bin/env bash
set -e

PREFIX="${1:-}"

echo "📦 Listando assets en Cloudflare R2 (burgers-exe-assets-v2-preview)..."
if [ -n "$PREFIX" ]; then
  echo "Prefijo: $PREFIX"
  npx wrangler r2 object list burgers-exe-assets-v2-preview --prefix "$PREFIX"
else
  npx wrangler r2 object list burgers-exe-assets-v2-preview
fi

#!/usr/bin/env bash
set -e

QUERY="${1:-SELECT count(*) as total_orders FROM orders_v2;}"

echo "🔍 Consultando Cloudflare D1 (burgers-exe-menu-v2-preview)..."
echo "SQL: $QUERY"
echo "──────────────────────────────────────────"
npx wrangler d1 execute burgers-exe-menu-v2-preview --remote --command "$QUERY"

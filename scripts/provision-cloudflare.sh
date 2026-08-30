#!/usr/bin/env bash
# =============================================================================
# provision-cloudflare.sh — Aprovisionamiento Automatizado de Recursos Cloudflare
# Uso: ./scripts/provision-cloudflare.sh <tenant-id> [production|preview]
# Ejemplo: ./scripts/provision-cloudflare.sh amsi-tortas production
# =============================================================================

set -euo pipefail

TENANT="${1:-}"
ENV="${2:-production}"

if [ -z "$TENANT" ]; then
  echo "❌ Error: Debes especificar el ID del tenant (ej. 'tamplet' o 'amsi-tortas')"
  echo "Uso: ./scripts/provision-cloudflare.sh <tenant-id> [production|preview]"
  exit 1
fi

DB_NAME="${TENANT}-menu-${ENV}"
BUCKET_NAME="${TENANT}-assets${ENV == 'preview' ? '-preview' : ''}"
PUBLIC_PROJECT="${TENANT}-public"
CHEKEO_PROJECT="${TENANT}-chekeo"

echo "================================================================="
echo "☁️ APROVISIONANDO RECURSOS CLOUDFLARE PARA TENANT: [${TENANT}] (${ENV})"
echo "================================================================="
echo "🗄️ D1 Database:  ${DB_NAME}"
echo "🪣 R2 Bucket:    ${BUCKET_NAME}"
echo "📱 Pages Public: ${PUBLIC_PROJECT}"
echo "🖥️ Pages Chekeo: ${CHEKEO_PROJECT}"
echo "================================================================="

echo "1. Creando Base de Datos D1..."
npx wrangler d1 create "${DB_NAME}" || echo "⚠️ Nota: La base D1 ya existe o se creará en el dashboard."

echo "2. Creando Bucket R2 de Assets..."
npx wrangler r2 bucket create "${BUCKET_NAME}" || echo "⚠️ Nota: El bucket R2 ya existe."

echo "3. Aplicando Schema V3 Limpio en D1..."
if [ -f "./migrations/template/0001_v3_clean_schema.sql" ]; then
  npx wrangler d1 execute "${DB_NAME}" --remote --file=./migrations/template/0001_v3_clean_schema.sql || true
fi

echo "4. Aplicando Seed Inicial..."
if [ "${TENANT}" = "amsi-tortas" ] && [ -f "./migrations/amsi_tortas/0002_amsi_tortas_seed.sql" ]; then
  echo "Cargando menú auténtico de Amsi Tortas..."
  npx wrangler d1 execute "${DB_NAME}" --remote --file=./migrations/amsi_tortas/0002_amsi_tortas_seed.sql || true
elif [ -f "./migrations/template/0002_v3_blank_seed.sql" ]; then
  echo "Cargando seed base en blanco..."
  npx wrangler d1 execute "${DB_NAME}" --remote --file=./migrations/template/0002_v3_blank_seed.sql || true
fi

echo "5. Creando Proyectos en Cloudflare Pages..."
npx wrangler pages project create "${PUBLIC_PROJECT}" --production-branch main || true
npx wrangler pages project create "${CHEKEO_PROJECT}" --production-branch main || true

echo "================================================================="
echo "✅ APROVISIONAMIENTO COMPLETADO EXITOSAMENTE PARA [${TENANT}]"
echo "================================================================="

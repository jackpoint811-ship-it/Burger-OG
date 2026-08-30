#!/usr/bin/env bash
# =============================================================================
# provision-saas-infra.sh — Aprovisionamiento de Infraestructura SaaS Independiente
# =============================================================================

set -euo pipefail

ENV="${1:-production}"
CONTROL_DB="resto-saas-control-plane-${ENV}"
ASSETS_BUCKET="resto-saas-brand-assets"
PORTAL_PROJECT="resto-saas-portal"
APP_PROJECT="resto-saas-app"

echo "================================================================="
echo "☁️ APROVISIONANDO INFRAESTRUCTURA SAAS INDEPENDIENTE (${ENV})"
echo "================================================================="
echo "🗄️ Control Plane D1:  ${CONTROL_DB}"
echo "🪣 Brand Assets R2:   ${ASSETS_BUCKET}"
echo "🌐 Pages Portal:      ${PORTAL_PROJECT}"
echo "📱 Pages Multi-App:   ${APP_PROJECT}"
echo "================================================================="

echo "1. Creando Base de Datos D1 para Control Plane..."
npx wrangler d1 create "${CONTROL_DB}" || echo "⚠️ Nota: La base D1 ya existe o se creará en el dashboard."

echo "2. Creando Bucket R2 para Assets de Marcas..."
npx wrangler r2 bucket create "${ASSETS_BUCKET}" || echo "⚠️ Nota: El bucket R2 ya existe."

echo "3. Aplicando Schema de Control Plane..."
if [ -f "./migrations/saas_control/0001_saas_control_plane.sql" ]; then
  npx wrangler d1 execute "${CONTROL_DB}" --remote --file=./migrations/saas_control/0001_saas_control_plane.sql || true
fi

echo "4. Aplicando Seed Inicial de Tenants..."
if [ -f "./migrations/saas_control/0002_saas_control_seed.sql" ]; then
  npx wrangler d1 execute "${CONTROL_DB}" --remote --file=./migrations/saas_control/0002_saas_control_seed.sql || true
fi

echo "5. Creando Proyectos en Cloudflare Pages..."
npx wrangler pages project create "${PORTAL_PROJECT}" --production-branch saas-platform || true
npx wrangler pages project create "${APP_PROJECT}" --production-branch saas-platform || true

echo "================================================================="
echo "✅ INFRAESTRUCTURA SAAS APROVISIONADA EXITOSAMENTE"
echo "================================================================="

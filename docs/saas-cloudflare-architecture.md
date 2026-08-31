# Arquitectura Cloudflare SaaS Multi-Tenant — Chekeo Cloud Engine

> **Estado**: Activo / Documentación Oficial de Infraestructura Cloudflare
> **Monorepo**: Burgers.exe V3 Multi-Tenant Core

---

## 1. Visión General de la Infraestructura

Chekeo Cloud Engine opera sobre una topología Serverless nativa en el Edge de **Cloudflare**, aprovechando:
- **Cloudflare Pages Functions** (Hono.js v4) para routing y lógica de negocio distribuida a <50ms de latencia global.
- **Cloudflare D1 (SQLite en el Edge)** para persistencia relacional con aislamiento estricto por tenant y Control Plane centralizado.
- **Cloudflare R2** para almacenamiento de assets, fotos de menú y banners promocionales sin tarifas de salida (*egress-free*).
- **Cloudflare SSL for SaaS / Custom Hostnames** para permitir dominios propios por restaurante en planes Pro y Enterprise.

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │               Cloudflare Edge Network                  │
                                    └──────────────────────────┬─────────────────────────────┘
                                                               │
                                         ┌─────────────────────┴─────────────────────┐
                                         │                                           │
                                 [ Subdominio *.pages.dev ]                  [ Dominio Personalizado ]
                                 ej. amsi-tortas.pages.dev                   ej. pedidos.restaurante.com
                                         │                                           │
                                         └─────────────────────┬─────────────────────┘
                                                               │
                                                  ┌────────────▼────────────┐
                                                  │ Cloudflare Pages Worker │
                                                  │   (Hono.js v4 Router)   │
                                                  │ /functions/api/[[route]]│
                                                  └────────────┬────────────┘
                                                               │
                           ┌───────────────────────────────────┼───────────────────────────────────┐
                           │                                   │                                   │
                ┌──────────▼──────────┐             ┌──────────▼──────────┐             ┌──────────▼──────────┐
                │   SaaS Subrouter    │             │   Menu & Orders     │             │ Kitchen & KDS Admin │
                │  /api/saas/tenants  │             │   /api/menu-v2      │             │ /api/kitchen-admin  │
                │  /api/saas/metrics  │             │   /api/orders-v2    │             │ /api/orders-admin   │
                │  /api/saas/onboard  │             └──────────┬──────────┘             └──────────┬──────────┘
                └──────────┬──────────┘                        │                                   │
                           │                                   └─────────────────┬─────────────────┘
                ┌──────────▼──────────┐                                          │
                │  D1 Control Plane   │                               ┌──────────▼──────────┐
                │ (saas_tenants,      │                               │   D1 Tenant DB      │
                │  saas_subscriptions,│                               │  (menu_items,       │
                │  saas_users)        │                               │   orders_v2,        │
                └─────────────────────┘                               │   ingredients_v2)   │
                                                                      └─────────────────────┘
```

---

## 2. Topología de Datos en Cloudflare D1

### 2.1. Base de Datos del Control Plane Central (`resto-saas-control-plane-*`)
Almacena el catálogo de marcas, usuarios, suscripciones y logs de plataforma:
- **`saas_tenants`**: Registro de restaurantes (identidad, slug, colores Taste Skill, radio de esquinas, plan activo, PIN operativo).
- **`saas_subscriptions`**: Estado de facturación recurrente en Stripe (`trialing`, `active`, `past_due`, `canceled`).
- **`saas_users`**: Operadores y administradores con roles (`owner`, `manager`, `cashier`, `kitchen`).
- **`saas_audit_logs`**: Trazabilidad y auditoría de cambios en la plataforma.

### 2.2. Bases de Datos de Restaurantes / Tenants (`<tenant>-menu-*`)
Cada restaurante cuenta con su base de datos D1 aislada o particionada con el schema unificado V3 ([`migrations/template/0001_v3_clean_schema.sql`](file:///data/data/com.termux/files/home/Burgers-exe/migrations/template/0001_v3_clean_schema.sql)):
- `menu_categories` & `menu_items`
- `ingredients_v2` & `product_ingredient_recipes_v2`
- `orders_v2` (con persistencia de `delivery_json` y timezone CDMX)
- `tower_schedules`
- `raffles_v2` & `referral_tickets_v2`

---

## 3. Matriz de Endpoints Hono.js para SaaS (`/api/saas/*`)

| Método | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| `GET` | `/api/saas/tenants` | Listado de todos los restaurantes y estado de flota | Pública / Control Plane |
| `GET` | `/api/saas/tenants/metrics` | KPIs globales: MRR (USD), órdenes procesadas y desglose de planes | Pública / Control Plane |
| `GET` | `/api/saas/tenants/:id` | Ficha detallada de configuración y marca de un tenant | Pública / Control Plane |
| `POST` | `/api/saas/onboarding` | Alta de nuevo restaurante con validación Zod y aprovisionamiento D1 | Pública (Self-Serve) |
| `PATCH` | `/api/saas/tenants/:id` | Modificación de parámetros de marca, colores o estado del tenant | Control Plane / Admin |

---

## 4. Script de Aprovisionamiento Automatizado

El script [`scripts/provision-cloudflare.sh`](file:///data/data/com.termux/files/home/Burgers-exe/scripts/provision-cloudflare.sh) automatiza la creación de recursos en Cloudflare:

```bash
# 1. Aprovisionar el Control Plane central del SaaS:
./scripts/provision-cloudflare.sh saas-control-plane preview
./scripts/provision-cloudflare.sh saas-control-plane production

# 2. Aprovisionar un nuevo restaurante (ej. 'amsi-tortas' o 'tamplet'):
./scripts/provision-cloudflare.sh amsi-tortas preview
./scripts/provision-cloudflare.sh amsi-tortas production
```

El script ejecuta automáticamente:
1. `wrangler d1 create <db-name>`
2. `wrangler r2 bucket create <bucket-name>`
3. `wrangler d1 execute <db-name> --remote --file=./migrations/template/0001_v3_clean_schema.sql`
4. `wrangler d1 execute <db-name> --remote --file=./migrations/<tenant>/0002_<tenant>_seed.sql`
5. `wrangler pages project create <project-name>`

---

## 5. Planes Comerciales y Límites de Infraestructura

| Nivel de Plan | Precio Mensual | Estaciones KDS | Límite de Pedidos | Dominio Personalizado | R2 Dedicado |
|---|---|---|---|---|---|
| **Starter** | $29 USD/mes | 1 Estación | 300 / mes | Subdominio `*.chekeo.io` | Compartido |
| **Pro** | $79 USD/mes | 2 Estaciones (Plancha + SideQuest) | 2,000 / mes | Subdominio personalizado | Compartido |
| **Enterprise** | $199 USD/mes | Hasta 5 Estaciones | Ilimitado | Dominio Propio (Cloudflare SSL) | R2 Dedicado |

---

## 6. Comandos de Gestión D1 en `package.json`

```bash
# Migraciones del Control Plane SaaS
npm run db:saas:preview:migrate    # Aplica schema saas en Preview
npm run db:saas:preview:seed       # Carga datos canónicos en Preview
npm run db:saas:produce:migrate    # Aplica schema saas en Producción
npm run db:saas:produce:seed       # Carga datos canónicos en Producción
```

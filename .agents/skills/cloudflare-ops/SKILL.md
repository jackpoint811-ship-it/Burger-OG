---
name: cloudflare-ops
description: Guía y procedimientos operativos para interactuar con Cloudflare D1 (SQLite), Cloudflare R2 (Storage) y Cloudflare Pages Functions en el entorno de Burgers.exe.
---

# ☁️ Skill: Cloudflare Ops (Burgers.exe)

Usa esta habilidad para consultar bases de datos D1, auditar assets en R2, levantar emuladores locales de Cloudflare Pages y monitorear logs en tiempo real.

---

## 1. 🗄️ Cloudflare D1 (Bases de Datos SQLite)

### Nombres y Bindings Oficiales
- **Binding de Código**: `BOG_MENU_DB` (definido en `env.d.ts` y routers de Hono).
- **Base de Datos Preview**: `burgers-exe-menu-v2-preview` (ID `c723f0c7-18ba-4fbe-8d7a-acb5f017af99`).
- **Base de Datos Producción**: `burgers-exe-menu-v2-production` (ID `2974d36e-9005-4bb3-bb39-b949507bbdc4`).

### Comandos Frecuentes

#### A. Consultar Menú en Preview (Remoto)
```bash
npx wrangler d1 execute burgers-exe-menu-v2-preview --remote --command "SELECT id, name, price_cents, category FROM menu_items LIMIT 10;"
```

#### B. Consultar Pedidos Recientes
```bash
npx wrangler d1 execute burgers-exe-menu-v2-preview --remote --command "SELECT id, customer_name, total_cents, status, created_at FROM orders_v2 ORDER BY created_at DESC LIMIT 5;"
```

#### C. Aplicar Migraciones
```bash
# Preview
npx wrangler d1 migrations apply burgers-exe-menu-v2-preview --remote

# Local
npx wrangler d1 migrations apply burgers-exe-menu-v2-preview --local
```

> [!CAUTION]
> **REGLA DE SEGURIDAD:** NUNCA ejecutar sentencias `DROP TABLE`, `TRUNCATE` o `DELETE` masivos en bases remotas sin autorización explícita del usuario.

---

## 2. 🪣 Cloudflare R2 (Almacenamiento de Assets)

### Nombres y Bindings Oficiales
- **Binding de Código**: `BOG_MENU_ASSETS`
- **Bucket Preview**: `burgers-exe-assets-v2-preview`
- **Bucket Producción**: `burgers-exe-assets-v2`

### Comandos Frecuentes

#### A. Listar Objetos en el Bucket
```bash
npx wrangler r2 object list burgers-exe-assets-v2-preview
```

#### B. Subir un Asset
```bash
npx wrangler r2 object put burgers-exe-assets-v2-preview/catalogo/ejemplo.webp --file=./ruta/local/ejemplo.webp
```

---

## 3. ⚡ Cloudflare Pages & Emulación Local

### A. Desarrollo Local con Funciones Hono
```bash
# Iniciar frontend + funciones locales con wrangler
npm run dev
```

### B. Monitoreo de Logs en Vivo (Live Tail)
```bash
npx wrangler pages deployment tail --project-name burgers-exe-public-v3
```

---

## 4. 🛠️ Scripts Auxiliares del Repositorio

- **Consulta rápida D1**: `./.agents/skills/cloudflare-ops/scripts/query-d1-preview.sh "SELECT count(*) FROM menu_items"`
- **Listar R2**: `./.agents/skills/cloudflare-ops/scripts/list-r2-assets.sh`

> Estado: vivo
> Uso: memoria técnica y operativa de la Plataforma SaaS Multi-Tenant para Codex/Burgers.exe

# 🚀 Plataforma SaaS Multi-Tenant — Arquitectura & Manual de Operación

> **Estado**: 🟢 100% Completado & Integrado (Mergeado en `preview` vía PR [#635](https://github.com/JackPointJP/Burgers-exe/pull/635))
> **Entorno Standalone**: `~/teamwork_projects/resto_saas_admin`
> **Fecha de Lanzamiento**: 2026-08-31

---

## 🎯 1. Visión General & Modelo de Negocio

La plataforma **Chekeo Cloud SaaS (RestoEngine)** es un sistema multi-tenant distribuido diseñado para aprovisionar, administrar y operar instancias completas de restaurantes (tienda pública PWA, comandería POS, cocina KDS en 2 estaciones y calculadora de insumos Resumen K) desde un único centro de mando centralizado.

### Jerarquía de Inquilinos:
1. **Tenant #0 (Flagship Case / Cliente Insignia):** `burgers-exe` (Hamburguesas gourmet, smash y papas sazonadas. Plan Enterprise, activo y protegido contra borrado).
2. **Tenant #1:** `amsi-tortas` (Desayunos mexicanos, tortas y jugos naturales. Plan Pro, activo).
3. **Tenant #2:** `tamplet` (Plantilla base en blanco para onboarding en trial de 14 días. Plan Starter).
4. **Tenants Dinámicos:** Nuevos restaurantes creados en vivo mediante el asistente de onboarding.

---

## 🛡️ 2. Arquitectura de Aislamiento (Zero Contamination)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CHEKEO CLOUD SAAS CONTROL PLANE                       │
│       (Gestión de Organizaciones, Facturación Stripe, Telemetría Global)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
 ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
 │   BURGERS.EXE 🍔     │   │   AMSI TORTAS 🥪     │   │   NUEVO TENANT 🌮    │
 │ (Flagship Tenant #0) │   │     (Tenant #1)      │   │   (Onboarding D1)    │
 ├──────────────────────┤   ├──────────────────────┤   ├──────────────────────┤
 │ • D1: menu-live      │   │ • D1: amsi-tortas    │   │ • D1: tenant-db      │
 │ • R2: assets-v2      │   │ • R2: amsi-assets    │   │ • R2: tenant-assets  │
 │ • POS + KDS Plancha  │   │ • POS + KDS Cocina   │   │ • POS + KDS Base     │
 └──────────────────────┘   └──────────────────────┘   └──────────────────────┘
```

* **Burgers.exe como Cliente #0:** El software de Burgers.exe opera como el caso de éxito de referencia. Sus bases de datos en Cloudflare D1 (`burgers-exe-menu-live`) y sus buckets R2 (`burgers-exe-assets-v2`) están completamente aislados del resto de los clientes.
* **Workspace Externo Autónomo:** Se mantiene una réplica 100% autocontenida de la plataforma en `~/teamwork_projects/resto_saas_admin` con su propio `package.json`, TypeScript estricto y suite de pruebas para evoluciones del SaaS sin tocar el monorepo.

---

## 🗄️ 3. Esquemas de Base de Datos Cloudflare D1

Ubicación de migraciones: `migrations/saas/`

### Tablas del Control Plane (`0001_saas_control_plane.sql`):
1. **`saas_tenants`**:
   - `id` (PK, slug único): Identificador del restaurante (ej. `burgers-exe`, `amsi-tortas`).
   - `brand_name`: Nombre comercial.
   - `short_name`: Nombre corto para tickets y badges.
   - `tagline`: Eslogan de marca.
   - `logo_emoji`: Emoji o icono visual.
   - `accent_color`: Color hexadecimal para inyección dinámica de CSS variables (`Taste Skill`).
   - `default_food_type`: Categoría gastronómica (`burger`, `torta`, `pizza`, `taco`, `other`).
   - `status`: Estado operativo (`active`, `trial`, `suspended`).
2. **`saas_subscriptions`**:
   - `id` (PK): UUID de suscripción.
   - `tenant_id` (FK): Vinculación al restaurante.
   - `stripe_customer_id`: ID de cliente en Stripe.
   - `stripe_subscription_id`: ID de suscripción en Stripe.
   - `plan_tier`: Nivel de servicio (`starter`, `pro`, `enterprise`).
   - `status`: Estado del ciclo de cobro (`trialing`, `active`, `past_due`, `canceled`).
   - `trial_ends_at`: Fecha límite de prueba gratuita de 14 días.
3. **`saas_users`**:
   - `id` (PK): UUID de usuario administrador.
   - `tenant_id` (FK): Restaurante asignado.
   - `email`: Correo de acceso.
   - `role`: Rol operativo (`owner`, `admin`, `kitchen`, `cashier`).
   - `pin_code`: PIN de 4 dígitos para acceso rápido al POS Chekeo.
4. **`saas_audit_logs`**:
   - Bitácora inmutable de eventos (creación de marcas, cambios de plan, rotación de credenciales).
5. **`saas_webhook_events`**:
   - Tabla de deduplicación e idempotencia para eventos recibidos desde Stripe.

---

## ⚡ 4. Rutas Backend en Hono (`functions/api/_routes/saas.ts`)

Montadas centralmente bajo el prefijo `/api/saas/*`:

| Endpoint | Método | Descripción |
|---|:---:|---|
| `/api/saas/tenants` | `GET` | Lista todos los restaurantes registrados en la plataforma. |
| `/api/saas/tenants/metrics` | `GET` | Calcula KPIs globales (MRR, total de inquilinos, comandas procesadas). |
| `/api/saas/onboarding` | `POST` | Alta de nuevo restaurante en 3 pasos con validación Zod y creación de credenciales. |
| `/api/saas/billing/checkout` | `POST` | Generación de sesión de Stripe Checkout para suscripciones recurrentes. |
| `/api/saas/billing/portal` | `POST` | Enlace directo al Stripe Customer Portal para gestión de tarjetas y facturas. |
| `/api/saas/billing/webhook` | `POST` | Handler seguro de webhooks de Stripe con validación de firma e idempotencia. |

---

## 🎨 5. Módulos de Frontend en Chekeo V3

### 1. `SaaSHubView.tsx` (Centro de Mando Principal)
* Se renderiza automáticamente en la ruta raíz (`/`) cuando no hay un tenant especificado en la URL.
* Visualiza los KPIs financieros (MRR $278 USD/mes), la cuadrícula de proyectos con acceso directo a tienda pública y POS, y el asistente de despliegue.

### 2. `TenantOnboardingModal.tsx` (Wizard de 3 Pasos)
* **Paso 1:** Identidad de marca, slug de subdominio (`*.chekeo.io`) y selector de color de acento.
* **Paso 2:** Selección de plantilla gastronómica base (Hamburguesas, Tortas/Chilaquiles, Tacos o En blanco).
* **Paso 3:** Correo de dueño, WhatsApp, PIN de 4 dígitos y selección de nivel de servicio.
* **Paso 4:** Pantalla de éxito con URLs directas de tienda y comandería.

### 3. `SubscriptionBillingPanel.tsx` (Panel de Suscripción)
* Accesible dentro del menú Admin de cada restaurante.
* Muestra el plan activo, cuotas de comandas del mes, estaciones KDS habilitadas y el switch de **Acceso Anticipado / Beta Gratuita ($0/mes)** con avisos de *Próximamente* para cobros automáticos.

### 4. `TopHeader.tsx` (Brand Switcher & Navegación)
* Selector desplegable en la cabecera para alternar entre marcas registradas en 1 clic (`Burgers.exe` $\leftrightarrow$ `Amsi Tortas`).
* Botón **`[ ⊞ SaaS Hub ]`** para regresar al Centro de Mando desde cualquier comandería.

---

## 💳 6. Catálogo de Planes & Matriz de Cuotas

Definidos en `packages/config/src/saas.types.ts`:

| Plan | Precio Mensual | Límite de Pedidos | Estaciones KDS | Subdominio Propio | Resumen K |
|---|:---:|:---:|:---:|:---:|:---:|
| **Starter (Dark Kitchen)** | $29 USD/mes | 300 pedidos/mes | 1 Estación | ❌ | ✅ |
| **Pro (Alto Volumen)** | $79 USD/mes | 2,000 pedidos/mes | 2 Estaciones (Plancha + Sides) | ✅ | ✅ |
| **Enterprise (Flagship)** | $199 USD/mes | Ilimitados | Hasta 5 Estaciones | ✅ (Dominio propio) | ✅ |

*Durante la fase actual de pruebas, todos los restaurantes gozan de acceso Pro/Enterprise sin costo bajo la modalidad de **Beta Gratuita**.*

---

## 🛠️ 7. Procedimiento de Aprovisionamiento en Cloudflare

Para aprovisionar la infraestructura completa e independiente del SaaS en Cloudflare:

```bash
# 1. Aprovisionar D1 Control Plane, R2 Bucket y proyectos Pages en Preview
./scripts/provision-cloudflare.sh preview

# 2. Aprovisionar en Producción (requiere autorización)
./scripts/provision-cloudflare.sh production
```

---

## 🧪 8. Verificaciones & Calidad de Código

* `npm run typecheck` $\rightarrow$ **0 errores de TypeScript**.
* `npm run build:public` $\rightarrow$ **Compilación limpia en 10.67s**.
* `npm run build:chekeo` $\rightarrow$ **Compilación limpia en 6.34s**.

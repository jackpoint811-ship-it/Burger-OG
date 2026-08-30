---
name: saas-mcp-suite
description: Guía de configuración, herramientas y comandos de los servidores MCP oficiales más fiables para SaaS (Stripe, Supabase, Resend, Clerk y PostHog).
---

# 🔌 Skill: SaaS MCP Suite (Top 5 Conectores Oficiales)

Usa esta habilidad para conectar, configurar y operar los servidores MCP más confiables y populares del ecosistema SaaS con el agente.

---

## 1. 💳 Stripe MCP (Facturación & Suscripciones)
- **Repositorio Oficial:** [stripe/ai](https://github.com/stripe/ai)
- **Modo Remoto (OAuth/SSE):** `https://mcp.stripe.com`
- **Modo Local (Stdio):**
  ```bash
  npx -y @stripe/mcp
  ```
- **Variables de Entorno:** `STRIPE_SECRET_KEY`
- **Capacidades del Agente:**
  - Consultar clientes (`customers.retrieve`), suscripciones activas y cargos.
  - Generar enlaces de pago y sesiones de Stripe Checkout.
  - Inspeccionar estado de facturas y eventos de webhook recientes para depuración.

---

## 2. 🗄️ Supabase MCP (Base de Datos & Auth)
- **Repositorio Oficial:** [supabase/supabase](https://github.com/supabase/supabase)
- **Modo Remoto (SSE):** `https://mcp.supabase.com/mcp`
- **Modo Local (Stdio):**
  ```bash
  npx -y @supabase/mcp-server
  ```
- **Variables de Entorno:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Capacidades del Agente:**
  - Ejecutar consultas SQL seguras para inspeccionar esquemas y tablas.
  - Administrar políticas de Row-Level Security (RLS).
  - Gestionar usuarios en Supabase Auth y buckets de Storage.

---

## 3. ✉️ Resend MCP (Emails Transaccionales)
- **Repositorio Oficial:** [resend/resend-mcp](https://github.com/resend/resend-mcp)
- **Modo Remoto (SSE):** `https://mcp.resend.com/mcp`
- **Modo Local (Stdio):**
  ```bash
  npx -y resend-mcp
  ```
- **Variables de Entorno:** `RESEND_API_KEY`
- **Capacidades del Agente:**
  - Enviar emails transaccionales de prueba y validar plantillas.
  - Consultar estado de entrega, rebotes (bounces) y aperturas de correos.
  - Verificar registros DNS de dominios de envío.

---

## 4. 🔐 Clerk MCP (Identidad & Organizaciones)
- **Repositorio Oficial:** [clerk/mcp-tools](https://github.com/clerk/mcp-tools)
- **Modo Local (Stdio):**
  ```bash
  npx -y @clerk/mcp-tools
  ```
- **Variables de Entorno:** `CLERK_SECRET_KEY`
- **Capacidades del Agente:**
  - Consultar y gestionar usuarios, metadatos y membresías de organizaciones.
  - Crear invitaciones a organizaciones y gestionar roles (RBAC).

---

## 5. 📊 PostHog MCP (Analítica & Feature Flags)
- **Repositorio Oficial:** [PostHog/posthog-mcp](https://github.com/PostHog/posthog-mcp)
- **Modo Local (Stdio):**
  ```bash
  npx -y posthog-mcp
  ```
- **Variables de Entorno:** `POSTHOG_API_KEY`, `POSTHOG_HOST` (ej. `https://us.i.posthog.com`)
- **Capacidades del Agente:**
  - Consultar métricas de conversión, eventos y tendencias de producto.
  - Habilitar, deshabilitar o inspeccionar Feature Flags activas.
  - Crear anotaciones de despliegues en los gráficos de métricas.

---

## 6. 📁 Plantilla de Configuración Persistente

Para activar estos servidores en tu entorno de desarrollo, consulta la plantilla incluida en:
[mcp_config.json.template](./resources/mcp_config.json.template)

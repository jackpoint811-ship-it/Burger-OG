---
name: saas-architect
description: Guía de arquitectura, patrones de diseño y estándares de implementación para productos SaaS (Multi-tenancy, Stripe Billing, Clerk/Supabase Auth, Resend Emails y PostHog Analytics).
---

# 🚀 Skill: SaaS Architect & Builder

Usa esta habilidad para planificar, estructurar, auditar o implementar funcionalidades críticas en aplicaciones SaaS modernas (B2B o B2C).

---

## 1. 🏢 Arquitectura Multi-Tenant y Aislamiento de Datos

### Estrategias de Aislamiento
1. **Row-Level Security (RLS) / Columna `tenant_id` (Estándar recomendado):**
   - Cada tabla incluye una columna obligatoria `tenant_id` o `organization_id`.
   - Políticas RLS (PostgreSQL/Supabase) o middleware de consulta garantizan que ningún tenant acceda a datos de otro.
   - Indexar siempre: `CREATE INDEX idx_table_tenant ON table (tenant_id, id);`.
2. **Schema-per-tenant:**
   - Un esquema Postgres separado por cliente. Ideal para B2B Enterprise con requisitos de compliance y backups segregados.
3. **Database-per-tenant:**
   - Bases de datos D1/SQLite o Postgres independientes por cliente (aislamiento físico total).

### Reglas de Seguridad Multi-Tenant
- **Verificación en Capa de Servicio:** Nunca confiar únicamente en el parámetro recibido por la URL (`/api/orgs/:orgId/data`). Validar siempre en sesión JWT que el usuario pertenece activamente a ese `tenant_id`.
- **Role-Based Access Control (RBAC):** Definir roles estándar: `Owner`, `Admin`, `Member`, `Billing_Viewer`.

---

## 2. 💳 Facturación y Suscripciones (Stripe Lifecycle)

### Flujo Canónico de Pagos
```text
[Frontend / Pricing]
        │ (1) Crear Checkout Session
        ▼
[Stripe Hosted Checkout] ──(2) Pago exitoso──► [Webhook Endpoint]
                                                     │
                                                     ▼
                                        [Actualizar DB: plan, status, period_end]
```

### Eventos Webhook Críticos (Obligatorios)
1. `checkout.session.completed`: Asocia el `stripe_customer_id` y `stripe_subscription_id` con el `tenant_id` en tu base de datos.
2. `customer.subscription.updated`: Maneja upgrades, downgrades, cancelaciones programadas o cambios de estado (`active`, `past_due`, `canceled`).
3. `customer.subscription.deleted`: Revoca el acceso a características premium inmediatamente o al final del período de gracia.
4. `invoice.payment_succeeded`: Registra el pago y extiende la fecha `current_period_end`.
5. `invoice.payment_failed`: Notifica al usuario sobre fallo de cobro (Dunning) y entra en período de gracia.

### Reglas de Oro en Stripe
- **Idempotencia en Webhooks:** Almacena los IDs de eventos (`event.id`) procesados en una tabla `webhook_events` para evitar duplicar acciones si Stripe reintenta el envío.
- **Validación de Firma:** Usar siempre `stripe.webhooks.constructEvent(payload, signature, secret)` antes de procesar cualquier evento.
- **Customer Portal:** Utilizar Stripe Customer Portal (`stripe.billingPortal.sessions.create`) para que el usuario gestione sus tarjetas y facturas sin que tu app toque datos sensibles de pago.

---

## 3. 🔐 Autenticación & Gestión de Organizaciones

### Proveedores Recomendados
- **Clerk:** Ideal para B2B SaaS con gestión nativa de Organizaciones, cambio de contexto de tenant, SSO/SAML, invitaciones por email y control de miembros.
- **Supabase Auth:** Excelente para control fino con RLS en PostgreSQL, autenticación passwordless, OAuth y Magic Links.

### Buenas Prácticas
- Guardar únicamente el `auth_id` externo en tu base de datos local y sincronizar mediante webhooks de Auth.
- Implementar flujo de invitación de miembros con tokens firmados de expiración corta (48 horas).

---

## 4. ✉️ Correos Transaccionales (Resend)

### Casos de Uso Clave
- **Bienvenida & Verificación:** Envío inmediato tras registro.
- **Invitación a Organización:** Notificación con link directo de aceptación.
- **Alertas de Facturación:** Factura disponible o fallo en método de pago.
- **Límites de Uso:** Notificación al alcanzar el 80% y 100% de la cuota del plan.

### Estructura de Envío Limpia
- Utilizar plantillas basadas en **React Email** (`@react-email/components`) para diseño profesional y compatibilidad con clientes de correo (Gmail, Outlook, Apple Mail).
- Configurar siempre registros SPF, DKIM y DMARC en el dominio de envío para evitar caer en Spam.

---

## 5. 📊 Analítica de Producto y Feature Flags (PostHog)

### Taxonomía de Eventos
- Formato estándar de nombrado: `[Objeto] [Acción]` en minúsculas o snake_case (ej: `project_created`, `invite_sent`, `subscription_upgraded`).
- **Feature Flags:** Controlar el lanzamiento gradual de funcionalidades y habilitar features exclusivas por nivel de suscripción (`tier: "enterprise"`).

---

## 6. ✅ Checklist de Lanzamiento SaaS (Pre-Flight)

- [ ] Webhooks de Stripe configurados con verificación de firma y tabla de idempotencia.
- [ ] Políticas de RLS / Tenant-Isolation validadas con tests de penetración de acceso cruzado.
- [ ] Stripe Customer Portal accesible para cancelar o actualizar métodos de pago.
- [ ] Manejo de límites de cuota (Rate Limiting y Usage Caps) en endpoints de API.
- [ ] Plantillas de email transaccional probadas en modo oscuro y móvil.
- [ ] Métricas de conversión y funnel de onboarding monitoreados en PostHog.

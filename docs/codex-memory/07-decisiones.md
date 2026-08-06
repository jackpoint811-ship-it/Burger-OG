> Estado: vivo
> Uso: memoria operativa para Codex/Burgers.exe

# Decisiones

## Decisiones activas

- Obsidian se usara como editor de memoria Markdown.
- La memoria real vive en `docs/codex-memory`.
- Codex debe leer esta memoria antes de cambios grandes.
- `AGENTS.md` sigue siendo la regla dura.
- Graphify debe usarse antes de modificar arquitectura o varios archivos, cuando este disponible.
- Todo cambio debe terminar en Pull Request cuando el usuario apruebe el cierre.

## Historial de decisiones

### Fecha

2026-07-02

### Decision

Burgers.exe V2 Clean Architecture se trabajara por fases con tracker Kanban.

### Motivo

Evitar que Codex, ChatGPT o el usuario pierdan el estado durante una migracion larga de arquitectura, ambientes, legacy y tooling.

### Impacto

- Se crea `10-migration-tracker.md`.
- Se crea `11-skills-and-tools.md`.
- Se documenta que Burgers.exe son solo 2 apps oficiales.
- Se documenta que D1 y R2 son source of truth.
- Se documenta que Sheets y Apps Script quedan legacy.
- Se exige actualizar el tracker en cada fase.

### Fecha

2026-08-02 / 2026-08-03

### Decisión

Establecer aislamiento total del entorno Preview en Cloudflare (`burgers-exe-menu-v2-preview` D1 / `burgers-exe-assets-v2-preview` R2) para pruebas e-2-e de pedidos y stock sin fallbacks y con 0% contaminación a producción. Asimismo, habilitar fallback de auth local dev en Vite (`1234` / `0000`) cuando se desarrolla sin wrangler functions.

### Motivo

Permitir probar todo el flujo de pedido y Chekeo en Preview de forma idéntica a producción, con persistencia real D1 y herramientas de reset de datos de prueba (`npm run db:v2:preview:reset-orders`).

### Impacto

- Preview opera con `source: "d1"` real y `ORDERS_V2_WRITE_ENABLED=true`.
- Producción (`burgers-exe-menu-live`) queda totalmente intacta y aislada.
- Dev local Vite admite PIN `1234` o `0000` en desarrollo.

### Fecha

2026-08-06

### Decisión

PIN exclusivo para la pestaña Admin en Chekeo V2. El acceso a las pantallas operativas (Home, Pedidos, Cocina, Pagos) es directo con datos D1 en vivo. Los endpoints operativos backend (`orders-v2-admin`, `summary`, `status`, `payment`, `kitchen-item`, `summary-k`) utilizan validación Same-Origin (`requireInternalOrigin`) sin requerir cookie de sesión activa.

### Motivo

Eliminar la barrera de login global y prevenir la degradación a modo fallback en las operaciones diarias del restaurante (cocina, empacado y cobro). El PIN queda reservado estrictamente para la gestión administrativa y endpoints destructivos.

### Impacto

- Operadores de cocina y empaque cargan pedidos reales en vivo directamente sin ingresar PIN.
- `<AdminGate>` protege únicamente la pestaña Admin y endpoints administrativos (`batch-archive`, `export.csv`, etc.).
- CSRF Same-Origin protege los endpoints operativos del backend.

### Fecha

2026-08-06

### Decisión

Garantizar la persistencia y resolución end-to-end del objeto `delivery_json` en Cloudflare D1. El backend público `POST /api/orders-v2` persiste `delivery_json` en `orders_v2`, el backend admin `mapD1OrderToOrderV2` utiliza fallback a `items[].snapshot.delivery` si `delivery_json` viniera nulo, y la UI de Chekeo V2 soporta filtrado dinámico por fechas completas (`all`, `today`, `past`, `YYYY-MM-DD`).

### Motivo

Evitar la pérdida de fechas de entrega programadas y ubicaciones en pedidos creados desde la app pública o scripts de prueba, asegurando que las órdenes para fechas futuras (ej. día 10) se muestren correctamente en la pantalla de pedidos y cocina en producción.

### Impacto

- `POST /api/orders-v2` incluye la columna `delivery_json` al insertar en `orders_v2`.
- `mapD1OrderToOrderV2` recupera metadatos de entrega desde el snapshot de items si `delivery_json` no está presente.
- Chekeo V2 filtra y muestra con 100% de precisión las órdenes según la fecha programada.

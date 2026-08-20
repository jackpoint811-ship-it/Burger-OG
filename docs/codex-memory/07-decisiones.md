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
- El visor oficial del grafo del proyecto es `tools/graph-city/graph_city.html` (ciudad 3D con Three.js, autocontenido, sin CDN). Se regenera con `node tools/graph-city/compute_layout.cjs && node tools/graph-city/build_city.cjs` a partir de `graphify-out/graph.json`; los scripts fuente viven en `tools/graph-city/` (`.graphify/` está excluido localmente vía `.git/info/exclude` y solo tiene el workspace de desarrollo del experimento).

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

### Fecha

2026-08-12

### Decisión

Establecer la **Protección Permanente contra Congelamientos de Carga en App Pública (Post-Mortem PR #493 / #498 - #502)**:

1. **Predeterminado Universal de Modo Catálogo**: `DEFAULT_PUBLIC_CONFIG` en `@config/contracts` y los fallbacks de `functions/api/menu-v2.ts` tendrán SIEMPRE `publicMode: "catalog"` y `catalogEnabled: true`. Ningún fallo de BD D1 o falta de columna en `site_config` podrá conmutar la app al flujo legacy descontinuado.
2. **Cumplimiento Estricto de Reglas de Hooks en React**: Todos los hooks (`useState`, `useRef`, `useMemo`, `useCallback`, `useEffect`) DEBEN declararse al inicio del componente ANTES de cualquier bloque condicional `if (...) return`. Se prohíbe terminantemente colocar hooks debajo de retornos anticipados para evitar errores React #310.
3. **Invalidador de Caché de HTML en Cloudflare Pages (`_headers`)**: Mantener el archivo `public/_headers` en todos los subproyectos con `Cache-Control: no-cache, no-store, must-revalidate` para `/*`, garantizando que los clientes siempre reciban la referencia al bundle JS más reciente sin errores de tipo MIME.
4. **Verificación Automatizada E2E**: Todo agente que modifique la app pública debe verificar la compilación y el renderizado real mediante Playwright antes de dar por cerrada la tarea.

### Motivo

Garantizar que la aplicación pública jamás vuelva a sufrir un congelamiento de interfaz por desincronización de esquemas en D1, errores de conmutación de Hooks en React o almacenamiento en caché de bundles JS obsoletos en Cloudflare Pages.

### Impacto

- Cero posibilidad de que errores de BD forcen la app pública al flujo legacy.
- Cero excepciones no capturadas por violaciones a Rules of Hooks en React.
- Cero inconsistencias de tipos MIME por HTMLs cacheados en CDN.
3. **Manejo de errores no bloqueante**: La app pública debe ofrecer reintentos limpios y fallbacks seguros antes de mostrar pantallas de error totales al usuario final.

### Motivo

En el PR #485 (`pr480-clean-v3`), la remoción de los fallbacks de `loadMenuV2()` y el lanzamiento de excepciones no controladas causaron que latencias de borde en `/api/menu-v2` dejaran inoperable la página pública de producción con la pantalla "No se pudo cargar el menú".

### Impacto

- Regla activa de resiliencia documentada en `docs/codex-memory/07-decisiones.md`, `09-checklists.md` y `19-risk-hardening-plan.md`.
- Todo PR que afecte la capa de datos pública debe validar la tolerancia a fallas y cold-starts de API.

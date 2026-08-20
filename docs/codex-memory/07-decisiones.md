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

### Fecha

2026-08-13

### Decisión

**Intercepción Obligatoria de Quick Add para Combos y Fallbacks Defensivos en Checkout / Backend**:

1. **Intercepción de Quick Add para Combos (`LayoutEngine.tsx`)**: Al hacer click en el botón `+` (Quick Add) de un combo, la app pública debe abrir el Drawer de Producto (`onProductSelect(item)`) en lugar de agregarlo directamente vacío. Esto garantiza que el cliente elija explícitamente su guarnición (Papas OG, Aros, etc.) y burger.
2. **Preservación en 1-Click Reorder (`LayoutEngine.tsx`)**: El reordenar 1-click debe pasar íntegramente `upgrades`, `comboSide` y `comboBurgers` a `addItem`.
3. **Fallback Defensivo en Checkout y Backend (`CatalogCheckoutDrawer.tsx`, `orders-v2.ts`)**: Si por cualquier excepción un combo llega a checkout o a la API sin `comboSide` / `garnish` o sin `comboBurgers`, se asignan por defecto `PAPAS_OG` (Papas OG) y la burger principal del combo en lugar de enviar `null` o listas vacías.
4. **Claridad en Cocina (`kitchen-helpers.ts`)**: Si existiese algún pedido antiguo sin guarnición, la cola de cocina rotula explícitamente `Papas OG (Guarnición estándar)` en lugar de un genérico confuso.

### Motivo

Evitar que combos agregados vía Quick Add se registren sin guarnición ni burger en D1, lo cual causaba que en cocina el Side Quest se mostrara como "Guarnición estándar" o "Guarnición regular" sin especificar qué papas preparar (incidente `PB-I8319`).

### Impacto

- Cero pedidos de combo con `garnish: null` o `comboBurgers: []`.
- Experiencia de compra guiada al armar combos desde cualquier botón `+` de la interfaz.
- Consistencia total de tickets, cocina y D1.

### Fecha

2026-08-18

### Decisión

**Migración completa V2 → V3 con stack moderno y reescritura total.**

1. **Branch `v3`**: Todo el desarrollo V3 en branch dedicado. V2 sigue en producción (`main`) sin interrupciones hasta cutover explícito.
2. **Stack V3**: React 19 + TanStack Query v5 + Zustand v5 + shadcn/ui + Tailwind CSS v4 + Zod v3 + React Hook Form v7 + Hono.js v4.
3. **Reescritura completa**: Ambas apps (Public Order y Internal Chekeo) se reescriben desde cero con arquitectura feature-based modular. God components eliminados.
4. **Backend Hono.js**: Las 30+ Cloudflare Functions individuales se centralizan en un router Hono tipado con middleware reutilizable. Mismas URLs de API, mismos contratos D1/R2.
5. **Limpieza total del repo**: `legacy/` eliminado, docs obsoletas eliminadas, `package.json` renombrado a v3.
6. **13 PRs secuenciales**: PR-V3-00 (limpieza) → PR-V3-13 (cutover). Cada PR tiene un único objetivo.
7. **Bitácora viva**: `docs/codex-memory/22-v3-bitacora.md` registra sesiones, decisiones y métricas.

### Motivo

V2 acumuló deuda técnica masiva: `InternalChekeoApp.tsx` con 6,336 líneas, `styles.css` con 9,711 líneas de CSS monolítico, 0 gestión de estado estructurada, 0 caché de servidor, ~50 archivos legacy contaminando el repo. La refactorización incremental ya no es viable para una transformación real.

### Impacto

- Repo limpio sin `legacy/`, sin docs de fases cerradas, sin archivos basura en la raíz.
- Componentes de ~200-400 líneas reemplazando god components de 6,000+.
- CSS de ~150 líneas (Tailwind tokens) reemplazando 9,711 líneas de CSS monolítico.
- Estado del carrito centralizado en Zustand, server state cacheado con TanStack Query.
- Backend organizado con Hono.js + Zod validation.
- Producción protegida hasta cutover final aprobado.

### Fecha

2026-08-19

### Decisión

**Arquitectura de KDS (Kitchen Display System) y Resumen K (Mise en Place) en Chekeo V3 (PR-V3-10)**:

1. **KDS Kanban con Semáforo Reactivo**: Interfaz de 3 columnas (Nuevos / En Plancha / Listos para Empacar) con folio en tipografía grande, temporizador dinámico con semáforo (`<10m` normal, `10-20m` warning, `>20m` urgente) y botón de 1-clic para avanzar el estado del pedido.
2. **Resaltado Crítico de Modificadores**: Remociones (`🔴 SIN CEBOLLA`, etc.) y extras (`🟢 +EXTRA TOCINO`, etc.) en chips de alto contraste y legibilidad a distancia para pantallas táctiles de cocina y tablets.
3. **Agregador de Insumos (Resumen K)**: Cómputo consolidado en tiempo real de hamburguesas a producir por receta, guarniciones (Papas Francesas, Aros) y extras totales para mise en place, con integración opcional a base de datos Cloudflare D1 (`/api/kitchen-v2-admin/summary-k`).
4. **Alertas Sonoras Nativas (Web Audio API)**: Síntesis de chimes sin depender de archivos de audio externos, con persistencia del switch de volumen en `localStorage`.

### Motivo

Permitir a los operadores de plancha y freidora preparar pedidos con máxima velocidad y cero errores de ingredientes, además de dimensionar los insumos necesarios para la jornada.

### Impacto

- Cero errores en burgers con modificaciones especiales.
- Visibilidad inmediata del flujo de pedidos y tiempos de preparación.
- Sin dependencias externas de audio ni assets pesados.

### Fecha

2026-08-20

### Decisión

**Despliegue Independiente V3 en Cloudflare Pages y Pipelines CI/CD Automatizados (PRs #546 y #547)**:

1. **Proyectos Dedicados en Cloudflare Pages**:
   - `burgers-exe-public-v3`: Public Order V3 mobile-first con soporte directo para catálogo D1 y assets R2.
   - `burgers-exe-internal-v3`: Internal Chekeo V3 protegido con autenticación de PIN segura por variable de entorno `BOG_INTERNAL_PIN`.
2. **Pipelines de CI/CD vía GitHub Actions**:
   - `.github/workflows/deploy-public-v3.yml` y `.github/workflows/deploy-chekeo-v3.yml` compilan con Vite y despliegan a Cloudflare Pages automáticamente en cada push o PR a `v3`.
3. **Extracción Canónica de Claves R2 en Router Hono**:
   - En `functions/api/_routes/assets.ts`, la extracción de clave de asset utiliza `c.req.path.replace(/^(?:\/api)?\/assets-v2\/?/, '')` para aislar correctamente la clave del objeto R2 (`menu/...`, `category-banners/...`) sin contaminar con el prefijo global `/api` de la aplicación.

### Motivo

Garantizar un ciclo de despliegue continuo, desacoplado, sin fricción manual y completamente compatible con el routing de Cloudflare Pages y la jerarquía de Hono.js.

### Impacto

- Ambas aplicaciones se despliegan en menos de 45 segundos ante cualquier push a `v3`.
- Catálogo e imágenes de R2 cargan con HTTP 200 sin 404s ni fallbacks degradados.
- Chekeo V3 mantiene autenticación robusta y segura contra el backend.

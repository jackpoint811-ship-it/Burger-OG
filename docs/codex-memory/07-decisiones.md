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
- Manejo de errores no bloqueante: La app pública debe ofrecer reintentos limpios y fallbacks seguros antes de mostrar pantallas de error totales al usuario final.

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

1. **KDS Kanban**: Interfaz de 3 columnas (Nuevos / En Plancha / Listos para Empacar) con folio en tipografía grande y botón de 1-clic para avanzar el estado del pedido.
2. **Resaltado Crítico de Modificadores**: Remociones (`🔴 SIN CEBOLLA`, etc.) y extras (`🟢 +EXTRA TOCINO`, etc.) en chips de alto contraste y legibilidad a distancia para pantallas táctiles de cocina y tablets.
3. **Agregador de Insumos (Resumen K)**: Cómputo consolidado en tiempo real de hamburguesas a producir por receta, guarniciones (Papas Francesas, Aros) y extras totales para mise en place, con integración opcional a base de datos Cloudflare D1 (`/api/kitchen-v2-admin/summary-k`).
4. **Alertas Sonoras Nativas (Web Audio API)**: Síntesis de chimes sin depender de archivos de audio externos, con persistencia del switch de volumen en `localStorage`.

### Motivo

Permitir a los operadores de plancha y freidora preparar pedidos con máxima velocidad y cero errores de ingredientes, además de dimensionar los insumos necesarios para la jornada.

### Impacto

- Cero errores en burgers con modificaciones especiales.
- Visibilidad inmediata del flujo de pedidos.
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

### Fecha

2026-08-20

### Decisión

**Alineación Operativa Definitiva en Chekeo V3 (Rescate de Patrones de Producción Real V2 — PR #549)**:

1. **Eliminación Total de Relojes de Presión en Cocina**: Se eliminan cronómetros de minutos transcurridos y semáforos de estrés (`<10m`, `10-20m`, `>20m` parpadeantes) porque chocan con el modelo de producción por lotes (batch cooking) y entregas programadas a torres de Burgers.exe.
2. **División por Estaciones Operativas Reales**:
   - `🍔 Preparación (Plancha)`: Enfocada exclusivamente en carnes smash, panes y modificaciones críticas.
   - `🍟 Side Quest (Freidora & Empaque)`: Enfocada en papas, aros de cebolla, bebidas y ensamble de paquetes.
   - `📋 Resumen K (Mise en Place)`: Conteo consolidado de insumos activos.
3. **Restitución de `HorizontalDateCalendarFilter`**: Riel horizontal de 14 días consecutivos con detección en zona horaria CDMX, botón especial de `⏱️ Anteriores / Histórico`, tarjeta `🟢 HOY` y conteo reactivo de comandas pendientes tanto en **Pedidos** como en **Cocina**.

### Motivo

Adaptar la interfaz a la realidad operativa del restaurante sin comprometer la nueva arquitectura modular de V3 (React 19 + TanStack Query + Tailwind v4).

### Impacto

- Cero estrés y cero alertas falsas en pedidos programados.
- Cocineros y empacadores trabajan con interfaces especializadas por estación física.
- Visibilidad completa de entregas futuras y pendientes históricos.

### Fecha

2026-08-21

### Decisión

**Afinaciones de UX/UI, Personalización y Ergonomía en Public Order V3**:

1. **Resolución Canónica de Recetas e Ingredientes Removibles**: Se implementa `useMenuRecipes()` y `lookupRecipeBySku()` garantizando la disponibilidad de modificadores (`removedIngredients`) tanto en burgers individuales como para cada hamburguesa dentro de un combo (`comboBurgerProducts[index]`), mapeando directamente desde Cloudflare D1 con fallbacks tolerantes a prefijos de SKU.
2. **Switch de Modo Oscuro en App Pública**: Se habilita el selector de tema (`Sun` / `Moon`) en `BrandHeader.tsx` con persistencia en `localStorage` (`public_theme`) y soporte completo de Tailwind v4.
3. **Emoji de Regalo `🎁` en Sorteos**: Se reemplaza el ícono de ticket genérico por el emoji `🎁` para identificar campañas activas de sorteo en cabecera, checkout y pantalla de éxito.
4. **Layout Canónico de 2 Columnas Móvil**: Adaptación mobile-first a grilla de 2 columnas (`grid-cols-2 sm:grid-cols-2 md:grid-cols-3`) y carrusel de banners previo a la navegación de categorías sticky.
5. **Checkout Limpio**: Campo de código de referido oculto si no hay sorteo activo y opt-in a WhatsApp desplegado condicionalmente tras ingresar 10 dígitos del teléfono.

### Motivo

Recuperar la experiencia fluida de personalización y compra probada en producción sin perder las ventajas de la arquitectura modular moderna de V3.

### Impacto

- Cero pedidos de burgers o combos bloqueados sin posibilidad de personalización.
- Soporte visual nativo para modo oscuro en la app de clientes.
- Reducción de ruido visual en el checkout para usuarios sin código o que aún no ingresan su teléfono.

### Fecha

2026-08-21

### Decisión

**Consolidación de Banners y Catálogo Interactivo en Chekeo Admin y Public Order V3**:

1. **Chekeo Admin Banners**: Se integra un Live Preview (WYSIWYG) en tiempo real en el modal de edición de banners y selectores desplegables dinámicos para categorías y productos (`useAdminMenu()`), eliminando el tipeo manual propenso a errores en `ctaTarget`.
2. **Public Carrusel Comercial y Gestos**: `BannerCarousel.tsx` soporta los 6 gradientes temáticos (`bgPreset`), acciones directas a productos (`openProductDrawer`), scroll a categorías, copiado de cupones y swipe táctil inercial con `framer-motion`.
3. **Módulo Top Vendidos (Featured Rail)**: Riel horizontal (`FeaturedRail.tsx`) arriba del catálogo con acceso en 1 tap a productos destacados.
4. **Módulo 1-Click Reorder**: `ReorderModule.tsx` lee el último pedido en `localStorage` (`pov3-last-order`) permitiendo repetir la comanda exacta al instante.
5. **Scrollspy Bidireccional**: `CategoryNav.tsx` implementa `IntersectionObserver` para auto-centrar y actualizar la categoría activa conforme se desplaza la vista por el catálogo.

### Motivo

Maximizar la conversión comercial y la velocidad de pedido en la app pública, brindando a la vez herramientas de gestión visual precisas en Chekeo Admin.

### Impacto

- Clientes recurrentes pueden reordenar en 1 clic.
- Banners promocionales abren el producto directamente sin fricción.
- Navegación de categorías siempre sincronizada con la posición en pantalla.

### Fecha

2026-08-21

### Fecha

2026-08-26

### Decisión

**Regla Inquebrantable de Veracidad de Datos (Prohibición Estricta de Inventar Datos o Fallbacks Ficticios)**:

1. **Single Source of Truth Obligatorio**: Todo el sistema (Frontend público, Chekeo POS, Cocina KDS, conciliación y seeds) debe operar única y exclusivamente con datos 100% reales provenientes de Cloudflare D1 (`menu_items`, `ingredients_v2`, `product_ingredient_recipes_v2`, `orders_v2`), Cloudflare R2 y endpoints Hono.
2. **Prohibición de Mocks y Fallbacks Simulados**: Queda terminantemente prohibido inventar o simular SKUs, productos, precios, ingredientes, recetas, combos o estados de pedidos ficticios en el código o en scripts de prueba.
3. **Manejo Honesto de Datos**: Si un dato, ingrediente o configuración no existe en la base de datos, el sistema no debe enmascararlo ni generar valores artificiales por omisión; debe reflejar el estado real o solicitar su configuración en Chekeo.
4. **Semillas y Testing Verificados**: Cualquier script de prueba o siembra debe consultar previamente el catálogo real de D1 y apegarse estrictamente a los esquemas oficiales Zod / TypeScript de V3.

### Motivo

Prevenir desalineaciones entre la base de datos real y la interfaz de usuario, evitar bugs fantasma de renderizado y asegurar que la cocina y el restaurante operen siempre con productos, costos e ingredientes reales.

### Impacto

- Cero productos o precios ficticios en la aplicación.
- Comandas y desgloses de cocina 100% consistentes con el catálogo de D1.
- Inclusión de la regla en `AGENTS.md`, `GEMINI.md` y `.agents/rules/00-hard-constraints.md` como prohibición permanente.

### Fecha

2026-08-31

### Decisión

**Transformación de Plataforma a SaaS Multi-Tenant Independiente (Chekeo Cloud Engine) con Burgers.exe como Flagship #0 (PR #635)**:

1. **Aislamiento Multi-Tenant**: El SaaS opera como una plataforma central que aprovisiona y aloja instancias de restaurantes con particionamiento de bases de datos Cloudflare D1 (`resto-saas-control-plane-*`), almacenamiento R2 y dominios propios.
2. **Burgers.exe como Cliente Insignia**: Burgers.exe se mantiene como el caso de éxito #0 (Enterprise Flagship), con inmunidad de borrado, operando de forma 100% independiente sin contaminar el código del SaaS.
3. **Control Plane & Onboarding Self-Serve**: El acceso principal de la plataforma (`/`) renderiza el `SaaSHubView` para gestión de flota de restaurantes, asistente de alta en 3 pasos (`TenantOnboardingModal`), control de cuotas y cálculo de MRR global.
4. **Gobernanza de Suscripciones**: Definición de 3 tiers de servicio (Starter $29/m, Pro $79/m, Enterprise $199/m) con modo *Acceso Anticipado / Beta Gratuita ($0/mes)* y pasarela Stripe en *Próximamente*.

### Motivo

Permitir que la tecnología de Burgers.exe escale como un SaaS para múltiples restaurantes y dark kitchens, manteniendo el software de Burgers.exe intacto y desacoplado.

### Impacto

- Mergeado en `preview` mediante PR [#635](https://github.com/JackPointJP/Burgers-exe/pull/635).
- Creación del espacio de trabajo independiente en `~/teamwork_projects/resto_saas_admin`.
- Disponibilidad del Hub Multi-Tenant en la ruta raíz de Chekeo.

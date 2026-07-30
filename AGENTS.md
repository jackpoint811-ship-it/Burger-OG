# AGENTS.md — Reglas permanentes para Codex en Burgers.exe

Estas reglas aplican a todo el repositorio salvo que un `AGENTS.md` más específico indique algo distinto.

## Forma de trabajo
- Trabajar por PRs pequeños, controlados y fáciles de revisar.
- No hacer merges automáticos ni resolver conflictos sin instrucción explícita.
- **NUNCA hacer merge a `main` ni push directo a `main` sin autorización y confirmación explícita previa del usuario.**
- No introducir frameworks, CDNs ni librerías externas salvo autorización explícita del prompt.
- No modificar `package.json`, lockfiles ni dependencias salvo autorización explícita.
- No tocar carpetas legacy, especialmente `legacy/`, salvo que el prompt lo autorice.
- Reportar siempre archivos modificados, riesgos, testing ejecutado y checklist manual de QA sugerido.

## Contratos de producto y datos
- No cambiar backend, payloads, contratos de datos, nombres de campos, precios, tickets, promociones ni reglas comerciales salvo autorización explícita.
- No modificar migraciones, esquemas, seeds ni servicios backend si el PR es de UI o documentación.
- Preservar compatibilidad con flujos existentes de pedidos, tickets, menú, ubicación y WhatsApp.
- Preservar la resolución de assets e imágenes mediante Cloudflare R2 (`resolveCatalogAssetUrl`) y datos reales de Cloudflare D1.

## UX/UI permanente (Estética Premium Casual)
- **Aesthetic**: Mantener la estética **Burgers.exe (Premium Casual Vibe)** (sustituyendo el estilo legacy cyberpunk/neón).
- **Temas**: Tema light-first por defecto (blanco cálido/crema suave `#F5F2EE`, tarjetas blancas `#FFFFFF`), con soporte completo para dark mode slate/carbón neutro (`#121212` / `#1E1E1E`) mediante clase `.theme-dark` en `<html>` o `prefers-color-scheme`.
- **Acento**: Verde bosque (`#16A34A` en light mode / `#22C55E` en dark mode).
- **Tipografía y Estilos**: Tipografía Inter, bordes sutiles (`--color-line`), sombras de elevación limpia (`--shadow-card`, `--shadow-panel`, `--shadow-floating`).
- **Layout Adaptativo Mobile-First**: Diseñado mobile-first, escalando fluidamente en tablets y computadoras de escritorio mediante el contenedor `--catalog-max-width: 768px` y grilla autoadaptable `repeat(auto-fill, minmax(min(100%, 160px), 1fr))`.
- **Accesibilidad**: Foco visible (`:focus-visible`), atributos `aria-*` en modales y drawers, labels persistentes, errores inline y targets táctiles de al menos 44px (`--touch-target-min`).
- **Movimiento**: Respetar `prefers-reduced-motion`; las animaciones con Framer Motion deben contar con fallback estático o desactivación sin romper el flujo.

## Arquitectura de `apps/public-order-v2` (Headless UI)
- **Motor de Renderizado Dinámico**: La interfaz principal se renderiza a través de `DynamicRenderer` y `LayoutEngine` basándose en especificaciones de diseño (`DEFAULT_STUDIO_DESIGN_SPEC`).
- **Módulos Headless UI**:
  1. `banner_carousel_1`: Banners promocionales interactivos con autoplay y swipe.
  2. `reorder`: Módulo 1-Click Reorder para repetir el último pedido.
  3. `categories_horizontal` / `categories_sticky`: Navegación sticky de categorías con scroll horizontal suave.
  4. `featured`: Rail horizontal de productos "Top Vendidos".
  5. `catalog` / `grid`: Grilla dinámica de productos adaptativa a cualquier resolución.
  6. `cart_bar`: Barra inferior flotante de resumen del pedido.
- **Drawers y Notificaciones**:
  - `CatalogProductDrawer`: Detalle de producto con opciones de cantidad y fallbacks SVG.
  - `CatalogCartDrawer`: Resumen y gestión de ítems en carrito.
  - `CatalogCheckoutDrawer`: Formulario de datos para completar el pedido.
  - `CatalogToast`: Notificaciones flotantes no bloqueantes.
- **Reglas del flujo de pedido**:
  - No romper el public order flow mobile-first ni los aprendizajes acumulados en PRs 237–240 y PRs 397–400.
  - Mantener CTA claro para iniciar pedido, checkout responsivo con etiquetas claras y validación inline.

## Checks esperados
- Ejecutar `git diff --check` en todo PR.
- Ejecutar `npm run typecheck` cuando se toque TypeScript, configuración o código de app.
- Ejecutar `npm run build:public` cuando se toque `apps/public-order-v2` o código compartido que pueda afectarlo.
- Si un check no aplica o no puede ejecutarse por limitación del entorno, reportarlo claramente.

## No hacer
- No hacer refactors masivos oportunistas.
- No reescribir arquitectura ni mover archivos sin necesidad directa del prompt.
- No cambiar copy crítico, precios, nombres de productos, promociones o lógica de negocio por criterio propio.
- No agregar dependencias, assets remotos, tracking, analytics, iframes ni llamadas externas no autorizadas.
- No ocultar errores de validación ni reemplazar labels persistentes por placeholders.
- No dejar cambios sin test/check reportado ni riesgos sin mencionar.

## Metodología de trabajo (PRs 350–355+ & PRs 397–400+)
- Dividir features grandes en roadmap secuencial de PRs antes de implementar (PR1 → contrato, PR2 → flag/tokens, PR3 → headless shell, PR4 → drawers/ux, etc.). Cada PR tiene un único objetivo; nunca mezclar responsabilidades.
- Funcionalidad primero, polish después. Animaciones, micro-interacciones, responsive fino y UX visual van en PRs separados posteriores.
- Reutilizar componentes, helpers, tipos, hooks y contratos existentes antes de crear código nuevo.
- Follow-ups pequeños: si el bot comenta algo, se corrige en el mismo PR o en un follow-up mínimo. No se abre un PR enorme para atender feedback.
- Verificar siempre el estado real del PR en GitHub antes de darlo por terminado: comentarios del bot, code review, conflictos, merge status y checks.
- Resumen estándar al cerrar PR:
  1. Resumen ejecutivo.
  2. Archivos modificados.
  3. Qué se implementó.
  4. Qué NO se implementó.
  5. Riesgos.
  6. Testing ejecutado.
  7. Estado del PR (número, URL, estado, merge status, comentarios pendientes, checks).

## Uso de Modelos y Subagentes (Playbook)
- **Gemini Pro (Razonamiento)**: Usar para planificar, diseñar el `implementation_plan.md`, resolver problemas complejos de accesibilidad y definir contratos de datos.
- **Gemini Flash (Ejecución)**: Usar para codificación rápida, ejecutar comandos de testing/typecheck en background y correr validaciones visuales con `browser_subagent`.
- **Delegación**: Usar `invoke_subagent` para paralelizar tareas del roadmap de PRs (ej. un subagente para el PR de contratos, otro para la UI) manteniendo las responsabilidades aisladas.

## Memoria del proyecto

Antes de cambios grandes, lee:

- docs/codex-memory/00-indice.md

Estas notas son la memoria viva del proyecto para Codex/Obsidian. Si contradicen el código actual, verifica el código y reporta la diferencia.

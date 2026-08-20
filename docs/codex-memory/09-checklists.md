# Checklists para agentes en Burgers.exe

Este archivo define checklists mínimos para que Codex o cualquier agente entregue cambios revisables, seguros y alineados a la arquitectura canonical V3.

## Checklist universal

Aplicar en todo PR:

- [ ] Leí `AGENTS.md` y `PROJECT.md`.
- [ ] Leí `docs/codex-memory/00-indice.md`.
- [ ] Identifiqué el área afectada.
- [ ] No agregué dependencias, CDNs ni frameworks salvo autorización explícita.
- [ ] No cambié contratos de datos, precios, tickets, promociones ni payloads salvo autorización explícita.
- [ ] Verifiqué que TODOS los React Hooks (`useState`, `useRef`, `useMemo`, `useCallback`, `useEffect`) estén declarados AL INICIO del componente, ANTES de cualquier `if (...) return` (Rules of Hooks).
- [ ] Verifiqué que los valores por defecto de la API y contratos mantengan activo el Modo Catálogo ante cualquier fallo de BD.
- [ ] Revisé el diff completo.
- [ ] Ejecuté `git diff --check` o reporté por qué no pude ejecutarlo.
- [ ] Ejecuté `npm run typecheck` si toqué TypeScript o configuración.
- [ ] Ejecuté los builds aplicables (`npm run build:public`, `npm run build:chekeo` o `npm run build`).
- [ ] Abrí PR desde una rama limpia con base en `v3` (`gh pr create --base v3 --head feat/v3-xx-...`).

## Checklist de documentación

Para cambios solo de docs o memoria:

- [ ] No cambié código de app, contratos ni lógica de backend.
- [ ] No cambié scripts ni configuración del proyecto.
- [ ] La documentación nueva o editada tiene un propósito claro y está alineada a V3.
- [ ] El índice (`00-indice.md`) enlaza y clasifica cualquier archivo nuevo o actualizado.
- [ ] Reporté que no se ejecutaron checks de runtime porque no aplican.

## Checklist de tooling

- [ ] Validé si Graphify aplica para mapeo de dependencias.
- [ ] Validé si Playwright aplica (`playwright.e2e.config.ts`, `playwright.internal-kitchen.config.ts`).
- [ ] Validé si Wrangler aplica para Pages/D1/R2.
- [ ] Validé `npm run typecheck`, `npm run build:public` y `npm run build:chekeo`.
- [ ] Si alguna herramienta faltó o falló, reporté el bloqueo o limitación claramente.

## Checklist ambientes Cloudflare

Aplicar cuando el cambio toque Pages, Wrangler, D1, R2, preview/prod, secrets o scripts de deploy/migración.

- [ ] Confirmé la app oficial afectada: `apps/public-order-v3` o `apps/internal-chekeo-v3`.
- [ ] Confirmé el ambiente: local, preview o producción.
- [ ] Confirmé el Pages project esperado antes de ejecutar cualquier comando remoto.
- [ ] Confirmé que `BOG_MENU_DB` apunta al D1 correcto para ese ambiente.
- [ ] Confirmé que `BOG_MENU_ASSETS` apunta al R2 correcto para ese ambiente (`resolveCatalogAssetUrl`).
- [ ] Confirmé presencia de `BOG_INTERNAL_PIN` solo como secreto, sin imprimir ni guardar su valor.
- [ ] Confirmé `ORDERS_V2_WRITE_ENABLED` por ambiente antes de aceptar escrituras públicas.
- [ ] No ejecuté deploy, migraciones remotas, seeds remotos ni cambios de secrets en PRs documentales.
- [ ] Confirmé que `.dev.vars`, `wrangler.toml` local y `.wrangler/` no queden trackeados.
- [ ] Si uso Wrangler, separé comandos read-only de comandos que mutan recursos.
- [ ] Si hay duda sobre binding real en Cloudflare Dashboard, marqué bloqueo o riesgo en el PR.

## Checklist de resiliencia y fallbacks (App Pública V3)

Aplicar cuando se modifique la carga del menú, endpoints públicos o manejo de errores de API:

- [ ] La app pública mantiene reintentos automáticos o degradación suave ante fallas 500 / timeouts de `/api/menu-v2` mediante TanStack Query v5.
- [ ] No se removieron fallbacks defensivos ni guardas de schema sin asegurar un manejo de errores no bloqueante en la UI.
- [ ] Se verificó que un cold-start o latencia transitoria en Cloudflare D1 no provoque pantallas en blanco o bloqueos totales.
- [ ] En desarrollo/preview, la falla del backend muestra una interfaz intuitiva con reintento activo sin colapsar el layout.

## Checklist UI/UX general (Premium Casual)

Para cambios visibles en frontend:

- [ ] Mantiene enfoque mobile-first.
- [ ] Funciona en 320px sin overflow horizontal.
- [ ] Funciona en 390px y escala a tablets/desktop mediante `--catalog-max-width: 768px`.
- [ ] Mantiene targets táctiles de al menos 44px (`--touch-target-min`).
- [ ] Mantiene foco visible (`:focus-visible`).
- [ ] Mantiene labels persistentes y errores inline claros.
- [ ] No reemplaza información esencial por placeholders.
- [ ] Tiene estados loading (skeletons), success, error o empty states cuando aplican.
- [ ] Respeta `prefers-reduced-motion` en animaciones (Framer Motion / CSS).
- [ ] Mantiene la estética **Burgers.exe (Premium Casual Vibe)**: tema light-first por defecto (fondo crema `#F5F2EE`, tarjetas blancas `#FFFFFF`, acento verde bosque `#16A34A`), soporte completo para dark mode slate/carbón (`#121212` / `#1E1E1E`, acento `#22C55E`), tipografía Inter, bordes sutiles (`--color-line`) y sombras de elevación limpia (`--shadow-card`, `--shadow-panel`).

## Checklist Chekeo (V3)

Antes de tocar Chekeo, leer `03-flujos-chekeo.md` y `21-order-communication-and-recipe-spec.md`.

Validar:

- [ ] **Pedidos**: cola de pedidos en vivo con auto-refresh, filtros multidimensionales (estado, modo, torres, calendario), comanda estructurada, drawer de auditoría cronológica y modal de cancelación segura.
- [ ] **Cocina (KDS & Resumen K)**: KDS Kanban interactivo con 3 columnas y semáforo de tiempos, tags de remociones (`🔴 SIN ...`) y extras (`🟢 +EXTRA ...`), chimes con Web Audio API, y Resumen K consolidado para mise en place.
- [ ] **Pagos**: conciliación financiera por método (Efectivo, SPEI, Tarjeta), generación e impresión nativa de recibos térmicos 80mm/58mm, y WhatsApp Bridge con 5 plantillas automáticas.
- [ ] **Admin**: control en vivo de Menú & Stock diario, gobernanza de Torres y horarios CDMX, Banners promocionales, Sorteos con ranking y ruleta, Corte Z de turno con exportación CSV e Insumos / Recetas.
- [ ] No se rompe el flujo de marcar pagado / regresar a pendiente ni las notas internas.

## Checklist Public Order (V3)

Antes de tocar public order, leer `04-flujo-public-order.md`.

Validar:

- [ ] Header con estatus operativo CDMX y modal de horarios por torre (`TowerScheduleModal`).
- [ ] Banners promocionales dinámicos con autoplay, swipe y fallback SVG.
- [ ] Navegación horizontal de categorías sticky con scroll suave.
- [ ] Catálogo modular con tarjetas de producto (`ProductCard`), badges, precios promo y quick-add interactivo para combos.
- [ ] `ProductDetailDrawer` con personalización de receta (ingredientes a remover, extras dinámicos, notas para cocina, guarniciones y bebidas obligatorias).
- [ ] `CartDrawer` con stepper de cantidades, desglose financiero y 1-Tap Reorder.
- [ ] `CartBar` flotante con total del pedido, animación suave y targets $\ge 44$px.
- [ ] `CheckoutDrawer` con validación Zod (nombre, teléfono WhatsApp 10 dígitos), selector de torre con advertencia de horario, cálculo de fecha de entrega, tarjeta bancaria con copiado rápido de CLABE y código de referido para sorteo.
- [ ] `OrderSuccessModal` con folio `#ORD-...`, resumen financiero y enlaces directos a WhatsApp.
- [ ] No se rompen contratos ni payloads enviados a `POST /api/orders-v2`.

## Checklist pagos, tickets y WhatsApp

Aplicar si el cambio toca pagos, ticket, comprobante o mensajes:

- [ ] No cambie reglas de precio ni cálculos financieros sin autorización.
- [ ] No cambie reglas de tickets térmicos sin autorización.
- [ ] El copy de WhatsApp incluye solo información necesaria según las plantillas oficiales preestablecidas.
- [ ] La información bancaria (CLABE / beneficiario) aparece correctamente con botón de 1-tap para copiar.
- [ ] El ticket vertical 80mm/58mm mantiene folio, fecha/entrega, cliente, desglose de modificaciones y totales.
- [ ] El tono mantiene la temática Burgers.exe Premium Casual (claro, profesional, amigable).

## Checklist Resumen K / Operación

Aplicar si el cambio toca cocina o resumen operativo:

- [ ] Muestra burgers necesarias consolidadas por receta (OG, Clásica, BBQ, etc.).
- [ ] Muestra guarniciones consolidadas (Papas Francesas, Aros de Cebolla, etc.).
- [ ] Muestra extras totales necesarios para el mise en place.
- [ ] Distingue cantidades operativas de información para cliente.
- [ ] No mezcla datos del sorteo con producción salvo requerimiento explícito.

## Checklist Skills oficiales

- [ ] Validé `graphify` y `.graphifyignore`.
- [ ] Validé Obsidian skills y estructura de `docs/codex-memory/`.
- [ ] Validé `burgers-pr-workflow`.
- [ ] Validé `playwright-qa`.
- [ ] Actualicé `11-skills-and-tools.md` si hubo cambios en herramientas.

## Checklist PR

La descripción del PR debe incluir:

```md
## Summary
- ...

## Testing
- ...

## Risks
- ...

## QA checklist
- [ ] ...
```

Si no se ejecuta un check, escribir:

```md
- Not run: [motivo claro]
```

---

## [Histórico / Referencia V2] Checklists de fases archivadas

> **Nota de Archivo**: Los siguientes checklists corresponden a fases pasadas de la migración V2 Clean Architecture y se preservan únicamente con fines de auditoría histórica.

### Checklist superficie activa y Fase 5 [Histórico V2]
- [x] Clasificación de código activo vs legacy concluida en PR-V3-00 y PR-V3-13.

### Checklist Fase 6 - Sheets/App Script cleanup [Histórico V2]
- [x] Scripts legacy y referencias a Sheets/AppScript purgados del runtime en V3.

### Checklist Fase 7A / 7B.1 - Preview mirror [Histórico V2]
- [x] Configuración de preview y aislamiento D1/R2 consolidado en V3.

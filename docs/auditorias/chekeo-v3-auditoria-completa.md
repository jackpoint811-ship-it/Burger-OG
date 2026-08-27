# 🔍 Auditoría Integral 360° — Chekeo V3

> **Fecha**: 2026-08-27
> **Entorno auditado**: `https://burgers-exe-internal-v2-preview.pages.dev/` (branch `preview`)
> **Viewport principal**: 📱 Móvil (375px–428px) — operadores en piso
> **Archivos auditados**: 86 archivos en `apps/internal-chekeo-v3/src/`
> **Dimensiones**: Inventario Funcional · UX/UI & Tokens · Accesibilidad WCAG 2.1 AA · Arquitectura & Código

---

## 📊 Resumen Ejecutivo

### Métricas de la Auditoría

| Dimensión | Hallazgos 🔴 Críticos | Hallazgos 🟡 Importantes | Hallazgos 🟢 Menores |
|-----------|:---------------------:|:------------------------:|:--------------------:|
| Shell & Auth | 2 | 3 | 0 |
| Operación | 1 | 1 | 0 |
| Pedidos | 3 | 3 | 1 |
| Cocina KDS | 0 | 2 | 0 |
| Pagos | 2 | 1 | 2 |
| Admin | 1 | 2 | 2 |
| **TOTAL** | **9** | **12** | **5** |

### Hallazgos Transversales (aplican a toda la app)

| # | Severidad | Hallazgo | Alcance |
|---|:---------:|----------|---------|
| T1 | 🔴 | **Targets táctiles < 44px** en botones de acción, filtros y controles secundarios | Todas las pestañas |
| T2 | 🔴 | **Focus Trap ausente** en popovers custom y algunos modales | Pedidos, Pagos, Admin |
| T3 | 🟡 | **Emojis en elementos interactivos** (prohibido por reglas de UI) | Operación, Cocina, Pagos, Admin |
| T4 | 🟡 | **`focus-visible:ring-2` inconsistente** — algunos usan `focus:` estricto | Shell, Pedidos, Operación |
| T5 | 🟡 | **`any` en TypeScript** en catches y handlers | Shell, Admin |

---

## 1. Shell & Autenticación

### 1.1 Inventario Funcional

#### `ChekeoApp.tsx` — Componente Raíz
- Ejecuta `checkSession()` de `useAuthStore` al montar (validación silenciosa de sesión)
- Renderiza `AppShell` con 5 `TabsContent`: `operacion`, `pedidos`, `cocina`, `pagos`, `admin`
- Estado `activeTab` controla qué pestaña se muestra
- **Operación, Pedidos, Cocina y Pagos**: Acceso libre e inmediato (sin PIN)
- **Admin**: Protegido con `AdminAuthGate` (PIN exclusivo)

#### `TopHeader.tsx` — Barra Superior Fija
| Elemento | Acción al Clic/Tap |
|----------|-------------------|
| Indicador de entorno | Solo visual: muestra `PREVIEW`, `DEV` o `PRODUCTION` |
| Reloj CDMX | Solo visual: actualización cada segundo con `setInterval` |
| Indicador Online/Offline | Solo visual: `navigator.onLine` con listener de eventos |
| Toggle Dark/Light 🌙/☀️ | Alterna `localStorage('burgers-theme')` y clase `.theme-dark` en `<html>` |
| Botón Logout 🔓 | Ejecuta `logout()` de `useAuthStore`, limpia sesión |

#### `NavTabs.tsx` — Barra de Navegación por Pestañas
| Pestaña | Ícono | Badge |
|---------|-------|-------|
| Operación | `Activity` (Lucide) | — |
| Pedidos | `ShoppingBag` | Conteo de pedidos activos |
| Cocina | `ChefHat` | Conteo de comandas pendientes |
| Pagos | `CreditCard` | Conteo de pagos por confirmar |
| Admin | `Settings` + 🔒 | Candado si no autenticado |

- Targets táctiles: `min-h-[44px]` ✅
- ARIA: `aria-label` descriptivos ✅
- Iconografía: SVG Lucide ✅

#### `AuthGate.tsx` — Login por PIN (Global)
| Elemento | Acción |
|----------|--------|
| Input PIN (oculto por defecto) | Acepta 4 dígitos, auto-submit al 4to |
| Botón Eye/EyeOff | Muestra/oculta los dígitos del PIN |
| Teclado numérico (0-9) | Agrega dígito al PIN |
| Botón Clear | Limpia todos los dígitos |
| Botón Backspace | Elimina último dígito |
| Botón Desbloquear | Envía PIN al backend (`loginWithPin`) |

**Estados:**
- ⏳ Cargando: Botón deshabilitado con texto "Validando..."
- ❌ Error: Animación shake, limpieza de PIN, mensaje `role="alert"`
- ✅ Éxito: Desmonta AuthGate, muestra las pestañas

#### `globals.css` — Tokens de Diseño
- Directiva `@import "tailwindcss"` + `@theme`
- Paleta Premium Casual: `#F5F2EE` (fondo), `#FFFFFF` (tarjeta), `#16A34A` (acento)
- Dark mode: `.theme-dark` con `#121212` (fondo), `#1E1E1E` (tarjeta), `#22C55E` (acento)
- Variables de sombra: `--shadow-card`, `--shadow-panel`, `--shadow-floating`
- Target táctil mínimo: `--touch-target-min: 44px`
- Scrollbar oculto: `.no-scrollbar`

### 1.2 Inspección UX/UI

- ✅ Paleta Premium Casual aplicada correctamente en shell
- ✅ Cursores correctos en botones del header
- ✅ Variables semánticas de color bien aplicadas
- ⚠️ Los botones del TopHeader miden `h-9 w-9` (36×36px), por debajo de los 44px mínimos

### 1.3 Accesibilidad

| Criterio | Estado | Detalle |
|----------|:------:|---------|
| Contraste | ✅ | Colores semánticos cumplen 4.5:1 |
| Targets táctiles | 🔴 | Botones de TopHeader: `h-9 w-9` = 36×36px (< 44px) |
| Foco visible | 🔴 | `focus-visible:outline-none` en `TabsContent` suprime anillo de foco |
| ARIA en tabs | ✅ | `NavTabs` tiene `aria-label` descriptivos |
| AuthGate a11y | 🟡 | Botón Eye tiene `tabIndex={-1}` (innavegable por teclado); input no vincula error con `aria-describedby` |

### 1.4 Arquitectura

- ✅ TanStack Query configurado con `staleTime: 30s`
- ✅ Zustand `useAuthStore` con persistencia en `localStorage`
- 🔴 `auth.api.ts` y `api-client.ts` usan `catch (err: any)` y `let data: any = null` — debe ser `unknown` con type guards
- ✅ Barrel exports limpios en `features/auth/index.ts`

### 1.5 Hallazgos

| # | Sev. | Hallazgo | Archivo | Línea aprox. |
|---|:----:|----------|---------|:---:|
| S1 | 🔴 | Botones TopHeader `h-9 w-9` (36px < 44px mínimo) | `TopHeader.tsx` | — |
| S2 | 🔴 | `catch (err: any)` y `let data: any` — usar `unknown` | `auth.api.ts`, `api-client.ts` | — |
| S3 | 🟡 | `focus-visible:outline-none` en TabsContent suprime foco | `ChekeoApp.tsx` | L30-48 |
| S4 | 🟡 | Botón Eye en AuthGate tiene `tabIndex={-1}` | `AuthGate.tsx` | — |
| S5 | 🟡 | Error de PIN sin `aria-describedby` en input | `AuthGate.tsx` | — |

---

## 2. Pestaña: Operación

### 2.1 Inventario Funcional

#### `OperacionView.tsx` — Dashboard Operativo

| Elemento | Acción al Clic/Tap |
|----------|-------------------|
| Tarjeta "Cocina Activa" 🔥 | Navega a pestaña `cocina` vía `onTabChange('cocina')` |
| Tarjeta "Por Cobrar" 💳 | Navega a pestaña `pagos` |
| Tarjeta "Pedidos Abiertos" 🛍️ | Navega a pestaña `pedidos` |
| Tarjeta "Venta del Día" 💵 | Solo visual (muestra monto en pesos) |
| Tarjeta "Siguiente Acción Prioritaria" | CTA dinámico que redirige a la pestaña más urgente |
| Mini cola de comandas urgentes | Cada tarjeta navega a la pestaña correspondiente |
| Mini Resumen K | Acceso directo a Cocina > Resumen K |

**Estados:**
- ⏳ Cargando: Skeletons animados en las 4 tarjetas
- 🟢 Normal: Métricas verdes si todo está al día
- 🟡 Atención: Métricas amarillas si hay pagos pendientes o comandas atrasadas
- 🔴 Urgente: Métricas rojas si hay acumulación crítica

**Datos en tiempo real:**
- Consulta `useChekeoOrdersQuery` con auto-refresh cada 15s
- Consulta `useKitchenDisplay` con auto-refresh
- Fecha calculada con `new Date()` local (**⚠️ Bug potencial de timezone — ver hallazgo O1**)

### 2.2 Inspección UX/UI

- ✅ Hover states atractivos con `cursor-pointer`
- ✅ Sombras `shadow-card` consistentes
- ✅ Jerarquía tipográfica clara (métricas grandes, labels pequeños)
- 🔴 **Emojis en botones interactivos**: `'Abrir Pagos 💳'`, `'Abrir Cocina 👨‍🍳'`, `'Abrir Pedidos 📦'`, `'🎯 Siguiente Acción'`

### 2.3 Accesibilidad

| Criterio | Estado | Detalle |
|----------|:------:|---------|
| Targets táctiles | ✅ | Tarjetas grandes, bien dimensionadas |
| Foco visible | 🟡 | Tarjetas clickeables sin `focus-visible:ring-2` |
| Semántica | ✅ | Usan `<button>` nativo |

### 2.4 Hallazgos

| # | Sev. | Hallazgo | Archivo |
|---|:----:|----------|---------|
| O1 | 🔴 | `todayStr` usa `new Date()` local en vez de `getCdmxTodayString()` — **Bug de timezone** | `OperacionView.tsx` L48-51 |
| O2 | 🟡 | Emojis interactivos en botones CTA (prohibido por reglas UI) | `OperacionView.tsx` |

---

## 3. Pestaña: Pedidos

### 3.1 Inventario Funcional

#### `PedidosView.tsx` — Orquestador de Pedidos

**Nivel 1 — Riel Horizontal de Fechas (`HorizontalDateCalendarFilter`)**

| Elemento | Acción |
|----------|--------|
| Botón "⏱️ Anteriores" | Filtra pedidos con fecha anterior a hoy |
| Botón "🟢 HOY" | Filtra pedidos de hoy (zona CDMX) |
| Botones de fechas (14 días) | Filtra por fecha específica, badges con conteo |
| Botón "Ver Todos" | Muestra todos los pedidos sin filtro de fecha |

**Nivel 2 — Barra de Control (`OrdersFilterBar`)**

| Elemento | Acción |
|----------|--------|
| Input de búsqueda universal | Filtra por folio, nombre, teléfono, torre, ingredientes |
| Botón X en búsqueda | Limpia el campo de búsqueda |
| Ribbon de estados | Filtra: Todos / Nuevos / Preparando / Listos / Entregados / Cancelados / 🗑️ Archivados |
| Botón "Filtros" con badge | Abre popover con selectores de Torre (GGA / Valcob) |
| Chips de filtros activos | Cada chip con X para quitar el filtro aplicado |

**Nivel 3 — Lista de Comandas (`OrdersList` + `OrderCard`)**

| Elemento en OrderCard | Acción |
|----------------------|--------|
| Checkbox de selección | Agrega/quita ID del Set de seleccionados |
| Folio copiable (#ORD-...) | Copia al portapapeles con feedback visual |
| Hecho 1: Total ($) | Solo visual |
| Hecho 2: Torre GGA/Valcob | Solo visual |
| Hecho 3: Fecha (⚡Hoy / 📅Después) | Solo visual |
| Botón "Pasar a Cocina" | Muta estado a `preparing` vía API |
| Botón "Detalle" | Abre `OrderDetailDrawer` |
| Botón WhatsApp | Abre enlace `wa.me` |
| Botón Archivar | Muta `archived_at` en D1 |

**Nivel 4 — Acciones en Lote (`BatchActionBar`)**

| Elemento | Acción |
|----------|--------|
| Contador "N seleccionadas" | Solo visual |
| Botón "Limpiar selección" | Vacía el Set de IDs |
| Botón "Archivar seleccionadas" | Abre `BatchConfirmModal` con desglose |
| Botón "Restaurar seleccionadas" | Solo visible en vista de archivados |

**Modales y Drawers**

| Modal/Drawer | Elementos | Acciones |
|-------------|-----------|---------|
| `OrderDetailDrawer` | Resumen completo, lista de ítems, modificadores, auditoría | Botones: Avanzar estado, Cancelar, Cerrar |
| `CancelOrderModal` | Presets de motivo (botones), campo de texto libre | Confirmar cancelación con motivo → muta API |
| `BatchConfirmModal` | Desglose de pedidos activos vs terminados | Confirmar / Cancelar archivado masivo |

### 3.2 Inspección UX/UI

- ✅ Diseño visual denso pero estructurado (estilo POS)
- ✅ Scroll horizontal con `no-scrollbar` para limpieza visual
- ✅ Iconos SVG Lucide en la mayoría de controles
- ⚠️ Scroll horizontal sin controles `<` `>` dificulta navegación por teclado
- ⚠️ Botones de acción diminutos en tarjetas (`p-1`, `w-3.5`)

### 3.3 Accesibilidad

| Criterio | Estado | Detalle |
|----------|:------:|---------|
| Popover filtros | 🔴 | Sin `role="dialog"`, sin focus trap, sin listener Escape |
| Botón X búsqueda | 🔴 | Tamaño ~20px (lejos de 44px) |
| Botones en OrderCard | 🔴 | Copiar folio y WhatsApp con `p-1 w-3.5` (~14px) |
| CancelOrderModal presets | 🟡 | Botones aislados sin `role="radio"` ni `aria-checked` |
| BatchActionBar | 🟡 | Altura `h-9` (36px) para acciones destructivas masivas |
| Checkbox maestro | 🟡 | Sin wrapper `min-h-11` para área táctil |

### 3.4 Arquitectura

- ✅ `useChekeoOrdersQuery` con auto-refresh 15s y conteos memoizados
- ✅ Query keys centralizadas (`chekeoOrderKeys`)
- ✅ Mutaciones que invalidan selectivamente el caché
- 🟢 Alta duplicación de visualización de ítems/modificadores entre `OrderCard` y `OrderDetailDrawer` — candidato a componente `OrderItemRow`

### 3.5 Hallazgos

| # | Sev. | Hallazgo | Archivo |
|---|:----:|----------|---------|
| P1 | 🔴 | Popover de filtros sin focus trap, sin Escape, sin `role="dialog"` | `OrdersFilterBar.tsx` |
| P2 | 🔴 | Botón X de búsqueda ~20px (< 44px obligatorio) | `OrdersFilterBar.tsx` |
| P3 | 🔴 | Botones Copiar folio y WhatsApp ~14px en OrderCard | `OrderCard.tsx` |
| P4 | 🟡 | Presets de cancelación sin `role="radio"` / `aria-checked` | `CancelOrderModal.tsx` |
| P5 | 🟡 | BatchActionBar con `h-9` (36px) en acciones destructivas | `BatchActionBar.tsx` |
| P6 | 🟡 | Scroll horizontal sin controles de teclado `<` `>` | `HorizontalDateCalendarFilter.tsx` |
| P7 | 🟢 | Duplicación de renderizado de ítems entre Card y Drawer | `OrderCard.tsx`, `OrderDetailDrawer.tsx` |

---

## 4. Pestaña: Cocina (KDS)

### 4.1 Inventario Funcional

#### `CocinaView.tsx` — Vista Principal (3 Estaciones)

**Nivel 1 — Selector de Estaciones (`role="tablist"`)**

| Pestaña | Ícono | Badge | Acción |
|---------|-------|-------|--------|
| 🍔 Preparación | (emoji) | Conteo de pendientes plancha | Muestra `KitchenDisplay` con `laneMode="prep"` |
| 🍟 Side Quest | (emoji) | Conteo de pendientes side quest | Muestra `KitchenDisplay` con `laneMode="sideQuest"` |
| 📋 Resumen K | (emoji) | — | Muestra `KitchenSummaryK` |

- Badge `🟢 Cocina en Vivo` con conteo total de pendientes
- Contadores reactivos calculados por `extractKitchenProductionUnits`

**Nivel 2 — Riel Horizontal de Fechas**
- Reutiliza `HorizontalDateCalendarFilter` con zona horaria CDMX (`getCdmxTodayString()`)

**Nivel 3 — Área de Producción**

#### `KitchenActiveStation.tsx` — Comanda Activa + Cola

| Elemento | Acción |
|----------|--------|
| Tarjeta de comanda activa (en foco) | Muestra detalles completos con `KitchenTicketCard` |
| Cola de espera (tarjetas compactas) | Clic selecciona comanda (`setSelectedTicketId`) |
| Acordeón "Listos" (desplegable) | Muestra comandas ya terminadas en esta estación |
| Botón "Revertir" en cada lista | Reversa comanda despachada vía API + localStorage |

#### `KitchenTicketCard.tsx` — Tarjeta de Comanda KDS

| Elemento | Acción |
|----------|--------|
| Header: Nombre del cliente (text-2xl font-black) | Solo visual, máxima jerarquía |
| Folio (#PB-M0001) + Torre | Solo visual |
| Acordeón de Nota de Pedido | Clic despliega/colapsa si nota > 40 caracteres |
| **Ítem #N (acordeón secuencial)** | Primer ítem pendiente abierto por defecto; al marcar listo se colapsa y abre el siguiente |
| Badge `[✓ Receta Original]` / `[🛠️ Personalizada]` | Solo visual, visible cuando ítem está colapsado |
| Modificadores `🔴 SIN [X]` | Texto rojo intenso de alto contraste |
| Modificadores `🟢 +EXTRA [X]` | Texto verde esmeralda de alto contraste |
| Nota de ítem (acordeón) | Despliega si nota > 45 caracteres |
| **Botón `✔ Marcar Ítem Listo`** | Marca unit como lista en `useKitchenItemTracking` (localStorage) |
| **Botón `↩ Desmarcar`** | Revierte ítem a pendiente |
| **Botón `✔ Despachar [Estación]`** | Solo activo cuando 100% ítems de la estación listos. Avanza estado global en D1 |

**Flujo de despacho desacoplado:**
1. Parrillero marca sus ítems en **Preparación** → despacha plancha independientemente
2. Freidor marca sus ítems en **Side Quest** → despacha side quest independientemente
3. `useKitchenItemTracking` con `dispatchMap` detecta cuando ambas estaciones terminaron → promueve automáticamente a `ready` en D1

#### `KitchenSummaryK.tsx` — Resumen K (Mise en Place)

| Elemento | Acción |
|----------|--------|
| Tab "Producción & Restock" / "Insumos D1" | Cambia vista entre producción en vivo y costeo de D1 |
| Botón Refrescar | Fuerza recarga de queries |
| Chips de estación: Todas / Plancha / Freidora / Bebidas / Extras | Filtra la vista de estaciones |

**Contenido del Resumen K:**
- 🥩 Patties (conteo por receta: sencilla=1, doble=2, triple=3 + extras de carne)
- 🍞 Bollos de pan
- 🧀 Queso Americano
- 🥓 Tocino
- 🍟 Guarniciones (desglose exacto: Papas L&P, Papas Especiales, Papas OG, Aros de Cebolla)
- 🥤 Bebidas frías
- 🥫 Dips / Salsas
- Desglose logístico por Torre (GGA vs Valcob)
- Panel de modificaciones (`✓ Receta Original` vs `🔴 SIN X (×N)` con burgers afectadas)

### 4.2 Inspección UX/UI

- ✅ Alto contraste en modificadores (rojo intenso / verde esmeralda)
- ✅ Jerarquía visual centrada en el nombre del cliente
- ✅ Acordeón secuencial automático (UX excelente para producción)
- ✅ Despacho desacoplado por estación (Plancha / Side Quest independientes)
- ⚠️ Emojis en tabs de estación: `'🍔 Preparación'`, `'🍟 Side Quest'`, `'📋 Resumen K'`
- ⚠️ Emojis en chips de filtro: `'🍔 Plancha'`, `'🍟 Freidora'`, etc.

### 4.3 Accesibilidad

| Criterio | Estado | Detalle |
|----------|:------:|---------|
| Tabs de estación | ✅ | `role="tablist"` + `role="tab"` + `aria-selected` |
| Targets táctiles | ✅ | Botón "Listo" grande ≥ 52px |
| Foco visible | ✅ | `focus-visible:ring-2 focus-visible:ring-accent` |
| Chips de filtro | ⚠️ | Podrían no alcanzar 44px de alto |
| Acordeón ítems | ✅ | `role="button"`, `aria-expanded`, `aria-label` |

### 4.4 Arquitectura

- ✅ Arquitectura sofisticada: TanStack Query (estado global) + localStorage (granularidad de checkeo)
- ✅ `useKitchenItemTracking` con `dispatchMap` para despacho paralelo por estación
- ✅ Tipos rigurosos en `kitchen.types.ts` para `KitchenProductionUnit`, `KitchenTicket`, etc.
- ✅ Chimes Web Audio API para alertas sonoras
- ✅ Funciones de extracción deterministas: `extractKitchenTicketItems`, `extractKitchenProductionUnits`

### 4.5 Hallazgos

| # | Sev. | Hallazgo | Archivo |
|---|:----:|----------|---------|
| K1 | 🟡 | Emojis en tabs de estación y chips de filtro (prohibido) | `CocinaView.tsx`, `KitchenSummaryK.tsx` |
| K2 | 🟡 | Chips de filtro en Resumen K podrían no alcanzar 44px | `KitchenSummaryK.tsx` |

---

## 5. Pestaña: Pagos

### 5.1 Inventario Funcional

#### `PagosView.tsx` — Orquestador de Pagos

**Nivel 1 — Selector de Período (`PaymentPeriodSelector`)**

| Elemento | Acción |
|----------|--------|
| Botón "⚡ Hoy" | Filtra pedidos de hoy |
| Botón "⏱️ Ayer" | Filtra pedidos de ayer |
| Botón "📅 Esta Semana" | Filtra últimos 7 días |
| Botón "🌐 Todo" | Sin filtro de fecha |
| Botón "Fecha Específica" | Abre mini calendario mensual popover |
| Mini Calendario | Matriz de días con indicadores verdes en días con cobros. Clic selecciona fecha exacta |

**Nivel 2 — KPIs Financieros (`PaymentKpiHeader`)**

| KPI | Click-to-Filter |
|-----|----------------|
| 💰 Total Ventas | Muestra todos |
| 🏦 Transferencias | Filtra `method=spei` |
| 💵 Efectivo | Filtra `method=cash` |
| ⏳ Por confirmar | Filtra `paymentStatus=pending` |

**Nivel 3 — Barra de Control (`PaymentsFilterBar`)**

| Elemento | Acción |
|----------|--------|
| Input búsqueda universal | Filtra por folio, nombre, teléfono, ubicación |
| Botón "🏦 Cuenta BBVA" | Abre `BankDetailsModal` con CLABE y datos |
| Botón "Filtros" | Abre popover con selectores de Método y Torre |
| Ribbon de estados | Todos / Por confirmar / Pagados / Cancelados |
| Botón "Restablecer" | Limpia todos los filtros |

**Nivel 4 — Lista de Pagos (`PaymentsList` + `PaymentCard`)**

| Elemento en PaymentCard | Acción |
|------------------------|--------|
| Checkbox de selección | Agrega/quita ID para lote |
| Folio copiable | Copia al portapapeles |
| Hecho 1: Total ($) | Solo visual |
| Hecho 2: Torre | Solo visual |
| Hecho 3: Fecha (⚡/📅) | Solo visual |
| Botón "1-Clic: Confirmar Pago" | Muta `paymentStatus=paid` + `status=delivered` vía API |
| Botón "1-Clic: Revertir" | Muta `paymentStatus=pending` vía API |
| Botón "Ticket" | Abre `OrderTicketModal` (80mm) |
| Botón "WhatsApp" | Abre `WhatsAppActionModal` |
| Botón "Detalle" | Abre `OrderDetailDrawer` |

**Nivel 5 — Acciones en Lote (`PaymentBatchActionBar`)**

| Elemento | Acción |
|----------|--------|
| Contador "N seleccionadas · $X" | Solo visual |
| Botón "Copiar Arqueo" | Genera texto formateado y copia al portapapeles |
| Botón "Por confirmar (Revertir)" | Abre `PaymentBatchConfirmModal` tipo revert |
| Botón "Confirmar (Validar)" | Abre `PaymentBatchConfirmModal` tipo validate |

**Modales**

| Modal | Contenido | Acciones |
|-------|-----------|---------|
| `OrderTicketModal` | Ticket térmico 80mm/58mm monoespaciado | Imprimir (diálogo nativo), Copiar Texto, WhatsApp |
| `WhatsAppActionModal` | 5 plantillas: Confirmación, En camino, Ticket, Recordatorio SPEI, Personalizado | Seleccionar plantilla → Textarea de notas → Botón "Enviar por WhatsApp" (`wa.me`) / "Copiar Mensaje" |
| `BankDetailsModal` | CLABE, Banco (BBVA), Titular | Botones 1-toque: Copiar CLABE, Copiar Ficha Completa |
| `PaymentBatchConfirmModal` | Desglose de montos y conteos | Confirmar / Cancelar acción masiva |

### 5.2 Inspección UX/UI

- ✅ Paleta Premium Casual consistente
- ✅ Transiciones y animaciones de retroalimentación excelentes (`animate-pulse` en ámbar)
- ✅ Iconos SVG Lucide predominan
- ⚠️ Emojis en botones de período: `⚡ Hoy`, `⏱️ Ayer`, `📅 Esta Semana`
- ✅ Tipografía y jerarquía bien estructurada (estilo dashboard financiero)
- ✅ Buen uso de padding y gap en general

### 5.3 Accesibilidad

| Criterio | Estado | Detalle |
|----------|:------:|---------|
| KPIs interactivos | 🔴 | `<div role="button" tabIndex={0}>` sin `onKeyDown` — inaccesibles por teclado |
| Popovers custom | 🔴 | Mini calendario y filtros sin focus trap ni Escape |
| Targets táctiles | ⚠️ | `PaymentCard` botones ~36-38px (cercano pero no 44px) |
| Contraste en badges | ⚠️ | `bg-emerald-500/15 text-emerald-600` requiere QA de contraste |
| Dialog/Drawers | ✅ | Componentes `<Dialog>` con focus trap correcto |

### 5.4 Arquitectura

- ✅ Encapsulación excelente en `use-payments.ts` con separación de concerns
- ✅ Utils especializados: `ticket.utils.ts`, `whatsapp.utils.ts`, `payments.utils.ts`
- ✅ Tipos estrictos en `payments.types.ts` sin `any`
- ✅ Normalización de teléfono WhatsApp (+521...) y cálculo CDMX

### 5.5 Hallazgos

| # | Sev. | Hallazgo | Archivo |
|---|:----:|----------|---------|
| PA1 | 🔴 | KPIs con `role="button"` sin `onKeyDown` (Enter/Space) | `PaymentKpiHeader.tsx` |
| PA2 | 🔴 | Popovers de calendario y filtros sin focus trap ni Escape | `PaymentPeriodSelector.tsx`, `PaymentsFilterBar.tsx` |
| PA3 | 🟡 | Emojis en botones de período (⚡, ⏱️, 📅) | `PaymentPeriodSelector.tsx` |
| PA4 | 🟢 | Prop deprecated `onFilterByPendingSpei` con fallback — limpiar | `PaymentKpiHeader.tsx` |
| PA5 | 🟢 | Strings mágicos para íconos en `WhatsAppActionModal` — usar mapa tipado | `WhatsAppAction.tsx` |

---

## 6. Pestaña: Admin (PRIORITARIA)

### 6.1 Inventario Funcional

#### Flujo de Autenticación PIN (`AdminAuthGate`)
1. Usuario ve pantalla de candado con teclado numérico táctil
2. Ingresa PIN de 4 dígitos (botones 0-9, Backspace, Clear)
3. Al completar 4 dígitos → auto-submit a `validatePin()` de `useAuthStore`
4. ⏳ Cargando: Botón deshabilitado "Validando..."
5. ❌ Error: Animación shake, limpieza automática de PIN
6. ✅ Éxito: Desmonta AuthGate → muestra `AdminWorkspace`

#### Hub Principal (`AdminHubGrid` + `AdminQuickFavorites`)

**Franja Superior — Favoritos Rápidos**
- Cuadritos compactos (grid 2 columnas en móvil) con accesos directos
- Cada favorito: icono Lucide + nombre + ⭐
- Clic en ⭐ → `togglePin()` persiste en `localStorage`
- Clic en tarjeta → navega al módulo correspondiente

**Cuadrícula de 6 Categorías Maestras** (grid 2 columnas)

| Categoría | Ícono | Métricas en Vivo | Sub-herramientas |
|-----------|-------|-----------------|-----------------|
| 📦 Menú & Stock | `Package` | Productos activos, agotados | Catálogo, Disponibilidad |
| 🏢 Torres & Horarios | `Building2` | Torres activas, pausadas | Config Torres, Horarios |
| 🎨 Banners | `Image` | Banners activos | Crear, Editar, Reordenar |
| 🎰 Sorteos | `Gift` | Campaña activa, tickets | Participantes, Códigos, Sortear |
| 💰 Corte de Caja | `Calculator` | Venta del día, método | Corte Z, Exportar CSV |
| 🧪 Ingredientes | `Beaker` | Recetas activas | Insumos, Costeo |

#### Command Palette ⌘K (`AdminSearchBar`)
1. Presionar `⌘K` (Mac) o `Ctrl+K` (Windows) abre el modal de búsqueda
2. Texto filtra `ADMIN_SEARCH_INDEX` (catálogo plano de módulos y herramientas)
3. Flechas ↑↓ navegan resultados (`selectedIndex`)
4. Enter selecciona y navega al módulo
5. Escape cierra el modal

#### Workspace Maestro-Detalle (`AdminModuleWorkspace`)

**Barra Superior:**
- `AdminBreadcrumbs`: Migas de pan multinivel (Home > Categoría > Herramienta)
- Botón retroceso, soporte Escape
- Botón Pin ⭐ para fijar a favoritos
- Botón 🔒 Bloquear Admin → `logout()`

**Sidebar Lateral Izquierdo (desktop/tablet):**
- Lista de sub-herramientas del módulo activo
- Accesos rápidos a favoritos

**Barra Segmentada (móvil < 768px):**
- Pastillas flotantes para conmutar herramientas sin desperdiciar espacio vertical

**Lienzo Central Derecho:**
- Renderiza el panel específico de la herramienta seleccionada

#### Panel: Menú & Stock (`MenuStockPanel`)
| Elemento | Acción |
|----------|--------|
| Tabs de categoría (filtros) | Filtra productos por categoría |
| Input de búsqueda | Filtra por nombre/SKU |
| Switch de disponibilidad (por producto) | Toggle `available` en D1 vía API |
| Botón "Nuevo Producto" | Abre `ProductEditModal` vacío |
| Botón "Editar" (por producto) | Abre `ProductEditModal` con datos pre-cargados |
| Botón "Eliminar imagen" | Borra asset de R2 |

#### Panel: Edición de Producto (`ProductEditModal`)
| Campo | Tipo | Validación |
|-------|------|-----------|
| SKU | Input texto | Requerido, formato `PRODUCTO_NOMBRE` |
| Nombre | Input texto | Requerido |
| Categoría | Select | Requerido, opciones de `MenuCategory` |
| Precio (centavos) | Input numérico | Requerido, ≥ 0 |
| Descripción | Textarea | Opcional |
| Promoción activa | Checkbox | `isPromo` |
| Precio promocional | Input numérico | Condicional si `isPromo` |
| Badge | Input texto | Opcional (ej. "NUEVO", "TOP") |
| Stock disponible | Input numérico | Opcional |
| Imagen | File input + preview | Upload a R2 |

#### Panel: Torres & Horarios (`TowersAdminPanel`)
| Elemento | Acción |
|----------|--------|
| Switch pausar/activar torre | Toggle `receiving_orders` en D1 |
| Input hora apertura | Configura `opening_time` |
| Input hora cierre | Configura `closing_time` |
| Chips de días (L, M, X, J, V, S, D) | Toggle `active_days[]` |
| Botón Guardar | Persiste cambios vía API |

#### Panel: Banners (`BannersAdminPanel`)
| Elemento | Acción |
|----------|--------|
| Botón "Nuevo Banner" | Crea banner con campos y live preview WYSIWYG |
| Botón Editar (por banner) | Abre formulario de edición |
| Botón Eliminar | Borra banner de D1 + asset de R2 |
| Botón Activar/Pausar | Toggle `active` |
| Drag & drop / flechas | Reordena banners |
| Live Preview | Previsualización en tiempo real |

#### Panel: Sorteos (`RafflesAdminPanel`)
| Elemento | Acción |
|----------|--------|
| Tabs: Participantes / Códigos / Ajustes | Conmuta sub-vistas |
| Tabla de participantes | Lista con tickets, referidos |
| Botón "Sortear Ganador" | Abre modal de ruleta con selección ponderada animada |
| Botón ajuste manual de tickets | Modifica conteo de tickets por participante |
| Códigos de referido | Lista de códigos activos |

#### Panel: Corte de Caja (`CashCutPanel`)
| Elemento | Acción |
|----------|--------|
| Botones de horizonte: Hoy / Ayer / 7 Días / Rango | Selecciona período de arqueo |
| Tabla de desglose por método | Transferencias / Efectivo / Totales |
| Botón "Exportar CSV" | Descarga archivo con detalle |
| Botón "Realizar Corte Z" | Abre modal de confirmación con input de nota → cierra turno |

#### Panel: Ingredientes (`IngredientsAdminPanel`)
| Elemento | Acción |
|----------|--------|
| Select de producto | Selecciona producto para ver/editar receta |
| Lista de insumos | Ingredientes vinculados con cantidades |
| Inputs numéricos (step=0.1) | Edita proporciones de recetas |
| Botón Crear insumo | Agrega ingrediente a la receta |
| Botón Guardar | Persiste cambios en D1 |

### 6.2 Inspección UX/UI

- ✅ Paleta Premium Casual aplicada consistentemente (`bg-surface-card`, `text-accent`, `bg-surface-raised`)
- ✅ Transiciones extensivas (`animate-in fade-in duration-300`, `transition-all`)
- ✅ Iconos SVG Lucide predominan (vía `admin-icons.utils.tsx`)
- 🔴 **Emojis en interactivos**: `RafflesAdminPanel` (🎲, 🎟️, 🥇), `ProductEditModal` (👁️)
- ✅ Sombras consistentes (`shadow-card`, `shadow-xs`)
- ✅ Cuadrícula 2 columnas adaptativa en móvil (`grid-cols-2 gap-2.5`)

### 6.3 Accesibilidad

| Criterio | Estado | Detalle |
|----------|:------:|---------|
| Focus Trap en modales | 🔴 | ProductEditModal, Banners, Ruleta, Corte Z: **sin focus trap**. Se puede tabular fuera del modal |
| Targets táctiles | 🟡 | 30+ botones con `h-8`/`h-9`/`h-10` (32-40px < 44px) |
| Foco visible | 🟡 | Inconsistente: algunos `focus-visible:ring-2`, otros `focus:ring-2` |
| Labels en formularios | ✅ | Labels persistentes con `<label className="block text-xs font-semibold...">` |
| ARIA en Command Palette | ✅ | Navegación por flechas, Enter, Escape |

### 6.4 Arquitectura

- ✅ TanStack Query excelente en `use-admin.ts`: query keys centralizadas, `staleTime` óptimo, invalidación selectiva
- 🟡 `useAdminPinnedFavorites` usa `localStorage.setItem/getItem` manual en lugar de Zustand + persist
- 🟡 `AdminHubGrid` y `AdminDashboardGrid` comparten 80% del código — candidatos a unificación
- 🟡 Varios `any` escapados: `catch (err: any)`, `value: any` en handlers de ProductEditModal

### 6.5 Hallazgos

| # | Sev. | Hallazgo | Archivo |
|---|:----:|----------|---------|
| A1 | 🔴 | Modales sin Focus Trap (ProductEdit, Banners, Ruleta, Corte Z) | Múltiples en `admin/` |
| A2 | 🟡 | 30+ botones con `h-8`/`h-9`/`h-10` < 44px | `MenuStockPanel`, `CashCutPanel`, etc. |
| A3 | 🟡 | Emojis en botones/tabs de `RafflesAdminPanel` y `ProductEditModal` | `RafflesAdminPanel.tsx`, `ProductEditModal.tsx` |
| A4 | 🟢 | `useAdminPinnedFavorites` con localStorage manual → migrar a Zustand + persist | `use-admin-pinned-favorites.ts` |
| A5 | 🟢 | `AdminHubGrid` y `AdminDashboardGrid` duplican 80% del código | `AdminHubGrid.tsx`, `AdminDashboardGrid.tsx` |

---

## 7. Recomendaciones Consolidadas

### 7.1 🔴 Hallazgos Críticos (9 total)

| # | Hallazgo | Impacto | Archivos Afectados | Recomendación |
|---|----------|---------|-------------------|---------------|
| C1 | **Bug de timezone**: `OperacionView` usa `new Date()` en vez de `getCdmxTodayString()` | Métricas incorrectas si el servidor/navegador no están en CDMX | `OperacionView.tsx` L48-51 | Reemplazar por `getCdmxTodayString()` de `@config` |
| C2 | **Targets táctiles < 44px** en TopHeader, OrderCard, OrdersFilterBar, BatchActionBar | Fricción masiva en entornos POS táctiles móviles | 6+ archivos | Aplicar `min-h-11 min-w-11` o padding invisible |
| C3 | **Focus Trap ausente** en popovers custom y modales de Admin | Usuarios de teclado/lectores de pantalla quedan atrapados o escapan | `OrdersFilterBar`, `PaymentPeriodSelector`, `PaymentsFilterBar`, modales Admin | Usar Radix Dialog/Popover o wrapper de focus trap |
| C4 | **KPIs de Pagos sin `onKeyDown`** | Inaccesibles por teclado — `role="button"` sin Enter/Space | `PaymentKpiHeader.tsx` | Agregar `onKeyDown` con handler Enter/Space |
| C5 | **`any` en TypeScript** en auth y API client | Pérdida de type safety, errores silenciosos | `auth.api.ts`, `api-client.ts` | Reemplazar por `unknown` + type guards |
| C6 | **Botón X búsqueda ~20px** en OrdersFilterBar | Target táctil 5x menor al mínimo WCAG | `OrdersFilterBar.tsx` | Envolver en botón con `min-h-11 min-w-11 p-2` |
| C7 | **Botones Copiar/WhatsApp ~14px** en OrderCard | Imposibles de tocar con precisión en móvil | `OrderCard.tsx` | Aumentar área clickeable con padding |
| C8 | **`focus-visible:outline-none`** en TabsContent | Suprime indicador de foco nativo | `ChekeoApp.tsx` | Agregar ring alternativo o quitar supresión |
| C9 | **Popovers sin Escape** en Pagos | No se pueden cerrar con teclado | `PaymentPeriodSelector.tsx`, `PaymentsFilterBar.tsx` | Agregar listener `onKeyDown` para Escape |

### 7.2 🟡 Hallazgos Importantes (12 total)

| # | Hallazgo | Recomendación |
|---|----------|---------------|
| I1 | Emojis en interactivos de Operación (💳, 👨‍🍳, 📦, 🎯) | Reemplazar por iconos Lucide SVG |
| I2 | Emojis en tabs de Cocina (🍔, 🍟, 📋) | Reemplazar por iconos Lucide SVG |
| I3 | Emojis en botones de período en Pagos (⚡, ⏱️, 📅) | Reemplazar por iconos Lucide SVG |
| I4 | Emojis en Sorteos Admin (🎲, 🎟️, 🥇) y ProductEdit (👁️) | Reemplazar por iconos Lucide SVG |
| I5 | Botón Eye en AuthGate con `tabIndex={-1}` | Quitar para hacerlo navegable |
| I6 | Error de PIN sin `aria-describedby` | Vincular mensaje con input |
| I7 | Presets de cancelación sin `role="radio"` | Usar radio group semántico |
| I8 | BatchActionBar con `h-9` (36px) | Aumentar a `min-h-11` |
| I9 | Scroll horizontal sin controles teclado | Agregar botones `<` `>` |
| I10 | 30+ botones Admin < 44px | Aplicar `min-h-11` |
| I11 | Foco visible inconsistente (`focus:` vs `focus-visible:`) | Estandarizar a `focus-visible:` |
| I12 | Chips de filtro en Resumen K < 44px | Aplicar `min-h-[44px]` |

### 7.3 🟢 Hallazgos Menores (5 total)

| # | Hallazgo | Recomendación |
|---|----------|---------------|
| M1 | Duplicación de ítems entre OrderCard y OrderDetailDrawer | Extraer a `OrderItemRow` reutilizable |
| M2 | `useAdminPinnedFavorites` con localStorage manual | Migrar a Zustand + persist |
| M3 | `AdminHubGrid` y `AdminDashboardGrid` duplican 80% | Unificar en un solo componente parametrizable |
| M4 | Prop deprecated `onFilterByPendingSpei` | Limpiar de `PaymentKpiHeader` |
| M5 | Strings mágicos para íconos en WhatsAppActionModal | Usar mapa tipado estático |

### 7.4 Roadmap de Mejoras Propuesto

| Prioridad | PR Propuesto | Alcance | Esfuerzo |
|:---------:|-------------|---------|:--------:|
| **P0** | Fix timezone en OperacionView | 1 archivo, 1 línea | ⚡ 5 min |
| **P1** | Fix targets táctiles ≥ 44px (toda la app) | 10+ archivos | 🔧 1-2h |
| **P2** | Focus trap en popovers custom + Escape | 3-4 archivos | 🔧 1-2h |
| **P3** | Reemplazar emojis por Lucide SVG en interactivos | 6+ archivos | 🔧 1h |
| **P4** | Fix KPIs Pagos: agregar `onKeyDown` | 1 archivo | ⚡ 15 min |
| **P5** | Estandarizar `focus-visible:` en toda la app | 8+ archivos | 🔧 1h |
| **P6** | Eliminar `any` en auth/API + type guards | 2-3 archivos | 🔧 30 min |
| **P7** | Extraer `OrderItemRow` compartido | 2-3 archivos | 🔧 30 min |
| **P8** | Unificar AdminHubGrid/AdminDashboardGrid | 2 archivos | 🔧 30 min |
| **P9** | Migrar favoritos a Zustand + persist | 1 archivo | 🔧 15 min |

---

## 8. Apéndice: Mapa Completo de Componentes (86 archivos)

### Árbol de Directorios

```
apps/internal-chekeo-v3/src/
├── main.tsx                              # Punto de entrada Vite + QueryClient
├── vite-env.d.ts                         # Tipos Vite
├── app/
│   └── ChekeoApp.tsx                     # Componente raíz con tabs
├── styles/
│   └── globals.css                       # Tokens Tailwind v4 Premium Casual
├── components/
│   ├── index.ts                          # Barrel export
│   ├── shell/
│   │   ├── AppShell.tsx                  # Layout: TopHeader + NavTabs + main
│   │   ├── TopHeader.tsx                 # Reloj CDMX, tema, logout
│   │   ├── NavTabs.tsx                   # 5 pestañas accesibles
│   │   └── index.ts
│   ├── views/
│   │   ├── OperacionView.tsx             # Dashboard semáforo (348 líneas)
│   │   ├── PedidosView.tsx               # Cola de pedidos (369 líneas)
│   │   ├── CocinaView.tsx                # KDS 3 estaciones (171 líneas)
│   │   ├── PagosView.tsx                 # Conciliación (282 líneas)
│   │   ├── AdminView.tsx                 # Auth gate + workspace (30 líneas)
│   │   └── index.ts
│   ├── shared/
│   │   ├── HorizontalDateCalendarFilter.tsx  # Riel 14 días CDMX
│   │   └── index.ts
│   ├── orders/
│   │   ├── OrderCard.tsx                 # Tarjeta de pedido
│   │   ├── OrdersList.tsx                # Grilla/lista adaptativa
│   │   ├── OrdersFilterBar.tsx           # Buscador + ribbon + filtros
│   │   ├── OrderDetailDrawer.tsx         # Drawer de detalle
│   │   ├── CancelOrderModal.tsx          # Modal cancelación segura
│   │   ├── BatchActionBar.tsx            # Acciones en lote flotante
│   │   ├── BatchConfirmModal.tsx         # Confirmación de lote
│   │   └── index.ts
│   ├── kitchen/
│   │   ├── KitchenActiveStation.tsx       # Comanda activa + cola
│   │   ├── KitchenDisplay.tsx             # Contenedor de estación
│   │   ├── KitchenTicketCard.tsx           # Comanda KDS alto contraste
│   │   ├── KitchenSummaryK.tsx            # Mise en place + restock
│   │   └── index.ts
│   ├── payments/
│   │   ├── PaymentCard.tsx                # Tarjeta de cobro
│   │   ├── PaymentsList.tsx               # Grilla de cobros
│   │   ├── PaymentKpiHeader.tsx           # 4 KPIs financieros
│   │   ├── PaymentPeriodSelector.tsx       # Selector período + calendario
│   │   ├── PaymentsFilterBar.tsx          # Buscador + filtros
│   │   ├── BankDetailsModal.tsx           # Datos BBVA
│   │   ├── OrderTicketModal.tsx           # Ticket térmico 80mm
│   │   ├── WhatsAppAction.tsx             # Bridge WhatsApp
│   │   ├── PaymentBatchActionBar.tsx      # Acciones lote pagos
│   │   ├── PaymentBatchConfirmModal.tsx   # Confirmación lote pagos
│   │   └── index.ts
│   └── admin/
│       ├── AdminAuthGate.tsx              # PIN exclusivo Admin
│       ├── AdminWorkspace.tsx             # Router Hub ↔ Workspace
│       ├── AdminHubGrid.tsx               # Hub 2 columnas + métricas
│       ├── AdminModuleWorkspace.tsx        # Maestro-detalle pantalla completa
│       ├── AdminBreadcrumbs.tsx           # Migas multinivel + Escape
│       ├── AdminQuickFavorites.tsx        # Favoritos fijables ⭐
│       ├── AdminSearchBar.tsx             # Command Palette ⌘K
│       ├── AdminDashboardGrid.tsx         # Grid de categorías
│       ├── AdminCategorySubmenu.tsx        # Submenú por categoría
│       ├── MenuStockPanel.tsx             # Catálogo + stock
│       ├── ProductEditModal.tsx           # CRUD de producto
│       ├── TowersAdminPanel.tsx           # Torres y horarios
│       ├── BannersAdminPanel.tsx          # Banners con live preview
│       ├── RafflesAdminPanel.tsx          # Sorteos + ruleta
│       ├── CashCutPanel.tsx               # Corte Z + CSV
│       ├── IngredientsAdminPanel.tsx       # Recetas e insumos
│       └── index.ts
└── features/
    ├── index.ts
    ├── shared/
    │   ├── api-client.ts                  # apiFetch + ApiError
    │   └── index.ts
    ├── auth/
    │   ├── api/auth.api.ts               # Login/logout endpoints
    │   ├── components/AuthGate.tsx        # Gate global de PIN
    │   ├── stores/auth.store.ts           # Zustand + persist
    │   └── index.ts
    ├── orders/
    │   ├── api/orders.api.ts             # CRUD órdenes D1
    │   ├── hooks/use-orders.ts           # TanStack Query + auto-refresh
    │   ├── types/orders.types.ts         # Normalización + formatters
    │   └── index.ts
    ├── kitchen/
    │   ├── api/kitchen.api.ts            # Summary K + item status
    │   ├── hooks/use-kitchen.ts          # KDS display + item tracking
    │   ├── types/kitchen.types.ts        # Production units + aggregates
    │   └── index.ts
    ├── payments/
    │   ├── hooks/use-payments.ts         # Conciliación financiera
    │   ├── types/payments.types.ts       # Financial summary + types
    │   ├── utils/payments.utils.ts       # Cálculos CDMX
    │   ├── utils/ticket.utils.ts         # Generador ticket 80mm
    │   ├── utils/whatsapp.utils.ts       # WhatsApp bridge
    │   └── index.ts
    └── admin/
        ├── api/admin.api.ts              # Endpoints admin Hono
        ├── constants/admin-navigation.constants.ts  # 6 categorías + search index
        ├── hooks/use-admin.ts            # TanStack Query admin
        ├── hooks/use-admin-pinned-favorites.ts  # localStorage favoritos
        ├── types/admin.types.ts          # Tipos admin
        ├── utils/admin-icons.utils.tsx   # Iconos Lucide dinámicos
        └── index.ts
```

---

> **Fin de la auditoría** — Documento generado el 2026-08-27 por auditoría automatizada con 3 subagentes en paralelo + inspección de código fuente.
> **Próximo paso**: El usuario revisa los hallazgos y aprueba el roadmap de PRs correctivos.

# 03 — Phase Log

## 2026-04-27 — Ajuste documental solicitado en PR #34 (Fase 0)

### Estado
✅ Completado.

### Cambios realizados
- Se normalizó la documentación base para usar exactamente:
  - `planning/00-project-rules.md`
  - `planning/01-roadmap.md`
  - `planning/02-data-contract.md`
  - `planning/03-phase-log.md`
- Se actualizó `README.md` con stack permitido, estado de reconstrucción, regla de `legacy/`, flujo por fases y restricción de no usar servicios externos.
- Se completó el contenido documental requerido de Fase 0 según comentarios de revisión del PR #34.

### Alcance respetado
- Sin funcionalidad nueva.
- Sin backend nuevo.
- Sin UI nueva.
- Sin cambios en Google Sheets.

### Nota
Este ajuste corresponde exclusivamente a documentación de Fase 0 previa a merge.

---

## 2026-04-27 — Cierre Fase 1 (Contrato de datos y hojas)

### Estado final
✅ Cerrada.

### Qué se hizo
- Se consolidó el resumen del contrato definitivo en `planning/02-data-contract.md`.
- Se documentó en detalle `planning/04-phase-1-data-contract.md`:
  - Propósito de cada hoja del sistema.
  - Matriz campo a campo de `Chekeo Nuevo` con tipo, origen, edición, preservación y visibilidad en ticket/WhatsApp.
  - Regla de ID con mínimo 3 dígitos y crecimiento variable.
  - Definición de campos provenientes de `Pedidos Master`.
  - Definición de campos editables por la futura app.
  - Definición de campos preservados en sincronización.
  - Definición de campos refrescables desde `Pedidos Master`.
  - Regla para pedidos especiales (`(+1)`, `Chequeo Manual`, ambigüedad) marcando `Alerta ⚠️` sin bloqueo.
  - Reglas de contenido para ticket cliente y WhatsApp.
  - Validaciones esperadas.
  - Criterios de cierre de Fase 1.

### Qué no se hizo
- No se implementó backend.
- No se implementó UI.
- No se modificó Google Sheets.
- No se crearon archivos `.gs`.
- No se crearon archivos `.html`.

### Archivos modificados
- `planning/02-data-contract.md`
- `planning/03-phase-log.md`
- `planning/04-phase-1-data-contract.md`

### Restricciones respetadas
- Sin cambios en `README.md`.
- Sin cambios en `legacy/`.
- Sin cambios en `planning/00-project-rules.md`.
- Sin cambios en `planning/01-roadmap.md`.
- Sin reutilizar rama vieja `codex/move-implementation-to-legacy-directory`.
- Sin reabrir PR #35.

### Siguiente fase recomendada
➡️ Fase 2 — Backend Apps Script base.

---

## 2026-04-27 — Implementación base de Fase 2 (Backend Apps Script)

### Estado
🟡 Implementación inicial (posteriormente ajustada por revisión en PR #38).

### Qué se implementó
- Base de proyecto Apps Script (`appsscript.json`) con runtime V8 y configuración de Web App.
- Núcleo backend en `.gs` (sin UI/HTML):
  - `Code.gs` con endpoints base `doGet`, `apiHealth` y `apiSyncChekeoNuevo`.
  - `backend_constants.gs` con contrato de hojas, columnas oficiales de `Chekeo Nuevo`, catálogos y defaults.
  - `backend_utils.gs` con utilidades de ID `BOG-###`, serialización fila↔objeto y normalización.
  - `backend_validation.gs` con validaciones de contrato (enums, formato ID, alerta, total y regla de ticket enviado).
  - `backend_sync_service.gs` con sincronización `Pedidos Master` → `Chekeo Nuevo` preservando campos operativos definidos en Fase 1.

### Reglas de Fase 2 respetadas
- Sin UI nueva.
- Sin archivos `.html` nuevos.
- Sin cambios en `legacy/`.
- Sin servicios ni librerías externas.
- Sin migración a Chekeo oficial.
- `Chekeo Nuevo` definido como hoja activa objetivo de operación.

### Notas
- La sincronización valida encabezados contra el contrato y falla de forma explícita si no coincide.
- Se marca `Alerta = ⚠️` cuando se detectan señales especiales (`(+1)` / `Chequeo Manual`) sin bloquear el flujo.

---

## 2026-04-27 — Ajustes de Fase 2 sobre PR #38 (backend)

### Estado
🟡 En ajuste de revisión (no marcado como cierre final de fase en esta entrada).

### Correcciones aplicadas
- Se implementaron wrappers públicos requeridos en `Code.gs`:
  - `healthCheck`, `validateSheetsSetup`, `syncOrdersFromMaster`, `getAppOrders`, `getOrderDetail`, `updateOrderStatus`, `markOrderPaid`, `updateOrderNotes`, `markTicketSent`, `getDailySummary`, `getBankConfig`.
- Se estandarizó envelope seguro en todas las funciones públicas (`ok/data/message` y `ok/error`).
- Se agregó `LockService` para operaciones de escritura en wrappers públicos.
- Se corrigió timezone de `appsscript.json` a `America/Mexico_City`.
- Se completaron constantes de contrato de hojas (`Pedidos Master`, `Chekeo Nuevo`, `Chekeo`, `Configuración`, `Resumen Pedidos`, `Historico`).
- Se migró lectura por encabezados normalizados con validación de columnas obligatorias y errores claros.
- Se reforzó sincronización para omitir filas vacías en `Pedidos Master`, evitar pedidos fantasma, preservar `ID Pedido`/`Fila Master` existentes y mantener `Alerta` como vacío/`⚠️` sin bloqueo.
- Se implementó normalización de dinero compatible con formatos MX/es.
- Se implementaron servicios faltantes de configuración bancaria, resumen diario y operaciones de pedidos.

### Restricciones respetadas
- Sin UI.
- Sin HTML.
- Sin cambios en `legacy/`.
- Sin tocar Google Sheets directamente fuera del código Apps Script.
- Sin migración a Chekeo oficial.

---

## 2026-04-27 — Refuerzo Fase 2 para Pedidos Master real y crecimiento dinámico

### Estado
🟡 En ajuste de revisión.

### Cambios backend aplicados
- Compatibilidad con estructura real de `Pedidos Master` leyendo por encabezados normalizados y sin exigir columnas destino (`Fecha Pedido`, `Hora Pedido`, `Resumen Pedido`, `Hamburguesas`, `Extras`, `Guarniciones`) como fuente.
- Transformador flexible `Pedidos Master` → `Chekeo Nuevo`:
  - Fecha/Hora desde `Marca temporal`.
  - Teléfono desde `Telefono` o `Teléfono`.
  - Total desde `Total` con fallback a `Precio Manual total` cuando corresponde.
  - Estado Pedido/Pago/Método Pago normalizados con reglas de negocio.
- Detección dinámica por patrones para crecimiento futuro:
  - Hamburguesas con `¿Cuantas? [NOMBRE]`.
  - Extras con `Extras [NOMBRE]`.
  - Guarniciones con `Date un extra [NOMBRE]`.
- Resumen compacto generado dinámicamente a partir de hamburguesas, extras y guarniciones detectadas.
- Alertas (`⚠️`) reforzadas para casos ambiguos, `(+1)`, chequeo manual y descripciones libres no asociables.
- Escritura en `Chekeo Nuevo` corregida por encabezados (`headerMap`), independiente del orden físico de columnas.
- `LockService` endurecido con bandera `lockAcquired` para liberar lock solo cuando fue tomado.

### Restricciones mantenidas
- Sin UI/HTML.
- Sin cambios en `legacy/`.
- Sin servicios externos ni librerías externas.
- Sin migración a `Chekeo` oficial; hoja activa se mantiene en `Chekeo Nuevo`.

---

## 2026-04-27 — Ajuste final Fase 2 previo a merge PR #38

### Estado
🟡 En revisión final.

### Correcciones realizadas
- Sync ahora detecta pedidos existentes por `Fila Master` **o** por `ID Pedido` esperado (`BOG-###`) para evitar duplicados cuando falta referencia de fila pero ya existe el ID.
- Se optimizó la escritura de sync para actualizar filas existentes con `setValues([row])` por fila completa (mapeada por encabezados actuales), evitando parcheo celda por celda en la sincronización masiva.
- Se ajustó formato visible de cantidades:
  - Hamburguesas: siempre `1x`, `2x`, etc.
  - Guarniciones: siempre `1x`, `2x`, etc.
  - Extras: nombre simple para 1; `Nx` para cantidades mayores.
- Se añadió alerta explícita cuando `Total` está vacío/manual y `Precio Manual total` también está vacío:
  - se usa `Total = 0` para no bloquear,
  - se marca `⚠️`,
  - se registra razón interna `total faltante o manual sin precio`.

### Reglas mantenidas
- Lectura flexible por encabezados de `Pedidos Master`.
- Detección dinámica de hamburguesas/extras/guarniciones para crecimiento futuro.
- `Chekeo Nuevo` como hoja activa.
- `Ticket Enviado` con catálogo `Si/No`.
- `Alerta` solo vacío/`⚠️`.
- `LockService` seguro con `lockAcquired`.

---

## 2026-04-27 — Correcciones adicionales de Fase 2 (PR #38)

### Estado
🟡 En revisión final.

### Ajustes aplicados
- Se aseguraron/normalizaron los helpers de formato de cantidades usados en sync:
  - `bogFormatBurgerOrSideWithCount_`
  - `bogFormatExtraWithCount_`
- Se corrigió el manejo de total manual/faltante sin precio manual para no romper la sync:
  - `Total = 0`
  - `Alerta = ⚠️`
  - razón interna `total faltante o manual sin precio`
  - sin bloqueo de pedido.
- Se endureció `getBankConfig()` para validar estrictamente los 3 campos requeridos (`Banco`, `Nombre`, `Número de cuenta`) tanto en formato `Campo | Valor` como en formato por columnas.
- Se mejoró la normalización de `Estado Pedido` mapeando alias de preparación (`En preparacion`, `En preparación`, `Preparacion`, `Preparación`) al catálogo final `Preparando`.

---

## 2026-04-27 — Implementación Fase 3 (Web App shell móvil) [SUPERSEDED]

### Estado
⚪ Entrada histórica reemplazada por la corrección final de Fase 3 en PR #40.

### Nota de consistencia
- El resultado vigente de Fase 3 **no** usa `webapp_*` ni tab `Cocina`.
- La implementación aprobada usa `Index.html`, `styles.html`, `scripts.html` e `include(filename)`.
- Tabs vigentes: `Inicio`, `Pedidos`, `Resumen`, `Ajustes`.
- Sin ticket cliente, sin WhatsApp y sin cambios en `legacy/`.

---

## 2026-04-27 — Corrección final Fase 3 (PR #40)

### Estado final
✅ Fase 3 completada.

### Correcciones aplicadas
- Se estandarizaron archivos HTML a:
  - `Index.html`
  - `styles.html`
  - `scripts.html`
- Se eliminaron los archivos temporales de nomenclatura inicial de Fase 3 para evitar duplicidad de entrada HTML.
- `doGet()` quedó configurado con `HtmlService.createTemplateFromFile('Index')`.
- Se expuso helper público `include(filename)` para parciales HTML.
- Tabs visibles finales en app shell:
  - `Inicio`
  - `Pedidos`
  - `Resumen`
  - `Ajustes`
- `scripts.html` implementa funciones cliente requeridas e inicialización con:
  - `healthCheck()`
  - `getDailySummary()`
  - `getAppOrders()`
  - `getBankConfig()`
- Botón `Sincronizar` ejecuta `syncOrdersFromMaster()` y refresca resumen/pedidos.
- `Pedidos` quedó en solo lectura (sin edición operativa).
- `Resumen` muestra montos y conteos por estado.
- `Ajustes` muestra estado backend, estado de config bancaria, hoja activa `Chekeo Nuevo` y nota de no uso de `Chekeo` oficial.

### Archivos modificados
- `Code.gs`
- `Index.html`
- `styles.html`
- `scripts.html`
- `planning/06-phase-3-webapp-shell.md`
- `planning/03-phase-log.md`

### Confirmación de alcance
- No se implementaron funcionalidades operativas de Fase 4.
- No se implementó ticket cliente.
- No se implementó WhatsApp.
- No se tocó `legacy/`.
- No se migró a `Chekeo` oficial.

### Siguiente fase recomendada
➡️ Fase 4 — Pedidos (operación).

---

## 2026-04-27 — Implementación Fase 4 (Pedidos + Cocina)

### Estado
🟡 Parcial (ajuste requerido en PR #42).

### Cambios backend
- `healthCheck()` actualizado para reportar `phase: 4` y servicio `Burger-OG Pedidos + Cocina`.
- Nuevo endpoint público `updateOrderOperationalData(orderId, payload)` para guardar en una sola operación:
  - estado pedido
  - estado/método de pago
  - notas interna/cliente
  - `Última Actualización`
  - `Hora Inicio` al pasar a `Preparando` (si estaba vacía)
  - `Hora Listo` al pasar a `Listo` (si estaba vacía)
- Se mantiene compatibilidad con endpoints previos (`updateOrderStatus`, `updateOrderPayment`, `markOrderPaid`, `updateOrderNotes`).

### Cambios frontend (mobile-first)
- Header actualizado a `Fase 4 — Pedidos + Cocina`.
- Tabs finales de fase:
  - `Inicio`
  - `Pedidos`
  - `Cocina`
  - `Resumen`
  - `Ajustes`
- `Pedidos` ahora permite edición operativa por tarjeta:
  - `Estado Pedido`, `Estado Pago`, `Método Pago`, `Nota Interna`, `Nota Cliente`.
  - Acciones: `Guardar pedido` y `Marcar pagado`.
- `Cocina` ahora muestra pedidos no `Listo` con acciones rápidas:
  - `Confirmar`
  - `Preparando`
  - `Listo`
- Cada operación refresca automáticamente pedidos + resumen.

### Restricciones respetadas
- Sin ticket cliente.
- Sin WhatsApp.
- Sin migración a `Chekeo` oficial.
- `Chekeo Nuevo` se mantiene como hoja activa.
- Sin cambios en `legacy/`.
- Sin librerías externas ni CDN/frameworks.


---

## 2026-04-27 — Correcciones Fase 4 solicitadas en issue #41 (PR #42)

### Estado final
✅ Fase 4 completada tras correcciones obligatorias.

### Correcciones aplicadas
- Se implementaron filtros/chips mobile-first en `Pedidos` usando `APP_STATE.orders` en memoria (sin llamada backend por filtro): `Todos`, `Nuevo`, `Confirmado`, `Preparando`, `Listo`, `Pendiente pago`, `Con alerta`.
- Se implementó modal/drawer de detalle de pedido con cierre explícito y campos completos de lectura:
  - `ID Pedido`, `Nombre`, `Resumen Pedido`, `Hamburguesas`, `Extras`, `Guarniciones`, `Total`, `Estado Pedido`, `Estado Pago`, `Método Pago`, `Nota Interna`, `Nota Cliente`, `Alerta`.
- La edición operativa se movió al detalle/modal para mantener tarjetas compactas:
  - `Estado Pedido`, `Estado Pago`, `Método Pago`, `Nota Interna`, `Nota Cliente`.
  - Acciones: `Guardar pedido` y `Marcar pagado`.
- Se corrigió visibilidad de botón `Marcar pagado` para mostrarlo solo cuando `Estado Pago != Pagado`.
- `Inicio` ahora muestra resumen rápido: pedidos activos, pedidos listos, pedidos pendientes de pago y total pendiente.
- `Resumen` ahora incluye conteo `Con alerta` calculado desde pedidos cargados.
- `Ajustes` incluye la nota exacta requerida: `Fase de prueba: no usa Chekeo oficial`.

### Confirmaciones de alcance
- Sin ticket cliente.
- Sin WhatsApp.
- Sin migración a `Chekeo` oficial.
- `Chekeo Nuevo` se mantiene como hoja activa.
- Sin cambios en `legacy/`.
- Sin librerías externas, CDN o frameworks.

---

## 2026-04-27 — Ajuste final PR #42: loading de escrituras

### Estado
✅ Corrección aplicada.

### Ajuste realizado
- Se implementó bloqueo `loading.write` en frontend para evitar doble ejecución de escrituras en:
  - `Guardar pedido`
  - `Marcar pagado`
  - `Confirmar`
  - `Preparando`
  - `Listo`
- Mientras hay escritura activa:
  - no se inicia otra escritura,
  - botones de acción de escritura quedan deshabilitados,
  - se muestra feedback de estado (`Guardando...` / `Actualizando...`).
- Al terminar la operación (éxito o error) se libera `loading.write`.
- `sync` se mantiene compatible y no inicia durante `loading.write`.

### Alcance mantenido
- Sin ticket cliente.
- Sin WhatsApp.
- Sin migración a `Chekeo` oficial.
- Sin cambios en `legacy/`.

---

## 2026-04-28 — Implementación Fase 5 (Ticket cliente + WhatsApp)

### Estado
✅ Fase 5 completada.

### Cambios aplicados
- Se actualizó `healthCheck()` para reportar Fase 5 y servicio de ticket/WhatsApp.
- En UI se actualizó el encabezado y alcance visible a Fase 5.
- En detalle de pedido se añadió bloque de Ticket cliente con:
  - Render de ticket en `canvas` propio.
  - Descarga de ticket en PNG (sin librerías externas).
  - Campos incluidos restringidos al contrato de Fase 1 (`ID Pedido`, `Nombre`, `Resumen Pedido`, `Hamburguesas`, `Extras`, `Guarniciones`, `Nota Cliente` opcional y `Total`).
- Se añadió flujo de WhatsApp por enlace `wa.me` con mensaje precargado:
  - Incluye saludo, total y datos bancarios (`Banco`, `Nombre`, `Número de cuenta`).
  - No incluye resumen completo del pedido.
  - No intenta enviar mensaje automáticamente ni adjuntar imagen automáticamente.
- Se añadió acción manual para `markTicketSent()` desde detalle de pedido.

### Restricciones respetadas
- Sin `html2canvas`.
- Sin CDN/frameworks/librerías externas.
- Sin cambios en `legacy/`.
- Sin migración a hoja `Chekeo` oficial.
- Hoja activa mantenida en `Chekeo Nuevo`.

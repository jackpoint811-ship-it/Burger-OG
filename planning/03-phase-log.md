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

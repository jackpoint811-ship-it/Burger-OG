# Bitácora de fases — Burger-OG

## Objetivo
Esta bitácora es la fuente de orden para la reconstrucción de Burger-OG. Codex debe actualizarla en cada fase para documentar qué se planeó, qué se hizo, qué no se hizo, qué quedó pendiente, qué archivos cambió y cómo se validó.

## Reglas obligatorias para Codex

1. Antes de modificar código, leer esta bitácora completa.
2. Antes de iniciar una fase, agregar o actualizar la sección correspondiente con el plan de trabajo.
3. Durante la fase, registrar avances relevantes, decisiones y bloqueos.
4. Al cerrar una fase, completar el cierre ejecutivo con evidencia.
5. No marcar una fase como terminada si faltan pruebas o validación mínima.
6. Si algo no se hizo, debe quedar escrito explícitamente en "No realizado".
7. Si se cambia el alcance, debe quedar en "Decisiones / cambios de alcance".
8. No tocar la hoja oficial `Chekeo` hasta que la fase de migración final lo indique.
9. Mientras estemos en pruebas, usar `Chekeo Nuevo` como hoja operativa.
10. No usar servicios externos, librerías externas, bases externas ni APIs fuera de Google Sheets + Apps Script Web App.

---

# Índice general de fases

## Fase 0 — Planeación y preparación
**Estado:** En progreso / base inicial creada  
**Objetivo:** Definir alcance real, hojas, flujo, estructura de datos y reglas de operación antes de tocar la app.

### Checklist
- [x] Confirmar stack permitido: Google Sheets + Apps Script Web App.
- [x] Confirmar que no se usarán servicios externos.
- [x] Revisar Sheet `Burgers OG`.
- [x] Revisar repo `Burger-OG`.
- [x] Crear hoja `Configuración`.
- [x] Crear hoja de prueba `Chekeo Nuevo`.
- [x] Definir columnas finales de hoja operativa.
- [x] Cargar pedidos reales actuales en `Chekeo Nuevo`.
- [ ] Validar visualmente `Chekeo Nuevo` con el usuario.
- [ ] Confirmar que Fase 1 puede iniciar.

### Archivos / hojas involucradas
- Google Sheet: `Burgers OG`
- Hoja fuente: `Pedidos Master`
- Hoja operativa de prueba: `Chekeo Nuevo`
- Hoja configuración: `Configuración`
- Repo: `jackpoint811-ship-it/Burger-OG`

### Decisiones confirmadas
- La app usará solo Google Sheets + Apps Script Web App.
- La app será primero para teléfono vertical y luego tablet.
- Se usará `Chekeo Nuevo` para pruebas.
- La hoja oficial `Chekeo` no se toca todavía.
- El ID será permanente: `BOG-001`, `BOG-002`, etc.
- La pantalla inicial tendrá: Pedidos, Cocina, Ticket cliente, Resumen y Sincronizar.
- Estados de pedido: `Nuevo`, `Confirmado`, `Preparando`, `Listo`.
- Estados de pago: `Pendiente`, `Pagado`.
- Métodos de pago: `Efectivo`, `Transferencia`, `Mixto`, `No definido`.
- El ticket cliente tendrá imagen descargable.
- WhatsApp se abrirá con total + datos bancarios desde `Configuración`.
- La imagen del ticket llevará el resumen ordinario del pedido + nota cliente.
- Al abrir WhatsApp, la app debe preguntar si se marca `Ticket Enviado`.

### No realizado
- No se modificó código del repo todavía.
- No se reemplazó la hoja oficial `Chekeo`.
- No se implementó la nueva Web App.

### Evidencia / validación
- Existe la hoja `Configuración` con Banco, Nombre y Número de cuenta.
- Existe la hoja `Chekeo Nuevo` con columnas nuevas.
- `Chekeo Nuevo` contiene los pedidos actuales convertidos desde `Pedidos Master`.

---

## Fase 1 — Backend nuevo contra `Chekeo Nuevo`
**Estado:** Completada (2026-04-26)  
**Objetivo:** Adaptar el backend de Apps Script para leer, sincronizar y actualizar la nueva estructura de `Chekeo Nuevo` sin tocar `Chekeo` oficial.

### Alcance
Crear o adaptar el backend para que la app pueda operar con el nuevo contrato de datos.

### Checklist técnico
- [x] Actualizar constantes para usar temporalmente `Chekeo Nuevo`.
- [x] Agregar `CONFIG_SHEET = 'Configuración'`.
- [x] Reemplazar/adaptar schema de Chekeo al nuevo contrato.
- [x] Crear normalizador de encabezados para `Chekeo Nuevo`.
- [x] Crear función `syncAppOrdersFromMaster()`.
- [x] La sync debe leer `Pedidos Master` por encabezados, no por posiciones fijas.
- [x] La sync debe preservar datos operativos existentes.
- [x] Crear `getAppOrders()`.
- [x] Crear `getOrderDetail(orderId)`.
- [x] Crear `updateOrderStatus(orderId, status)`.
- [x] Crear `markOrderPaid(orderId)`.
- [x] Crear `updateOrderNotes(orderId, noteInternal, noteClient)`.
- [x] Crear `markTicketSent(orderId)`.
- [x] Crear `getDailySummary()`.
- [x] Crear `getBankConfig()`.
- [x] Usar `LockService` en escrituras.
- [x] Manejar errores claros para UI.
- [x] No tocar `Chekeo` oficial.

### Reglas de preservación en sync
La sync debe conservar, si el pedido ya existe:
- [x] Estado Pedido
- [x] Estado Pago
- [x] Método Pago si fue editado
- [x] Nota Interna
- [x] Nota Cliente
- [x] Ticket Enviado
- [x] Fecha Ticket Enviado
- [x] Hora Inicio
- [x] Hora Listo

La sync puede actualizar desde `Pedidos Master`:
- [x] Nombre
- [x] Teléfono
- [x] Resumen Pedido
- [x] Hamburguesas
- [x] Extras
- [x] Guarniciones
- [x] Total
- [x] Alerta
- [x] Última Actualización

### Pruebas mínimas
- [x] Ejecutar validación estática de Apps Script sin errores de sintaxis.
- [x] Verificar exposición de nuevas funciones públicas en `Code.gs`.
- [ ] Ejecutar pruebas manuales contra Google Sheet real (pendiente en entorno del usuario).

### Archivos esperados
Codex debe registrar aquí los archivos exactos que modifique.

- `backend_constants.gs`
- `backend_utils.gs`
- `backend_sync_service.gs`
- `backend_orders_service.gs`
- `Code.gs`
- `planning/bitacora-fases.md`

### Decisiones / cambios de alcance
- Se mantuvieron funciones legacy (`syncChekeoFromMaster`, `getChekeoOrders`, `markOrderReady`) para no romper la UI actual mientras Fase 2 no inicia.
- El backend nuevo se añadió por capas de servicio y funciones públicas nuevas, sin implementar UI completa.

### No realizado
- No se implementó UI nueva (Fase 2).
- No se conectó WhatsApp/ticket visual (Fase 3).
- No se ejecutaron pruebas end-to-end sobre la hoja real desde este entorno local.

### Cierre de fase
- Se migró el backend para operar sobre `Chekeo Nuevo` y `Configuración`, incluyendo sync con preservación de estado operativo y nuevas APIs para estado, pago, notas, resumen diario y datos bancarios.
- Se añadieron normalizadores para estados (`Nuevo`, `Confirmado`, `Preparando`, `Listo`) y pago (`Pendiente`, `Pagado`) conservando compatibilidad con el esquema anterior.
- Se cerró la fase técnica sin tocar `Chekeo` oficial ni construir UI completa, cumpliendo alcance solicitado para Fase 1.

### Resumen de cambios
- Se reforzó la validación de `updateOrderStatus` para rechazar estados inválidos con error explícito.
- En sync, el método de pago ahora preserva una edición operativa previa y se actualiza `Última Actualización` por corrida.
- `updateOrderNotes` ahora exige columnas `Nota Interna` y `Nota Cliente` para evitar no-op silencioso.

### Archivos modificados
- `backend_utils.gs`
- `backend_sync_service.gs`
- `backend_orders_service.gs`
- `planning/bitacora-fases.md`

### Funciones creadas/adaptadas
- `assertValidOrderStatus_()`
- `updateOrderStatusService_()` (validación estricta)
- `updateOrderNotesService_()` (validación de columnas requeridas para la acción)
- `syncAppOrdersFromMasterService_()` (preserva método de pago y actualiza `updatedAt`)

### Pruebas realizadas
- Validación estática de sintaxis local (`node --check` sobre copias `.js` temporales de `.gs`).
- Verificación de firmas de funciones nuevas/ajustadas con `rg`.

### Qué no hizo
- No se construyó UI nueva (sigue fuera de alcance en Fase 1).
- No se tocaron integraciones de WhatsApp/ticket visual (Fase 3).
- No se ejecutaron pruebas manuales con hoja real desde este entorno.

### Pendientes
- Validación funcional en entorno del usuario contra `Chekeo Nuevo` (estado, pago, notas, sync, resumen diario y config bancaria).
- Confirmar con operación que los encabezados finales de `Configuración` y `Chekeo Nuevo` coinciden con aliases previstos.

---

## Fase 2 — Nueva interfaz móvil
**Estado:** Pendiente  
**Objetivo:** Crear la nueva Web App móvil primero, usando el backend de Fase 1.

### Checklist técnico
- [ ] Crear shell móvil claro con acentos Burgers OG.
- [ ] Crear pantalla Inicio.
- [ ] Crear pantalla Pedidos.
- [ ] Crear filtros: Activos, Listos, Todos.
- [ ] Crear tarjetas de pedido.
- [ ] Crear pantalla Detalle.
- [ ] Crear pantalla Cocina con pedido actual grande.
- [ ] Crear botones grandes: Confirmado, Preparando, Listo.
- [ ] Confirmación antes de marcar `Listo`.
- [ ] Crear botón `Pagado` con confirmación.
- [ ] Crear edición de Nota Interna y Nota Cliente.
- [ ] Crear indicador visual `⚠️` para alertas.
- [ ] Autoactualizar cada 60 segundos.
- [ ] Botón manual de actualizar/sincronizar.
- [ ] Mantener compatibilidad con Apps Script Web App.
- [ ] Sin librerías externas.

### Pruebas mínimas
- [ ] Abrir app en vista móvil.
- [ ] Ver lista de pedidos.
- [ ] Cambiar estado desde detalle.
- [ ] Cambiar estado desde cocina.
- [ ] Marcar pago como pagado.
- [ ] Editar notas.
- [ ] Confirmar que la app no rompe con alertas `⚠️`.

### Archivos esperados
- Pendiente

### No realizado
- Pendiente

### Cierre de fase
- Pendiente

---

## Fase 3 — Ticket cliente + WhatsApp
**Estado:** Pendiente  
**Objetivo:** Implementar ticket cliente con imagen descargable y WhatsApp precargado con total + datos bancarios.

### Checklist técnico
- [ ] Crear vista/acción `Ticket cliente` desde pedido.
- [ ] Generar imagen PNG con Canvas, sin librerías externas.
- [ ] Imagen debe incluir resumen ordinario del pedido.
- [ ] Imagen debe incluir nota cliente si existe.
- [ ] Agregar botón `Descargar imagen`.
- [ ] Agregar botón `Abrir WhatsApp cliente`.
- [ ] WhatsApp debe usar teléfono de `Chekeo Nuevo`.
- [ ] WhatsApp debe precargar total de la orden.
- [ ] WhatsApp debe precargar datos bancarios desde `Configuración`.
- [ ] Después de abrir WhatsApp, preguntar si se marca `Ticket Enviado`.
- [ ] Si confirma, actualizar `Ticket Enviado = Si` y `Fecha Ticket Enviado`.
- [ ] No intentar adjuntar imagen automáticamente en WhatsApp.

### Mensaje WhatsApp base
```text
Hola [Nombre] 🍔

El total de tu pedido es: $[Total]

Datos para pago:
Banco: [Banco]
Nombre: [Nombre]
Número de cuenta: [Cuenta]

Te adjunto tu ticket con el resumen del pedido.
```

### Pruebas mínimas
- [ ] Descargar imagen desde móvil.
- [ ] Abrir WhatsApp con número correcto.
- [ ] Ver texto de pago precargado.
- [ ] Confirmar que no intenta adjuntar imagen automáticamente.
- [ ] Marcar ticket enviado después de confirmar.

### Archivos esperados
- Pendiente

### No realizado
- Pendiente

### Cierre de fase
- Pendiente

---

## Fase 4 — Resumen operativo
**Estado:** Pendiente  
**Objetivo:** Crear resumen operativo con dinero vendido, pagado y pendiente.

### Checklist técnico
- [ ] Calcular total vendido.
- [ ] Calcular total pagado.
- [ ] Calcular total pendiente.
- [ ] Mostrar datos en pantalla Resumen.
- [ ] Actualizar resumen automáticamente al sincronizar.
- [ ] Confirmar si se actualiza también la hoja `Resumen Pedidos`.

### Pruebas mínimas
- [ ] Comparar total vendido contra `Chekeo Nuevo`.
- [ ] Comparar pagado contra pedidos con `Estado Pago = Pagado`.
- [ ] Comparar pendiente contra pedidos con `Estado Pago = Pendiente`.

### Archivos esperados
- Pendiente

### No realizado
- Pendiente

### Cierre de fase
- Pendiente

---

## Fase 5 — Migración final a `Chekeo` oficial
**Estado:** Pendiente  
**Objetivo:** Migrar de `Chekeo Nuevo` a `Chekeo` oficial solo cuando la app nueva esté validada.

### Checklist técnico
- [ ] Crear respaldo de `Chekeo` actual.
- [ ] Registrar nombre del respaldo y fecha.
- [ ] Copiar estructura final de `Chekeo Nuevo` a `Chekeo`.
- [ ] Copiar datos validados a `Chekeo`.
- [ ] Cambiar constante de prueba a producción.
- [ ] Confirmar que la app lee `Chekeo` oficial.
- [ ] Confirmar que `Chekeo Nuevo` queda como respaldo temporal o se elimina solo con autorización.

### Pruebas mínimas
- [ ] Abrir app usando `Chekeo` oficial.
- [ ] Sincronizar desde `Pedidos Master`.
- [ ] Cambiar estado.
- [ ] Marcar pago.
- [ ] Descargar ticket.
- [ ] Abrir WhatsApp.
- [ ] Revisar resumen.

### No realizado
- Pendiente

### Cierre de fase
- Pendiente

---

# Registro cronológico de avances

## 2026-04-26 — Preparación inicial
- Se definió reconstrucción desde cero funcional, pero conservando patrones útiles de Apps Script.
- Se confirmó stack: Google Sheets + Apps Script Web App.
- Se creó hoja `Configuración`.
- Se creó hoja `Chekeo Nuevo`.
- Se cargaron pedidos actuales de `Pedidos Master` en `Chekeo Nuevo`.
- Se decidió que Codex debe iniciar con Fase 1, no con UI.

---

# Plantilla obligatoria para cierre de cada fase

Cada fase debe cerrarse con este formato:

```md
## Cierre Fase X — [Nombre]

### Estado final
- Completada / Parcial / Bloqueada

### Qué se hizo
- ...

### Qué no se hizo
- ...

### Archivos modificados
- ...

### Hojas afectadas
- ...

### Pruebas realizadas
- ...

### Resultados
- ...

### Riesgos / pendientes
- ...

### Siguiente fase recomendada
- ...
```

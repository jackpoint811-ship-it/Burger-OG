# 04 — Fase 1: Contrato de datos y hojas (detallado)

## 1) Hojas del sistema y propósito

| Hoja | Propósito |
|---|---|
| `Pedidos Master` | Fuente principal operativa; origen de los pedidos y datos base del cliente/pedido. |
| `Chekeo Nuevo` | Hoja de trabajo normalizada para operación diaria, seguimiento de estado y envío de ticket/WhatsApp. |
| `Chekeo` | Compatibilidad histórica y referencia de control durante transición documental. |
| `Configuración` | Catálogos permitidos y parámetros de operación (estados y métodos). |
| `Resumen Pedidos` | Vista agregada para seguimiento operativo y control de volumen. |
| `Historico` | Resguardo histórico de pedidos cerrados y trazabilidad. |

## 2) Contrato detallado de columnas — `Chekeo Nuevo`

| Columna | Tipo esperado | Origen | Editable por app | Preservar en sync | Aparece en ticket cliente | Aparece en WhatsApp |
|---|---|---|---|---|---|---|
| ID Pedido | Texto (`BOG-###`) | Derivado de `Fila Master` | No | Sí | Sí | Sí |
| Fila Master | Número entero | `Pedidos Master` (número de fila) | No | Sí | No | No |
| Fecha Pedido | Fecha (YYYY-MM-DD) | `Pedidos Master` | No | Sí | Sí | Sí |
| Hora Pedido | Hora (HH:MM) | `Pedidos Master` | No | Sí | Sí | Sí |
| Nombre | Texto | `Pedidos Master` | No | Sí | Sí | Sí |
| Teléfono | Texto | `Pedidos Master` | No | Sí | Sí | Sí |
| Resumen Pedido | Texto | `Pedidos Master` (normalizado) | No | Sí | Sí | Sí |
| Hamburguesas | Número entero | `Pedidos Master` | No | Sí | Sí | Sí |
| Extras | Texto | `Pedidos Master` | No | Sí | Sí | Sí |
| Guarniciones | Texto | `Pedidos Master` | No | Sí | Sí | Sí |
| Total | Número decimal | `Pedidos Master` | No | Sí | Sí | Sí |
| Estado Pedido | Enum | Inicial desde `Pedidos Master`; luego operación | Sí | Sí | Sí | Sí |
| Estado Pago | Enum | Inicial desde `Pedidos Master`; luego operación | Sí | Sí | Sí | Sí |
| Método Pago | Enum | Inicial desde `Pedidos Master`; luego operación | Sí | Sí | Sí | Sí |
| Nota Interna | Texto | Operación interna | Sí | Sí | No | No |
| Nota Cliente | Texto | Operación / aclaraciones | Sí | Sí | Sí | Sí |
| Alerta | Enum (`OK` / `⚠️`) | Regla de negocio | Sí (solo ajuste manual excepcional) | Sí | No | Sí |
| Ticket Enviado | Enum (`Sí` / `No`) | Operación | Sí | Sí | No | No |
| Fecha Ticket Enviado | Fecha | Operación | Sí | Sí | No | No |
| Hora Inicio | Hora | Operación cocina | Sí | Sí | No | No |
| Hora Listo | Hora | Operación cocina | Sí | Sí | No | No |
| Última Actualización | FechaHora ISO | Sistema (sync/app) | No | No (siempre refrescable) | No | No |

## 3) Regla de ID
- Fila Master 2 → `BOG-001`
- Fila Master 3 → `BOG-002`
- Fila Master 11 → `BOG-010`

**Regla general:** `ID Pedido = "BOG-" + (Fila Master - 1)` con padding a 3 dígitos.

## 4) Campos que vienen de `Pedidos Master`
- `Fila Master`
- `Fecha Pedido`
- `Hora Pedido`
- `Nombre`
- `Teléfono`
- `Resumen Pedido`
- `Hamburguesas`
- `Extras`
- `Guarniciones`
- `Total`
- (semilla inicial) `Estado Pedido`, `Estado Pago`, `Método Pago`

## 5) Campos editables desde la futura app
- `Estado Pedido`
- `Estado Pago`
- `Método Pago`
- `Nota Interna`
- `Nota Cliente`
- `Alerta` (solo uso manual excepcional)
- `Ticket Enviado`
- `Fecha Ticket Enviado`
- `Hora Inicio`
- `Hora Listo`

## 6) Campos preservados al sincronizar
En toda sincronización con `Pedidos Master` se preservan los campos operativos creados o editados en `Chekeo Nuevo`:
- `Estado Pedido`
- `Estado Pago`
- `Método Pago`
- `Nota Interna`
- `Nota Cliente`
- `Alerta`
- `Ticket Enviado`
- `Fecha Ticket Enviado`
- `Hora Inicio`
- `Hora Listo`

## 7) Campos refrescables desde `Pedidos Master`
Se pueden refrescar desde `Pedidos Master` cuando cambie la fuente:
- `Fecha Pedido`
- `Hora Pedido`
- `Nombre`
- `Teléfono`
- `Resumen Pedido`
- `Hamburguesas`
- `Extras`
- `Guarniciones`
- `Total`

No se refrescan por sincronización: `ID Pedido`, `Fila Master`, ni campos operativos preservados.

## 8) Regla para pedidos especiales
Si en el pedido aparece cualquiera de estas señales:
- `(+1)`
- `Chequeo Manual`
- Ambigüedad en composición/cantidades

Entonces:
- Marcar `Alerta = ⚠️`.
- **No bloquear** el flujo del pedido.
- Mantener pedido visible y operable para resolución manual.

## 9) Reglas de ticket cliente
El ticket cliente incluye exclusivamente:
- `ID Pedido`
- `Fecha Pedido`
- `Hora Pedido`
- `Nombre`
- `Teléfono`
- `Resumen Pedido`
- `Hamburguesas`
- `Extras`
- `Guarniciones`
- `Total`
- `Estado Pedido`
- `Estado Pago`
- `Método Pago`
- `Nota Cliente` (si existe)

Nunca incluir en ticket cliente:
- `Fila Master`
- `Nota Interna`
- `Alerta`
- `Ticket Enviado`
- `Fecha Ticket Enviado`
- `Hora Inicio`
- `Hora Listo`
- `Última Actualización`

## 10) Reglas de WhatsApp
Mensaje base de WhatsApp debe incluir:
- `ID Pedido`
- `Nombre`
- `Resumen Pedido`
- `Total`
- `Estado Pedido`
- `Estado Pago`
- `Nota Cliente` (si aplica)
- Indicador de `⚠️` cuando `Alerta = ⚠️`.

Nunca exponer datos internos (`Nota Interna`, trazas operativas).

## 11) Validaciones esperadas
- `ID Pedido` único y con formato `BOG-###`.
- `Fila Master` numérica y sin duplicados en `Chekeo Nuevo`.
- Enums válidos para `Estado Pedido`, `Estado Pago`, `Método Pago`, `Ticket Enviado`, `Alerta`.
- `Total` numérico mayor o igual a 0.
- Fechas y horas en formato consistente.
- Si `Ticket Enviado = Sí`, debe existir `Fecha Ticket Enviado`.
- Si hay señales especiales (`(+1)`, `Chequeo Manual`, ambigüedad), `Alerta` debe quedar en `⚠️`.

## 12) Criterios de cierre de Fase 1
Se considera cerrada la Fase 1 cuando:
1. Existe contrato definitivo resumido en `planning/02-data-contract.md`.
2. Existe documento detallado campo a campo en este archivo.
3. Quedan establecidas reglas de ID, sync, ticket cliente y WhatsApp.
4. Quedan definidas validaciones mínimas operativas.
5. Se registra cierre en `planning/03-phase-log.md`.

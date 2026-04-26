# Fase 1 (realista Burger-OG) — Auditoría mínima de implementación

## Objetivo de esta fase
Preparar una base técnica más modular y mantenible, manteniendo la paridad funcional de cocina sin introducir capas que aún no existen en el producto (Auth/PIN/Update Manager).

## A. Estructura mínima propuesta (sin sobreingeniería)

## Frontend (HTMLService)
- `burger.html` (mismo archivo por compatibilidad, pero con módulos internos):
  - `AppState`: estado UI local (`orders`, `current`, `pendingOrderId`).
  - `ChekeoBridge`: wrapper único para `google.script.run`.
  - `ChekeoRenderer`: render de vista principal y builders reutilizables.
  - `ChekeoActions`: casos de uso de pantalla (load, openConfirm, confirmReady).
  - `ViewUtils`: helpers de presentación/escape.

## Backend (Apps Script)
- `Code.gs`: solo funciones públicas de entrada (menú + API expuesta al HTML).
- `backend_constants.gs`: constantes de hojas, estados e índices de columnas.
- `backend_sync_service.gs`: sync Master→Chekeo.
- `backend_orders_service.gs`: lectura de órdenes activas, marcar LISTO, diagnóstico.
- `backend_utils.gs`: mapeo/normalización/utilidades compartidas.

## B. Estrategia de migración desde archivos actuales
1. Mantener firmas públicas (`syncChekeoFromMaster`, `getChekeoOrders`, `markOrderReady`, etc.) para no romper integración.
2. Mover implementación interna desde `Code.gs` a servicios por dominio.
3. En frontend, remover handlers inline y pasar a acciones con event delegation.
4. Encapsular el bridge remoto para desacoplar render de IO.
5. Conservar render y copy funcionales (misma operación) para no romper cocina.

## C. Paridad funcional preservada
- Sync desde menú.
- Cola activa por estado (`PENDIENTE` / `EN PREP`).
- Vista de pedido actual + siguiente.
- Confirmación LISTO.
- Escritura de timestamps y lock de concurrencia.

## D. Qué habilita para la siguiente fase visual
- Cambiar layout/componentes sin tocar bridge ni casos de uso.
- Introducir nuevos bloques visuales reutilizando builders del renderer.
- Evolucionar estilos sin reabrir lógica de negocio.


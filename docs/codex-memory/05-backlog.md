> Estado: vivo
> Uso: memoria operativa para Codex/Burgers.exe

# Backlog

## Pendientes importantes

- Afinar ticket pequeño vertical.
- Mejorar ticket en Pagos.
- Mejorar copy de WhatsApp.
- Arreglar y desacoplar Resumen K V2 (seguimiento de recetas e insumos).
- Mejorar Corte.
- Reacomodar Sorteo.
- Agregar tickets extra a participantes.
- Sincronización de Favoritos de Admin V3 en Cloudflare D1 (Multi-dispositivo). El plan detallado ya está estructurado (Migración SQL `0004_v2_admin_favorites.sql`, actualización de `site-config.ts` y sincronización en `AdminWorkspaceV3.tsx`).
## Completados recientemente

- [x] **PR #507**: Rediseño Hub Admin V3 con Cuadrícula Modular 3x3 de 9 tarjetas táctiles compactas.
- [x] **PR #507**: Componente `CollapsibleCustomerNote.tsx` (píldora plegada por defecto `[📝 Nota del cliente ▼]`) en Pedidos y Cocina.
- [x] **PR #507**: Purga completa de estilos cyberpunk neón (`cyan-400`, `pink-500`, `zinc-950`) adoptando la paleta Premium Casual Vibe (`#16A34A` / `#22C55E`, tarjetas neutras).
- [x] **PR #507**: Interruptor dinámico para activar/desactivar la tienda pública directamente desde Chekeo V2 (`site_config` en D1) con badge permanente `MODO CATÁLOGO ÚNICO`.

## Ideas futuras

- Convertir Burgers.exe en SaaS.
- Mejorar QA visual manual.
- Usar Obsidian como memoria del proyecto.
- Usar Graphify como mapa técnico antes de cambios grandes.

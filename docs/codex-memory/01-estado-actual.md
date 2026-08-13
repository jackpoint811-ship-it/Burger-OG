> Estado: vivo
> Uso: memoria operativa para Codex/Burgers.exe

# Estado actual de Burgers.exe

## Contexto general

Burgers.exe tiene una app pública de pedidos y una app interna de Chekeo.

## Reglas importantes

- `AGENTS.md` manda sobre esta memoria.
- Los cambios deben terminar en Pull Request cuando el usuario apruebe el cierre.
- Usar Graphify antes de cambios grandes o de arquitectura.
- No tocar `legacy/` sin autorización.
- No meter dependencias nuevas sin autorización.
- Mantener enfoque mobile-first.
- Mantener UX clara, accesible y consistente con la marca.

## Estado funcional deseado

- Pedidos: revisar pedidos con detalle, sin saturar con descarga/envío de imagen.
- Pagos: concentrar ticket, WhatsApp y comprobante.
- Corte: debe funcionar bien y mostrar resumen operativo.
- Resumen K: debe mostrar burgers, ingredientes, extras y cantidades necesarias.
- Sorteo: debe mostrar lo más importante sin saturar.

## Hito reciente - 2026-08-13

- **PR #518 Mergeado en `preview`**: Se completó la refactorización integral de colores y branding en **Chekeo Preview** (`apps/internal-chekeo-v2` y `packages/ui`), erradicando clases legadas dark/cyberpunk (`bg-zinc-950`, `bg-cyan-400`, `border-zinc-800`) e implementando la estética **Premium Casual Vibe** (Light Mode `#F5F2EE` base background, `#FFFFFF` cards, `#16A34A` Forest Green accent; Dark Mode Slate `#121212` / `#1E1E1E`).

## Hito reciente - 2026-07-31

- **Chekeo V3 Transition Plan & Codebase Inventory**: Se completó con éxito el análisis detallado de la base de código de Chekeo V2 (9,022 líneas analizadas) usando `teamwork_preview`. Se generó el plan maestro [`CHEKEO_V3_TRANSITION_PLAN.md`](file:///home/codespace/.gemini/antigravity-cli/brain/11778496-2bda-4b2a-8e14-f41839ea7490/CHEKEO_V3_TRANSITION_PLAN.md) que documenta los 88 controles interactivos, mapea las llamadas de API/D1/R2 y provee el blueprint modular de 10 subcomponentes para el rediseño V3 bajo la Estética Premium Casual.


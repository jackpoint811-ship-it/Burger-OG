> Estado: vivo
> Uso: memoria operativa para Codex/Burgers.exe

# Decisiones

## Decisiones activas

- Obsidian se usará como editor de memoria Markdown.
- La memoria real vive en `docs/codex-memory/`.
- Codex debe leer esta memoria antes de cambios grandes.
- `AGENTS.md` sigue siendo la regla dura.
- Graphify debe usarse antes de modificar arquitectura o varios archivos.
- Todo cambio debe terminar en Pull Request cuando el usuario apruebe el cierre.

## Formato para nuevas decisiones

### 2026-07-27
- **Decisión**: Conectar `CatalogBannerRail`, fallbacks SVG visuales, chips emoji y opt-in WA directamente al flujo por defecto de `PublicOrderApp.tsx` (PR 11 y PR 12).
- **Motivo**: Los componentes rediseñados en PRs 3-7 solo estaban activos bajo el flag `publicMode === "catalog"`, haciendo que el flujo público principal no mostrara las mejoras.
- **Impacto**: El usuario ahora ve el carrusel neón, tarjetas con SVG visuales y la casilla de WhatsApp en el wizard interactivo principal.

- **Decisión**: Aplicar el sistema de diseño Cyberpunk Dark Premium a las vistas operativas de Chekeo y Admin Catálogo (PR 13 y PR 14).
- **Motivo**: Los PRs 9 y 10 no habían modificado la interfaz visual de Chekeo adecuadamente.
- **Impacto**: Chekeo cuenta con pestañas glowing neón, bordes inteligentes en tarjetas por estado (recibido, cocina, listo) y panel admin con estética glassmorphic.

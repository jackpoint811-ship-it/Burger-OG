# 🔄 Flujo de Trabajo y Ciclo de Vida de PRs

## 1. Antes de iniciar cambios
- Consultar `docs/codex-memory/01-estado-actual.md` y `docs/codex-memory/22-v3-bitacora.md`.
- Delimitar con precisión qué archivos se van a modificar y cuáles **NO** se deben tocar.
- Crear una rama limpia: `git checkout -b feat/... preview` (o desde `v3`).

## 2. Durante la implementación
- Cambios mínimos, directos y quirúrgicos.
- Cero refactors oportunistas fuera del alcance.
- En `apps/public-order-v3`: siempre validar comportamiento mobile-first.

## 3. Verificaciones requeridas
```bash
git diff --check
npm run typecheck
npm run build:public
npm run build:chekeo
```

## 4. Al finalizar la tarea
- Actualizar `docs/codex-memory/22-v3-bitacora.md` y `01-estado-actual.md`.
- Hacer commit con mensaje descriptivo.
- Push de la rama y abrir PR con `gh pr create --base preview` (o `--base v3`).
- Presentar al usuario el reporte estructurado con Resumen, Archivos, Checks, Riesgos, Checklist QA y Enlace al PR.
- El usuario revisa y hace el merge.

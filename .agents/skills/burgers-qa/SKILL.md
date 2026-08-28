---
name: burgers-qa
description: Suite de validación y verificación técnica integral de Burgers.exe. Ejecuta la matriz de comprobaciones obligatorias (git diff, typecheck, build public y build chekeo) previo a abrir un Pull Request.
---

# 🛡️ Skill: Burgers.exe QA & Validation Suite

Usa esta habilidad para validar que cualquier cambio en el repositorio cumple con el 100% de los estándares técnicos requeridos antes de abrir un Pull Request.

## 🚀 Comprobaciones Obligatorias

Ejecuta el script automatizado:

```bash
./.agents/skills/burgers-qa/scripts/run-all-checks.sh
```

O corre los comandos individualmente:

1. **Git Diff Check**:
   ```bash
   git diff --check
   ```
2. **TypeScript (0 Errores en todo el monorepo)**:
   ```bash
   npm run typecheck
   ```
3. **Compilación de App Pública (Vite + React 19 + Tailwind v4)**:
   ```bash
   npm run build:public
   ```
4. **Compilación de App Interna Chekeo**:
   ```bash
   npm run build:chekeo
   ```

## 📋 Estructura de Reporte de Cierre

Al completar las comprobaciones con éxito, genera el reporte estructurado con:
- **Resumen ejecutivo**.
- **Archivos modificados**.
- **Qué se implementó**.
- **Qué NO se implementó**.
- **Riesgos evaluados**.
- **Testing ejecutado y resultados**.
- **Checklist manual de QA sugerido**.

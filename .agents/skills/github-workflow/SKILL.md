---
name: github-workflow
description: Flujo de trabajo, branching, validación y gestión de Pull Requests con Git y GitHub CLI (gh) para Burgers.exe.
---

# 🐙 Skill: GitHub Workflow (Burgers.exe)

Esta habilidad establece el protocolo operativo obligatorio para la gestión de ramas, commits, Pull Requests y sincronización en este repositorio.

---

## 1. 🛑 Reglas Inquebrantables de Branching

1. **PROHIBIDO PUSH O MERGE A `main`**:
   - `main` permanece congelado y reservado para producción.
   - Todas las ramas de trabajo se crean a partir de `preview` o `v3`.
   - Todos los PRs deben tener como base (`--base`) la rama `preview` o `v3`.

2. **Convención de Nombres de Rama**:
   - Features: `feat/v3-<nombre-corto>` o `feat/<nombre-corto>`
   - Bugfixes: `fix/<nombre-corto>`
   - Refactor/Estilos: `style/<nombre-corto>` o `refactor/<nombre-corto>`

---

## 2. 🔄 Ciclo de Vida de una Tarea

### Paso 1: Crear Rama Limpia
```bash
git checkout preview
git pull origin preview
git checkout -b feat/mi-nueva-funcionalidad preview
```

### Paso 2: Cambios Quirúrgicos & Commits Semánticos
- Realizar únicamente los cambios solicitados.
- **NUNCA** usar `git add .` ni `git add -A`.
- Añadir archivos específicamente:
```bash
git add ruta/al/archivo1.tsx ruta/al/archivo2.ts
git commit -m "feat(modulo): descripcion clara del cambio"
```

### Paso 3: Validación Técnica Obligatoria (QA)
Antes de hacer push o abrir PR, ejecutar siempre:
```bash
./.agents/skills/burgers-qa/scripts/run-all-checks.sh
```
El script verifica:
- `git diff --check` (0 errores de whitespace)
- `npm run typecheck` (0 errores de TypeScript)
- `npm run build:public` (Compilación limpia)
- `npm run build:chekeo` (Compilación limpia)

### Paso 4: Push y Apertura de Pull Request
```bash
# Push de la rama
git push -u origin feat/mi-nueva-funcionalidad

# Crear PR con gh CLI hacia preview
gh pr create --base preview --head feat/mi-nueva-funcionalidad --title "feat(modulo): titulo descriptivo" --body "## Resumen..."
```

### Paso 5: Auditoría de Pureza del PR (Cero Contaminación)
Verificar en GitHub que no se hayan colado archivos ajenos:
```bash
gh pr view <numero_pr> --json files,commits
```

### Paso 6: Sincronización Post-Merge
Una vez que el usuario aprueba y hace el merge en GitHub:
```bash
git checkout preview
git pull origin preview
git branch -d feat/mi-nueva-funcionalidad
```

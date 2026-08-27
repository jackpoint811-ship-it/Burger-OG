---
name: burgers-exe
description: Activador maestro de Burgers.exe. Se activa automáticamente cuando el usuario escribe 'Burgers.exe', 'burger.exe', '/burgers', 'burgers.exe: <tarea>' o solicita contexto, inicio o ejecución de tareas en este repositorio.
---

# 🍔 Skill: Activador Maestro de Burgers.exe

Se activa cuando el usuario incluye `Burgers.exe`, `burger.exe`, `/burgers` o prefijos como `/plan burgers.exe: <tarea>` al inicio de su solicitud.

## 1. Acciones Inmediatas (Siempre)
1. **Cargar Memoria Viva**:
   - Leer `docs/codex-memory/01-estado-actual.md`
   - Leer `docs/codex-memory/22-v3-bitacora.md`
2. **Inspeccionar Entorno Git**:
   - Consultar rama activa (`git status`) y base de trabajo (`preview` / `v3`).
3. **Recordar Hard Constraints**:
   - NUNCA push ni PR a `main`.
   - NUNCA agregar dependencias a `package.json` sin permiso.
   - NUNCA romper contratos de datos (D1/Hono/Zod).
   - NUNCA mergear PRs automáticamente (el usuario revisa y mergea).
   - Mantener estética **Premium Casual** (blanco cálido `#F5F2EE`, verde bosque `#16A34A`, dark slate `#121212`).

## 2. Modos de Ejecución

### Modo A: Solo Estatus / Arranque (ej: `burgers.exe`, `burger.exe`, `/burgers`)
Si el usuario envía únicamente el comando sin una tarea específica:
- Responder con un resumen conciso:
  - **Rama activa y estado del repo**.
  - **Último hito completado**.
  - **Hard constraints activas**.
  - **Disponibilidad inmediata para la siguiente tarea**.

### Modo B: Acción Directa (ej: `burgers.exe: <tarea>`, `/plan burgers.exe: <tarea>`, `/burgers <tarea>`)
Si el usuario incluye una tarea o instrucción en el mismo mensaje:
- Cargar memoria viva en silencio.
- Si viene con `/plan`, diseñar el plan de implementación estructurado antes de tocar código.
- Proceder de inmediato con la tarea solicitada siguiendo el flujo de trabajo estándar (branch desde `preview`/`v3`, cambios mínimos, checks, actualización de memoria y PR).

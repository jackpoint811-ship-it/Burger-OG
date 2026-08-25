---
name: burgers-exe
description: Activador maestro de Burgers.exe. Se activa automáticamente cuando el usuario escribe 'Burgers.exe', 'burger.exe' o solicita contexto y arranque en este repositorio.
---

# 🍔 Skill: Activador Maestro de Burgers.exe

Cuando el usuario escriba únicamente `Burgers.exe`, `burger.exe` o mencione el nombre del proyecto como comando de inicio:

## 1. Acciones Inmediatas
1. **Cargar Memoria Viva**:
   - Leer `docs/codex-memory/01-estado-actual.md`
   - Leer `docs/codex-memory/22-v3-bitacora.md`
2. **Inspeccionar Entorno Git**:
   - Consultar la rama activa (`git status`) y últimos commits.
   - Confirmar si la base de trabajo es `preview` o `v3`.
3. **Recordar Hard Constraints**:
   - NUNCA push ni PR a `main`.
   - NUNCA agregar dependencias a `package.json` sin permiso.
   - NUNCA romper contratos de datos (D1/Hono/Zod).
   - Mantener estética **Premium Casual** (blanco cálido `#F5F2EE`, verde bosque `#16A34A`).

## 2. Respuesta al Usuario
Responder con un resumen conciso:
- **Rama activa y estado del repo**.
- **Último hito completado**.
- **Disponibilidad inmediata para la siguiente tarea bajo el flujo de trabajo estándar**.

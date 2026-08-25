# 🛑 Prohibiciones Estrictas (Hard Constraints)

Estas reglas son inquebrantables bajo cualquier circunstancia en este repositorio:

1. **NUNCA PUSH NI MERGE A `main`**:
   - `main` es intocable salvo en cutovers oficiales autorizados explícitamente por el usuario.
   - Trabajar siempre en ramas creadas desde `preview` o `v3`.
   - Todos los Pull Requests deben tener como base `preview` o `v3`.

2. **NUNCA MODIFICAR DEPENDENCIAS SIN AUTORIZACIÓN**:
   - No agregar paquetes a `package.json`, no cambiar versiones ni instalar dependencias externas sin permiso explícito.

3. **NUNCA ROMPER CONTRATOS DE DATOS O BACKEND**:
   - Respetar los schemas Zod en `@config` (`packages/config/src/schemas.ts`).
   - No cambiar rutas ni respuestas de Hono en `functions/api/`.
   - No alterar precios, nombres de campos, promociones ni reglas de negocio.
   - No ejecutar migraciones destructivas ni resets en bases de datos de producción/preview.

4. **NUNCA USAR ESTÉTICA CYBERPUNK/NEÓN OBSOLETA**:
   - La estética oficial es **Premium Casual**: tema claro por defecto (fondo crema `#F5F2EE`, tarjetas blancas `#FFFFFF`, acento verde bosque `#16A34A`), dark mode neutro slate (`#121212`), y tipografía Inter limpia.

5. **NUNCA DEJAR CAMBIOS SIN CHECKS TÉCNICOS**:
   - Todo cambio debe validar `git diff --check`, `npm run typecheck` (0 errores) y `npm run build` sin excepciones.

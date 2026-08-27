# 🛑 Prohibiciones Estrictas (Hard Constraints)

## ⚡ Activador Maestro: `Burgers.exe`
- **Modo Estatus**: Si el prompt es solo `Burgers.exe`, `burger.exe` o `/burgers`, leer memoria viva, verificar entorno y ponerse a la orden.
- **Modo Acción Directa**: Si incluye una tarea (ej: `burgers.exe: <tarea>`, `/plan burgers.exe: <tarea>`), cargar memoria silenciosamente y proceder inmediatamente con la tarea.

---

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

6. **NUNCA INVENTAR DATOS NI USAR FALLBACKS FICTICIOS**:
   - Trabajar única y exclusivamente con los datos reales de Cloudflare D1 (`menu_items`, `ingredients_v2`, `product_ingredient_recipes_v2`, `orders_v2`), Cloudflare R2 y endpoints Hono.
   - Prohibido inventar SKUs, productos, precios, ingredientes, recetas, combos o estados de pedidos ficticios en el frontend, backend o scripts de prueba.
   - Si un dato o configuración no existe, debe reflejarse limpiamente o solicitarse su configuración real en Chekeo, nunca ocultar fallas con valores por omisión inventados.

7. **NUNCA DESFASAR FECHAS NI ENTORNO EN PEDIDOS (HORA CDMX & PREVIEW SOURCE)**:
   - Todo pedido de prueba o preview debe llevar `source: "public-v2-preview"`.
   - Toda fecha operativa debe calcularse usando obligatoriamente la hora de Ciudad de México (`getCdmxTodayString()` / `America/Mexico_City`), previniendo desalineaciones entre servidores UTC y navegadores locales.

---
name: a11y-wcag-auditor
description: Auditoría de accesibilidad (a11y) y directrices WCAG 2.1 AA para interfaces web y móviles en Burgers.exe.
---

# ♿ Skill: Accesibilidad & Compliance WCAG 2.1 AA (Burgers.exe)

Usa esta habilidad para auditar y garantizar que cualquier componente o pantalla cumpla con los estándares internacionales de accesibilidad e inclusión.

---

## 1. 🎯 Matriz de Comprobaciones WCAG 2.1 AA

| Criterio | Requisito Mínimo | Implementación en Burgers.exe |
| :--- | :--- | :--- |
| **Contraste de Texto** | Mínimo $4.5:1$ (texto normal) y $3:1$ (texto grande) | Texto claro `#0F172A` sobre crema `#F5F2EE`; blanco `#FFFFFF` sobre `#121212`. |
| **Foco Visible** | Indicador de foco claro para navegación por teclado | `focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none`. |
| **Targets Táctiles** | Mínimo $44 \times 44\text{px}$ en móvil | `min-h-11 min-w-11` o variables `--touch-target-min: 44px`. |
| **Semántica de Modales** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | Primitivas Radix Dialog / Drawer con `DialogTitle` obligatorio. |
| **Lectores de Pantalla** | Notificar cambios dinámicos sin bloquear | `aria-live="polite"` en carritos y avisos de estado de cocina. |
| **Reducción de Movimiento** | Respetar preferencia del sistema operativo | `motion-reduce:transition-none` o `framer-motion` con fallback estático. |

---

## 2. 📋 Checklist de Auditoría Rápida

Antes de dar por finalizada una pantalla o componente, verifica los siguientes puntos:

### A. Elementos Interactivos y Botones
- [ ] Todo botón o enlace interactivo tiene `cursor-pointer`.
- [ ] Si un botón solo contiene un icono SVG, incluye `aria-label="Descripción de la acción"` (ej. `aria-label="Cerrar modal"`).
- [ ] Los botones deshabilitados usan `disabled` nativo y `disabled:opacity-50 disabled:cursor-not-allowed`.

### B. Formularios e Inputs
- [ ] Todo `<input>` tiene un `<label>` asociado mediante `htmlFor` o `aria-labelledby`.
- [ ] No sustituir etiquetas persistentes por `placeholder`.
- [ ] Los mensajes de error inline están vinculados con `aria-describedby="error-id"`.
- [ ] Teclados móviles optimizados: `inputMode="numeric"` para PINs y `inputMode="tel"` para teléfonos.

### C. Modales, Drawers y Popovers
- [ ] La tecla <kbd>Escape</kbd> cierra el modal/drawer.
- [ ] El foco queda atrapado dentro del modal mientras está abierto (*Focus Trap* de Radix UI).
- [ ] Al cerrar el modal, el foco regresa al botón que lo abrió.

---

## 3. 🛠️ Snippets Accesibles Recomendados

### Botón de Cierre Accesible
```tsx
<button
  type="button"
  onClick={onClose}
  aria-label="Cerrar ventana"
  className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
>
  <X className="w-5 h-5" aria-hidden="true" />
</button>
```

### Notificación en Vivo para Carrito
```tsx
<div role="status" aria-live="polite" className="sr-only">
  {itemAddedMessage}
</div>
```

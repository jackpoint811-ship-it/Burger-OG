---
name: tailwind-v4-tokens
description: Guía de tokens de diseño, sistema de color y directivas de Tailwind CSS v4 para Burgers.exe.
---

# 🎨 Skill: Tokens de Diseño y Estándares Tailwind CSS v4 (Burgers.exe)

Esta habilidad establece la paleta oficial, variables CSS y patrones de diseño adaptativo para mantener la coherencia visual **Premium Casual** en todo el monorepo.

---

## 1. 🌈 Paleta Oficial (Premium Casual Vibe)

### Modo Claro (Light-First por Defecto)
* **Fondo Global (`bg-background`)**: Blanco crema suave `#F5F2EE`
* **Superficie de Tarjeta (`bg-surface-card`)**: Blanco puro `#FFFFFF`
* **Superficie Elevada (`bg-surface-raised`)**: Gris muy tenue `#EAE6E1`
* **Líneas y Bordes (`border-line`)**: Borde sutil `#E2DCD5`
* **Acento Principal (`text-accent` / `bg-accent`)**: Verde bosque `#16A34A` (Hover: `#15803D`)
* **Texto Primario (`text-text-primary`)**: Carbón oscuro `#0F172A`
* **Texto Secundario (`text-text-secondary`)**: Slate neutro `#475569`
* **Texto Muted (`text-text-muted`)**: Slate claro `#64748B`

### Modo Oscuro (Deep Slate High-Contrast vía `.theme-dark`)
* **Fondo Global (`bg-surface`)**: Deep Slate oscuro `#0C0E12`
* **Superficie de Tarjeta (`bg-surface-card`)**: Slate elevado `#161922`
* **Superficie Elevada (`bg-surface-raised`)**: Slate interactivo `#202531`
* **Superficie Secundaria (`bg-surface-alt`)**: Slate neutro `#12151D`
* **Líneas y Bordes (`border-line`)**: Borde nítido `#2E3545` (Contraste 2.6:1)
* **Acento Principal (`text-accent` / `bg-accent`)**: Verde esmeralda brillante `#22C55E` (Hover: `#16A34A`)
* **Acento Soft (`bg-accent-soft`)**: `rgba(34, 197, 94, 0.18)`
* **Texto Primario (`text-text-primary`)**: Blanco puro `#F8FAFC` (Contraste 15.8:1 AAA)
* **Texto Secundario (`text-text-secondary`)**: Slate suave `#94A3B8` (Contraste 8.2:1 AAA)
* **Texto Muted (`text-text-muted`)**: Slate medio `#8492A6` (Contraste 6.0:1 AA)

---

## 2. 📱 Ergonomía Mobile-First & Layouts

### A. Ancho Máximo de Catálogo
```css
--catalog-max-width: 768px; /* Contenedor centrado para evitar estiramiento en desktop */
```

### B. Grillas Adaptativas
```css
/* Grilla autoadaptable de 2 columnas en móvil a 3-4 en tablet/desktop */
grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr));
```

### C. Safe Area Insets (iOS / Android)
Para barras flotantes inferiores (`cart_bar`, `batch_action_bar`):
```tsx
<div className="fixed bottom-0 left-0 right-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-surface-card/95 backdrop-blur-md border-t border-line z-50">
  {/* Contenido flotante */}
</div>
```

---

## 3. 🚫 Erradicación de Antipatrones Visuales

1. **PROHIBIDO el estilo Cyberpunk/Neón Legacy:** Cero fuentes pixeladas, cero bordes verde fosforescente `#00FF66` sobre fondos negros puros.
2. **Cero Clases CSS Inexistentes:** Validar siempre que las clases utilizadas existan en `globals.css` o en el sistema Tailwind.
3. **Sombras Limpias:** Usar `shadow-card` y `shadow-panel` en lugar de sombras negras duras.

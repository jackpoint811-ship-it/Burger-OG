---
name: dynamic-ui-components
description: Catálogo y patrones de componentes dinámicos de Frontend (Drawers gestuales, KDS Timers, KPI Cards, Floating Bars y Steppers) para Burgers.exe.
---

# ⚡ Skill: Componentes Dinámicos de Frontend (Burgers.exe)

Usa esta habilidad para diseñar, componer o refactorizar componentes interactivos y dinámicos en `packages/ui`, `apps/public-order-v3` y `apps/internal-chekeo-v3`.

---

## 1. 📱 Patrones para `public-order-v3` (Mobile-First & App-Like)

### A. Dynamic Bottom Sheet (Drawer con Gestos y Física de Resorte)
* **Gestos táctiles:** Arrastre vertical (`drag="y"`), resistencia elástica (`dragConstraints={{ top: 0 }}`, `dragElastic={0.2}`) y cierre automático si se arrastra hacia abajo $>100\text{px}$ o con velocidad $>500\text{px/s}$.
* **Fondo escalable y desenfoque:** Backdrop con `bg-black/60 backdrop-blur-xs` y cierre con un toque fuera o tecla `Escape`.
* **Grab Handle táctil:** Píldora visual superior de $48\text{px} \times 5\text{px}$ (`rounded-full bg-line`) para indicar capacidad de arrastre en móviles.
* **Safe Area Inset:** Margen inferior respetando `env(safe-area-inset-bottom)`.

### B. Quantity Stepper Interactivo
* **Área táctil mínima:** Botones de `+` y `-` con dimensiones mínimas de $44\text{px} \times 44\text{px}$ (`min-h-[44px] min-w-[44px]`).
* **Feedback háptico visual:** Micro-animación de escala (`whileTap={{ scale: 0.92 }}`) al presionar.
* **Bloqueo accesible:** Atributo `disabled` y estilo visual desaturado al alcanzar los límites mínimo (`1` o `0`) y máximo.

### C. Floating Cart Bar (Isla Flotante Reactiva)
* **Animación de entrada/salida:** Despliegue con resorte suave (`type: 'spring', damping: 24, stiffness: 220`).
* **Bump numérico:** Al cambiar la cantidad de ítems, el contador hace una animación de escala (`initial={{ scale: 1.3 }} animate={{ scale: 1 }}`) para feedback inmediato.
* **Fijación segura:** `fixed bottom-4 left-4 right-4 max-w-[768px] mx-auto pb-[max(0rem,env(safe-area-inset-bottom))]`.

---

## 2. 🖥️ Patrones para `internal-chekeo-v3` (POS, KDS y Dashboards)

### A. Live Timer Badge (Semáforo de Tiempo en Vivo KDS)
* **Tick reactivo:** Hook interno con `setInterval(10000)` para recalcular los minutos transcurridos sin recargar la página.
* **Semáforo de urgencia:**
  * 🟢 **Normal ($< 10\text{ min}$):** `bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30`
  * 🟡 **Atención ($10 - 20\text{ min}$):** `bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30`
  * 🔴 **Urgente ($> 20\text{ min}$):** `bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse`

### B. KPI Metric Cards (Dashboard & Resumen Financiero)
* **Estructura visual:**
  1. *Encabezado:* Título contextual en mayúsculas (`text-xs font-bold uppercase text-text-secondary`) + Icono temático dentro de cápsula circular suave.
  2. *Métrica principal:* Número en gran formato (`text-2xl sm:text-3xl font-black text-text-primary`).
  3. *Badge de tendencia / estado:* Píldora con porcentaje o detalle comparativo (`↑ +14% vs ayer` o `3 órdenes pendientes`).
  4. *Subtexto:* Contexto del período activo (ej. `⚡ Hoy`, `⏱️ Ayer`, `📅 Esta Semana`).
* **Interacción:** Soporte para modo clickeable / filtro activo con borde resaltado `ring-2 ring-accent`.

### C. Dynamic Segmented Control
* **Indicador deslizante:** Uso de `framer-motion` con `layoutId="activeSegment"` para que la pastilla de fondo se deslice con física fluida entre opciones sin saltos bruscos.
* **Navegación por teclado:** Atributos ARIA `role="tablist"` y `role="tab"` con soporte para flechas izquierda/derecha.

---

## 3. ♿ Directrices de Accesibilidad y Performance
1. **`prefers-reduced-motion`:** Consultar siempre `useReducedMotion()` de Framer Motion. Si el usuario tiene animaciones reducidas activas, conmutar a transiciones de opacidad estáticas.
2. **Gestión de Foco:** Al abrir modales y drawers, atrapar el foco dentro del contenedor y devolverlo al elemento disparador al cerrar.
3. **Cero Dependencias Bloqueantes:** Usar exclusivamente `packages/ui` (`@ui/drawer`, `@ui/kpi-card`, `@ui/timer-badge`, `@ui/stepper`, `@ui/segmented-control`) construidos sobre `@radix-ui`, `clsx` y `framer-motion`.

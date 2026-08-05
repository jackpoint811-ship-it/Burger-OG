# 🚀 Plan Maestro de Rediseño UI/UX — Burgers.exe (Dark Premium Modern)

Este documento es la **Fuente de Verdad (Single Source of Truth)** para el rediseño visual y funcional de **Burgers.exe**. Está diseñado para guiar la ejecución paso a paso mediante PRs autónomos, garantizando el máximo rendimiento, estética de primer nivel y cero interrupción en contratos de datos ni backend.

---

## 📐 Directrices de Diseño & Filosofía Visual

### 🎨 Estética: Dark Premium Modern
Unión entre la sobriedad y pulcritud de **Linear / Vercel / Spotify** con la identidad potente y gastronómica de **Shake Shack / Five Guys** y el toque gaming cyberpunk discreto de **Burgers.exe**:

- **Fondo Base:** Carbón profundo (`#090A0C`), evitando el negro puro para prevenir fatiga visual y blooming.
- **Superficies & Elevación:** Sistema de 3 capas (`#121316` base, `#1A1C20` elevada para tarjetas/drawers, `#24272E` overlay/modales).
- **Acentos Vibrantes (Saturados & Controlados):**
  - **Verde Neón Smash (`#22C55E` / `#54A432`):** Botones principales, disponible/online, badges de éxito y CTAs del carrito.
  - **Rojo Gourmet (`#C92027`):** Promociones, ofertas, elementos "Spicy" y badges de descuento.
  - **Dorado Pan Brioche (`#F59E0B`):** Destacados, calificaciones, items "Bestsellers" y acentos de sabor.
- **Bordes & Cristal:** Bordes sutiles `1px solid rgba(255, 255, 255, 0.08)` y sombras flotantes con `backdrop-filter: blur(16px)`.
- **Tipografía:** Conservar **Nunito** (weights 400 a 900) con espaciados y jerarquías claras (style Notion / Framer).
- **Imágenes:** Sistema híbrido inteligente — Fallbacks vectoriales SVG dark con gradientes sutiles cuando el producto no tenga fotografía subida.

---

## 🧭 Especificaciones Tecnológicas y Reglas Permanentemente Vigentes (`AGENTS.md`)

1. **Sin dependencias externas pesadas:** No introducir librerías de UI externas (mantener TailwindCSS v3 + CSS Variables nativas + Framer Motion existente).
2. **Preservación de Contratos:** Cero modificaciones a servicios de backend, esquemas de datos de `orders-v2`, tickets ni `package.json`.
3. **Mobile-First Estricto:** Touch targets mínimos de `44px` (ideal `48px-52px`), áreas de scroll contenidas y soporte total para `prefers-reduced-motion`.
4. **Accesibilidad WAI-ARIA:** `aria-modal`, `aria-labelledby`, `aria-describedby`, soporte completo de navegación por teclado y foco visible con contorno neón (`--focus-ring`).

---

## 🎯 Componentes Clave & Patrones UI a Implementar

### 1. Header Fijo & Hero Section Interactiva
- **Header:** Logotipo SVG `Burgers.exe` animado, estado de la tienda en vivo (`🟢 Abierto` / `🔴 Cerrado`), botón de tickets rápido 🎟️ y toggle manual de tema (preconfigurado a Dark Premium).
- **Hero Section:** Ilustración SVG vectorial en código puro de una burger artesanal con resplandor neón animado (`@keyframes`), título evocador (*"Hamburguesas Reales. Sabor Neón."*), horario de atención visible y botón CTA directo *"Ver Menú"*.

### 2. Rail de Banners & Categorías
- **Banner Rail:** Carrusel swipeable con scroll-snap nativo, dots de paginación sincronizados (`● ○ ○`) y auto-play de 5s pausado al hacer hover/touch (respetando `prefers-reduced-motion`).
- **Navegación por Categorías:** Bar de píldoras adherente (`sticky top-14`) con emojis por categoría (`🍔 Burgers`, `🍟 Combos`, `🥤 Bebidas`, `🧀 Extras`).

### 3. Grid de Productos Híbrido (Mix Card Layout)
- **Cards Destacadas (Combos / Bestsellers):** Ocupan ancho completo o destacadas en la grilla. Imagen prominente en ratio 16:9 con gradiente inferior, badge `🔥 Destacado` y CTA flotante `+ Agregar`.
- **Cards Normales:** Layout limpio en grid responsivo (2 columnas en desktop, tarjeta horizontal compacta en móvil), foto a la derecha (`96x96px`), info a la izquierda con control `+ / -` directo.

### 4. Bottom Sheet Drawers (Producto & Carrito)
- **Drawer de Producto:** Altura máxima `85vh`, handle bar táctil (`48x5px`), detalles de ingredientes, aviso de personalización y botón CTA inferior fijo `[ - 1 + ] Agregar al Carrito — $XXX`.
- **Drawer de Carrito:** Resumen detallado con selector de cantidad, badge de total con IVA incluido e iniciación de checkout fluida.

### 5. Checkout Fludio & Checkbox de WhatsApp
- **Formulario Mobile-First:** Inputs con labels flotantes persistentes, teclado optimizado (`inputmode="tel"`), selector de método de pago en chips interactivas (`Efectivo`, `Transferencia`, `Confirmar por WA`).
- **Restauración de Checkbox de WhatsApp:** Checkbox activo por defecto: `☑️ Quiero unirme al grupo oficial de WhatsApp 📲`.
- **Pantalla de Éxito:** Tarjeta con folio destacado, animación de éxito y enlace directo al grupo oficial de WhatsApp (`chat.whatsapp.com/GycE5zALOypGPvJVaMfbPp`) si el opt-in fue marcado.

### 6. Footer de Marca & Redes Sociales
- Ubicaciones (`Torre GGA`, `Torre Valcob`), enlaces oficiales a Instagram/WhatsApp y horario de cocina.

---

## 🗺️ Roadmap Secuencial de PRs (Fases de Implementación)

### 🔴 FASE 1: Public Order V2 (Prioridad Máxima — Vista Pública)

#### 📦 PR 1: Sistema de Tokens CSS Dark Premium & Reset Global
- **Archivos a modificar:** `apps/public-order-v2/src/styles.css`
- **Contenido:** Implementación completa del paletizado Dark Premium Modern (`--bg-canvas`, `--bg-surface-base`, `--accent-shack-neon`, etc.), tipografía Nunito, clases de utilidad para sombras, bordes y backdrop-blur.

#### 📦 PR 2: Rediseño del Header, Hero SVG Animado & Horarios
- **Archivos a modificar:** `apps/public-order-v2/src/components/CatalogModeApp.tsx`, `apps/public-order-v2/src/styles.css`
- **Contenido:** Header con logo SVG animado, badge de horario en vivo y sección Hero con gráfica SVG pura y tagline renovado.

#### 📦 PR 3: Banner Rail con Carrusel Autoplay & Navegación de Categorías
- **Archivos a modificar:** `apps/public-order-v2/src/components/CatalogBannerRail.tsx`, `apps/public-order-v2/src/styles.css`
- **Contenido:** Transformación del rail de banners a carrusel dinámico con dots de paginación, scroll-snap y pause-on-hover.

#### 📦 PR 4: Rediseño del Grid de Productos (Mix Layout: Featured vs Normal)
- **Archivos a modificar:** `apps/public-order-v2/src/components/CatalogModeApp.tsx`, `apps/public-order-v2/src/styles.css`
- **Contenido:** Layout de tarjetas diferenciadas para Combos/Destacados vs Items normales, badges de precio y CTA táctil rápido.

#### 📦 PR 5: Overhaul de Drawers (Producto & Carrito)
- **Archivos a modificar:** `apps/public-order-v2/src/components/CatalogProductDrawer.tsx`, `apps/public-order-v2/src/components/CatalogCartDrawer.tsx`, `apps/public-order-v2/src/components/CatalogCartBar.tsx`
- **Contenido:** Bottom sheets con handle bar de arrastre, controles incrementales `+ / -` y barra inferior flotante con icono 🛒.

#### 📦 PR 6: Checkout con Checkbox WhatsApp Restaurado & Pantalla de Éxito
- **Archivos a modificar:** `apps/public-order-v2/src/components/CatalogCheckoutDrawer.tsx`, `apps/public-order-v2/src/styles.css`
- **Contenido:** Checkout limpio con selector de pago por chips, restaura opt-in de WhatsApp y pantalla de confirmación con enlace al grupo oficial.

#### 📦 PR 7: Footer de Marca & Polish Final de Accesibilidad
- **Archivos a modificar:** `apps/public-order-v2/src/components/CatalogModeApp.tsx`, `apps/public-order-v2/src/styles.css`
- **Contenido:** Footer completo con redes, sedes, accesibilidad ARIA refinada y verificación de contraste WCAG AA.

---

### 🟡 FASE 2: Pantalla de Tickets (`TicketsLookupPage.tsx`)

#### 📦 PR 8: Rediseño Dark Premium de Consulta de Tickets
- **Archivos a modificar:** `apps/public-order-v2/src/components/TicketsLookupPage.tsx`, `apps/public-order-v2/src/tickets.css`
- **Contenido:** Estilización al tema Dark Premium Modern, buscador de folio por teléfono, visualización de tickets de rifa estilo boleto retro-futurista con bordes dorados y estados en tiempo real.

---

### 🟢 FASE 3: Internal Chekeo V2 (Admin Interno)

#### 📦 PR 9: Rediseño de UI de Chekeo & Tablas Operativas
- **Archivos a modificar:** `apps/internal-chekeo-v2/src/styles.css`, `apps/internal-chekeo-v2/src/components/InternalChekeoApp.tsx`
- **Contenido:** Aplicación del lenguaje visual Dark Premium, tarjetas de comandas con bordes neón de estado, vista de cocina de alto contraste y navegación por tabs rápida.

#### 📦 PR 10: Rediseño del Panel de Administración del Catálogo (`CatalogAdminPanel.tsx`)
- **Archivos a modificar:** `apps/internal-chekeo-v2/src/components/CatalogAdminPanel.tsx`
- **Contenido:** Editor de items, promos, ingredientes y banners de catálogo en tarjetas oscuras elevadas, inputs con foco neón y botones de acción destacados.

---

## 🧪 Plan de Verificación & QA

### 🤖 Pruebas Automatizadas (Ejecución Obligatoria en Cada PR)
```powershell
# 1. Verificación de sintaxis e higiene de Git
git diff --check

# 2. Verificación de Tipos TypeScript
npm run typecheck

# 3. Compilación de producción de Public Order V2
npm run build:public
```

### 👁️ QA Manual & Criterios de Aceptación
- **Viewport Móvil:** Probar en 390px (iPhone 12/13/14) y 412px (Android Pixel/Samsung).
- **Checkout WA Flow:**
  1. Enviar pedido con `wantsWhatsappGroup` activado -> Verificar bloque con enlace `chat.whatsapp.com/GycE5zALOypGPvJVaMfbPp`.
  2. Enviar pedido desmarcando el checkbox -> Verificar confirmación limpia sin enlace a grupo.
- **Rendimiento:** Verificar transiciones fluidas a 60fps y 0 tirones durante el scroll.
- **Modo Reducido de Movimiento:** Activar `prefers-reduced-motion` en el sistema -> Verificar que no hay auto-scroll forzado ni animaciones molestas.
- **Foco por Teclado:** Recorrer todo el sitio con la tecla `Tab` -> Verificar contorno de foco verde neón visible en cada elemento interactivo.

---

## ⚠️ Riesgos & Medidas de Mitigación
- **Riesgo:** Incompatibilidad con navegadores antiguos por backdrop-filter.
  - *Mitigación:* Fallback de color sólido con opacidad `background: rgba(18, 19, 22, 0.95)` cuando backdrop-filter no esté soportado.
- **Riesgo:** Productos sin fotografía deslucidos visualmente.
  - *Mitigación:* Generación de ilustraciones vectoriales en SVG para cada tipo de producto (`burger`, `combo`, `drink`, `side`, `topping`).

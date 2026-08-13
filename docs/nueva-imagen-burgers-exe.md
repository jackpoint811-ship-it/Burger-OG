# Especificación de la Nueva Imagen de Marca: Burgers.exe (Premium Casual Vibe)

**Estado:** Documentación Oficial del Sistema Visual V2  
**Fecha:** Agosto 2026  
**Ámbito:** Identidad de marca, `apps/public-order-v2`, `apps/chekeo-v2` y componentes compartidos  

---

## 1. Resumen Ejecutivo y Evolución de la Marca

**Burgers.exe** ha evolucionado su identidad visual, dejando atrás la estética *cyberpunk / terminal de neón* (caracterizada por fondos oscuros densos, fuentes monospaciadas estridentes y tonos neón saturados) para adoptar un lenguaje contemporáneo denominado **Premium Casual Vibe**.

Esta nueva imagen busca combinar la agilidad y personalidad digital del proyecto con una experiencia de comida artesanal, limpia, apetitosa y profesional. El objetivo principal es ofrecer una UX moderna y ágil, reduciendo la fricción visual y cognitiva en los usuarios al hacer sus pedidos, mientras que en las consolas operativas asegura la máxima eficiencia de lectura.

---

## 2. Filosofía y Principios del Diseño

El nuevo sistema de diseño de Burgers.exe se rige por cinco pilares fundamentales:

1. **Light-First por Defecto**:
   - La interfaz pública y los componentes principales utilizan una base clara (blanco cálido / crema suave), evocando frescura, higiene y apetitosidad.
   - Cuenta con soporte completo para **Dark Mode Slate/Carbón**, activado dinámicamente según las preferencias del usuario (`prefers-color-scheme` o clase `.theme-dark`).

2. **Verde Bosque como Acento Principal**:
   - Sustitución del verde neón fosforescente por un **Verde Bosque** orgánico, sofisticado y legible (`#16A34A` en Light Mode / `#22C55E` en Dark Mode), ideal para llamadas a la acción (CTA) e indicadores clave.

3. **Tipografía Inter (Sans-Serif Limpia)**:
   - Abandono de la tipografía terminal tipo consola en los flujos principales en favor de **Inter**, garantizando legibilidad óptima en cualquier tamaño de pantalla, espaciado equilibrado de caracteres y escaneo visual rápido.

4. **Sombras de Elevación Limpia y Bordes Sutiles**:
   - Reemplazo de los bordes gruesos y halos fosforescentes por tarjetas con sombras suaves de elevación (`--shadow-card`, `--shadow-panel`) y líneas divisorias neutras sutiles (`--color-line`), proporcionando textura sin saturar.

5. **Layout Adaptativo Mobile-First**:
   - Diseñado pensando primero en teléfonos móviles (320px – 430px) y escalando fluidamente hacia tablets y computadoras mediante grillas autoadaptables (`repeat(auto-fill, minmax(min(100%, 160px), 1fr))`) y un contenedor máximo de 768px (`--catalog-max-width`).

---

## 3. Matriz Cromática y Design Tokens

El sistema de tokens de color unifica la experiencia entre aplicaciones:

### Paleta Light Mode (Predeterminada)

| Token | Código Hex / Valor | Uso Principal |
| :--- | :--- | :--- |
| `--color-bg-base` | `#F5F2EE` | Fondo global de la aplicación (crema suave) |
| `--color-bg-surface` | `#FFFFFF` | Tarjetas de producto, contenedores y modales |
| `--color-bg-surface-alt` | `#EFECE6` | Paneles secundarios y fondos de apoyo |
| `--color-brand-primary` | `#16A34A` | Verde Bosque para CTAs primarios y selección activa |
| `--color-fg-primary` | `#1F2937` | Texto principal de alto contraste (gris oscuro) |
| `--color-fg-muted` | `#6B7280` | Descripciones, metadatos y labels secundarios |
| `--color-line` | `#E5E7EB` | Bordes sutiles y divisores |
| `--color-focus-ring` | `#16A34A` | Anillo de enfoque visible para accesibilidad |

### Paleta Dark Mode (Slate / Carbón)

| Token | Código Hex / Valor | Uso Principal |
| :--- | :--- | :--- |
| `--color-bg-base` | `#121212` | Fondo global oscuro profundo |
| `--color-bg-surface` | `#1E1E1E` | Tarjetas y paneles oscuros neutros |
| `--color-bg-surface-alt` | `#2A2A2A` | Paneles alternos y elementos secundarios |
| `--color-brand-primary` | `#22C55E` | Verde Bosque brillante para contraste en modo oscuro |
| `--color-fg-primary` | `#F9FAFB` | Texto principal blanco cálido |
| `--color-fg-muted` | `#9CA3AF` | Metadatos y texto secundario |
| `--color-line` | `#374151` | Bordes sutiles oscuros |

---

## 4. Aplicación por Superficie

### A. App Pública de Pedidos (`apps/public-order-v2`)
* **Enfoque de Experiencia**: Estilo **Uber Eats / E-Commerce de Alimentos Tradicional y Profesional**.
* **Arquitectura de Interfaz Headless UI**:
  - **Banner Promocional (`banner_carousel_1`)**: Deslizador horizontal compacto para lanzamientos y combos.
  - **Reorden Rápido (`reorder`)**: Módulo "1-Click Reorder" para repetir pedidos frecuentes.
  - **Categorías Sticky (`categories_sticky`)**: Barra de navegación superior fija con desplazamiento horizontal suave.
  - **Grilla de Productos (`catalog` / `grid`)**: Tarjetas claras con fotografía de producto, nombre, precio, descripción e interacciones táctiles directas.
  - **Barra de Carrito Flotante (`cart_bar`)**: Resumen inferior persistente con total, cantidad de ítems y CTA claro para checkout.
  - **Drawers y Modales**: Personalización comprensible de productos (`CatalogProductDrawer`) y checkout seguro (`CatalogCheckoutDrawer`).

### B. Consola Operativa Interna (`apps/chekeo-v2`)
* **Enfoque de Experiencia**: **Consola de Trabajo de Alta Densidad**.
* **Arquitectura de Interfaz**:
  - Diseño orientado a operabilidad directa en Cocina, Empaque y Cajas.
  - Pestañas especializadas con datos en vivo desde Cloudflare D1.
  - Tipografía sans-serif clara para escaneo instantáneo de pedidos y tickets.
  - Acceso directo a vistas operativas sin barreras de inicio de sesión innecesarias en pantallas de cocina.

---

## 5. Accesibilidad, Interacción y Rendimiento

* **Objetivo WCAG 2.2 AA**:
  - Relación de contraste mínima de 4.5:1 en todos los textos y controles.
  - Anillos de foco visibles (`:focus-visible`) para navegación por teclado.
  - Blancos táctiles (touch targets) con altura mínima de **44px** (`--touch-target-min`).
* **Microinteracciones y Movimiento**:
  - Microinteracciones ágiles en botones y switches de cantidad.
  - Respeto estricto a las preferencias del usuario para reducción de movimiento (`prefers-reduced-motion`).
* **Optimización de Assets**:
  - Resolución e imágenes mediante **Cloudflare R2** (`resolveCatalogAssetUrl`).
  - Iconografía SVG local vectorial de carga liviana.

---

## 6. Guía de Uso de Marca (Do's and Don'ts)

### ✅ Lo que SÍ se debe hacer (Do's):
* Mantener fondos limpios, claros y relajantes como la opción por defecto.
* Priorizar la fotografía apetitosa del producto sobre elementos gráficos ornamentales.
* Usar botones de acción (CTA) destacados en Verde Bosque con textos breves e inequívocos.
* Garantizar etiquetas persistentes y mensajes de error inline en los formularios de datos.

### ❌ Lo que NO se debe hacer (Don'ts):
* **No usar temas Cyberpunk/Neón legacy**: Evitar fondos negros totales con textos fosforescentes verde neón.
* **No usar fuentes puramente Monospace** en la experiencia pública de pedidos.
* **No usar gradientes estridentes ni halos fosforescentes (Glows)** excesivos alrededor de tarjetas o contenedores.
* **No usar combinaciones de texto morado o violeta sobre fondos oscuros**.
* **No saturar la pantalla con íconos o badges innecesarios** que distraigan del proceso de compra.

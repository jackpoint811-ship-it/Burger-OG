---
name: taste-skill
description: Criterio estético superior, anti-slop de IA y estándares de diseño artesanal para interfaces web y móviles en Burgers.exe.
---

# 💎 Skill: Taste Skill & Criterio de Diseño Artesanal (Burgers.exe)

Esta habilidad dota a los agentes y desarrolladores de **criterio visual de alto nivel, juicio estético y rechazo explícito al "AI Slop"** (diseños genéricos, predecibles o de plantilla producidos por modelos de IA). Aplica tanto a la tienda pública (`public-order-v3`) como al sistema operativo interno (`internal-chekeo-v3`).

---

## 1. 🚫 Manifiesto Anti-Slop (Lo que NUNCA debe generar la IA)

Los modelos de lenguaje tienden a converger en el "promedio estadístico" del diseño web. En Burgers.exe queda **estrictamente prohibido**:

1. **Gradientes Violetas/Púrpuras Genéricos de IA ("AI Purple"):** Cero fondos `from-purple-600 to-indigo-600` o efectos de brillo ultravioleta cliché.
2. **Hero Sections Centradas Perezosas:** No generar títulos genéricos centrados con tres tarjetas idénticas debajo solo para "rellenar espacio".
3. **Ilustraciones y Formas Flotantes Sin Sentido:** Cero "blobs" SVG decorativos, círculos borrosos aleatorios o iconos dentro de círculos de colores sin propósito funcional.
4. **Tarjetas Monótonas de 3 Columnas:** Las grillas deben responder al contenido real del producto y a la experiencia móvil, no a plantillas de landing pages SaaS.
5. **Micro-textos Ilegibles o Grises Desvanecidos:** Todo texto debe tener contraste nítido y legible (mínimo 4.5:1 conforme a WCAG 2.1 AA). Prohibido `text-gray-300` sobre fondos claros.
6. **Controles sin Feedback Táctil:** Prohibido dejar botones o tarjetas interactivas sin estados explícitos de `:hover`, `:active` (pulsación táctil) y `:focus-visible`.
7. **Espaciados Accidentales:** Cero márgenes desproporcionados que obliguen a scroll innecesario o agrupen elementos sin relación semántica.

---

## 2. 🍔 Pilares de Diseño Food-Tech & E-Commerce (Burgers.exe)

### A. Apetito y Jerarquía de Producto
* **Protagonismo del Producto:** Los platillos, fotos y opciones deben lucir apetecibles, con fotos nítidas resueltas desde Cloudflare R2 (`resolveCatalogAssetUrl`).
* **Tipografía con Intención y Tensión:**
  - Títulos principales en `font-black tracking-tight text-text-primary`.
  - Precios claros con números tabulares: `font-black tabular-nums text-text-primary` o `text-accent`.
  - Etiquetas y metadatos secundarios en `text-xs font-semibold text-text-secondary`.
* **Modificadores Críticos en Alto Contraste:**
  - `🔴 SIN [Ingrediente]` (Rojo distintivo para exclusiones).
  - `🟢 +EXTRA [Ingrediente]` (Verde bosque para adiciones).
  - `📝 [Nota de cocina]` (Ámbar cálido para notas especiales).

### B. Superficies, Capas y Elevación Limpia
Construir profundidad mediante capas sutiles en lugar de bordes negros duros:
```text
Capa 0: Fondo General         -> bg-background      (#F5F2EE claro / #121212 dark)
Capa 1: Tarjetas y Contenedor  -> bg-surface-card    (#FFFFFF claro / #1E1E1E dark) + border border-line + shadow-card
Capa 2: Elementos Elevados     -> bg-surface-raised  (#EAE6E1 claro / #282828 dark)
Capa 3: Modales y Drawers      -> bg-surface-card    + shadow-panel + backdrop-blur
```

---

## 3. 🎛️ Calibración de Design Dials

Ajusta la personalidad del diseño según la aplicación y el caso de uso:

| Parámetro (1–10) | `public-order-v3` (Tienda Clientes) | `internal-chekeo-v3` (POS / Cocina) |
|---|:---:|:---:|
| **Variance (Creatividad & Editorial)** | **7/10** (Apetecible, cálido, storytelling) | **3/10** (Funcional, ultra-consistente, estricto) |
| **Motion Intensity (Física & Animación)** | **6/10** (Resortes suaves, micro-taps, sheets) | **2/10** (Cero distracción, instantáneo $<100\text{ms}$) |
| **Visual Density (Información / Espacio)** | **5/10** (Mobile-first cómodo, respirable) | **9/10** (Alta densidad, glanceable a 2 metros) |

---

## 4. ✨ Micro-Interacciones y Tactilidad

1. **Feedback Háptico Visual:**
   - Botones y tarjetas clicables deben incluir `active:scale-[0.98] transition-transform duration-100 ease-out`.
2. **Incrementos Reactivos (Bump Effect):**
   - Al agregar productos al carrito, el contador debe realizar una sutil animación de escala (`scale-110` -> `scale-100`).
3. **Transiciones Rápidas y No Bloqueantes:**
   - Duración recomendada para hover/fade: `150ms` a `200ms`.
   - Curva de animación: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out elástico sutil).
4. **Respeto a `prefers-reduced-motion`:**
   - Si el usuario prefiere movimiento reducido, apagar escalas y desplazamientos; mantener cambios instantáneos de opacidad.

---

## 5. 🛠️ Checklist de Calidad "Taste" para Pull Requests

Antes de considerar un componente o pantalla completado:
- [ ] ¿Tiene personalidad propia de Burgers.exe o parece una plantilla descargada?
- [ ] ¿El contraste de texto cumple WCAG 2.1 AA en modo claro y modo oscuro?
- [ ] ¿Todos los botones y elementos táctiles miden $\ge 44\text{px} \times 44\text{px}$?
- [ ] ¿Cuenta con estado `:focus-visible` para accesibilidad por teclado?
- [ ] ¿La información crítica (precio, ingredientes, estado del pedido) se lee en menos de 2 segundos?
- [ ] ¿Se eliminaron todos los gradientes o sombras artificiales innecesarias?

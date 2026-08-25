# 🏗️ Arquitectura V3 y Estándares de Estilo

## Estructura del Monorepo
- `apps/public-order-v3`: Aplicación pública para clientes (menú en vivo, personalización, checkout, confirmación).
- `apps/internal-chekeo-v3`: Aplicación interna protegida por PIN (comandas KDS, cocina en foco, cobros, administración).
- `packages/config`: Esquemas Zod compartidos (`MenuItem`, `OrderV2`, `Ingredients`, `Raffles`).
- `packages/ui`: Componentes base accesibles de Radix UI / shadcn.
- `functions/api`: Backend centralizado con router Hono.js sobre Cloudflare Pages Functions.

## Principios de Estilo y UX
- **Estética Premium Casual**:
  - Fondo claro: Crema suave (`#F5F2EE`)
  - Tarjetas: Blanco puro (`#FFFFFF`) con bordes sutiles y sombras limpias
  - Acento: Verde bosque (`#16A34A` / `#22C55E`)
  - Dark Mode: Slate/Carbón (`#121212` / `#1E1E1E`)
  - Tipografía: Inter
- **Mobile First**: Viewport móvil como primera prioridad; targets táctiles de mínimo 44px.

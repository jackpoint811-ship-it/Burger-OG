# 🌟 Catálogo Curado de Servidores MCP y Skills para Burgers.exe

Este catálogo reúne las extensiones más útiles para optimizar la operación de Burgers.exe.

---

## 1. Cloudflare & Edge Storage

### Cloudflare MCP (`@cloudflare/mcp-server-cloudflare`)
* **Qué hace**: Permite consultar el estado de bases de datos D1 (`burgers-exe-menu-v2-production`, `burgers-exe-menu-v2-preview`), inspeccionar buckets de assets R2 y verificar el estado de despliegues de Cloudflare Pages.
* **Instalación**:
  ```bash
  npx -y @smithery/cli install @cloudflare/mcp-server-cloudflare --client antigravity
  ```

---

## 2. Pruebas Automatizadas & Navegación

### Playwright / Browser MCP
* **Qué hace**: Permite controlar navegadores headless para ejecutar tests de integración, verificar el catálogo público, flujo de personalización de combos y despacho en el KDS de Cocina.

---

## 3. Base de Datos Local

### SQLite MCP (`mcp-server-sqlite`)
* **Qué hace**: Inspección directa de la base de datos local generada por wrangler durante `npm run dev:public` o `npm run dev:chekeo`.

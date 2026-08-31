---
name: skill-mcp-finder
description: >-
  Buscador, evaluador e instalador de Servidores MCP (Model Context Protocol) y Agent Skills
  para Burgers.exe. Permite consultar Smithery (@smithery/cli) y skills.sh (npx skills)
  para encontrar herramientas de Cloudflare, Playwright, WhatsApp, UI/UX, SQLite, A11y y más.
---

# 🔍 Skill: Skill & MCP Finder para Burgers.exe

Permite al agente y al equipo buscar, evaluar e instalar rápidamente Servidores MCP (Model Context Protocol) y Agent Skills desde la terminal utilizando los registros oficiales de **Smithery (`@smithery/cli`)** y **skills.sh (`npx skills`)**.

---

## 1. Comandos de Búsqueda Rápida

### A. Script Interactivo Local
Puedes ejecutar el script helper integrado:

```bash
node .agents/skills/skill-mcp-finder/scripts/search-mcps.mjs <termino>
```

Ejemplos:
```bash
node .agents/skills/skill-mcp-finder/scripts/search-mcps.mjs cloudflare
node .agents/skills/skill-mcp-finder/scripts/search-mcps.mjs playwright
node .agents/skills/skill-mcp-finder/scripts/search-mcps.mjs accessibility
```

### B. Búsqueda de Servidores MCP con Smithery
```bash
npx -y @smithery/cli search <termino>
```

### C. Búsqueda e Instalación de Skills con skills.sh
```bash
# Buscar skills en el registro de 85k+ skills
npx skills search <termino>

# Instalar un skill en el repositorio local
npx skills add <nombre-del-skill>
```

---

## 2. Servidores MCP y Skills Relevantes para Burgers.exe

Consulta [`references/popular-restaurant-mcps.md`](./references/popular-restaurant-mcps.md) para ver la lista curada:

| Categoría | Servidor / Skill | Utilidad en Burgers.exe |
|---|---|---|
| **Infraestructura Cloudflare** | `@cloudflare/mcp-server-cloudflare` | Inspeccionar D1 (`burgers-exe-menu-v2-*`), R2 buckets y deployments de Pages. |
| **Pruebas Automatizadas** | `playwright-mcp` / `browser-tools` | Ejecución de tests E2E y validaciones visuales de la tienda y KDS. |
| **Base de Datos Local** | `mcp-server-sqlite` | Consultas directas sobre archivos `.wrangler/state/v3/d1/...`. |
| **Diseño & UI/UX** | `shadcn-ui` / `taste-skill` / `dynamic-ui-components` | Composición visual, feedback táctil y estética Premium Casual. |
| **Notificaciones & Tickets** | `resend-mcp` / `whatsapp-api` | Generación y envío automatizado de recibos y tickets térmicos. |

---

## 3. Instalación de un MCP en Antigravity / Gemini CLI

Para instalar cualquier MCP encontrado en Smithery en tu entorno local:

```bash
npx -y @smithery/cli install <mcp-name> --client antigravity
```

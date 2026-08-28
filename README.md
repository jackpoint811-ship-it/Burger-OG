# Burgers.exe V3

Burgers.exe V3 is the modern multi-app architecture and official production stack for the Burgers.exe ecosystem, running on Cloudflare Pages Functions, Cloudflare D1 (SQLite), and Cloudflare R2 object storage.

## Official V3 Architecture

- **Public Ordering App**: `apps/public-order-v3`
  - Customer-facing ordering progressive web app built with React 18/19, Vite 6, Tailwind CSS v4, Radix UI primitives, Zustand v5, and TanStack Query v5.
  - Follows the **Premium Casual Vibe** design system (warm cream `#F5F2EE`, white cards `#FFFFFF`, forest green `#16A34A`, Inter typography).
  - Production URL: <https://burgers-exe.pages.dev>
- **Internal Chekeo App**: `apps/internal-chekeo-v3`
  - Kitchen Display System (KDS), orders management, cash cuts, payments, raffles administration, and menu catalog management.
  - Production URL: <https://chekeo2-0.pages.dev>
- **Centralized Backend Router**: `functions/api/[[route]].ts`
  - Hono.js v4 API router running on Cloudflare Pages Functions with 13 specialized sub-routers.
- **Shared Packages**:
  - `packages/config`: TypeScript types, Zod schemas, runtime environment detection, bank payment config, and Cloudflare R2 asset URL resolver (`resolveCatalogAssetUrl`).
  - `packages/ui`: Accessible, reusable UI component primitives (shadcn-inspired on Radix UI and Tailwind CSS v4).
- **Persistence & Storage**:
  - Cloudflare D1 (`BOG_MENU_DB`): Source of truth for catalog, orders, operations, kitchen queue, and raffle records.
  - Cloudflare R2 (`BOG_MENU_ASSETS`): Source of truth for product images, category banners, and campaign assets.
- **Security & Authentication**:
  - Internal Chekeo PIN authentication (`BOG_INTERNAL_PIN`) backed by HttpOnly session cookie (`bog_internal_session`).

## Repository Layout

```text
/workspaces/Burgers-exe/
├── apps/
│   ├── internal-chekeo-v3/   # Internal operations & KDS dashboard
│   └── public-order-v3/      # Public customer ordering UI (Premium Casual)
├── packages/
│   ├── config/               # Types, Zod schemas, assets, constants
│   └── ui/                   # Accessible UI components (Radix + Tailwind v4)
├── functions/
│   └── api/                  # Centralized Hono.js v4 API router & 13 sub-routes
├── migrations/               # D1 SQL schemas (menu, seed, orders)
├── docs/
│   └── codex-memory/         # Living memory notes for Codex & Obsidian
├── tests/                    # Playwright test suites (e2e, visual, kitchen)
├── wrangler.production.toml  # Cloudflare deployment configuration
└── PROJECT.md                # Project status & architecture blueprint
```

## Quick Start & Developer Scripts

### Installation
```bash
npm install
```

### Development
```bash
# Public ordering app (http://localhost:5173)
npm run dev:public

# Internal Chekeo app (http://localhost:5173 with proxy to Pages Functions)
npm run dev:chekeo
```

### Build & Verification
```bash
# Typecheck entire monorepo
npm run typecheck

# Build individual apps
npm run build:public   # Output: dist/public-order-v3
npm run build:chekeo   # Output: dist/internal-chekeo-v3

# Build both applications
npm run build

# Visual QA & E2E Tests
npm run qa:visual
```

### Local Preview
```bash
npm run preview:public  # Preview public order PWA at http://127.0.0.1:4173
npm run preview:chekeo  # Preview internal chekeo at http://127.0.0.1:4174
```

## Working Documentation & Memory

- **Project Blueprint**: `PROJECT.md`
- **Living Memory Index**: `docs/codex-memory/00-indice.md`
- **V3 Migration Bitácora**: `docs/codex-memory/22-v3-bitacora.md`
- **Agent Workflow & Rules**: `AGENTS.md` and `docs/codex-memory/08-agent-workflow.md`
- **QA & Verification Checklists**: `docs/codex-memory/09-checklists.md`
- **Current Operational State**: `docs/codex-memory/01-estado-actual.md`
- **Technical Decisions Log**: `docs/codex-memory/07-decisiones.md`

## Environment Policy

- **Isolation**: Production and preview environments must never share database writes or mutating operations.
- **Resource Segregation**: Preview environments must use dedicated preview D1 databases and R2 buckets (`burgers-exe-menu-v2-preview`, `burgers-exe-assets-v2-preview`).
- **Safety**: Local development runs with `--local` flags and must never point to production secrets or production D1 instances.

## Repository Governance

- `AGENTS.md` is the authoritative rule set for all automated agents and human contributors.
- **Branching**: All work branches from `v3` (`git checkout -b feat/... v3`) and all Pull Requests target `v3` (`gh pr create --base v3`).
- `main` remains protected in production until the final cutover approval.

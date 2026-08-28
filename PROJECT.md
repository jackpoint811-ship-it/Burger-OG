# Project: Burgers.exe V3 Post-Migration Compliance & Cleanup

## Architecture
Burgers.exe V3 is a modern multi-app architecture operating on Cloudflare Pages Functions, Cloudflare D1 (SQLite), and Cloudflare R2:
- **`apps/public-order-v3/`**: Customer-facing ordering progressive web app built with React 19, Vite, Tailwind CSS v4, and Radix UI primitives. Follows the **Premium Casual** aesthetic (warm white `#F5F2EE`, forest green `#16A34A`).
- **`apps/internal-chekeo-v3/`**: Operations, kitchen display system (KDS), orders management, cash cuts, payments, and raffle administration.
- **`packages/config/`**: Shared TypeScript contracts, Zod schemas, asset resolvers (`resolveCatalogAssetUrl`), environment detection, and bank payment configurations.
- **`packages/ui/`**: Reusable, accessible UI primitives (shadcn-inspired on Radix UI).
- **`functions/api/`**: Centralized Hono.js v4 API router (`[[route]].ts`) hosting 12 specialized sub-routers interfacing with D1 database (`BOG_MENU_DB`) and R2 storage (`BOG_MENU_ASSETS`).

## Feature Inventory
| # | Feature / Area | Description | Milestone | Source |
|---|----------------|-------------|-----------|--------|
| 1 | App Reachability & V2 Purge Audit | Verify 100% reachability of all files in `apps/public-order-v3` and `apps/internal-chekeo-v3`, confirm zero `apps/*-v2` directories remain. | M3 | Survey 1 |
| 2 | Packages & Backend Routing Audit | Verify `packages/config`, `packages/ui`, and Hono sub-routers in `functions/api/` are typed and reachable with zero broken imports. | M3 | Survey 2 |
| 3 | Tooling & Test Runner Alignment | Update Playwright test configurations (`playwright.e2e.config.ts`, `playwright.internal-kitchen.config.ts`) from `dist/*-v2` to `dist/*-v3` and `preview:chekeo`. | M1 | Survey 1, Survey 2 |
| 4 | Repository Hygiene & Stray Assets | Clean up stray root artifacts (e.g. root `.png`), update `.gitignore` for `.graphifyignore` and `.vscode/`. | M1 | Survey 2, Survey 3 |
| 5 | Governance & Root Documentation | Update `README.md`, `AGENTS.md` headers, and `PROJECT.md` to reflect V3 architecture and Premium Casual aesthetic. | M2 | Survey 3 |
| 6 | Codex Memory Synchronization | Update `docs/codex-memory/` (`00-indice.md`, `02-reglas-del-proyecto.md`, `09-checklists.md`, `22-v3-bitacora.md`) to reflect V3 status. | M2 | Survey 3 |
| 7 | Auth & Feature State Verification | Audit `auth.api.ts` in `internal-chekeo-v3` to ensure clean type safety and no broken fallbacks. | M3 | Survey 3 |
| 8 | Workspace Build & Type Safety | Verify `npm run typecheck`, `npm run build:public`, `npm run build:chekeo`, and `git diff --check` across the repo. | M4 | Survey 1, 2, 3 |
| 9 | Forensic Integrity & Adversarial Audit | Execute forensic auditor checks to confirm zero cheating, dummy facades, or unverified claims. | M4 | Survey 1, 2, 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Tooling & Test Configurations Alignment | Update Playwright configs, wrangler TOML, `.gitignore`, and clean stray root artifacts | none | DONE |
| M2 | Documentation & Memory Synchronization | Align `README.md`, `AGENTS.md`, and `docs/codex-memory/` with V3 architecture | M1 | DONE |
| M3 | Code Consistency & Workspace Hardening | Verify auth API consistency, ensure zero dangling references or broken paths | M1 | PLANNED |
| M4 | Final E2E Test Pass & Audit Verification | Complete end-to-end verification, typechecks, builds, challenger & forensic audits | M1, M2, M3 | PLANNED |

## Interface Contracts
### Client Apps ↔ Backend API
- Base path: `/api/*` handled by Cloudflare Pages Function `functions/api/[[route]].ts`.
- Menu endpoint: `GET /api/menu-v2` returns `MenuApiResponse` (categories, items, promos, banners, towerSchedules).
- Orders endpoint: `POST /api/orders-v2` consumes `CreateOrderV2Payload` and returns `OrderResponse`.
- Chekeo Admin: `/api/orders-v2-admin/*`, `/api/kitchen-v2-admin/*`, `/api/menu-v2-admin/*`, `/api/raffles-v2-admin/*` authenticated via HttpOnly cookie `bog_internal_session` or PIN header.

### Shared Packages ↔ Applications
- `@config/*` mapped to `packages/config/src/*`: provides Zod schemas, asset URL resolver `resolveCatalogAssetUrl`, and runtime environment flags.
- `@ui/*` mapped to `packages/ui/src/*`: provides Radix UI primitives.

## Code Layout
```
/workspaces/Burgers-exe/
├── apps/
│   ├── internal-chekeo-v3/   # Internal operations & KDS dashboard
│   └── public-order-v3/      # Public customer ordering UI (Premium Casual)
├── packages/
│   ├── config/               # Types, Zod schemas, assets, constants
│   └── ui/                   # Accessible UI components (Radix + Tailwind v4)
├── functions/
│   └── api/                  # Hono.js v4 API router & 12 sub-routes
├── docs/
│   └── codex-memory/         # Living memory notes for Codex
├── e2e/                      # Playwright E2E and visual test specs
└── dist/                     # Target build outputs (public-order-v3, internal-chekeo-v3)
```

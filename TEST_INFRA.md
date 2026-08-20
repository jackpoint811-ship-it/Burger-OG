# TEST_INFRA.md — Burgers.exe V3 Test Infrastructure & Comprehensive E2E Plan

This document establishes the official test infrastructure, runner configuration, test matrix, and opaque-box requirement-driven 4-Tier test plan for **Burgers.exe V3**.

---

## 1. Test Architecture & Infrastructure Overview

Burgers.exe V3 employs a multi-app frontend and serverless backend architecture:
- **`apps/public-order-v3/`**: Customer-facing ordering PWA (React 19, Tailwind CSS v4, Radix UI).
- **`apps/internal-chekeo-v3/`**: Kitchen Display System (KDS), orders management, cash cuts, payments, and admin workspace.
- **`packages/config/`**: Shared Zod schemas, DTOs, environment contracts, and R2 asset resolvers.
- **`packages/ui/`**: Accessible UI primitives (Radix UI + Tailwind v4).
- **`functions/api/`**: Centralized Hono.js v4 router interfacing with Cloudflare D1 (`BOG_MENU_DB`) and R2 (`BOG_MENU_ASSETS`).

### Test Runner Stack
- **Framework**: Playwright Test (`@playwright/test` v1.60.0).
- **Browser Engines**: Chromium Headless Shell (v145.0.7632.6 / v1223).
- **Static Type Checking**: TypeScript Compiler (`tsc --noEmit`).
- **Build Verification**: Vite v6 (`npm run build:public`, `npm run build:chekeo`).
- **Configurations**:
  - `playwright.e2e.config.ts`: End-to-end multi-app integration runner mounting both Public and Chekeo apps.
  - `playwright.internal-kitchen.config.ts`: Internal operations and Kitchen Display System test runner.
  - `playwright.visual.config.ts`: Visual preflight, responsive viewport regression, and ticket lookup runner.

---

## 2. Four-Tier Opaque-Box E2E Test Plan

The E2E test plan is structured across 4 distinct testing tiers, ensuring complete opaque-box requirements coverage, adversarial robustness, pairwise cross-feature validation, and realistic user journeys.

```
┌─────────────────────────────────────────────────────────────┐
│ TIER 4: Real-World Application Scenarios (>= 5 Scenarios)   │
├─────────────────────────────────────────────────────────────┤
│ TIER 3: Cross-Feature Combinations (Pairwise Coverage)      │
├─────────────────────────────────────────────────────────────┤
│ TIER 2: Boundary & Corner Cases (>= 5 per Feature)         │
├─────────────────────────────────────────────────────────────┤
│ TIER 1: Feature Coverage (>= 5 per Feature)                │
└─────────────────────────────────────────────────────────────┘
```

---

### Tier 1: Feature Coverage (>= 5 tests per feature)

Verifies nominal behavior (happy paths) for every primary functional requirement without relying on internal implementation details.

#### Feature 1: Kitchen Item Line Classification & Fallback
- **T1.1.1 — Mega Combo Classification**: Verifies item with combo structure is parsed into `combo` kind with full burger, side, and drink breakdown (`🍔 1 Burger · 🍟 1 Side · 🥤 1 Bebida`).
- **T1.1.2 — French Fries Classification**: Verifies garnish item is categorized as `garnish` and routed to the Side Quest queue (`🍟 1 Side`).
- **T1.1.3 — Drink Classification**: Verifies beverage item is categorized as `drink` and routed to the Side Quest queue (`🥤 1 Bebida`).
- **T1.1.4 — Non-Production Extra Classification**: Verifies standalone modifier/extra (e.g. `Extra Queso`) without parent line is classified as `other` and excluded from production queue.
- **T1.1.5 — OG Smash Burger Classification**: Verifies standalone burger is classified as `burger` and placed in the main preparation queue (`🍔 1 Burger`).

#### Feature 2: Catalog Promotional Banners Management
- **T1.2.1 — Public Active Filter**: Verifies public catalog renders active banners and filters out inactive ones.
- **T1.2.2 — Admin Active Banner List**: Verifies admin API endpoint returns active banners with correct sorting.
- **T1.2.3 — Admin Inactive Banner List**: Verifies admin API endpoint retains inactive banners for management.
- **T1.2.4 — Unauthenticated Banner Protection**: Verifies unauthenticated access to admin banner endpoints returns `401 Unauthorized`.
- **T1.2.5 — Admin Banners Panel UI**: Verifies admin workspace displays the banner configuration drawer and lists all active and inactive entries.

#### Feature 3: Customer Checkout Phone Normalization
- **T1.3.1 — International Format Normalization (`+52 55 1234 5678`)**: Verifies +52 with spaces is stripped and normalized to 10-digit format (`5512345678`).
- **T1.3.2 — National Format with Country Code (`52 55 1234 5678`)**: Verifies leading 52 with spaces is normalized to 10 digits (`5512345678`).
- **T1.3.3 — Compact International Format (`+525512345678`)**: Verifies compact +52 prefix is normalized to 10 digits (`5512345678`).
- **T1.3.4 — Compact National Format (`525512345678`)**: Verifies compact 52 prefix is normalized to 10 digits (`5512345678`).
- **T1.3.5 — Standard 10-Digit Format (`5512345678`)**: Verifies standard 10-digit number passes validation cleanly without modification.

#### Feature 4: Kitchen Operations & Status Progression
- **T1.4.1 — Order Status: New to Preparing**: Moves order from incoming queue to active preparation.
- **T1.4.2 — Order Status: Preparing to Ready**: Advances order from preparation to ready/dispatch counter.
- **T1.4.3 — Item Done Toggling**: Marks an individual burger line as completed within an active order.
- **T1.4.4 — Multi-Burger Partial Revert**: Reverts a completed burger line without affecting other completed lines.
- **T1.4.5 — Summary K Aggregation**: Verifies shift summary accurately counts burgers, sides, drinks, and estimated costs.

#### Feature 5: Raffle Administration & Participant Lookups
- **T1.5.1 — Public Ticket Lookup**: Verifies customer lookup by 10-digit phone returns earned tickets.
- **T1.5.2 — Referral Code Search**: Verifies admin search filters participants by unique referral code.
- **T1.5.3 — Manual Ticket Adjustment**: Grants manual bonus tickets to a participant with audit trail.
- **T1.5.4 — Adjustment Reversion**: Reverts a manual adjustment and updates participant total tickets immediately.
- **T1.5.5 — Campaign Summary Calculation**: Verifies campaign base tickets, extra tickets, and participant counts match.

---

### Tier 2: Boundary & Corner Cases (>= 5 tests per feature)

Tests extremes, malformed inputs, special characters, and boundary limits.

#### Feature 1: Kitchen Line Fallback Boundaries
- **T2.1.1 — Empty Name Fallback**: Item with blank/whitespace name defaults safely to burger category without crashing.
- **T2.1.2 — Multiple Keywords Priority**: Item name containing both "combo" and "drink" correctly prioritizes combo categorization.
- **T2.1.3 — Case-Insensitive Keywords**: Mixed-case input (e.g. `paPAs FRanceSAs`) matches garnish classification.
- **T2.1.4 — Trailing/Leading Whitespace**: Item name wrapped in excessive spaces (`   fries   `) is trimmed and classified properly.
- **T2.1.5 — Ultra-Long Item Names**: Extremely long item name (>200 characters) containing keywords classifies correctly without layout overflow.

#### Feature 2: Catalog Banners Boundaries
- **T2.2.1 — Empty Banner Database**: Gracefully renders catalog when zero banners exist in D1.
- **T2.2.2 — SQL Injection & Special Characters in Title**: Input like `Banner'; DROP TABLE catalog_banners; --` is escaped and safely handled.
- **T2.2.3 — Large Volume Banners (>50 Entries)**: Verifies carousel/rail paginates and sorts large banner collections without performance degradation.
- **T2.2.4 — Extreme Sort Order Indices**: Supports negative (`-50`) and high (`1000`) sort orders with consistent DOM ordering.
- **T2.2.5 — Malformed Authorization Tokens**: Rejects malformed tokens (`Bearer SQL' OR 1=1`, `Token basic-auth`) with 401/403.

#### Feature 3: Checkout Phone Boundaries
- **T2.3.1 — Non-Mexican Country Code (`+1 555 123 4567`)**: Rejects foreign country codes with inline error message.
- **T2.3.2 — Short Number (`55123`)**: Rejects numbers with fewer than 10 digits and halts order submission.
- **T2.3.3 — Excessively Long Number (`5255123456789`)**: Rejects numbers with more than 12 digits (or >10 digits post-strip).
- **T2.3.4 — Alphanumeric Phone Input (`55abc1234567`)**: Strips/rejects alphabetic characters and blocks submission.
- **T2.3.5 — Prefix-Only Input (`52`)**: Rejects input containing only country prefix.

#### Feature 4: Kitchen Operations Boundaries
- **T2.4.1 — Locked Terminal Statuses**: Verifies delivered and cancelled orders cannot be transitioned back to preparing.
- **T2.4.2 — Ready Order Kitchen Revert**: Allows a `ready` order to revert to `preparing` when an item is marked incomplete.
- **T2.4.3 — Summary K No-Recipes Fallback**: Displays clear fallback message when recipe database is offline.
- **T2.4.4 — Duplicate Burger Aggregation**: Correctly groups and aggregates duplicate burger SKUs in Summary K.
- **T2.4.5 — Mobile-320 Layout Overflow**: Verifies zero horizontal overflow (`scrollWidth <= clientWidth`) on 320px screens.

#### Feature 5: Raffle Administration Boundaries
- **T2.5.1 — Unregistered Phone Lookup**: Returns clean `found: false` response for unregistered phone numbers.
- **T2.5.2 — Zero/Negative Ticket Adjustment**: Rejects non-positive ticket adjustment deltas.
- **T2.5.3 — Duplicate Revert Protection**: Prevents reverting an already reverted ticket adjustment.
- **T2.5.4 — Extreme Reason Text Length**: Safely stores and renders long adjustment reason explanations (>500 chars).
- **T2.5.5 — Participant Name Special Characters**: Handles accented letters, emoji, and punctuation in participant queries.

---

### Tier 3: Cross-Feature Combinations (Pairwise Coverage)

Validates interactions between disparate system modules and data flows.

- **T3.1 — Checkout Phone Normalization + Kitchen Display Ingestion**: An order submitted with `+52` phone formatting is stored, normalized, and displayed with clean 10-digit phone contact details in the Kitchen Display and Orders Drawer.
- **T3.2 — Admin Banner Management + Public Catalog Display**: Toggling a banner's `isActive` state in the Chekeo Admin panel immediately updates its visibility in the customer-facing Catalog Carousel.
- **T3.3 — Order State Machine + Summary K Live Aggregation**: Moving orders between `new`, `preparing`, and `ready` updates real-time count metrics and ingredient deductions in Summary K.
- **T3.4 — Order Submission + Raffle Points Attribution + Admin Manual Adjustment**: Placing a burger order increments participant tickets, which are further modified by an admin adjustment and verified via the public `/tickets` lookup.
- **T3.5 — Database Degradation + UI Offline Resilience + Recovery**: When Cloudflare D1 returns 503, public app displays the offline fallback catalog from `mock-data.ts` without white-screening, recovering once connectivity restores.

---

### Tier 4: Real-World Application Scenarios (>= 5 Scenarios)

Simulates complete user and operator workflows from start to finish.

- **Scenario 1 — End-to-End Customer Ordering Journey**:
  1. Customer visits catalog homepage and views active promotional banners.
  2. Navigates to Burgers category, selects an OG Smash Burger, customizes extras and removed ingredients.
  3. Opens cart, reviews subtotal, proceeds to checkout.
  4. Enters name, Mexican phone with `+52` prefix, selects cash payment, and submits order.
  5. Receives order confirmation modal with folio and WhatsApp notification link.

- **Scenario 2 — Promotional Banner Full Lifecycle**:
  1. Admin logs into Chekeo Admin and navigates to Banners panel.
  2. Creates a new promotional banner with CTA and sort order.
  3. Verifies new banner appears in public catalog carousel.
  4. Edits banner to inactive state; verifies immediate removal from public catalog.
  5. Deletes banner; verifies clean deletion from D1 database.

- **Scenario 3 — Multi-Item Kitchen Production & Item-Level Workflow**:
  1. Multi-item order arrives in Kitchen Display containing 1 combo, 2 fries, and 1 soda.
  2. Kitchen staff moves order to `preparing`.
  3. Prep cook completes burger in preparation station; Side Quest cook completes fries and drink.
  4. Cook accidentally marks wrong burger done and reverts it; only the targeted burger reopens.
  5. All items completed; order automatically moves to `ready` for counter pickup.

- **Scenario 4 — Admin Security & Access Gating**:
  1. Unauthenticated user attempts to access `/admin` or Chekeo operations.
  2. Global PIN authentication gate intercepts request.
  3. User enters incorrect PIN; system rejects with error.
  4. User enters valid PIN; session cookie is established and full operations shell unlocks.
  5. User conducts cash cut review and safely closes session.

- **Scenario 5 — High-Load Database Outage & Resilient Fallback**:
  1. Cloudflare D1 database experiences simulated downtime (503 response).
  2. Public catalog intercepts failure and loads cached offline catalog from `@config/mock-data`.
  3. Banner informs user that offline backup catalog is active.
  4. D1 service recovers; public app automatically resumes live catalog synchronization.

---

## 3. Test Suite Inventory & File Map

| Spec File | Test Count | Scope & Tiers Covered | Command |
|---|---|---|---|
| `tests/e2e-catalog-kitchen.spec.ts` | 38 tests | Tiers 1–4: Feature coverage, boundaries, pairwise combinations, real-world scenarios | `npx playwright test tests/e2e-catalog-kitchen.spec.ts` |
| `tests/internal-chekeo/kitchen-production-board.spec.ts` | 30 tests | Internal operations, KDS board, Summary K, raffle adjustments, responsive layout (320–1280px) | `npx playwright test --config=playwright.internal-kitchen.config.ts` |
| `tests/internal-chekeo/kitchen-screenshots.spec.ts` | 11 tests | Visual snapshot verification across mobile 320, 390, 430 and desktop 1280 | `npx playwright test tests/internal-chekeo/kitchen-screenshots.spec.ts` |
| `tests/visual/public-preflight.spec.ts` | 8 tests | Public visual preflight across 7 viewports (320–1440px) + public raffle lookup | `npx playwright test --config=playwright.visual.config.ts` |
| `tests/preview/phase-9a-preview-smoke.spec.ts` | 2 tests | Preview environment read-only smoke tests (D1 connectivity & auth gate) | `npx playwright test tests/preview/` |
| `tests/production/controlled-production-smoke.spec.ts` | 2 tests | Production environment read-only smoke tests (D1 connectivity & auth gate) | `npx playwright test tests/production/` |
| **Total** | **91 tests** | **Complete repository test coverage** | `npx playwright test` |

---

## 4. Execution Guide & Commands

### Prerequisites
```bash
# Install Playwright Chromium browser binaries
npx playwright install chromium
```

### Static Typechecking & Builds
```bash
# Typecheck entire workspace (0 errors expected)
npm run typecheck

# Build Customer Public Ordering App
npm run build:public

# Build Internal Chekeo Operations App
npm run build:chekeo

# Whitespace and formatting verification
git diff --check
```

### Running Test Suites
```bash
# 1. Run full 4-Tier E2E Suite (38 tests)
npx playwright test tests/e2e-catalog-kitchen.spec.ts

# 2. Run Internal Kitchen & Operations Suite (41 tests)
npx playwright test --config=playwright.internal-kitchen.config.ts

# 3. Run Public Visual Preflight Suite (8 tests)
npx playwright test --config=playwright.visual.config.ts

# 4. Run All Active Test Suites in Repository (91 tests)
npx playwright test
```

---

## 5. Defect Reporting & Escalation Protocol

When a test failure occurs during verification:
1. **Classify Failure**: Determine whether it is a test defect (outdated selector/assertion) or an application defect (contract violation, UI bug, broken calculation).
2. **Isolate Reproduction**: Reproduce with `--trace=on` or screenshot capture in `test-results/`.
3. **Escalate Application Bugs**: Document exact component, line number, expected vs actual behavior, and notify the responsible track agent.
4. **Never Modify Production Code in Test Role**: Test writer role is strictly restricted to test code and test infrastructure configuration.

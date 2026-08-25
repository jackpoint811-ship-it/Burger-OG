# Claude Code Instructions for Burgers.exe

Please follow the rules and workflow defined in [GEMINI.md](./GEMINI.md) and [AGENTS.md](./AGENTS.md).

## Critical Rules:
1. NEVER push or PR to `main`. Use `preview` or `v3` as base.
2. NEVER add dependencies without explicit approval.
3. NEVER change data contracts (D1/Hono/Zod).
4. Maintain Premium Casual design (light cream `#F5F2EE`, forest green `#16A34A`).
5. Run `git diff --check`, `npm run typecheck`, and `npm run build` before submitting changes.

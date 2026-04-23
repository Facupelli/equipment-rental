# Agent Context

`@repo/types` contains shared enums and lightweight TypeScript contract types used across backend and web.

Run commands from `packages/types/`.

Common commands:

- `pnpm build`

Use `../docs/agent-rules/shared-packages.md` for shared-package rules.

Package-specific expectations:

- Keep exports stable and additive when possible.
- Prefer small focused files under `src/enums/` or other narrow source files rather than large catch-all modules.
- Update `src/index.ts` when adding a new public type or enum.
- Do not edit `dist/` by hand.

Representative examples:

- enum export: `src/enums/order.enum.ts`
- shared type: `src/problem-details.type.ts`
- package export surface: `src/index.ts`

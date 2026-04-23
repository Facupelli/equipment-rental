# Agent Context

`@repo/jest-config` contains shared Jest configuration presets used by backend tests.

Run commands from `packages/jest-config/` only when you need to inspect or update this package directly.

Use `../docs/agent-rules/shared-packages.md` for shared-package rules.

Package-specific expectations:

- Keep preset changes explicit and conservative because they can affect many tests indirectly.
- Prefer updating the shared preset files instead of duplicating configuration downstream.
- Use the preset files as the source of truth:
  - `index.ts`
  - `jest.config.unit.ts`
  - `jest.config.integration.ts`
  - `jest.config.e2e.ts`

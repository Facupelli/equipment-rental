# Agent Context

`@repo/typescript-config` contains shared TypeScript configuration presets for the monorepo.

Run commands from `packages/typescript-config/` only when you need to inspect or update this package directly.

Use `../docs/agent-rules/shared-packages.md` for shared-package rules.

Package-specific expectations:

- Keep changes minimal because compiler-option changes can affect many packages at once.
- Prefer compatibility with current consumers over style-motivated churn.
- Use `base.json` as the source of truth for the shared preset in this package.

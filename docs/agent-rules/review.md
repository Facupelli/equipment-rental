# Review Expectations

Use these review expectations when auditing generated or hand-written changes anywhere in the monorepo.

Primary review goals:

- find correctness bugs, regressions, and contract drift first
- call out architectural boundary violations before style issues
- identify missing validation, missing tests, or unsafe assumptions
- keep findings prioritized by severity and anchored to concrete files or behaviors

Review order:

1. Confirm the change matches the requested behavior and did not add extra features.
2. Check contract boundaries: public APIs, shared packages, generated artifacts, and cross-module imports.
3. Check data and persistence risks: migrations, schema drift, serialization, null handling, and enum changes.
4. Check operational impact: build, test, deployment, and runtime-sensitive changes.
5. Check maintainability only after correctness and architectural risks are covered.

Cross-workspace review points:

- If a change touches `packages/`, verify both the package itself and each affected consumer app still make sense.
- If a change modifies shared types or schemas, check for backward-compatibility assumptions in both backend and web.
- If a change affects generated outputs, confirm the source artifact changed rather than only the generated file.

Review output expectations:

- findings first
- brief summary second
- mention residual testing or verification gaps if confidence is still limited

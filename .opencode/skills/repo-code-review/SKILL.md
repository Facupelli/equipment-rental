---
name: repo-code-review
description: >
  Reviews a monorepo change for correctness, regressions, contract drift, and missing validation.
  Use this skill when reviewing code across backend, web, or shared packages.
---

# Repo Code Review

Use `docs/agent-rules/review.md` as the default review rubric.

## Review priorities

1. Correctness and regression risk
2. Architectural boundaries and public-contract safety
3. Shared package and cross-workspace impact
4. Missing tests or insufficient verification
5. Maintainability issues that materially increase future risk

## Output style

- findings first
- one issue per bullet
- include file references when possible
- keep summaries brief after the findings

# Backend Testing And Verification

Start with the smallest relevant validation command and broaden only if needed.

Common backend commands:

- `pnpm lint` for static checks
- `pnpm test` for the default Jest run
- `pnpm test:integration` for database-backed or module-slice integration checks
- `pnpm test:e2e` for full application flows
- `pnpm build` for compile-time verification and dependency wiring

Selection guidance:

- Use focused unit tests when domain logic changed inside one module.
- Use integration tests when repository, Prisma, transaction, or HTTP controller wiring changed.
- Use `pnpm build` when DI wiring, public contracts, or cross-module imports changed.
- Treat changes in `packages/` that affect backend consumers as cross-workspace changes and validate from the workspace or backend app as well.

Representative examples:

- order lifecycle integration coverage: `src/modules/order/application/commands/order-lifecycle.http.int-spec.ts`
- command-side service coverage: `src/modules/order/application/commands/create-order/create-order.service.spec.ts`
- domain entity coverage: `src/modules/order/domain/entities/order.entity.spec.ts`

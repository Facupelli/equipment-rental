# Canonical Logging in NestJS — A Complete Guide

---

## Part 1 — What is Canonical Logging?

### The Problem with Traditional Logging

In a typical Node.js application, logs are scattered. A single HTTP request might generate a dozen individual log lines:

```
[INFO]  Incoming request: POST /users
[INFO]  Validating payload...
[DEBUG] DB query executed in 12ms
[INFO]  User created with id=abc123
[INFO]  Email notification sent
[INFO]  Response sent: 201
```

This is _fine_ for local debugging. But in production, with thousands of concurrent requests, this becomes a nightmare. To understand what happened during a single request, you must:

1. Find a unique request ID buried somewhere in those logs
2. Issue a complex query to collate all lines sharing that ID
3. Manually piece together the full picture

This is slow, expensive (you're scanning gigabytes of data), and requires complex query syntax.

### The Canonical Log Line Pattern

Popularized by [Stripe's engineering blog](https://stripe.com/blog/canonical-log-lines), the canonical log pattern is elegantly simple:

> **Emit one single, information-dense log line at the end of each request that captures all key telemetry in one place.**

This is _in addition to_ — not a replacement for — your regular logs. Think of it as a "summary event" for the entire unit of work.

A canonical log looks like this:

```json
{
  "type": "canonical",
  "timestamp": "2024-01-15T14:32:11.432Z",
  "requestId": "req_9f3a1b2c",
  "httpMethod": "POST",
  "httpPath": "/users",
  "httpStatus": 201,
  "durationMs": 87,
  "userId": "usr_abc123",
  "dbQueries": 3,
  "dbDurationMs": 34,
  "errorCode": null,
  "service": "user-service",
  "environment": "production"
}
```

With this single line per request, you can now answer powerful questions instantly:

- "Which endpoints are slowest?" — query `durationMs` grouped by `httpPath`
- "Is this user hitting errors consistently?" — filter by `userId` + `httpStatus >= 500`
- "Is DB latency correlated with our slow requests?" — plot `dbDurationMs` vs `durationMs`
- "How many requests came in the last 5 minutes?" — count by timestamp

No joins. No collating. One event, one answer.

### The Observability Triangle

Canonical logs occupy a unique middle ground in the observability stack:

```
                    ┌─────────────────────────────────────────┐
                    │           METRICS (Prometheus)          │
     Fast to query  │  "What % of requests returned 500?"     │
     Low flexibility│  Known questions only                   │
                    └─────────────────────────────────────────┘
                    ┌─────────────────────────────────────────┐
                    │         CANONICAL LOGS ← You are here   │
    Medium speed    │  "Show me all slow requests from        │
    High flexibility│   user X with DB errors this hour"      │
                    └─────────────────────────────────────────┘
                    ┌─────────────────────────────────────────┐
                    │           RAW TRACES (log lines)        │
    Slow to query   │  Full request journey, step by step     │
    Max detail      │  High noise, complex queries needed     │
                    └─────────────────────────────────────────┘
```

### Key Design Principles

**1. Mutate, don't append.** The canonical log is built incrementally throughout the request lifecycle. Different parts of your code (middleware, guards, services, interceptors) _add fields_ to the same log object. It's emitted once — at the end.

**2. Use AsyncLocalStorage for context propagation.** This is the key technical mechanism. Node.js's `AsyncLocalStorage` lets you attach a "context store" to an async call chain. Any code that runs within the same request's async scope can read and write to this store without passing it explicitly through every function.

**3. Emit on request completion.** The canonical log is flushed in a response interceptor, after the handler and all middleware have finished. At that point, it has accumulated data from every layer of the stack.

**4. Keep a stable schema.** The real power comes when you query across thousands of canonical logs. If field names change, your dashboards break. Treat the schema as a contract.

---

## Part 2 — Architecture Overview

Here's the NestJS component map for this implementation:

```
┌──────────────────────────────────────────────────────────┐
│                        Request Lifecycle                  │
│                                                          │
│  HTTP Request                                            │
│       │                                                  │
│       ▼                                                  │
│  [LoggingMiddleware]  ← Creates AsyncLocalStorage        │
│       │                 context, assigns requestId,      │
│       │                 records start time               │
│       ▼                                                  │
│  [Guards / Pipes]    ← AuthGuard adds userId to context  │
│       │                                                  │
│       ▼                                                  │
│  [Route Handler]     ← Business logic adds custom fields │
│       │                 via LogContext.set(key, value)   │
│       ▼                                                  │
│  [LoggingInterceptor] ← Flushes canonical log on         │
│       │                  response/error                  │
│       ▼                                                  │
│  HTTP Response                                           │
└──────────────────────────────────────────────────────────┘

Supporting pieces:
  ┌──────────────────────┐     ┌─────────────────────────┐
  │   LogContext         │     │   AppLogger              │
  │ (static ALS helper)  │     │ (NestJS LoggerService)   │
  │                      │     │                          │
  │ - Stores the mutable │     │ - log(), error(),        │
  │   canonical log obj  │     │   warn(), debug()        │
  │ - set(key, value)    │     │ - Reads requestId from   │
  │ - get(key)           │     │   AsyncLocalStorage      │
  │ - flush()            │     │   and injects into       │
  └──────────────────────┘     │   every log line         │
                               └─────────────────────────┘
```

---

## Part 3 — Implementation

### 3.1 Install Dependencies

```bash
npm install pino pino-pretty
npm install --save-dev @types/node
```

We use **Pino** as our underlying logger because:

- It's the fastest JSON logger for Node.js
- Its output is clean JSON by default (perfect for log aggregators)
- `pino-pretty` makes development output readable

### 3.2 Project Structure

```
src/
├── logger/
│   ├── log-context.ts          # AsyncLocalStorage wrapper
│   ├── app-logger.service.ts   # NestJS LoggerService implementation
│   ├── logging.middleware.ts   # Initializes context per request
│   ├── logging.interceptor.ts  # Flushes canonical log on response
│   └── logger.module.ts        # Module that wires everything together
├── app.module.ts
└── main.ts
```

### 3.3 The Log Context (`log-context.ts`)

This is the heart of the implementation. `AsyncLocalStorage` creates an "invisible thread-local" that any code within an async call chain can access.

```typescript
// src/logger/log-context.ts
import { AsyncLocalStorage } from 'async_hooks';

export interface CanonicalLog {
  // --- Request identity ---
  requestId: string;
  httpMethod?: string;
  httpPath?: string;
  httpStatus?: number;

  // --- Timing ---
  startedAt?: number; // Unix ms, internal use
  durationMs?: number;

  // --- Auth context ---
  userId?: string;
  userRole?: string;

  // --- Performance ---
  dbQueries?: number;
  dbDurationMs?: number;
  cacheHits?: number;
  cacheMisses?: number;

  // --- Outcome ---
  errorCode?: string;
  errorMessage?: string;

  // --- Extensible ---
  [key: string]: unknown;
}

const store = new AsyncLocalStorage<CanonicalLog>();

/**
 * LogContext provides static access to the per-request canonical log object.
 * Any code running within the same async context (same request) can call
 * LogContext.set() to enrich the canonical log, and LogContext.flush() to emit it.
 */
export class LogContext {
  /**
   * Run a function within a new async context, bound to a fresh canonical log.
   * This is called once per request in the middleware.
   */
  static run(log: CanonicalLog, fn: () => void): void {
    store.run(log, fn);
  }

  /**
   * Add or update a field in the current request's canonical log.
   * Safe to call from anywhere — no-ops if there's no active context.
   */
  static set(key: keyof CanonicalLog, value: unknown): void {
    const log = store.getStore();
    if (log) {
      log[key] = value;
    }
  }

  /**
   * Increment a numeric counter field. Useful for tracking DB query counts, etc.
   */
  static increment(key: keyof CanonicalLog, by = 1): void {
    const log = store.getStore();
    if (log) {
      const current = (log[key] as number) ?? 0;
      log[key] = current + by;
    }
  }

  /**
   * Read a field from the current canonical log.
   */
  static get<K extends keyof CanonicalLog>(key: K): CanonicalLog[K] | undefined {
    return store.getStore()?.[key];
  }

  /**
   * Get the full canonical log object (a snapshot, not a copy).
   */
  static getStore(): CanonicalLog | undefined {
    return store.getStore();
  }

  /**
   * Returns a frozen snapshot of the log, ready to be emitted.
   * Computes durationMs from startedAt.
   */
  static flush(): CanonicalLog | null {
    const log = store.getStore();
    if (!log) return null;

    if (log.startedAt) {
      log.durationMs = Date.now() - log.startedAt;
    }

    return { ...log };
  }
}
```

### 3.4 The App Logger (`app-logger.service.ts`)

This replaces NestJS's built-in logger. Every log line automatically gets the `requestId` from the async context, so all your regular logs are still correlated with the canonical log — without you having to pass anything around.

```typescript
// src/logger/app-logger.service.ts
import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import pino, { Logger } from 'pino';
import { LogContext } from './log-context';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * AppLogger wraps Pino and implements NestJS's LoggerService interface.
 *
 * It automatically injects requestId from AsyncLocalStorage into every log
 * line, so that individual trace logs can be correlated with canonical logs
 * using a simple query: `requestId = "req_abc123"`.
 */
@Injectable()
export class AppLogger implements LoggerService {
  private readonly pino: Logger;

  constructor() {
    this.pino = pino({
      level: process.env.LOG_LEVEL ?? 'info',
      ...(isDev
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:HH:MM:ss',
                ignore: 'pid,hostname',
                messageKey: 'msg',
              },
            },
          }
        : {
            // Production: raw JSON, one line per log entry
            formatters: {
              level(label) {
                return { level: label };
              },
            },
          }),
    });
  }

  private getBase(context?: string): Record<string, unknown> {
    const base: Record<string, unknown> = {};
    const requestId = LogContext.get('requestId');
    if (requestId) base.requestId = requestId;
    if (context) base.context = context;
    return base;
  }

  log(message: string, context?: string): void {
    this.pino.info(this.getBase(context), message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.pino.error({ ...this.getBase(context), trace }, message);
  }

  warn(message: string, context?: string): void {
    this.pino.warn(this.getBase(context), message);
  }

  debug(message: string, context?: string): void {
    this.pino.debug(this.getBase(context), message);
  }

  verbose(message: string, context?: string): void {
    this.pino.trace(this.getBase(context), message);
  }

  /**
   * Emit the canonical log line for the current request.
   * Called once per request by the LoggingInterceptor.
   */
  canonical(log: Record<string, unknown>): void {
    this.pino.info({ ...log, type: 'canonical' }, `canonical ${log.httpMethod} ${log.httpPath} → ${log.httpStatus}`);
  }
}
```

### 3.5 The Logging Middleware (`logging.middleware.ts`)

Middleware runs before everything else. This is where we **create the async context** and populate the initial fields.

```typescript
// src/logger/logging.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { LogContext } from './log-context';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    // Respect incoming X-Request-ID from API gateway or upstream services,
    // or generate a new one. This enables distributed tracing.
    const requestId = (req.headers['x-request-id'] as string) ?? `req_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

    LogContext.run(
      {
        requestId,
        httpMethod: req.method,
        httpPath: req.route?.path ?? req.path,
        startedAt: Date.now(),
        dbQueries: 0,
        dbDurationMs: 0,
        cacheHits: 0,
        cacheMisses: 0,
      },
      () => next(),
    );
  }
}
```

**Why middleware and not an interceptor for initialization?** Interceptors run after guards. If an auth guard rejects the request (401/403), a request-init interceptor would never fire — you'd lose the canonical log for rejected requests. Middleware always runs first.

### 3.6 The Logging Interceptor (`logging.interceptor.ts`)

The interceptor wraps the route handler. It is the _last thing_ that runs before the response is sent, making it the perfect place to flush the canonical log.

```typescript
// src/logger/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Response } from 'express';
import { AppLogger } from './app-logger.service';
import { LogContext } from './log-context';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = ctx.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        LogContext.set('httpStatus', res.statusCode);
        this.flush();
      }),
      catchError((err: unknown) => {
        const status = err instanceof HttpException ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        LogContext.set('httpStatus', status);
        LogContext.set('errorCode', err instanceof Error ? err.constructor.name : 'UnknownError');
        LogContext.set('errorMessage', err instanceof Error ? err.message : String(err));

        this.flush();
        return throwError(() => err);
      }),
    );
  }

  private flush(): void {
    const log = LogContext.flush();
    if (log) {
      this.logger.canonical(log as Record<string, unknown>);
    }
  }
}
```

### 3.7 The Logger Module (`logger.module.ts`)

Wire everything together in a module and make it globally available.

```typescript
// src/logger/logger.module.ts
import { Global, Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppLogger } from './app-logger.service';
import { LoggingMiddleware } from './logging.middleware';
import { LoggingInterceptor } from './logging.interceptor';

@Global()
@Module({
  providers: [
    AppLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [AppLogger],
})
export class LoggerModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
```

> **Why `@Global()`?** Without it, you'd need to import `LoggerModule` in every feature module that wants to use `AppLogger`. Marking it global registers the provider application-wide — inject `AppLogger` anywhere without extra imports.

### 3.8 Bootstrap: Replace NestJS's Default Logger (`main.ts`)

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './logger/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until our logger is ready
  });

  const logger = app.get(AppLogger);

  // Replace NestJS's built-in logger with ours.
  // This means even NestJS's own startup messages (routes registered, etc.)
  // will go through Pino with proper formatting.
  app.useLogger(logger);

  await app.listen(3000);
  logger.log('Application started on port 3000', 'Bootstrap');
}
bootstrap();
```

### 3.9 Register the Module (`app.module.ts`)

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { LoggerModule } from './logger/logger.module';
// ... your other modules

@Module({
  imports: [
    LoggerModule,
    // ... other modules
  ],
})
export class AppModule {}
```

---

## Part 4 — Enriching the Canonical Log from Anywhere

Now that the plumbing is in place, any layer of your app can contribute fields to the canonical log.

### From a Guard (Auth context)

```typescript
// src/auth/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { LogContext } from '../logger/log-context';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = this.validateToken(request.headers.authorization);

    if (user) {
      // Enrich the canonical log with auth info
      LogContext.set('userId', user.id);
      LogContext.set('userRole', user.role);
    }

    return !!user;
  }

  private validateToken(authHeader: string): { id: string; role: string } | null {
    // your JWT validation logic
    return null;
  }
}
```

### From a Service (DB performance tracking)

```typescript
// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { LogContext } from '../logger/log-context';

@Injectable()
export class UsersService {
  async findUser(id: string) {
    const start = Date.now();

    const user = await this.db.users.findOne({ id }); // your DB call

    // Track DB performance in canonical log
    LogContext.increment('dbQueries');
    LogContext.increment('dbDurationMs', Date.now() - start);

    return user;
  }
}
```

### From a Route Handler (Business context)

```typescript
// src/orders/orders.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { LogContext } from '../logger/log-context';

@Controller('orders')
export class OrdersController {
  @Post()
  async createOrder(@Body() dto: CreateOrderDto) {
    const order = await this.ordersService.create(dto);

    // Add business-specific fields to the canonical log
    LogContext.set('orderId', order.id);
    LogContext.set('orderAmount', order.totalCents);
    LogContext.set('currency', order.currency);

    return order;
  }
}
```

---

## Part 5 — What You Get

### Development Output (pino-pretty)

```
14:32:11 INFO  [AuthGuard] Token validated
14:32:11 INFO  [UsersService] Fetching user from DB
14:32:11 INFO  canonical POST /orders → 201  {
  type: 'canonical',
  requestId: 'req_9f3a1b2c4d5e6f70',
  httpMethod: 'POST',
  httpPath: '/orders',
  httpStatus: 201,
  durationMs: 87,
  userId: 'usr_abc123',
  userRole: 'customer',
  dbQueries: 3,
  dbDurationMs: 34,
  orderId: 'ord_xyz789',
  orderAmount: 4999,
  currency: 'USD'
}
```

### Production Output (raw JSON)

```json
{"level":"info","timestamp":"2024-01-15T14:32:11.432Z","requestId":"req_9f3a1b2c","context":"AuthGuard","msg":"Token validated"}
{"level":"info","timestamp":"2024-01-15T14:32:11.455Z","requestId":"req_9f3a1b2c","context":"UsersService","msg":"Fetching user from DB"}
{"level":"info","timestamp":"2024-01-15T14:32:11.519Z","type":"canonical","requestId":"req_9f3a1b2c","httpMethod":"POST","httpPath":"/orders","httpStatus":201,"durationMs":87,"userId":"usr_abc123","userRole":"customer","dbQueries":3,"dbDurationMs":34,"orderId":"ord_xyz789","orderAmount":4999,"currency":"USD","msg":"canonical POST /orders → 201"}
```

Notice that all three log lines share the same `requestId`. You can query all trace logs for a request, or just query canonical logs for pattern analysis — both with a single, simple filter.

---

## Part 6 — Example Queries

Once your canonical logs flow into a log aggregation system (Datadog, Grafana Loki, Splunk, AWS CloudWatch), you can answer production questions instantly:

**Identify slow endpoints:**

```
type="canonical" | stats avg(durationMs) by httpPath | sort -avg(durationMs)
```

**Find all failed requests for a user:**

```
type="canonical" userId="usr_abc123" httpStatus>=400
```

**Detect DB-heavy requests:**

```
type="canonical" dbQueries > 10 | table requestId, httpPath, dbQueries, dbDurationMs
```

**Monitor error rate over time:**

```
type="canonical" | timechart count(errorCode) by httpPath
```

---

## Summary

| Component            | Role                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `LogContext`         | Static wrapper around `AsyncLocalStorage`. Holds and mutates the canonical log for the current request.                  |
| `AppLogger`          | Pino-backed `LoggerService`. Injects `requestId` into every trace log. Has a `canonical()` method to emit the final log. |
| `LoggingMiddleware`  | Creates the async context at the start of every request. Populates initial fields.                                       |
| `LoggingInterceptor` | Captures the final HTTP status (or error), then calls `flush()` to emit the canonical log.                               |
| `LoggerModule`       | Wires everything together. `@Global()` means `AppLogger` is injectable everywhere without repeat imports.                |

The beauty of this system is **separation of concerns**. Guards add auth context. Services track DB performance. Controllers add business data. Nobody passes a logger object around. Nobody cares about the implementation. The canonical log quietly accumulates context from every layer, then fires once — giving you a complete picture of every request with zero query complexity.

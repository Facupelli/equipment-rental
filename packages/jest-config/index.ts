import type { Config } from "jest";

/**
 * Base config shared by all presets.
 * Each preset spreads this and overrides what it needs.
 */
const base: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  transform: {
    "^.+\\.(t|j)s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
  },
  moduleNameMapper: {
    // Resolves `src/`-prefixed absolute imports used throughout the codebase.
    // Each app's rootDir is set to its own root, so src/ maps correctly.
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  testEnvironment: "node",
};

/**
 * Unit test preset.
 * - Scoped to src/ only
 * - Picks up *.spec.ts files
 * - Fast: no DB, no HTTP, no timeouts needed
 */
export const unitConfig: Config = {
  ...base,
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  // Override moduleNameMapper so src/ resolves inside src/ subdirectory
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  coverageDirectory: "coverage",
};

/**
 * Integration test preset.
 * - Picks up *.integration-spec.ts files
 * - Runs sequentially (shares a real DB instance)
 * - Longer timeout for DB round-trips
 */
export const integrationConfig: Config = {
  ...base,
  rootDir: ".",
  testRegex: ".*\\.integration-spec\\.ts$",
  testTimeout: 30_000,
  // Sequential: test files share the same DB and rely on per-test cleanup,
  // not parallel isolation.
  maxWorkers: 1,
};

/**
 * E2E test preset.
 * - Picks up *.e2e-spec.ts files
 * - Runs sequentially (boots a real NestJS app + DB)
 * - Longer timeout for full app bootstrap
 */
export const e2eConfig: Config = {
  ...base,
  rootDir: ".",
  testRegex: ".*\\.e2e-spec\\.ts$",
  testTimeout: 30_000,
  maxWorkers: 1,
};

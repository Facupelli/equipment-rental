import type { Config } from "@jest/types";

/**
 * Base config shared by all presets.
 * - No tsconfig path here: each consuming app injects its own via globals.
 * - No diagnostics: type-checking is the compiler's job, not the test runner's.
 */
const base: Config.InitialOptions = {
  moduleFileExtensions: ["js", "json", "ts"],
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  testEnvironment: "node",
};

/**
 * Unit test preset.
 * Fast: no DB, no HTTP, no timeouts needed.
 */
export const unitConfig: Config.InitialOptions = {
  ...base,
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  coverageDirectory: "coverage",
};

/**
 * Integration test preset.
 * Runs sequentially — test files share a real DB instance
 * and rely on per-test cleanup, not parallel isolation.
 */
export const integrationConfig: Config.InitialOptions = {
  ...base,
  rootDir: ".",
  testRegex: ".*\\.integration-spec\\.ts$",
  testTimeout: 30_000,
  maxWorkers: 1,
};

/**
 * E2E test preset.
 * Runs sequentially — boots a real NestJS app + DB.
 */
export const e2eConfig: Config.InitialOptions = {
  ...base,
  rootDir: ".",
  testRegex: ".*\\.e2e-spec\\.ts$",
  testTimeout: 30_000,
  maxWorkers: 1,
};

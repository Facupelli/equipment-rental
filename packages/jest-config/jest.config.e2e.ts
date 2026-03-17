import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  testRegex: ".*\\.e2e-spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  testEnvironment: "node",
  // E2e tests boot the full app and hit HTTP — they're slow by nature
  testTimeout: 60000,
  // Never run e2e tests in parallel — one server, one test runner
  maxWorkers: 1,
};

export default config;

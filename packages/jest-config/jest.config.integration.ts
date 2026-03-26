import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  moduleFileExtensions: ["js", "json", "ts"],
  testRegex: ".*\\.int-spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  testEnvironment: "node",
  testTimeout: 30000,
  maxWorkers: 1,
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/../src/$1",
  },
};

export default config;

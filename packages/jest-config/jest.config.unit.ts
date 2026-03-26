import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  moduleFileExtensions: ["js", "json", "ts"],
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  // Teach Jest to resolve 'src/...' imports the same way TypeScript does.
  // <rootDir> here resolves to whatever rootDir the consuming app sets —
  // in our case apps/backend/src, so we go up one level to apps/backend.
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/../src/$1",
  },
};

export default config;

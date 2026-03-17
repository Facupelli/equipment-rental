import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  testEnvironment: 'node',

  // E2E tests boot a real app and talk to a real DB —
  // give each test file a generous timeout.
  testTimeout: 30_000,

  // Run test files sequentially: each e2e suite owns the DB state
  // and we don't want parallel suites stepping on each other.
  maxWorkers: 1,
};

export default config;

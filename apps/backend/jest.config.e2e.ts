import { e2eConfig } from '@repo/jest-config';
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  ...e2eConfig,
  rootDir: '.',
  moduleNameMapper: {
    ...e2eConfig.moduleNameMapper,
    '^@generated/prisma$': '<rootDir>/src/generated/prisma',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      diagnostics: false,
    },
  },
};

export default config;

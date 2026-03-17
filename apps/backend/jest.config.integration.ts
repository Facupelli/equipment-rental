import integrationConfig from '@repo/jest-config/jest.config.integration';
import type { Config } from 'jest';

const config: Config = {
  ...integrationConfig,
  rootDir: 'src',
  globalSetup: '<rootDir>/../test/setup/global-setup.ts',
  globalTeardown: '<rootDir>/../test/setup/global-teardown.ts',
};

export default config;

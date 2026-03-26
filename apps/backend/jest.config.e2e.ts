import e2eConfig from '@repo/jest-config/jest.config.e2e';
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  ...e2eConfig,
  rootDir: 'test',
};

export default config;

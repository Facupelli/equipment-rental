import unitConfig from '@repo/jest-config/jest.config.unit';
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  ...unitConfig,
  rootDir: 'src',
};

export default config;

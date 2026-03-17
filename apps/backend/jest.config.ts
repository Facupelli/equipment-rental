import unitConfig from '@repo/jest-config/jest.config.unit';
import type { Config } from 'jest';

const config: Config = {
  ...unitConfig,
  rootDir: 'src',
};

export default config;

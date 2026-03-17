// Global teardown runs once after all integration test suites complete.
//
// We intentionally do NOT stop the Docker container here.
// Reason: keeping it running makes re-runs during development much faster
// (no container cold-start on every test:integration invocation).
//
// The container uses tmpfs so data is wiped automatically when it stops
// (e.g. on machine restart or explicit `docker compose down`).
//
// If you need a clean teardown in CI, uncomment the block below.

// import { execSync } from 'child_process';
// import * as path from 'path';

export default async function globalTeardown(): Promise<void> {
  // execSync('docker compose -f docker-compose.test.yml down', {
  //   stdio: 'inherit',
  //   cwd: path.resolve(__dirname, '../..'),
  // });
}

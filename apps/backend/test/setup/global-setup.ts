import { execSync } from 'child_process';
import * as path from 'path';

// Load .env.test so DATABASE_URL is available for the Prisma migration command.
// We do this in globalSetup (not in jest config) because globalSetup runs in a
// separate Node process that doesn't inherit Jest's module environment.
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

export default async function globalSetup(): Promise<void> {
  console.log('\n🐳 Starting test database container...');

  execSync('docker compose -f docker-compose.test.yml up -d --wait', {
    stdio: 'inherit',
    // cwd must point to apps/backend where docker-compose.test.yml lives
    cwd: path.resolve(__dirname, '../..'),
  });

  console.log('🗄️  Running Prisma migrations against test database...');

  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
    env: {
      ...process.env,
      // DATABASE_URL is already set from .env.test above — this is explicit for clarity
      DATABASE_URL: process.env.DATABASE_URL!,
    },
  });

  console.log('✅ Test database ready.\n');
}

/**
 * Boots in-memory MongoDB, seeds demo data, starts API, runs smoke tests, exits.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

process.env.USE_MEMORY_DB = 'true';
process.env.NODE_ENV = 'development';
process.env.PORT = process.env.PORT || '5055';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_smoke';
process.env.DEMO_MODE = 'true';

const { default: connectDB, disconnectDB } = await import('../config/db.js');
const { default: seedDatabase } = await import('../seeders/seed.js');
const { startServer } = await import('../index.js');

const PORT = process.env.PORT;
const BASE_URL = `http://localhost:${PORT}`;

console.log('Starting API test harness (in-memory MongoDB)...');

await connectDB();
const seeded = await seedDatabase();
console.log('Seeded demo credentials:', seeded.credentials.admin);

const server = await startServer({ connect: false });

// Wait for server readiness
const waitForHealth = async (retries = 30) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Server did not become healthy in time');
};

await waitForHealth();
console.log(`Server ready at ${BASE_URL}`);

const smokePath = path.join(__dirname, 'api.smoke.js');
const child = spawn(process.execPath, [smokePath], {
  cwd: root,
  env: { ...process.env, BASE_URL },
  stdio: 'inherit',
});

const code = await new Promise((resolve) => {
  child.on('close', resolve);
});

server.close();
await disconnectDB();
process.exit(code ?? 1);

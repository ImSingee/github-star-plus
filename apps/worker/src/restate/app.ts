import * as restate from '@restatedev/restate-sdk';
import { runMigrations } from '@proj/db/migrate';
import { services } from './jobs';

function getPort(): number {
  const raw = process.env.PORT;
  if (!raw) return 9080;

  const port = Number(raw);
  if (!Number.isFinite(port) || !Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT: ${raw}`);
  }

  return port;
}

async function main() {
  await runMigrations();

  void restate.serve({
    services,
    port: getPort(),
    defaultServiceOptions: {
      journalRetention: { days: 14 },
    },
  });
}

void main();

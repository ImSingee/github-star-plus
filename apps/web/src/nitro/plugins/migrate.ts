import { definePlugin } from 'nitro';
import { runMigrations } from '@proj/db/migrate';

export default definePlugin(async () => {
  await runMigrations();
});

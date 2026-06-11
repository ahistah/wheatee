import { createApp } from './app.js';
import { config, validateProductionConfig } from './config.js';
import { closeDatabase } from './services/database.js';

const app = createApp();
validateProductionConfig();

const server = app.listen(config.port, () => {
  console.log(`Wheatee API listening on ${config.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    server.close();
    await closeDatabase();
    process.exit(0);
  });
}

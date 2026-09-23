import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config.js';
import { PersistentStore } from './persistent-store.js';

const store = await PersistentStore.create(env.MONGO_URI);
const server = createServer(createApp(store));

server.listen(env.PORT, () => {
  console.log(`Eventra API listening on http://localhost:${env.PORT}`);
});

async function shutdown(): Promise<void> {
  server.close();
  await store.close();
  process.exit(0);
}

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());

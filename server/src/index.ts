import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config.js';

const server = createServer(createApp());

server.listen(env.PORT, () => {
  console.log(`Eventra API listening on http://localhost:${env.PORT}`);
});

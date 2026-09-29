import cors from 'cors';
import express, { json } from 'express';
import { join } from 'path';
import morgan from 'morgan';

import { routesErrorHandler } from './middlewares/errors/errorHandler.js';
import { generalRateLimiter } from './middlewares/rateLimiters.js';
import router from './routes/index.js';
import config from './config/index.js';
import { connectDb } from './database/index.js';
import { getServerIPs } from './utils/ip.js';

const app = express();

app.use(cors());
app.use(generalRateLimiter);

app.use(json());
app.use(morgan('combined'));

const publicDirectory = join(process.cwd(), 'src/public');
app.use(express.static(publicDirectory));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: publicDirectory });
});

app.use(router);
app.use(routesErrorHandler);

const port = config.app.port || 7000;

connectDb()
  .then(() => app.listen(port, '0.0.0.0', () => {
    const ips = getServerIPs().map(ip => `${ip}:${port}`).join(' ');

    // eslint-disable-next-line no-console
    console.log(`server accessible at: ${ips}`);
  }));

export default app;

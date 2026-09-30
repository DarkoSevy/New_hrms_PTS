import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.isProd ? 'info' : 'debug',
  transport: env.isProd
    ? undefined
    : { target: 'pino/file', options: { destination: 1 } },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.passwordHash', '*.password'],
    remove: true,
  },
});

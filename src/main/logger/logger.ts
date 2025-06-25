import * as pino from 'pino';

// Configure logger
const logger = pino.pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

export default logger;
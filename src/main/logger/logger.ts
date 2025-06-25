import * as pino from 'pino';

// Configure logger
const logger = pino.pino({
  // Use a simpler configuration without worker threads
  level: 'info',
  // Use direct formatting instead of transport to avoid worker threads
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  // Use timestamp for better logging
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

export default logger;

import { ipcMain } from 'electron';
import logger from '../logger/logger';
import { connectTcpClient, disconnectTcpClient, sendData, getConnectionCount } from '../tcp/tcp-client';
import { 
  startLoadTest, 
  stopLoadTest, 
  isLoadTestActive, 
  getLoadTestConfig,
  defaultConfig
} from '../tcp/load-test';
import type { LoadTestConfig } from '../tcp/load-test';

// Register all IPC handlers
function registerIpcHandlers(): void {
  // Handle connect request from renderer
  ipcMain.handle('tcp:connect', async (_event, host: string, port: number) => {
    try {
      await connectTcpClient(host, port);
      return true;
    } catch (error) {
      logger.error(`Connection error: ${error}`);
      throw error;
    }
  });

  // Handle disconnect request from renderer
  ipcMain.handle('tcp:disconnect', (_event, connectionId?: string) => {
    disconnectTcpClient(connectionId);
    return true;
  });

  // Handle send request from renderer
  ipcMain.handle('tcp:send', (_event, message: string, encoding: BufferEncoding, connectionId?: string) => {
    sendData(message, encoding, connectionId);
    return true;
  });

  // Handle get connection count request from renderer
  ipcMain.handle('tcp:connection-count', () => {
    return getConnectionCount();
  });

  // Handle load test start request from renderer
  ipcMain.handle('loadtest:start', (_event, config: LoadTestConfig) => {
    startLoadTest(config);
    return true;
  });

  // Handle load test stop request from renderer
  ipcMain.handle('loadtest:stop', () => {
    stopLoadTest();
    return true;
  });

  // Handle load test status request from renderer
  ipcMain.handle('loadtest:status', () => {
    return isLoadTestActive();
  });

  // Handle load test config request from renderer
  ipcMain.handle('loadtest:config', () => {
    return getLoadTestConfig();
  });

  // Handle default load test config request from renderer
  ipcMain.handle('loadtest:default-config', () => {
    return defaultConfig;
  });

  logger.info('IPC handlers registered');
}

export {
  registerIpcHandlers
};

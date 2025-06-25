import { ipcMain } from 'electron';
import logger from '../logger/logger';
import { connectTcpClient, disconnectTcpClient, sendData } from '../tcp/tcp-client';

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
  ipcMain.handle('tcp:disconnect', () => {
    disconnectTcpClient();
    return true;
  });

  // Handle send request from renderer
  ipcMain.handle('tcp:send', (_event, message: string, encoding: BufferEncoding) => {
    sendData(message, encoding);
    return true;
  });

  logger.info('IPC handlers registered');
}

export {
  registerIpcHandlers
};
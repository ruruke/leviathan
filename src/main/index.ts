import { app, BrowserWindow } from 'electron';
import { initMainWindow, getMainWindow } from './window/window';
import { registerIpcHandlers } from './ipc/ipc-handlers';
import { disconnectTcpClient, isTcpClientConnected } from './tcp/tcp-client';
import logger from './logger/logger';

// Create window when Electron is ready
app.whenReady().then(() => {
  // Initialize main window
  initMainWindow();
  
  // Register IPC handlers
  registerIpcHandlers();

  // On macOS, recreate window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      initMainWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up before app quits
app.on('before-quit', () => {
  // Disconnect TCP client if connected
  if (isTcpClientConnected()) {
    disconnectTcpClient();
  }
  
  logger.info('Application shutting down');
});
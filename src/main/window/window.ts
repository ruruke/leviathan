import { BrowserWindow } from 'electron';
import * as path from 'path';
import logger from '../logger/logger';

// Main window reference
let mainWindow: BrowserWindow | null = null;

// Create the browser window
function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 1200,
    minHeight: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load the index.html file
  window.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    window.webContents.openDevTools();
  }

  logger.info('Main window created');
  return window;
}

// Initialize the main window
function initMainWindow(): BrowserWindow {
  if (!mainWindow) {
    mainWindow = createWindow();

    // Handle window close
    mainWindow.on('closed', () => {
      mainWindow = null;
      logger.info('Main window closed');
    });
  }

  return mainWindow;
}

// Get the main window instance
function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export {
  createWindow,
  initMainWindow,
  getMainWindow
};

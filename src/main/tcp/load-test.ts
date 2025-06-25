import * as net from 'net';
import logger from '../logger/logger';
import { getMainWindow } from '../window/window';
import { sendData, isTcpClientConnected } from './tcp-client';

// Load test state
let loadTestActive = false;
let loadTestInterval: NodeJS.Timeout | null = null;

// Load test configuration
interface LoadTestConfig {
  interval: number;        // Interval between messages in milliseconds
  randomLength: number;    // Length of random string
  charset: string;         // Character set to use for random string generation
  encoding: BufferEncoding; // Encoding to use for sending messages
}

// Default configuration
const defaultConfig: LoadTestConfig = {
  interval: 100,
  randomLength: 100,
  charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  encoding: 'utf8'
};

// Current configuration
let currentConfig: LoadTestConfig = { ...defaultConfig };

// Generate a random string
function generateRandomString(length: number, charset: string): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

// Start load test
function startLoadTest(config: LoadTestConfig): void {
  // Update current configuration
  currentConfig = { ...config };

  // Check if already running
  if (loadTestActive) {
    stopLoadTest();
  }

  // Check if connected
  if (!isTcpClientConnected()) {
    const errorMsg = 'Cannot start load test: Not connected to server';
    logger.error(errorMsg);
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('tcp:error', errorMsg);
    }
    return;
  }

  // Set state to active
  loadTestActive = true;

  // Notify UI
  const mainWindow = getMainWindow();
  if (mainWindow) {
    mainWindow.webContents.send('loadtest:started', currentConfig);
  }

  // Start sending messages at the specified interval
  loadTestInterval = setInterval(() => {
    if (!isTcpClientConnected()) {
      stopLoadTest();
      return;
    }

    // Generate random string
    const randomString = generateRandomString(
      currentConfig.randomLength,
      currentConfig.charset
    );

    // Send the message
    sendData(randomString, currentConfig.encoding);

    // Notify UI about the sent message
    if (mainWindow) {
      mainWindow.webContents.send('loadtest:message-sent', randomString);
    }
  }, currentConfig.interval);

  logger.info(`Load test started with interval ${currentConfig.interval}ms`);
}

// Stop load test
function stopLoadTest(): void {
  if (loadTestInterval) {
    clearInterval(loadTestInterval);
    loadTestInterval = null;
  }

  loadTestActive = false;

  // Notify UI
  const mainWindow = getMainWindow();
  if (mainWindow) {
    mainWindow.webContents.send('loadtest:stopped');
  }

  logger.info('Load test stopped');
}

// Check if load test is active
function isLoadTestActive(): boolean {
  return loadTestActive;
}

// Get current load test configuration
function getLoadTestConfig(): LoadTestConfig {
  return { ...currentConfig };
}

export {
  startLoadTest,
  stopLoadTest,
  isLoadTestActive,
  getLoadTestConfig,
  defaultConfig
};

export type { LoadTestConfig };

import * as net from 'net';
import logger from '../logger/logger';
import { getMainWindow } from '../window/window';

// TCP Client state
let tcpClient: net.Socket | null = null;
let isConnected = false;

// Connect to TCP server
async function connectTcpClient(host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    // Disconnect existing connection if any
    if (tcpClient && isConnected) {
      disconnectTcpClient();
    }

    // Create new TCP client
    tcpClient = new net.Socket();

    // Set encoding to binary by default (we'll handle encoding in the send/receive methods)
    tcpClient.setEncoding('binary');

    // Handle connection
    tcpClient.connect(port, host, () => {
      logger.info(`Connected to TCP server at ${host}:${port}`);
      isConnected = true;

      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('tcp:connected');
      }

      resolve();
    });

    // Handle data received
    tcpClient.on('data', (data) => {
      logger.info(`Received data from server: ${data.toString()}`);

      const mainWindow = getMainWindow();
      if (mainWindow) {
        // Send as binary data, renderer will handle display based on selected encoding
        mainWindow.webContents.send('tcp:data', data.toString('binary'), 'binary');
      }
    });

    // Handle connection close
    tcpClient.on('close', () => {
      logger.info('Connection closed');
      isConnected = false;

      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('tcp:disconnected');
      }
    });

    // Handle errors
    tcpClient.on('error', (err) => {
      logger.error(`TCP client error: ${err.message}`);

      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('tcp:error', err.message);
      }

      reject(err.message);
    });
  });
}

// Disconnect from TCP server
function disconnectTcpClient(): void {
  if (tcpClient) {
    tcpClient.destroy();
    tcpClient = null;
    isConnected = false;
    logger.info('Disconnected from TCP server');
  }
}

// Send data to TCP server
function sendData(message: string, encoding: BufferEncoding): void {
  if (tcpClient && isConnected) {
    try {
      // Convert message to buffer with specified encoding
      const buffer = Buffer.from(message, encoding);
      tcpClient.write(buffer);
      logger.info(`Sent data to server (${encoding}): ${message}`);
    } catch (error) {
      logger.error(`Error sending data: ${error}`);
      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('tcp:error', `Error sending data: ${error}`);
      }
    }
  } else {
    const errorMsg = 'Cannot send data: Not connected to server';
    logger.error(errorMsg);
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('tcp:error', errorMsg);
    }
  }
}

// Check if TCP client is connected
function isTcpClientConnected(): boolean {
  return isConnected;
}

export {
  connectTcpClient,
  disconnectTcpClient,
  sendData,
  isTcpClientConnected
};
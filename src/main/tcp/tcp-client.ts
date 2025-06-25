import * as net from 'net';
import logger from '../logger/logger';
import { getMainWindow } from '../window/window';

// TCP Client state
interface TcpClientConnection {
  socket: net.Socket;
  host: string;
  port: number;
  id: string;
}

// Store multiple client connections
const tcpClients: Map<string, TcpClientConnection> = new Map();
let isConnected = false;
let nextClientId = 1; // Counter for sequential client IDs

// Generate a unique ID for each connection
function generateConnectionId(host: string, port: number): string {
  // Use sequential numbering for client IDs
  const clientId = nextClientId++;
  return `client-${clientId}`;
}

// Connect to TCP server
async function connectTcpClient(host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create new TCP client
    const socket = new net.Socket();
    const connectionId = generateConnectionId(host, port);

    // Set encoding to binary by default (we'll handle encoding in the send/receive methods)
    socket.setEncoding('binary');

    // Handle connection
    socket.connect(port, host, () => {
      logger.info(`Connected to TCP server at ${host}:${port} with ID ${connectionId}`);

      // Store the connection
      tcpClients.set(connectionId, {
        socket,
        host,
        port,
        id: connectionId
      });

      isConnected = tcpClients.size > 0;

      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('tcp:connected', tcpClients.size);
      }

      resolve();
    });

    // Handle data received
    socket.on('data', (data) => {
      logger.info(`Received data from server ${connectionId}: ${data.toString()}`);

      const mainWindow = getMainWindow();
      if (mainWindow) {
        // Send as binary data, renderer will handle display based on selected encoding
        mainWindow.webContents.send('tcp:data', data.toString('binary'), 'binary', connectionId);
      }
    });

    // Handle connection close
    socket.on('close', () => {
      logger.info(`Connection ${connectionId} closed`);

      // Remove the connection from the map
      tcpClients.delete(connectionId);
      isConnected = tcpClients.size > 0;

      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('tcp:disconnected', tcpClients.size);
      }
    });

    // Handle errors
    socket.on('error', (err) => {
      logger.error(`TCP client error for ${connectionId}: ${err.message}`);

      // Remove the connection from the map on error
      tcpClients.delete(connectionId);
      isConnected = tcpClients.size > 0;

      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('tcp:error', err.message, connectionId);
      }

      reject(err.message);
    });
  });
}

// Disconnect from TCP server
function disconnectTcpClient(connectionId?: string): void {
  if (connectionId) {
    // Disconnect a specific client
    const client = tcpClients.get(connectionId);
    if (client) {
      client.socket.destroy();
      tcpClients.delete(connectionId);
      isConnected = tcpClients.size > 0;
      logger.info(`Disconnected from TCP server ${connectionId}`);

      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('tcp:disconnected', tcpClients.size);
      }
    }
  } else {
    // Store the number of clients being disconnected
    const clientCount = tcpClients.size;

    // Disconnect all clients
    for (const [id, client] of tcpClients.entries()) {
      // Remove listeners to prevent 'close' event from sending individual disconnection events
      client.socket.removeAllListeners('close');
      client.socket.destroy();
      tcpClients.delete(id);
    }
    isConnected = false;
    logger.info(`Disconnected from all TCP servers (${clientCount} connections)`);

    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('tcp:disconnected', 0);
    }
  }
}

// Send data to TCP server
function sendData(message: string, encoding: BufferEncoding, connectionId?: string): void {
  if (tcpClients.size === 0 || !isConnected) {
    const errorMsg = 'Cannot send data: Not connected to any server';
    logger.error(errorMsg);
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('tcp:error', errorMsg);
    }
    return;
  }

  try {
    // Convert message to buffer with specified encoding
    const buffer = Buffer.from(message, encoding);

    if (connectionId) {
      // Send to a specific client
      const client = tcpClients.get(connectionId);
      if (client) {
        client.socket.write(buffer);
        logger.info(`Sent data to server ${connectionId} (${encoding}): ${message}`);
      } else {
        const errorMsg = `Cannot send data: Connection ${connectionId} not found`;
        logger.error(errorMsg);
        const mainWindow = getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send('tcp:error', errorMsg);
        }
      }
    } else {
      // Send to all clients
      for (const [id, client] of tcpClients.entries()) {
        client.socket.write(buffer);
        logger.info(`Sent data to server ${id} (${encoding}): ${message}`);
      }
    }
  } catch (error) {
    logger.error(`Error sending data: ${error}`);
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('tcp:error', `Error sending data: ${error}`);
    }
  }
}

// Check if TCP client is connected
function isTcpClientConnected(): boolean {
  return isConnected;
}

// Get the number of active connections
function getConnectionCount(): number {
  return tcpClients.size;
}

export {
  connectTcpClient,
  disconnectTcpClient,
  sendData,
  isTcpClientConnected,
  getConnectionCount
};

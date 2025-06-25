import { contextBridge, ipcRenderer } from 'electron';

// Define the LoadTestConfig interface to match the one in load-test.ts
interface LoadTestConfig {
  interval: number;
  randomLength: number;
  charset: string;
  encoding: BufferEncoding;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // TCP Client methods
    connect: (host: string, port: number) => {
      return ipcRenderer.invoke('tcp:connect', host, port);
    },
    disconnect: (connectionId?: string) => {
      return ipcRenderer.invoke('tcp:disconnect', connectionId);
    },
    send: (message: string, encoding: BufferEncoding, connectionId?: string) => {
      return ipcRenderer.invoke('tcp:send', message, encoding, connectionId);
    },
    getConnectionCount: () => {
      return ipcRenderer.invoke('tcp:connection-count');
    },
    // Event listeners
    onConnected: (callback: (connectionCount: number) => void) => {
      ipcRenderer.on('tcp:connected', (_event, connectionCount) => callback(connectionCount));
      return () => {
        ipcRenderer.removeAllListeners('tcp:connected');
      };
    },
    onDisconnected: (callback: (connectionCount: number) => void) => {
      ipcRenderer.on('tcp:disconnected', (_event, connectionCount) => callback(connectionCount));
      return () => {
        ipcRenderer.removeAllListeners('tcp:disconnected');
      };
    },
    onData: (callback: (data: string, encoding: BufferEncoding, connectionId: string) => void) => {
      ipcRenderer.on('tcp:data', (_event, data, encoding, connectionId) => callback(data, encoding, connectionId));
      return () => {
        ipcRenderer.removeAllListeners('tcp:data');
      };
    },
    onError: (callback: (error: string, connectionId?: string) => void) => {
      ipcRenderer.on('tcp:error', (_event, error, connectionId) => callback(error, connectionId));
      return () => {
        ipcRenderer.removeAllListeners('tcp:error');
      };
    },

    // Load Test methods
    startLoadTest: (config: LoadTestConfig) => {
      return ipcRenderer.invoke('loadtest:start', config);
    },
    stopLoadTest: () => {
      return ipcRenderer.invoke('loadtest:stop');
    },
    getLoadTestStatus: () => {
      return ipcRenderer.invoke('loadtest:status');
    },
    getLoadTestConfig: () => {
      return ipcRenderer.invoke('loadtest:config');
    },
    getDefaultLoadTestConfig: () => {
      return ipcRenderer.invoke('loadtest:default-config');
    },

    // Load Test event listeners
    onLoadTestStarted: (callback: (config: LoadTestConfig) => void) => {
      ipcRenderer.on('loadtest:started', (_event, config) => callback(config));
      return () => {
        ipcRenderer.removeAllListeners('loadtest:started');
      };
    },
    onLoadTestStopped: (callback: () => void) => {
      ipcRenderer.on('loadtest:stopped', () => callback());
      return () => {
        ipcRenderer.removeAllListeners('loadtest:stopped');
      };
    },
    onLoadTestMessageSent: (callback: (message: string) => void) => {
      ipcRenderer.on('loadtest:message-sent', (_event, message) => callback(message));
      return () => {
        ipcRenderer.removeAllListeners('loadtest:message-sent');
      };
    }
  }
);

// Log when preload script has loaded
console.log('Preload script loaded');

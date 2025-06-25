import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // TCP Client methods
    connect: (host: string, port: number) => {
      return ipcRenderer.invoke('tcp:connect', host, port);
    },
    disconnect: () => {
      return ipcRenderer.invoke('tcp:disconnect');
    },
    send: (message: string, encoding: BufferEncoding) => {
      return ipcRenderer.invoke('tcp:send', message, encoding);
    },
    // Event listeners
    onConnected: (callback: () => void) => {
      ipcRenderer.on('tcp:connected', () => callback());
      return () => {
        ipcRenderer.removeAllListeners('tcp:connected');
      };
    },
    onDisconnected: (callback: () => void) => {
      ipcRenderer.on('tcp:disconnected', () => callback());
      return () => {
        ipcRenderer.removeAllListeners('tcp:disconnected');
      };
    },
    onData: (callback: (data: string, encoding: BufferEncoding) => void) => {
      ipcRenderer.on('tcp:data', (_event, data, encoding) => callback(data, encoding));
      return () => {
        ipcRenderer.removeAllListeners('tcp:data');
      };
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on('tcp:error', (_event, error) => callback(error));
      return () => {
        ipcRenderer.removeAllListeners('tcp:error');
      };
    }
  }
);

// Log when preload script has loaded
console.log('Preload script loaded');
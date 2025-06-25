// Define the API interface to match what's exposed in preload.ts
interface TcpApi {
  connect: (host: string, port: number) => Promise<void>;
  disconnect: () => Promise<void>;
  send: (message: string, encoding: BufferEncoding) => Promise<void>;
  onConnected: (callback: () => void) => () => void;
  onDisconnected: (callback: () => void) => () => void;
  onData: (callback: (data: string, encoding: BufferEncoding) => void) => () => void;
  onError: (callback: (error: string) => void) => () => void;
}

// Access the exposed API
declare global {
  interface Window {
    api: TcpApi;
  }
}

// DOM Elements
const hostInput = document.getElementById('host') as HTMLInputElement;
const portInput = document.getElementById('port') as HTMLInputElement;
const connectButton = document.getElementById('connect') as HTMLButtonElement;
const disconnectButton = document.getElementById('disconnect') as HTMLButtonElement;
const messageInput = document.getElementById('message') as HTMLTextAreaElement;
const encodingSelect = document.getElementById('encoding') as HTMLSelectElement;
const sendButton = document.getElementById('send') as HTMLButtonElement;
const clearLogButton = document.getElementById('clear-log') as HTMLButtonElement;
const logContainer = document.getElementById('log') as HTMLDivElement;
const statusElement = document.getElementById('status') as HTMLSpanElement;

// Error Dialog Elements
const errorDialog = document.getElementById('error-dialog') as HTMLDivElement;
const errorMessage = document.getElementById('error-message') as HTMLParagraphElement;
const closeDialogButton = document.getElementById('close-dialog') as HTMLButtonElement;
const dialogOkButton = document.getElementById('dialog-ok') as HTMLButtonElement;

// Confirmation Dialog Elements
const confirmDialog = document.getElementById('confirm-dialog') as HTMLDivElement;
const confirmMessage = document.getElementById('confirm-message') as HTMLParagraphElement;
const closeConfirmDialogButton = document.getElementById('close-confirm-dialog') as HTMLButtonElement;
const confirmCancelButton = document.getElementById('confirm-cancel') as HTMLButtonElement;
const confirmOkButton = document.getElementById('confirm-ok') as HTMLButtonElement;

// Connection state
let isConnected = false;

// Event listeners cleanup functions
let connectedCleanup: (() => void) | null = null;
let disconnectedCleanup: (() => void) | null = null;
let dataCleanup: (() => void) | null = null;
let errorCleanup: (() => void) | null = null;

// Helper function to show error dialog
function showErrorDialog(message: string): void {
  errorMessage.textContent = message;
  errorDialog.classList.add('visible');
}

// Helper function to hide error dialog
function hideErrorDialog(): void {
  errorDialog.classList.remove('visible');
}

// Helper function to show confirmation dialog
function showConfirmDialog(message: string, onConfirm: () => void): void {
  confirmMessage.textContent = message;
  confirmDialog.classList.add('visible');

  // Store the confirm action
  confirmOkButton.onclick = () => {
    onConfirm();
    hideConfirmDialog();
  };
}

// Helper function to hide confirmation dialog
function hideConfirmDialog(): void {
  confirmDialog.classList.remove('visible');
  // Reset the confirm action
  confirmOkButton.onclick = hideConfirmDialog;
}

// Helper function to add log entries
function addLogEntry(message: string, type: 'info' | 'sent' | 'received' | 'error'): void {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;

  // Add timestamp
  const now = new Date();
  const timestamp = `[${now.toLocaleTimeString()}] `;

  entry.textContent = timestamp + message;
  logContainer.appendChild(entry);

  // Auto-scroll to bottom
  logContainer.scrollTop = logContainer.scrollHeight;

  // Show error dialog for error type entries
  if (type === 'error') {
    showErrorDialog(message);
  }
}

// Update UI based on connection state
function updateConnectionState(connected: boolean): void {
  isConnected = connected;

  // Update buttons
  connectButton.disabled = connected;
  disconnectButton.disabled = !connected;
  sendButton.disabled = !connected;

  // Update status indicator
  statusElement.textContent = connected ? 'Connected' : 'Disconnected';
  statusElement.className = `status ${connected ? 'connected' : 'disconnected'}`;

  // Update form fields
  hostInput.disabled = connected;
  portInput.disabled = connected;
}

// Set up event listeners
function setupEventListeners(): void {
  // Clean up any existing listeners
  if (connectedCleanup) connectedCleanup();
  if (disconnectedCleanup) disconnectedCleanup();
  if (dataCleanup) dataCleanup();
  if (errorCleanup) errorCleanup();

  // Set up new listeners
  connectedCleanup = window.api.onConnected(() => {
    updateConnectionState(true);
    addLogEntry('Connected to server', 'info');
  });

  disconnectedCleanup = window.api.onDisconnected(() => {
    updateConnectionState(false);
    addLogEntry('Disconnected from server', 'info');
  });

  dataCleanup = window.api.onData((data, encoding) => {
    addLogEntry(`Received (${encoding}): ${data}`, 'received');
  });

  errorCleanup = window.api.onError((error) => {
    addLogEntry(`Error: ${error}`, 'error');
    // In case of error, assume disconnected
    updateConnectionState(false);
  });
}

// Connect to server
async function connect(): Promise<void> {
  try {
    const host = hostInput.value;
    const port = parseInt(portInput.value, 10);

    if (!host) {
      addLogEntry('Error: Host cannot be empty', 'error');
      return;
    }

    if (isNaN(port) || port <= 0 || port > 65535) {
      addLogEntry('Error: Port must be a number between 1 and 65535', 'error');
      return;
    }

    addLogEntry(`Connecting to ${host}:${port}...`, 'info');
    await window.api.connect(host, port);
    // Connection success/failure will be handled by event listeners
  } catch (error) {
    addLogEntry(`Connection error: ${error}`, 'error');
  }
}

// Disconnect from server
async function disconnect(): Promise<void> {
  try {
    addLogEntry('Disconnecting...', 'info');
    await window.api.disconnect();
    // Disconnection success/failure will be handled by event listeners
  } catch (error) {
    addLogEntry(`Disconnection error: ${error}`, 'error');
  }
}

// Send message to server
async function sendMessage(): Promise<void> {
  try {
    const message = messageInput.value;
    const encoding = encodingSelect.value as BufferEncoding;

    if (!message) {
      addLogEntry('Error: Message cannot be empty', 'error');
      return;
    }

    addLogEntry(`Sent (${encoding}): ${message}`, 'sent');
    await window.api.send(message, encoding);

    // Clear message input after sending
    messageInput.value = '';
  } catch (error) {
    addLogEntry(`Send error: ${error}`, 'error');
  }
}

// Clear log
function clearLog(): void {
  showConfirmDialog('Are you sure you want to clear the log?', () => {
    logContainer.innerHTML = '';
    addLogEntry('Log cleared', 'info');
  });
}

// Initialize the application
function init(): void {
  // Set up event listeners
  setupEventListeners();

  // Add button event listeners
  connectButton.addEventListener('click', connect);
  disconnectButton.addEventListener('click', disconnect);
  sendButton.addEventListener('click', sendMessage);
  clearLogButton.addEventListener('click', clearLog);

  // Add error dialog event listeners
  closeDialogButton.addEventListener('click', hideErrorDialog);
  dialogOkButton.addEventListener('click', hideErrorDialog);

  // Close dialog when clicking outside of it (on the backdrop)
  errorDialog.addEventListener('click', (event) => {
    if (event.target === errorDialog) {
      hideErrorDialog();
    }
  });

  // Add confirmation dialog event listeners
  closeConfirmDialogButton.addEventListener('click', hideConfirmDialog);
  confirmCancelButton.addEventListener('click', hideConfirmDialog);

  // Close confirmation dialog when clicking outside of it (on the backdrop)
  confirmDialog.addEventListener('click', (event) => {
    if (event.target === confirmDialog) {
      hideConfirmDialog();
    }
  });

  // Allow sending message with Enter key (Shift+Enter for new line)
  messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && isConnected) {
      event.preventDefault();
      sendMessage();
    }
  });

  // Initial UI state
  updateConnectionState(false);

  addLogEntry('TCP Client initialized', 'info');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

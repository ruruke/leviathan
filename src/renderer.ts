// Make this file a module by adding an export
export {};

// Define the LoadTestConfig interface to match what's in preload.ts
interface LoadTestConfig {
  interval: number;
  randomLength: number;
  charset: string;
  encoding: BufferEncoding;
}

// Define the API interface to match what's exposed in preload.ts
interface TcpApi {
  connect: (host: string, port: number) => Promise<void>;
  disconnect: (connectionId?: string) => Promise<void>;
  send: (message: string, encoding: BufferEncoding, connectionId?: string) => Promise<void>;
  getConnectionCount: () => Promise<number>;
  onConnected: (callback: (connectionCount: number) => void) => () => void;
  onDisconnected: (callback: (connectionCount: number) => void) => () => void;
  onData: (callback: (data: string, encoding: BufferEncoding, connectionId: string) => void) => () => void;
  onError: (callback: (error: string, connectionId?: string) => void) => () => void;

  // Load Test methods
  startLoadTest: (config: LoadTestConfig) => Promise<void>;
  stopLoadTest: () => Promise<void>;
  getLoadTestStatus: () => Promise<boolean>;
  getLoadTestConfig: () => Promise<LoadTestConfig>;
  getDefaultLoadTestConfig: () => Promise<LoadTestConfig>;

  // Load Test event listeners
  onLoadTestStarted: (callback: (config: LoadTestConfig) => void) => () => void;
  onLoadTestStopped: (callback: () => void) => () => void;
  onLoadTestMessageSent: (callback: (message: string) => void) => () => void;
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
const openLoadTestButton = document.getElementById('open-loadtest') as HTMLButtonElement;
const openSettingsButton = document.getElementById('open-settings') as HTMLButtonElement;
const logContainer = document.getElementById('log') as HTMLDivElement;
const statusElement = document.getElementById('status') as HTMLSpanElement;
const connectionCountInput = document.getElementById('connection-count') as HTMLInputElement;

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

// Load Test Dialog Elements
const loadTestDialog = document.getElementById('loadtest-dialog') as HTMLDivElement;
const loadTestIntervalInput = document.getElementById('loadtest-interval') as HTMLInputElement;
const loadTestLengthInput = document.getElementById('loadtest-length') as HTMLInputElement;
const loadTestCharsetSelect = document.getElementById('loadtest-charset') as HTMLSelectElement;
const loadTestCustomCharsetGroup = document.getElementById('loadtest-custom-charset-group') as HTMLDivElement;
const loadTestCustomCharsetInput = document.getElementById('loadtest-custom-charset') as HTMLInputElement;
const loadTestEncodingSelect = document.getElementById('loadtest-encoding') as HTMLSelectElement;
const closeLoadTestDialogButton = document.getElementById('close-loadtest-dialog') as HTMLButtonElement;
const loadTestCancelButton = document.getElementById('loadtest-cancel') as HTMLButtonElement;
const loadTestStartButton = document.getElementById('loadtest-start') as HTMLButtonElement;

// Settings Dialog Elements
const settingsDialog = document.getElementById('settings-dialog') as HTMLDivElement;
const settingsAutoScrollSelect = document.getElementById('settings-auto-scroll') as HTMLSelectElement;
const settingsTimestampSelect = document.getElementById('settings-timestamp') as HTMLSelectElement;
const settingsFontSizeSelect = document.getElementById('settings-font-size') as HTMLSelectElement;
const settingsMaxLogEntriesInput = document.getElementById('settings-max-log-entries') as HTMLInputElement;
const closeSettingsDialogButton = document.getElementById('close-settings-dialog') as HTMLButtonElement;
const settingsCancelButton = document.getElementById('settings-cancel') as HTMLButtonElement;
const settingsSaveButton = document.getElementById('settings-save') as HTMLButtonElement;

// Connection state
let isConnected = false;

// Load test state
let isLoadTestRunning = false;

// Application settings state
interface AppSettings {
  autoScroll: boolean;
  showTimestamps: boolean;
  fontSize: 'small' | 'medium' | 'large';
  maxLogEntries: number;
}

// Default settings
const defaultSettings: AppSettings = {
  autoScroll: true,
  showTimestamps: true,
  fontSize: 'medium',
  maxLogEntries: 1000
};

// Current settings
let appSettings: AppSettings = { ...defaultSettings };

// Event listeners cleanup functions
let connectedCleanup: (() => void) | null = null;
let disconnectedCleanup: (() => void) | null = null;
let dataCleanup: (() => void) | null = null;
let errorCleanup: (() => void) | null = null;
let loadTestStartedCleanup: (() => void) | null = null;
let loadTestStoppedCleanup: (() => void) | null = null;
let loadTestMessageSentCleanup: (() => void) | null = null;

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

// Helper function to show load test dialog
function showLoadTestDialog(): void {
  // Reset form to default values
  window.api.getDefaultLoadTestConfig().then((config) => {
    loadTestIntervalInput.value = config.interval.toString();
    loadTestLengthInput.value = config.randomLength.toString();

    // Set encoding
    for (let i = 0; i < loadTestEncodingSelect.options.length; i++) {
      if (loadTestEncodingSelect.options[i].value === config.encoding) {
        loadTestEncodingSelect.selectedIndex = i;
        break;
      }
    }

    // Set character set
    if (config.charset === 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
      loadTestCharsetSelect.value = 'alphanumeric';
    } else if (config.charset === 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz') {
      loadTestCharsetSelect.value = 'alphabetic';
    } else if (config.charset === '0123456789') {
      loadTestCharsetSelect.value = 'numeric';
    } else {
      loadTestCharsetSelect.value = 'custom';
      loadTestCustomCharsetInput.value = config.charset;
      loadTestCustomCharsetGroup.style.display = 'block';
    }
  });

  // Update button text based on current state
  loadTestStartButton.textContent = isLoadTestRunning ? 'Stop Load Test' : 'Start Load Test';

  // Show dialog
  loadTestDialog.classList.add('visible');
}

// Helper function to hide load test dialog
function hideLoadTestDialog(): void {
  loadTestDialog.classList.remove('visible');
}

// Helper function to show settings dialog
function showSettingsDialog(): void {
  // Set form values based on current settings
  settingsAutoScrollSelect.value = appSettings.autoScroll ? 'enabled' : 'disabled';
  settingsTimestampSelect.value = appSettings.showTimestamps ? 'enabled' : 'disabled';
  settingsFontSizeSelect.value = appSettings.fontSize;
  settingsMaxLogEntriesInput.value = appSettings.maxLogEntries.toString();

  // Show dialog
  settingsDialog.classList.add('visible');
}

// Helper function to hide settings dialog
function hideSettingsDialog(): void {
  settingsDialog.classList.remove('visible');
}

// Helper function to save settings
function saveSettings(): void {
  // Get values from form
  const autoScroll = settingsAutoScrollSelect.value === 'enabled';
  const showTimestamps = settingsTimestampSelect.value === 'enabled';
  const fontSize = settingsFontSizeSelect.value as 'small' | 'medium' | 'large';
  const maxLogEntries = parseInt(settingsMaxLogEntriesInput.value, 10);

  // Validate inputs
  if (isNaN(maxLogEntries) || maxLogEntries < 50) {
    addLogEntry('Error: Maximum log entries must be at least 50', 'error');
    return;
  }

  // Update settings
  appSettings = {
    autoScroll,
    showTimestamps,
    fontSize,
    maxLogEntries
  };

  // Apply settings
  applySettings();

  // Hide dialog
  hideSettingsDialog();

  // Log success message
  addLogEntry('Settings saved successfully', 'info');
}

// Helper function to apply settings
function applySettings(): void {
  // Apply font size
  logContainer.classList.remove('font-small', 'font-medium', 'font-large');
  logContainer.classList.add(`font-${appSettings.fontSize}`);

  // Trim log entries if needed
  const logEntries = logContainer.querySelectorAll('.log-entry');
  if (logEntries.length > appSettings.maxLogEntries) {
    // Remove oldest entries
    for (let i = 0; i < logEntries.length - appSettings.maxLogEntries; i++) {
      logEntries[i].remove();
    }
  }
}

// Helper function to handle character set selection change
function handleCharsetSelectChange(): void {
  const selectedValue = loadTestCharsetSelect.value;

  if (selectedValue === 'custom') {
    loadTestCustomCharsetGroup.style.display = 'block';
  } else {
    loadTestCustomCharsetGroup.style.display = 'none';
  }
}

// Helper function to get the character set based on the selection
function getSelectedCharset(): string {
  const selectedValue = loadTestCharsetSelect.value;

  switch (selectedValue) {
    case 'alphanumeric':
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    case 'alphabetic':
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    case 'numeric':
      return '0123456789';
    case 'custom':
      return loadTestCustomCharsetInput.value || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    default:
      return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  }
}

// Start or stop load test
async function toggleLoadTest(): Promise<void> {
  try {
    if (isLoadTestRunning) {
      // Stop the load test
      await window.api.stopLoadTest();
      // UI updates will be handled by the event listener
    } else {
      // Get configuration from form
      const interval = parseInt(loadTestIntervalInput.value, 10);
      const randomLength = parseInt(loadTestLengthInput.value, 10);
      const charset = getSelectedCharset();
      const encoding = loadTestEncodingSelect.value as BufferEncoding;

      // Validate inputs
      if (isNaN(interval) || interval < 10) {
        addLogEntry('Error: Interval must be at least 100ms', 'error');
        return;
      }

      if (isNaN(randomLength) || randomLength < 1) {
        addLogEntry('Error: Random string length must be at least 1', 'error');
        return;
      }

      if (!charset) {
        addLogEntry('Error: Character set cannot be empty', 'error');
        return;
      }

      // Create configuration object
      const config: LoadTestConfig = {
        interval,
        randomLength,
        charset,
        encoding
      };

      // Start the load test
      await window.api.startLoadTest(config);
      // UI updates will be handled by the event listener
    }

    // Hide the dialog
    hideLoadTestDialog();
  } catch (error) {
    addLogEntry(`Load test error: ${error}`, 'error');
  }
}

// Helper function to add log entries
function addLogEntry(message: string, type: 'info' | 'sent' | 'received' | 'error'): void {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;

  // Add timestamp if enabled
  let displayMessage = message;
  if (appSettings.showTimestamps) {
    const now = new Date();
    const timestamp = `[${now.toLocaleTimeString()}] `;
    displayMessage = timestamp + message;
  }

  entry.textContent = displayMessage;
  logContainer.appendChild(entry);

  // Trim log entries if needed
  const logEntries = logContainer.querySelectorAll('.log-entry');
  if (logEntries.length > appSettings.maxLogEntries) {
    logEntries[0].remove();
  }

  // Auto-scroll to bottom if enabled
  if (appSettings.autoScroll) {
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // Show error dialog for error type entries
  if (type === 'error') {
    showErrorDialog(message);
  }
}

// Update UI based on connection state
function updateConnectionState(connected: boolean, connectionCount: number = 0): void {
  isConnected = connected;

  // Update buttons
  connectButton.disabled = connected;
  disconnectButton.disabled = !connected;
  sendButton.disabled = !connected;
  openLoadTestButton.disabled = !connected;

  // Update status indicator
  if (connected) {
    statusElement.textContent = `Connected (${connectionCount})`;
  } else {
    statusElement.textContent = 'Disconnected';
  }
  statusElement.className = `status ${connected ? 'connected' : 'disconnected'}`;

  // Disable the connection count input when connected, just like host and port
  connectionCountInput.disabled = connected;

  // Update form fields
  hostInput.disabled = connected;
  portInput.disabled = connected;

  // If disconnected, ensure load test is stopped
  if (!connected && isLoadTestRunning) {
    window.api.stopLoadTest().catch(error => {
      addLogEntry(`Error stopping load test: ${error}`, 'error');
    });
  }
}

// Update UI based on load test state
function updateLoadTestState(running: boolean): void {
  isLoadTestRunning = running;

  // Update button text if dialog is open
  if (loadTestDialog.classList.contains('visible')) {
    loadTestStartButton.textContent = running ? 'Stop Load Test' : 'Start Load Test';
  }

  // Update open load test button text
  openLoadTestButton.textContent = running ? 'Stop Load Test' : 'Load Test';
}

// Set up event listeners
function setupEventListeners(): void {
  // Clean up any existing listeners
  if (connectedCleanup) connectedCleanup();
  if (disconnectedCleanup) disconnectedCleanup();
  if (dataCleanup) dataCleanup();
  if (errorCleanup) errorCleanup();
  if (loadTestStartedCleanup) loadTestStartedCleanup();
  if (loadTestStoppedCleanup) loadTestStoppedCleanup();
  if (loadTestMessageSentCleanup) loadTestMessageSentCleanup();

  // Set up new listeners
  connectedCleanup = window.api.onConnected((connectionCount: number) => {
    updateConnectionState(true, connectionCount);
    addLogEntry(`Connected to server (${connectionCount} connections)`, 'info');
  });

  disconnectedCleanup = window.api.onDisconnected((connectionCount: number) => {
    updateConnectionState(connectionCount > 0, connectionCount);
    if (connectionCount > 0) {
      addLogEntry(`Disconnected from a server (${connectionCount} connections remaining)`, 'info');
    } else {
      addLogEntry('Disconnected from all servers', 'info');
    }

    // If load test is running and no connections, stop it
    if (connectionCount === 0 && isLoadTestRunning) {
      window.api.stopLoadTest().catch(error => {
        addLogEntry(`Error stopping load test: ${error}`, 'error');
      });
    }
  });

  dataCleanup = window.api.onData((data: string, encoding: BufferEncoding, connectionId: string) => {
    addLogEntry(`Received from ${connectionId} (${encoding}): ${data}`, 'received');
  });

  errorCleanup = window.api.onError((error: string, connectionId?: string) => {
    if (connectionId) {
      addLogEntry(`Error from ${connectionId}: ${error}`, 'error');
    } else {
      addLogEntry(`Error: ${error}`, 'error');
    }

    // Get current connection count to update UI
    window.api.getConnectionCount().then((count: number) => {
      updateConnectionState(count > 0, count);
    }).catch(err => {
      console.error('Failed to get connection count:', err);
      updateConnectionState(false, 0);
    });
  });

  // Load test event listeners
  loadTestStartedCleanup = window.api.onLoadTestStarted((config: LoadTestConfig) => {
    isLoadTestRunning = true;
    addLogEntry(`Load test started with interval ${config.interval}ms, length ${config.randomLength}, encoding ${config.encoding}`, 'info');
    updateLoadTestState(true);
  });

  loadTestStoppedCleanup = window.api.onLoadTestStopped(() => {
    isLoadTestRunning = false;
    addLogEntry('Load test stopped', 'info');
    updateLoadTestState(false);
  });

  loadTestMessageSentCleanup = window.api.onLoadTestMessageSent((message: string) => {
    addLogEntry(`Load test sent: ${message}`, 'sent');
  });
}

// Connect to server
async function connect(): Promise<void> {
  try {
    const host = hostInput.value;
    const port = parseInt(portInput.value, 10);
    const connectionCount = parseInt(connectionCountInput.value, 10);

    if (!host) {
      addLogEntry('Error: Host cannot be empty', 'error');
      return;
    }

    if (isNaN(port) || port <= 0 || port > 65535) {
      addLogEntry('Error: Port must be a number between 1 and 65535', 'error');
      return;
    }

    if (isNaN(connectionCount) || connectionCount < 1 || connectionCount > 100) {
      addLogEntry('Error: Connection count must be a number between 1 and 100', 'error');
      return;
    }

    addLogEntry(`Connecting to ${host}:${port} with ${connectionCount} connection(s)...`, 'info');

    // Create multiple connections based on the connection count
    for (let i = 0; i < connectionCount; i++) {
      await window.api.connect(host, port);
    }

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

    addLogEntry(`Sent to all connections (${encoding}): ${message}`, 'sent');
    await window.api.send(message, encoding); // No connectionId means send to all

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

// Handle open load test button click
function handleOpenLoadTest(): void {
  if (isLoadTestRunning) {
    // If load test is running, stop it
    showConfirmDialog('Are you sure you want to stop the load test?', async () => {
      try {
        await window.api.stopLoadTest();
        // UI updates will be handled by the event listener
      } catch (error) {
        addLogEntry(`Error stopping load test: ${error}`, 'error');
      }
    });
  } else {
    // If load test is not running, show the dialog
    showLoadTestDialog();
  }
}

// Handle open settings button click
function handleOpenSettings(): void {
  showSettingsDialog();
}

// Initialize the application
function init(): void {
  // Set up event listeners
  setupEventListeners();

  // Apply default settings
  applySettings();

  // Add button event listeners
  connectButton.addEventListener('click', connect);
  disconnectButton.addEventListener('click', disconnect);
  sendButton.addEventListener('click', sendMessage);
  clearLogButton.addEventListener('click', clearLog);
  openLoadTestButton.addEventListener('click', handleOpenLoadTest);
  openSettingsButton.addEventListener('click', handleOpenSettings);

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

  // Add load test dialog event listeners
  closeLoadTestDialogButton.addEventListener('click', hideLoadTestDialog);
  loadTestCancelButton.addEventListener('click', hideLoadTestDialog);
  loadTestStartButton.addEventListener('click', toggleLoadTest);

  // Handle character set selection change
  loadTestCharsetSelect.addEventListener('change', handleCharsetSelectChange);

  // Close load test dialog when clicking outside of it (on the backdrop)
  loadTestDialog.addEventListener('click', (event) => {
    if (event.target === loadTestDialog) {
      hideLoadTestDialog();
    }
  });

  // Add settings dialog event listeners
  closeSettingsDialogButton.addEventListener('click', hideSettingsDialog);
  settingsCancelButton.addEventListener('click', hideSettingsDialog);
  settingsSaveButton.addEventListener('click', saveSettings);

  // Close settings dialog when clicking outside of it (on the backdrop)
  settingsDialog.addEventListener('click', (event) => {
    if (event.target === settingsDialog) {
      hideSettingsDialog();
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
  window.api.getConnectionCount().then((count: number) => {
    updateConnectionState(count > 0, count);
    addLogEntry(`TCP Client initialized (${count} connections)`, 'info');
  }).catch(err => {
    console.error('Failed to get connection count:', err);
    updateConnectionState(false, 0);
    addLogEntry('TCP Client initialized (0 connections)', 'info');
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

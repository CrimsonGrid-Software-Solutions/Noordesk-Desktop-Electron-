const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window Controls
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  closeApp: () => ipcRenderer.send('close-app'),
  restartApp: () => ipcRenderer.send('restart-app'),

  // Navigation
  navigateToPrayer: () => ipcRenderer.send('navigate-to-prayer'),
  navigateToDashboard: () => ipcRenderer.send('navigate-to-dashboard'),
  openQuran: () => ipcRenderer.send('open-quran'),


  // Settings
  settingsUpdated: (settings) => ipcRenderer.send('settings-updated', settings),

  // Listen for commands from the main process
  onPlayAdhan: (callback) => ipcRenderer.on('play-adhan', callback),

  // Test Adhan
  testAdhan: () => ipcRenderer.send('test-adhan'),

  // Custom Notification
  dismissNotification: () => ipcRenderer.send('dismiss-notification')
});
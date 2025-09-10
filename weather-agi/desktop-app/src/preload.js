const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Store operations
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, value) => ipcRenderer.invoke('store-set', key, value)
  },

  // Notifications
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),

  // File operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

  // Monitoring
  startMonitoring: (interval) => ipcRenderer.invoke('start-monitoring', interval),
  stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),

  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Menu event listeners
  onMenuAction: (callback) => {
    const events = [
      'menu-new-analysis',
      'menu-export-data',
      'menu-settings',
      'menu-run-analysis',
      'menu-toggle-monitoring',
      'menu-view-alerts'
    ]
    
    events.forEach(event => {
      ipcRenderer.on(event, callback)
    })
    
    return () => {
      events.forEach(event => {
        ipcRenderer.removeListener(event, callback)
      })
    }
  },

  onMenuNavigate: (callback) => {
    ipcRenderer.on('menu-navigate', (event, route) => callback(route))
    return () => ipcRenderer.removeListener('menu-navigate', callback)
  },

  onMonitoringUpdate: (callback) => {
    ipcRenderer.on('monitoring-update', callback)
    return () => ipcRenderer.removeListener('monitoring-update', callback)
  },

  onNotificationClick: (callback) => {
    ipcRenderer.on('notification-clicked', (event, data) => callback(data))
    return () => ipcRenderer.removeListener('notification-clicked', callback)
  },

  // Platform detection
  platform: process.platform,
  isElectron: true
})
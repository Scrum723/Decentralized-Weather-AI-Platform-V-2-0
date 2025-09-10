const { app, BrowserWindow, Menu, ipcMain, shell, dialog, Notification } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')
const Store = require('electron-store')
const notifier = require('node-notifier')

// Initialize configuration store
const store = new Store({
  defaults: {
    windowBounds: { width: 1400, height: 900 },
    apiKeys: {},
    monitoringSettings: {
      enabled: false,
      interval: 5
    }
  }
})

let mainWindow = null
let monitoringInterval = null

function createMainWindow() {
  const windowBounds = store.get('windowBounds')

  mainWindow = new BrowserWindow({
    ...windowBounds,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../build/icon.png'),
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  })

  // Load the frontend application
  if (app.isPackaged) {
    // Production: Load from bundled frontend
    mainWindow.loadFile(path.join(__dirname, '../frontend/index.html'))
  } else {
    // Development: Load from development server
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // Focus on startup
    if (process.platform === 'darwin') {
      app.dock.show()
    }
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
    if (monitoringInterval) {
      clearInterval(monitoringInterval)
      monitoringInterval = null
    }
  })

  // Save window bounds on resize/move
  mainWindow.on('resize', () => {
    if (mainWindow && !mainWindow.isMaximized()) {
      store.set('windowBounds', mainWindow.getBounds())
    }
  })

  mainWindow.on('move', () => {
    if (mainWindow && !mainWindow.isMaximized()) {
      store.set('windowBounds', mainWindow.getBounds())
    }
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return mainWindow
}

// App event handlers
app.whenReady().then(() => {
  createMainWindow()
  createMenu()
  setupAutoUpdater()
  setupIpcHandlers()

  // Handle activation (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  // Save current settings
  if (mainWindow) {
    store.set('windowBounds', mainWindow.getBounds())
  }
})

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Analysis',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-analysis')
          }
        },
        {
          label: 'Export Data',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow?.webContents.send('menu-export-data')
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('menu-settings')
          }
        },
        { type: 'separator' },
        {
          role: 'quit'
        }
      ]
    },
    {
      label: 'Weather',
      submenu: [
        {
          label: 'Run Analysis',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow?.webContents.send('menu-run-analysis')
          }
        },
        {
          label: 'Start Monitoring',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow?.webContents.send('menu-toggle-monitoring')
          }
        },
        { type: 'separator' },
        {
          label: 'View Alerts',
          accelerator: 'CmdOrCtrl+A',
          click: () => {
            mainWindow?.webContents.send('menu-view-alerts')
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow?.webContents.send('menu-navigate', 'dashboard')
          }
        },
        {
          label: 'Analysis',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow?.webContents.send('menu-navigate', 'analysis')
          }
        },
        {
          label: 'Monitoring',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow?.webContents.send('menu-navigate', 'monitoring')
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About Weather AGI',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Weather AGI',
              message: 'Weather AGI Desktop v2.0',
              detail: 'Professional Severe Weather Forecasting System\\n\\nBuilt for meteorologists, storm chasers, and weather enthusiasts.\\n\\nFeatures AI-enhanced analysis and real-time monitoring capabilities.'
            })
          }
        },
        {
          label: 'Check for Updates',
          click: () => {
            autoUpdater.checkForUpdatesAndNotify()
          }
        },
        { type: 'separator' },
        {
          label: 'Open DevTools',
          accelerator: 'F12',
          click: () => {
            mainWindow?.webContents.toggleDevTools()
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Setup IPC handlers
function setupIpcHandlers() {
  // Store operations
  ipcMain.handle('store-get', (event, key) => {
    return store.get(key)
  })

  ipcMain.handle('store-set', (event, key, value) => {
    store.set(key, value)
    return true
  })

  // Show native notifications
  ipcMain.handle('show-notification', (event, options) => {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: options.title || 'Weather AGI',
        body: options.body,
        icon: path.join(__dirname, '../build/icon.png'),
        urgency: options.urgency || 'normal'
      })
      
      notification.show()
      
      notification.on('click', () => {
        mainWindow?.focus()
        if (options.onClick) {
          mainWindow?.webContents.send('notification-clicked', options.onClick)
        }
      })
    } else {
      // Fallback to node-notifier
      notifier.notify({
        title: options.title || 'Weather AGI',
        message: options.body,
        icon: path.join(__dirname, '../build/icon.png'),
        sound: true
      })
    }
  })

  // File operations
  ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Weather Data',
      defaultPath: `weather-analysis-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      ...options
    })
    return result
  })

  // Monitoring controls
  ipcMain.handle('start-monitoring', (event, interval) => {
    const minutes = interval || 5
    
    if (monitoringInterval) {
      clearInterval(monitoringInterval)
    }
    
    monitoringInterval = setInterval(() => {
      mainWindow?.webContents.send('monitoring-update')
    }, minutes * 60 * 1000)
    
    store.set('monitoringSettings', { enabled: true, interval: minutes })
    return true
  })

  ipcMain.handle('stop-monitoring', (event) => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval)
      monitoringInterval = null
    }
    
    store.set('monitoringSettings', { enabled: false, interval: 5 })
    return true
  })

  // App information
  ipcMain.handle('get-app-info', () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      platform: process.platform,
      arch: process.arch
    }
  })
}

// Auto-updater setup
function setupAutoUpdater() {
  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: 'A new version of Weather AGI is available. It will be downloaded in the background.',
      buttons: ['OK']
    })
  })

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The application will restart to apply the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })
}

// Handle certificate errors (for development)
app.commandLine.appendSwitch('ignore-certificate-errors')

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationUrl) => {
    navigationEvent.preventDefault()
    shell.openExternal(navigationUrl)
  })
})
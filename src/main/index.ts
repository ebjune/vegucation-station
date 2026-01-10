import { config } from 'dotenv'
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { initDatabase } from './database/schema'
import { registerIpcHandlers } from './ipc/handlers'

// Load environment variables from .env file
config({ path: path.join(app.getAppPath(), '.env') })
console.log('ANTHROPIC_API_KEY loaded:', !!process.env.ANTHROPIC_API_KEY)

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
console.log('isDev:', isDev, 'isPackaged:', app.isPackaged)

function createWindow(): void {
  console.log('Creating window...')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    fullscreen: false, // Disabled for development
    kiosk: false,      // Disabled for development
    frame: true,       // Always show frame for now
    autoHideMenuBar: true,
    show: false,       // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for better-sqlite3
    },
  })

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow?.show()
  })

  // Log any renderer errors
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details)
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  // Load the app
  const loadUrl = isDev ? 'http://localhost:5173' : path.join(__dirname, '../../renderer/index.html')
  console.log('Loading URL:', loadUrl)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    console.log('Window closed')
    mainWindow = null
  })
}

// Initialize app
app.whenReady().then(async () => {
  // Initialize database
  await initDatabase()

  // Register IPC handlers
  registerIpcHandlers(ipcMain)

  // Create window
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock()
console.log('Got single instance lock:', gotTheLock)
if (!gotTheLock) {
  console.log('Another instance is running, quitting...')
  app.quit()
  // Note: process.exit() is needed because app.quit() is async
  process.exit(0)
}

app.on('second-instance', () => {
  console.log('Second instance detected, focusing main window')
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.protocol !== 'file:') {
      event.preventDefault()
    }
  })
})

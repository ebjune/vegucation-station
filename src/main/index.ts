import { config } from 'dotenv'
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { initDatabase } from './database/schema'
import { registerIpcHandlers } from './ipc/handlers'
import {
  registerProduceImageProtocol,
  setupProduceImageProtocol,
} from './services/produceImageProtocol'
import {
  migrateFromLegacyUserData,
  seedBundledDataIfNeeded,
} from './config/dataPaths'
import { migrateLegacyProduceImages } from './services/migrateProduceImages'

// Custom protocol for seller-downloaded produce images (must be before app.ready)
registerProduceImageProtocol()

// Load environment variables from .env file
function loadEnvironment(): void {
  const candidates = app.isPackaged
    ? [
        path.join(path.dirname(process.execPath), '.env'),
        path.join(process.resourcesPath, '.env'),
        path.join(app.getPath('userData'), '.env'),
      ]
    : [
        path.join(app.getAppPath(), '.env'),
        path.join(process.cwd(), '.env'),
      ]

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      config({ path: envPath })
      console.log('Loaded .env from:', envPath)
      return
    }
  }

  console.warn('No .env file found; using environment variables only')
}

function reportStartupError(title: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  console.error(title, error)
  dialog.showErrorBox(title, message)
}

loadEnvironment()
console.log('ANTHROPIC_API_KEY loaded:', !!process.env.ANTHROPIC_API_KEY)

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function isKioskMode(): boolean {
  if (app.isPackaged) return true
  const flag = process.env.KIOSK_MODE?.trim().toLowerCase()
  return flag === 'true' || flag === '1'
}

const isKiosk = isKioskMode()
console.log('isDev:', isDev, 'isPackaged:', app.isPackaged, 'isKiosk:', isKiosk)

process.on('uncaughtException', (error) => {
  reportStartupError('VegucationStation failed to start', error)
  app.exit(1)
})

process.on('unhandledRejection', (reason) => {
  reportStartupError('VegucationStation failed to start', reason)
  app.exit(1)
})

function getRendererIndexPath(): string {
  return path.join(__dirname, '../renderer/index.html')
}

function loadRenderer(window: BrowserWindow): void {
  const rendererPath = getRendererIndexPath()

  if (app.isPackaged) {
    console.log('Loading packaged renderer from:', rendererPath)
    void window.loadFile(rendererPath)
    return
  }

  // Development: prefer Vite dev server, fall back to built files in dist/renderer
  let loadedFromDevServer = false
  window.webContents.on('did-fail-load', (_event, _errorCode, _description, validatedURL, isMainFrame) => {
    if (!isMainFrame || loadedFromDevServer) return
    if (!validatedURL.startsWith('http://localhost:5173')) return
    if (!fs.existsSync(rendererPath)) {
      console.error('Dev server unavailable and no built renderer found. Run "pnpm dev" or "pnpm build".')
      return
    }

    loadedFromDevServer = true
    console.log('Dev server unavailable, loading built renderer from:', rendererPath)
    void window.loadFile(rendererPath)
  })

  console.log('Loading development renderer from http://localhost:5173')
  void window.loadURL('http://localhost:5173')
}

function createWindow(): void {
  console.log('Creating window...')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    fullscreen: isKiosk,
    kiosk: isKiosk,
    frame: !isKiosk,
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

  loadRenderer(mainWindow)

  if (isDev && !isKiosk) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    console.log('Window closed')
    mainWindow = null
  })
}

async function startApp(): Promise<void> {
  try {
    setupProduceImageProtocol()

    migrateFromLegacyUserData()
    seedBundledDataIfNeeded()

    await initDatabase()
    migrateLegacyProduceImages()

    registerIpcHandlers(ipcMain)
    createWindow()
  } catch (error) {
    reportStartupError('VegucationStation failed to start', error)
    app.exit(1)
  }
}

// Prevent multiple instances — must run before app startup work
const gotTheLock = app.requestSingleInstanceLock()
console.log('Got single instance lock:', gotTheLock)

if (!gotTheLock) {
  console.log('Another instance is running, quitting...')
  app.quit()
} else {
  app.on('second-instance', () => {
    console.log('Second instance detected, focusing main window')
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    void startApp()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
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

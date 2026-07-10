import fs from 'fs'
import path from 'path'
import { app } from 'electron'

const DATA_DIR_NAME = 'data'
const PRODUCE_IMAGES_DIR_NAME = 'produce-images'
const DB_FILE_NAME = 'vegucation.db'
const LEGACY_APP_FOLDER = 'vegucation-station'
const BUNDLED_DATA_DIR_NAME = 'default-data'

function ensureDir(dirPath: string): string {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
  return dirPath
}

function isWritableDirectory(dirPath: string): boolean {
  try {
    ensureDir(dirPath)
    const testFile = path.join(dirPath, `.write-test-${process.pid}`)
    fs.writeFileSync(testFile, 'ok')
    fs.unlinkSync(testFile)
    return true
  } catch {
    return false
  }
}

/** Project root in dev, install folder when packaged. */
export function getAppRoot(): string {
  if (app.isPackaged) {
    return path.dirname(process.execPath)
  }
  return app.getAppPath()
}

function getPortableDataDir(): string {
  return path.join(getAppRoot(), DATA_DIR_NAME)
}

function getUserDataDataDir(): string {
  return path.join(app.getPath('userData'), DATA_DIR_NAME)
}

/**
 * Portable data directory for the database and runtime images.
 * - Dev: <project>/data
 * - Packaged + writable install folder: <install>/data
 * - Packaged + protected install (e.g. Program Files): %APPDATA%/.../data
 * - Override: VEGUCATION_DATA_DIR in .env
 */
export function getDataDir(): string {
  const customDir = process.env.VEGUCATION_DATA_DIR?.trim()
  if (customDir) {
    return ensureDir(path.resolve(customDir))
  }

  if (!app.isPackaged) {
    return ensureDir(getPortableDataDir())
  }

  if (isWritableDirectory(getAppRoot())) {
    return ensureDir(getPortableDataDir())
  }

  const userDataDir = getUserDataDataDir()
  console.warn(
    'Install folder is not writable; using user data directory for database and images:',
    userDataDir
  )
  return ensureDir(userDataDir)
}

export function getDbPath(): string {
  return path.join(getDataDir(), DB_FILE_NAME)
}

/** Writable produce images (seller downloads, Add Item, etc.). */
export function getProduceImagesDir(): string {
  return ensureDir(path.join(getDataDir(), PRODUCE_IMAGES_DIR_NAME))
}

function getLegacyUserDataRoot(): string {
  return path.join(app.getPath('userData'), LEGACY_APP_FOLDER)
}

function copyDirectoryContents(sourceDir: string, targetDir: string): void {
  if (!fs.existsSync(sourceDir)) return
  ensureDir(targetDir)

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)
    if (entry.isDirectory()) {
      copyDirectoryContents(sourcePath, targetPath)
    } else if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}

/**
 * Copy bundled default inventory from the installer into the active data folder.
 */
export function seedBundledDataIfNeeded(): void {
  if (!app.isPackaged) return

  const dbPath = getDbPath()
  if (fs.existsSync(dbPath)) return

  const bundledDataDir = path.join(process.resourcesPath, BUNDLED_DATA_DIR_NAME)
  if (!fs.existsSync(path.join(bundledDataDir, DB_FILE_NAME))) {
    return
  }

  console.log('Seeding data from bundled defaults:', bundledDataDir)
  copyDirectoryContents(bundledDataDir, getDataDir())
}

/**
 * One-time migration from legacy Electron AppData layout.
 */
export function migrateFromLegacyUserData(): void {
  const legacyRoot = getLegacyUserDataRoot()
  const legacyDb = path.join(legacyRoot, DB_FILE_NAME)
  const targetDb = getDbPath()

  if (!fs.existsSync(legacyDb)) {
    return
  }

  if (!fs.existsSync(targetDb)) {
    console.log('Migrating database from legacy AppData to active data folder')
    fs.copyFileSync(legacyDb, targetDb)

    for (const suffix of ['-wal', '-shm', '-journal'] as const) {
      const legacySidecar = `${legacyDb}${suffix}`
      if (fs.existsSync(legacySidecar)) {
        fs.copyFileSync(legacySidecar, `${targetDb}${suffix}`)
      }
    }
  }

  copyDirectoryContents(
    path.join(legacyRoot, PRODUCE_IMAGES_DIR_NAME),
    getProduceImagesDir()
  )
}

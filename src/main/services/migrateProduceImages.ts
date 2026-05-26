import fs from 'fs'
import path from 'path'
import { getDatabase } from '../database/schema'
import {
  getProduceImagesDir,
  getBundledProduceImagesDir,
  isDevMode,
  toProduceImageUrl,
  toPublicImagePath,
} from './imageDownloader'

function fileNameFromStoredPath(imagePath: string): string | null {
  if (imagePath.startsWith('/produce-images/')) {
    return imagePath.replace(/^\/produce-images\//, '')
  }
  if (imagePath.startsWith('produce://')) {
    try {
      const url = new URL(imagePath)
      const fromPath = decodeURIComponent(url.pathname.replace(/^\//, ''))
      if (fromPath) return fromPath
      if (url.hostname) return decodeURIComponent(url.hostname)
    } catch {
      return null
    }
  }
  return null
}

function syncToPublicFolder(fileName: string, userFile: string): void {
  const publicDir = getBundledProduceImagesDir()
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }
  fs.copyFileSync(userFile, path.join(publicDir, fileName))
}

function correctPathForFile(fileName: string): string {
  return isDevMode() ? toPublicImagePath(fileName) : toProduceImageUrl(fileName)
}

/**
 * Ensure downloaded images are reachable by the renderer and fix legacy URL formats.
 */
export function migrateLegacyProduceImages(): void {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT id, image_path as imagePath
    FROM produce
    WHERE image_path IS NOT NULL AND image_path != ''
  `).all() as Array<{ id: number; imagePath: string }>

  const userDir = getProduceImagesDir()
  const bundledDir = getBundledProduceImagesDir()

  for (const row of rows) {
    const fileName = fileNameFromStoredPath(row.imagePath)
    if (!fileName) continue

    const userFile = path.join(userDir, fileName)
    const correctPath = correctPathForFile(fileName)

    if (fs.existsSync(userFile)) {
      if (isDevMode()) {
        syncToPublicFolder(fileName, userFile)
      }
      if (row.imagePath !== correctPath) {
        db.prepare('UPDATE produce SET image_path = ? WHERE id = ?').run(correctPath, row.id)
      }
      continue
    }

    const bundledFile = path.join(bundledDir, fileName)
    if (fs.existsSync(bundledFile)) {
      fs.copyFileSync(bundledFile, userFile)
      if (isDevMode()) {
        syncToPublicFolder(fileName, userFile)
      }
      db.prepare('UPDATE produce SET image_path = ? WHERE id = ?').run(correctPath, row.id)
    }
  }
}

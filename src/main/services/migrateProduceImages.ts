import fs from 'fs'
import path from 'path'
import { getDatabase } from '../database/schema'
import {
  getProduceImagesDir,
  getBundledProduceImagesDir,
  toProduceImageUrl,
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

/**
 * Ensure downloaded images are stored in data/produce-images and referenced via produce:// URLs.
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
    const correctPath = toProduceImageUrl(fileName)

    if (fs.existsSync(userFile)) {
      if (row.imagePath !== correctPath) {
        db.prepare('UPDATE produce SET image_path = ? WHERE id = ?').run(correctPath, row.id)
      }
      continue
    }

    const bundledFile = path.join(bundledDir, fileName)
    if (fs.existsSync(bundledFile)) {
      fs.copyFileSync(bundledFile, userFile)
      db.prepare('UPDATE produce SET image_path = ? WHERE id = ?').run(correctPath, row.id)
    }
  }
}

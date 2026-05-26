import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { app } from 'electron'

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

/**
 * Convert produce name to image filename base
 * e.g., "Green Beans" -> "green-beans"
 */
export function nameToImageBase(name: string): string {
  return name.toLowerCase().replace(/['\s]/g, '-').replace(/--/g, '-')
}

/**
 * Writable folder for seller-downloaded images (persists across restarts).
 */
export function getProduceImagesDir(): string {
  const imagesDir = path.join(app.getPath('userData'), 'produce-images')
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
  }
  return imagesDir
}

/** URL stored in the database and loaded via the produce:// protocol (three slashes required). */
export function toProduceImageUrl(fileName: string): string {
  return `produce:///${encodeURIComponent(fileName)}`
}

/** Web path served by Vite in development (same as the original working behavior). */
export function toPublicImagePath(fileName: string): string {
  return `/produce-images/${fileName}`
}

export function isDevMode(): boolean {
  return process.env.NODE_ENV === 'development' || !app.isPackaged
}

/**
 * Bundled seed images shipped with the app (read-only, dev/public or production resources).
 */
export function getBundledProduceImagesDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'produce-images')
  }
  return path.join(app.getAppPath(), 'src/renderer/public/produce-images')
}

function getExtensionFromUrl(url: string, contentType?: string): string {
  if (contentType) {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg'
    if (contentType.includes('png')) return '.png'
    if (contentType.includes('webp')) return '.webp'
    if (contentType.includes('gif')) return '.gif'
  }

  try {
    const urlPath = new URL(url).pathname.toLowerCase()
    if (urlPath.endsWith('.jpg') || urlPath.endsWith('.jpeg')) return '.jpg'
    if (urlPath.endsWith('.png')) return '.png'
    if (urlPath.endsWith('.webp')) return '.webp'
    if (urlPath.endsWith('.gif')) return '.gif'
  } catch {
    // ignore invalid URL for extension parsing
  }

  return '.jpg'
}

function isImageContentType(contentType?: string): boolean {
  if (!contentType) return true
  return contentType.startsWith('image/')
}

function validateImageFile(filePath: string): void {
  const stats = fs.statSync(filePath)
  if (stats.size < 500) {
    throw new Error('Downloaded file is too small to be a valid image')
  }

  const header = Buffer.alloc(12)
  const fd = fs.openSync(filePath, 'r')
  try {
    fs.readSync(fd, header, 0, 12, 0)
  } finally {
    fs.closeSync(fd)
  }

  const isJpeg = header[0] === 0xff && header[1] === 0xd8
  const isPng = header.toString('ascii', 0, 4) === '\x89PNG'
  const isGif = header.toString('ascii', 0, 3) === 'GIF'
  const isWebp = header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP'

  if (!isJpeg && !isPng && !isGif && !isWebp) {
    throw new Error(
      'The URL did not return a valid image file. Use a direct image link (ending in .jpg, .png, etc.), not a web page.'
    )
  }
}

function removeExistingImages(imagesDir: string, baseName: string): void {
  if (!fs.existsSync(imagesDir)) return

  for (const file of fs.readdirSync(imagesDir)) {
    const parsed = path.parse(file)
    const ext = parsed.ext.toLowerCase()
    if (parsed.name === baseName && IMAGE_EXTENSIONS.includes(ext)) {
      fs.unlinkSync(path.join(imagesDir, file))
    }
  }
}

function safeUnlink(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {
    // ignore cleanup errors
  }
}

function fetchImage(
  imageUrl: string,
  redirectCount = 0
): Promise<{ buffer: Buffer; contentType?: string }> {
  if (redirectCount > 5) {
    return Promise.reject(new Error('Too many redirects while downloading image'))
  }

  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http

    const request = protocol.get(
      imageUrl,
      {
        headers: {
          'User-Agent': 'VegucationStation/1.0 (Educational Kiosk App)',
          Accept: 'image/*',
        },
      },
      (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          const redirectUrl = new URL(response.headers.location, imageUrl).toString()
          fetchImage(redirectUrl, redirectCount + 1).then(resolve).catch(reject)
          response.resume()
          return
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: HTTP ${response.statusCode}`))
          response.resume()
          return
        }

        const contentType = response.headers['content-type']
        if (!isImageContentType(contentType)) {
          reject(
            new Error(
              'The URL did not return an image. Paste a direct image link (right-click image → Copy image address), not a gallery page URL.'
            )
          )
          response.resume()
          return
        }

        const chunks: Buffer[] = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => {
          resolve({ buffer: Buffer.concat(chunks), contentType })
        })
        response.on('error', reject)
      }
    )

    request.on('error', reject)
    request.setTimeout(30000, () => {
      request.destroy()
      reject(new Error('Image download timeout'))
    })
  })
}

/**
 * Download an image from a URL and save it to userData/produce-images.
 * Does not remove the previous image until the new file is validated.
 */
export async function downloadProduceImage(imageUrl: string, produceName: string): Promise<string> {
  const imagesDir = getProduceImagesDir()
  const baseName = nameToImageBase(produceName)

  const { buffer, contentType } = await fetchImage(imageUrl)
  const extension = getExtensionFromUrl(imageUrl, contentType)
  const fileName = `${baseName}${extension}`
  const finalPath = path.join(imagesDir, fileName)
  const tempPath = path.join(imagesDir, `${baseName}.${randomUUID()}.tmp`)

  try {
    fs.writeFileSync(tempPath, buffer)
    validateImageFile(tempPath)

    removeExistingImages(imagesDir, baseName)
    fs.renameSync(tempPath, finalPath)

    // In development, also copy to public/ so Vite serves /produce-images/... (original behavior)
    if (isDevMode()) {
      const publicDir = getBundledProduceImagesDir()
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
      }
      removeExistingImages(publicDir, baseName)
      fs.copyFileSync(finalPath, path.join(publicDir, fileName))
      return toPublicImagePath(fileName)
    }
  } catch (error) {
    safeUnlink(tempPath)
    throw error
  }

  return toProduceImageUrl(fileName)
}

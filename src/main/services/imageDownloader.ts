import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

/**
 * Convert produce name to image filename base
 * e.g., "Green Beans" -> "green-beans"
 */
function nameToImageBase(name: string): string {
  return name.toLowerCase().replace(/['\s]/g, '-').replace(/--/g, '-')
}

/**
 * Get the produce-images directory path
 * In development: src/renderer/public/produce-images
 * In production: resources/produce-images (copied during build)
 */
function getProduceImagesDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'produce-images')
  } else {
    // In dev mode, app.getAppPath() returns the project root
    const appPath = app.getAppPath()
    const imagesDir = path.join(appPath, 'src/renderer/public/produce-images')
    console.log('Images directory:', imagesDir)
    return imagesDir
  }
}

/**
 * Determine file extension from URL or content-type
 */
function getExtensionFromUrl(url: string, contentType?: string): string {
  // Check content-type first
  if (contentType) {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg'
    if (contentType.includes('png')) return '.png'
    if (contentType.includes('webp')) return '.webp'
    if (contentType.includes('gif')) return '.gif'
  }

  // Fall back to URL extension
  const urlPath = new URL(url).pathname.toLowerCase()
  if (urlPath.endsWith('.jpg') || urlPath.endsWith('.jpeg')) return '.jpg'
  if (urlPath.endsWith('.png')) return '.png'
  if (urlPath.endsWith('.webp')) return '.webp'
  if (urlPath.endsWith('.gif')) return '.gif'

  // Default to .jpg
  return '.jpg'
}

/**
 * Download an image from a URL and save it to the produce-images folder
 * Returns the relative path for use in the app
 */
export async function downloadProduceImage(imageUrl: string, produceName: string): Promise<string> {
  const imagesDir = getProduceImagesDir()
  const baseName = nameToImageBase(produceName)

  // Ensure the directory exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
  }

  // Delete any existing images for this produce
  const existingFiles = fs.readdirSync(imagesDir)
  for (const file of existingFiles) {
    const fileBase = path.parse(file).name
    if (fileBase === baseName) {
      fs.unlinkSync(path.join(imagesDir, file))
    }
  }

  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http

    const request = protocol.get(imageUrl, {
      headers: {
        'User-Agent': 'VegucationStation/1.0 (Educational Kiosk App)'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location
        if (redirectUrl) {
          downloadProduceImage(redirectUrl, produceName)
            .then(resolve)
            .catch(reject)
          return
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: HTTP ${response.statusCode}`))
        return
      }

      // Determine extension from content-type
      const contentType = response.headers['content-type']
      const extension = getExtensionFromUrl(imageUrl, contentType)
      const fileName = `${baseName}${extension}`
      const filePath = path.join(imagesDir, fileName)

      const fileStream = fs.createWriteStream(filePath)
      response.pipe(fileStream)

      fileStream.on('finish', () => {
        fileStream.close()
        // Return the path relative to the public folder for use in the app
        resolve(`/produce-images/${fileName}`)
      })

      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {}) // Clean up partial file
        reject(err)
      })
    })

    request.on('error', reject)
    request.setTimeout(30000, () => {
      request.destroy()
      reject(new Error('Image download timeout'))
    })
  })
}

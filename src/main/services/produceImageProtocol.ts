import fs from 'fs'
import { protocol, net } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { getBundledProduceImagesDir, getProduceImagesDir } from './imageDownloader'

export function registerProduceImageProtocol(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'produce',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ])
}

function resolveProduceImagePath(fileName: string): string | null {
  const userFile = path.join(getProduceImagesDir(), fileName)
  if (fs.existsSync(userFile)) {
    return userFile
  }

  const bundledFile = path.join(getBundledProduceImagesDir(), fileName)
  if (fs.existsSync(bundledFile)) {
    return bundledFile
  }

  return null
}

export function setupProduceImageProtocol(): void {
  protocol.handle('produce', async (request) => {
    try {
      const fileName = fileNameFromProduceUrl(request.url)
      if (!fileName) {
        return new Response('Not found', { status: 404 })
      }

      const filePath = resolveProduceImagePath(fileName)
      if (!filePath) {
        return new Response('Not found', { status: 404 })
      }

      return net.fetch(pathToFileURL(filePath).toString())
    } catch (error) {
      console.error('produce:// protocol error:', error)
      return new Response('Not found', { status: 404 })
    }
  })
}

/** Resolve filename from produce:// URLs (supports legacy produce://file.jpg form). */
function fileNameFromProduceUrl(requestUrl: string): string | null {
  const url = new URL(requestUrl)
  const fromPath = decodeURIComponent(url.pathname.replace(/^\//, ''))
  if (fromPath) return fromPath
  if (url.hostname) return decodeURIComponent(url.hostname)
  return null
}

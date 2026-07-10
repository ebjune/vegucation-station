import { useState, useEffect } from 'react'
import type { Produce } from '../../models/Produce'

interface ProduceCardProps {
  produce: Produce
  onClick?: () => void
  selected?: boolean
  showAvailability?: boolean
}

// Convert produce name to image filename base (e.g., "Green Beans" -> "green-beans")
function nameToImageBase(name: string): string {
  return name.toLowerCase().replace(/['\s]/g, '-').replace(/--/g, '-')
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

function withCacheBust(src: string, refreshKey: number): string {
  if (refreshKey <= 0) return src
  const separator = src.includes('?') ? '&' : '?'
  return `${src}${separator}v=${refreshKey}`
}

function tryLoadImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

function produceProtocolUrl(fileName: string): string {
  return `produce:///${encodeURIComponent(fileName)}`
}

function normalizeDbImagePath(imagePath: string): string | null {
  if (imagePath.startsWith('/produce-images/')) {
    const fileName = imagePath.replace(/^\/produce-images\//, '')
    return produceProtocolUrl(fileName)
  }
  if (imagePath.startsWith('produce://')) {
    try {
      const url = new URL(imagePath)
      const fromPath = url.pathname.replace(/^\//, '')
      if (fromPath) {
        return `produce:///${encodeURIComponent(decodeURIComponent(fromPath))}`
      }
      if (url.hostname) {
        return `produce:///${encodeURIComponent(url.hostname)}`
      }
    } catch {
      return null
    }
  }
  return null
}

// refreshKey forces re-check when changed (e.g., after downloading new image)
export function useProduceImage(
  produceName: string,
  imagePath: string | null = null,
  refreshKey: number = 0
): string | null {
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function resolveImage() {
      setImageSrc(null)

      const dbPath = imagePath ? normalizeDbImagePath(imagePath) : null
      if (dbPath) {
        const src = withCacheBust(dbPath, refreshKey)
        if (await tryLoadImage(src)) {
          if (!cancelled) setImageSrc(src)
          return
        }
      }

      const baseName = nameToImageBase(produceName)

      for (const ext of IMAGE_EXTENSIONS) {
        const fileName = `${baseName}${ext}`
        const testPath = withCacheBust(produceProtocolUrl(fileName), refreshKey)
        if (await tryLoadImage(testPath)) {
          if (!cancelled) setImageSrc(testPath)
          return
        }
      }
    }

    resolveImage()

    return () => {
      cancelled = true
    }
  }, [produceName, imagePath, refreshKey])

  return imageSrc
}

// Placeholder images based on produce name
function getProduceEmoji(name: string): string {
  const emojiMap: Record<string, string> = {
    tomatoes: '🍅',
    carrots: '🥕',
    lettuce: '🥬',
    spinach: '🥬',
    kale: '🥬',
    zucchini: '🥒',
    'bell peppers': '🫑',
    cucumbers: '🥒',
    broccoli: '🥦',
    cauliflower: '🥦',
    'green beans': '🫛',
    corn: '🌽',
    potatoes: '🥔',
    'sweet potatoes': '🍠',
    onions: '🧅',
    garlic: '🧄',
    beets: '🫒',
    radishes: '🫒',
    turnips: '🫒',
    squash: '🎃',
    pumpkin: '🎃',
    eggplant: '🍆',
    asparagus: '🥬',
    celery: '🥬',
    cabbage: '🥬',
    apples: '🍎',
    peaches: '🍑',
    strawberries: '🍓',
    blueberries: '🫐',
    raspberries: '🫐',
    blackberries: '🫐',
    watermelon: '🍉',
    cantaloupe: '🍈',
    grapes: '🍇',
    pears: '🍐',
    plums: '🍑',
    cherries: '🍒',
    'chicken eggs': '🥚',
    'duck eggs': '🥚',
    'goat cheese': '🧀',
    'fresh milk': '🥛',
    butter: '🧈',
    shiitake: '🍄',
    'oyster mushrooms': '🍄',
    portobello: '🍄',
    cremini: '🍄',
    "lion's mane": '🍄',
    basil: '🌿',
    cilantro: '🌿',
    parsley: '🌿',
    mint: '🌿',
    rosemary: '🌿',
    thyme: '🌿',
    dill: '🌿',
    'microgreens mix': '🌱',
    'sunflower sprouts': '🌱',
    honey: '🍯',
    'maple syrup': '🍁',
    jam: '🍓',
    pickles: '🥒',
    'fresh bread': '🍞',
    fennel: '🌿',
  }

  return emojiMap[name.toLowerCase()] || '🥗'
}

export default function ProduceCard({
  produce,
  onClick,
  selected = false,
  showAvailability = false,
}: ProduceCardProps) {
  const imageSrc = useProduceImage(produce.name, produce.imagePath)

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full aspect-square rounded-touch p-4
        flex flex-col items-center justify-center gap-2
        transition-all duration-150
        ${selected
          ? 'bg-primary-100 border-4 border-primary-500 scale-95'
          : 'bg-white border-2 border-gray-200 hover:border-primary-300 hover:shadow-lg'
        }
        ${onClick ? 'cursor-pointer active:scale-95' : 'cursor-default'}
      `}
    >
      {showAvailability && (
        <div
          className={`
            absolute top-2 right-2 w-4 h-4 rounded-full
            ${produce.isAvailable ? 'bg-primary-500' : 'bg-gray-300'}
          `}
        />
      )}

      {selected && (
        <div className="absolute top-2 left-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">✓</span>
        </div>
      )}

      <div className="w-24 h-24 flex items-center justify-center">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={produce.name}
            className="w-full h-full object-cover rounded-xl shadow-sm"
          />
        ) : (
          <span className="text-6xl">{getProduceEmoji(produce.name)}</span>
        )}
      </div>

      <span className="text-touch-base font-semibold text-earth-800 text-center leading-tight">
        {produce.name}
      </span>
    </button>
  )
}

export { getProduceEmoji }

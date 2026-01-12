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

// Try multiple image extensions based on produce name
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

// refreshKey parameter forces re-check when changed (e.g., after downloading new image)
export function useProduceImage(produceName: string, refreshKey: number = 0): string | null {
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  useEffect(() => {
    // Reset state when refreshKey changes
    setImageSrc(null)

    const baseName = nameToImageBase(produceName)
    const basePath = `/produce-images/${baseName}`

    // Check each extension
    let found = false
    for (const ext of IMAGE_EXTENSIONS) {
      // Add cache-busting query param when refreshKey > 0
      const cacheBust = refreshKey > 0 ? `?v=${refreshKey}` : ''
      const testPath = basePath + ext + cacheBust
      const img = new Image()
      img.onload = () => {
        if (!found) {
          found = true
          setImageSrc(testPath)
        }
      }
      img.src = testPath
    }

    // Timeout fallback - show emoji if no image found
    const timeout = setTimeout(() => {
      if (!found) setImageSrc(null)
    }, 500)

    return () => clearTimeout(timeout)
  }, [produceName, refreshKey])

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
  }

  return emojiMap[name.toLowerCase()] || '🥗'
}

export default function ProduceCard({
  produce,
  onClick,
  selected = false,
  showAvailability = false,
}: ProduceCardProps) {
  // Auto-detect image based on produce name (checks .jpg, .png, .webp)
  const imageSrc = useProduceImage(produce.name)

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
      {/* Availability indicator */}
      {showAvailability && (
        <div
          className={`
            absolute top-2 right-2 w-4 h-4 rounded-full
            ${produce.isAvailable ? 'bg-primary-500' : 'bg-gray-300'}
          `}
        />
      )}

      {/* Selection checkmark */}
      {selected && (
        <div className="absolute top-2 left-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">✓</span>
        </div>
      )}

      {/* Produce image or emoji */}
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

      {/* Produce name */}
      <span className="text-touch-base font-semibold text-earth-800 text-center leading-tight">
        {produce.name}
      </span>
    </button>
  )
}

export { getProduceEmoji }

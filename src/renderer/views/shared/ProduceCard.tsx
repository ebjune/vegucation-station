import type { Produce } from '../../models/Produce'

interface ProduceCardProps {
  produce: Produce
  onClick?: () => void
  selected?: boolean
  showAvailability?: boolean
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
      <div className="text-6xl">
        {produce.imagePath ? (
          <img
            src={produce.imagePath}
            alt={produce.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
        ) : (
          getProduceEmoji(produce.name)
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

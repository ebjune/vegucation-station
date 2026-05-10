import type { Recipe } from '../../models/Recipe'
import TouchButton from '../shared/TouchButton'

interface RecipeCardProps {
  recipe: Recipe
  isExpanded: boolean
  onToggle: () => void
  onEmail: () => void
  onPrint: () => void
  emailEnabled: boolean
  /** This card's print job is in progress */
  isPrinting?: boolean
  /** Another card (or this one) is printing — disable all print buttons */
  printBusy?: boolean
}

const DIFFICULTY_COLORS = {
  Easy: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
}

export default function RecipeCard({
  recipe,
  isExpanded,
  onToggle,
  onEmail,
  onPrint,
  emailEnabled,
  isPrinting = false,
  printBusy = false,
}: RecipeCardProps) {
  return (
    <div className="bg-white rounded-touch shadow-md overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-touch-lg font-bold text-earth-800 mb-2">
              {recipe.title}
            </h3>
            <p className="text-touch-sm text-earth-800/70">{recipe.description}</p>
          </div>
          <span className="text-2xl text-primary-500 flex-shrink-0">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-3 mt-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
            <span>⏱️</span> {recipe.prepTime}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              DIFFICULTY_COLORS[recipe.difficulty] || DIFFICULTY_COLORS.Easy
            }`}
          >
            {recipe.difficulty}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
            <span>👥</span> Serves {recipe.servings}
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {/* Ingredients */}
          <div className="mt-4">
            <h4 className="text-touch-base font-semibold text-earth-800 mb-3 flex items-center gap-2">
              <span>🥗</span> Ingredients
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-touch-sm text-earth-800/80"
                >
                  <span className="w-2 h-2 bg-primary-400 rounded-full flex-shrink-0" />
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="mt-6">
            <h4 className="text-touch-base font-semibold text-earth-800 mb-3 flex items-center gap-2">
              <span>👩‍🍳</span> Instructions
            </h4>
            <ol className="space-y-4">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <p className="text-touch-sm text-earth-800/80 pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            {emailEnabled && (
              <TouchButton
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEmail()
                }}
                className="flex-1"
              >
                📧 Email Recipe
              </TouchButton>
            )}
            <TouchButton
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onPrint()
              }}
              className="flex-1"
              disabled={printBusy}
            >
              {isPrinting ? '🖨️ Printing…' : '🖨️ Print Recipe'}
            </TouchButton>
          </div>
        </div>
      )}
    </div>
  )
}

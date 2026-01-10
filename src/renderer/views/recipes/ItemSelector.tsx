import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProduceStore } from '../../viewmodels/useProduceStore'
import { useRecipeStore } from '../../viewmodels/useRecipeStore'
import ProduceCard from '../shared/ProduceCard'
import TouchButton from '../shared/TouchButton'
import LoadingSpinner from '../shared/LoadingSpinner'
import CategoryFilter from '../customer/CategoryFilter'

export default function ItemSelector() {
  const navigate = useNavigate()

  const {
    categories,
    availableProduce,
    produceLoading,
    fetchCategories,
    fetchAvailableProduce,
    selectedCategoryId,
    setSelectedCategoryId,
  } = useProduceStore()

  const {
    selectedIngredients,
    addIngredient,
    removeIngredient,
    isSelected,
    generateRecipes,
    isGenerating,
    error,
  } = useRecipeStore()

  // Fetch data on mount
  useEffect(() => {
    fetchCategories()
    fetchAvailableProduce()
  }, [fetchCategories, fetchAvailableProduce])

  // Filter produce by selected category
  const filteredProduce = selectedCategoryId
    ? availableProduce.filter((p) => p.categoryId === selectedCategoryId)
    : availableProduce

  const handleProduceClick = (produce: (typeof availableProduce)[0]) => {
    if (isSelected(produce.id)) {
      removeIngredient(produce.id)
    } else {
      addIngredient(produce)
    }
  }

  const handleGenerateRecipes = async () => {
    await generateRecipes()
    navigate('/recipes/results')
  }

  if (produceLoading && availableProduce.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading ingredients..." />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-touch-xl font-bold text-earth-800">
          Select Your Ingredients
        </h2>
        <p className="text-touch-sm text-earth-800/70">
          Choose up to 5 items to get recipe ideas
        </p>
      </div>

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
      />

      {/* Produce Grid */}
      <div className="flex-1 overflow-y-auto scroll-touch p-6">
        {filteredProduce.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">🥗</span>
            <h3 className="text-touch-xl font-semibold text-earth-800 mb-2">
              No ingredients available
            </h3>
            <p className="text-touch-base text-earth-800/70">
              Check back later for fresh items!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProduce.map((produce) => (
              <ProduceCard
                key={produce.id}
                produce={produce}
                onClick={() => handleProduceClick(produce)}
                selected={isSelected(produce.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Bar - Selected Items and Generate Button */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        {error && (
          <p className="text-secondary-600 text-sm mb-2">{error}</p>
        )}

        <div className="flex items-center justify-between gap-4">
          {/* Selected Items */}
          <div className="flex-1">
            {selectedIngredients.length === 0 ? (
              <p className="text-earth-800/50 text-touch-sm">
                Tap items above to select them
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedIngredients.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {item.name}
                    <button
                      onClick={() => removeIngredient(item.id)}
                      className="ml-1 w-5 h-5 rounded-full bg-primary-200 hover:bg-primary-300 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <TouchButton
            variant="secondary"
            onClick={handleGenerateRecipes}
            disabled={selectedIngredients.length === 0 || isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin">⏳</span>
                Generating...
              </>
            ) : (
              <>Get Recipes ({selectedIngredients.length})</>
            )}
          </TouchButton>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProduceStore } from '../../viewmodels/useProduceStore'
import { useEducationStore } from '../../viewmodels/useEducationStore'
import { useRecipeStore } from '../../viewmodels/useRecipeStore'
import LoadingSpinner from '../shared/LoadingSpinner'
import TouchButton from '../shared/TouchButton'
import FunFacts from './FunFacts'
import NutritionInfo from './NutritionInfo'
import { getProduceEmoji, useProduceImage } from '../shared/ProduceCard'

export default function ProduceDetail() {
  const navigate = useNavigate()
  const { produceId } = useParams<{ produceId: string }>()
  const { availableProduce, fetchAvailableProduce } = useProduceStore()
  const { fetchContent, isLoading, error, isExpanded, setIsExpanded } = useEducationStore()
  const { addIngredient, clearIngredients } = useRecipeStore()

  const [content, setContent] = useState<Awaited<ReturnType<typeof fetchContent>>>(null)

  const produce = availableProduce.find((p) => p.id === parseInt(produceId || '', 10))
  // Auto-detect image based on produce name
  const imageSrc = useProduceImage(produce?.name || '')

  // Fetch produce if not loaded
  useEffect(() => {
    if (availableProduce.length === 0) {
      fetchAvailableProduce()
    }
  }, [availableProduce.length, fetchAvailableProduce])

  // Fetch education content
  useEffect(() => {
    if (produce) {
      fetchContent(produce.id, produce.name).then(setContent)
    }
  }, [produce, fetchContent])

  const handleGetRecipes = () => {
    if (produce) {
      clearIngredients()
      addIngredient(produce)
      navigate('/recipes')
    }
  }

  if (!produce) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🤔</span>
          <h3 className="text-touch-xl font-semibold text-earth-800 mb-4">
            Produce not found
          </h3>
          <TouchButton variant="primary" onClick={() => navigate('/browse')}>
            Back to Browse
          </TouchButton>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" message={`Learning about ${produce.name}...`} />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto scroll-touch">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-32 h-32 flex items-center justify-center text-8xl">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={produce.name}
                className="w-full h-full object-cover rounded-2xl shadow-md"
              />
            ) : (
              getProduceEmoji(produce.name)
            )}
          </div>
          <div>
            <h2 className="text-touch-3xl font-bold text-earth-800">{produce.name}</h2>
            <p className="text-touch-base text-earth-800/70">
              Fresh from your local farmers market
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-secondary-100 border border-secondary-300 rounded-touch p-4 mb-6">
            <p className="text-secondary-700">{error}</p>
          </div>
        )}

        {/* Fun Facts Section */}
        {content && <FunFacts facts={content.funFacts} />}

        {/* Nutrition Info */}
        {content?.nutritionInfo && (
          <NutritionInfo nutrition={content.nutritionInfo} />
        )}

        {/* Learn More Section (Expandable) */}
        {content?.detailedInfo && (
          <div className="mb-8">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between bg-white rounded-touch p-4 shadow-md hover:shadow-lg transition-shadow"
            >
              <span className="text-touch-lg font-semibold text-earth-800">
                Learn More
              </span>
              <span className="text-2xl text-primary-500">
                {isExpanded ? '▲' : '▼'}
              </span>
            </button>

            {isExpanded && (
              <div className="bg-white rounded-b-touch p-6 -mt-2 shadow-md border-t border-gray-100">
                <div className="prose prose-lg text-earth-800/80 whitespace-pre-line">
                  {content.detailedInfo}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pb-6">
          <TouchButton
            variant="outline"
            onClick={() => navigate('/browse')}
            className="flex-1"
          >
            ← Back to Browse
          </TouchButton>
          <TouchButton
            variant="secondary"
            onClick={handleGetRecipes}
            className="flex-1"
          >
            Get Recipes with {produce.name} →
          </TouchButton>
        </div>
      </div>
    </div>
  )
}

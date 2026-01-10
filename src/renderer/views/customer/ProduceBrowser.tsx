import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProduceStore } from '../../viewmodels/useProduceStore'
import ProduceCard from '../shared/ProduceCard'
import LoadingSpinner from '../shared/LoadingSpinner'
import CategoryFilter from './CategoryFilter'

export default function ProduceBrowser() {
  const navigate = useNavigate()
  const { categoryId } = useParams<{ categoryId?: string }>()

  const {
    categories,
    availableProduce,
    produceLoading,
    fetchCategories,
    fetchAvailableProduce,
    selectedCategoryId,
    setSelectedCategoryId,
  } = useProduceStore()

  // Fetch data on mount
  useEffect(() => {
    fetchCategories()
    fetchAvailableProduce()
  }, [fetchCategories, fetchAvailableProduce])

  // Sync URL category param with store
  useEffect(() => {
    if (categoryId) {
      setSelectedCategoryId(parseInt(categoryId, 10))
    } else {
      setSelectedCategoryId(null)
    }
  }, [categoryId, setSelectedCategoryId])

  // Filter produce by selected category
  const filteredProduce = selectedCategoryId
    ? availableProduce.filter((p) => p.categoryId === selectedCategoryId)
    : availableProduce

  const handleCategorySelect = (catId: number | null) => {
    if (catId === null) {
      navigate('/browse')
    } else {
      navigate(`/browse/${catId}`)
    }
  }

  const handleProduceSelect = (produceId: number) => {
    navigate(`/learn/${produceId}`)
  }

  if (produceLoading && availableProduce.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading produce..." />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
      />

      {/* Produce Grid */}
      <div className="flex-1 overflow-y-auto scroll-touch p-6">
        {filteredProduce.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">🥗</span>
            <h3 className="text-touch-xl font-semibold text-earth-800 mb-2">
              No produce available
            </h3>
            <p className="text-touch-base text-earth-800/70">
              {selectedCategoryId
                ? 'Try selecting a different category'
                : 'Check back later for fresh items!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProduce.map((produce) => (
              <ProduceCard
                key={produce.id}
                produce={produce}
                onClick={() => handleProduceSelect(produce.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

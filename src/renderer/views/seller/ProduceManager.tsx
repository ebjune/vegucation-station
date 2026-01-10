import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProduceStore } from '../../viewmodels/useProduceStore'
import { useSellerStore } from '../../viewmodels/useSellerStore'
import { useAppStore } from '../../viewmodels/useAppStore'
import LoadingSpinner from '../shared/LoadingSpinner'
import { getProduceEmoji } from '../shared/ProduceCard'

export default function ProduceManager() {
  const navigate = useNavigate()
  const { isSellerAuthenticated } = useAppStore()
  const { searchQuery, setSearchQuery } = useSellerStore()
  const {
    categories,
    allProduce,
    produceLoading,
    fetchCategories,
    fetchAllProduce,
    toggleAvailability,
    selectedCategoryId,
    setSelectedCategoryId,
  } = useProduceStore()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isSellerAuthenticated) {
      navigate('/seller')
    }
  }, [isSellerAuthenticated, navigate])

  // Fetch data on mount
  useEffect(() => {
    fetchCategories()
    fetchAllProduce()
  }, [fetchCategories, fetchAllProduce])

  // Filter produce by category and search
  const filteredProduce = allProduce.filter((produce) => {
    const matchesCategory = selectedCategoryId === null || produce.categoryId === selectedCategoryId
    const matchesSearch = searchQuery === '' ||
      produce.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Group by category for display
  const produceByCategory = categories.map((category) => ({
    category,
    items: filteredProduce.filter((p) => p.categoryId === category.id),
  })).filter((group) => group.items.length > 0)

  // Count available items
  const availableCount = allProduce.filter((p) => p.isAvailable).length

  if (produceLoading && allProduce.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading inventory..." />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-touch-xl font-bold text-earth-800">
              Manage Inventory
            </h2>
            <p className="text-touch-sm text-earth-800/70">
              {availableCount} of {allProduce.length} items available today
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                allProduce.forEach((p) => {
                  if (p.isAvailable) toggleAvailability(p.id)
                })
              }}
              className="px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search produce..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:outline-none select-text"
          />

          <select
            value={selectedCategoryId ?? ''}
            onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:outline-none bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Produce List */}
      <div className="flex-1 overflow-y-auto scroll-touch p-6">
        {filteredProduce.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <span className="text-6xl mb-4">🔍</span>
            <h3 className="text-touch-lg font-semibold text-earth-800 mb-2">
              No items found
            </h3>
            <p className="text-touch-sm text-earth-800/70">
              Try adjusting your search or filter
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {produceByCategory.map(({ category, items }) => (
              <div key={category.id}>
                <h3 className="text-touch-lg font-semibold text-earth-800 mb-4 flex items-center gap-2">
                  <span>{category.icon}</span> {category.name}
                  <span className="text-sm font-normal text-earth-800/50">
                    ({items.filter((i) => i.isAvailable).length}/{items.length} available)
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((produce) => (
                    <button
                      key={produce.id}
                      onClick={() => toggleAvailability(produce.id)}
                      className={`
                        flex items-center gap-4 p-4 rounded-touch transition-all
                        ${produce.isAvailable
                          ? 'bg-primary-50 border-2 border-primary-500'
                          : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <span className="text-3xl">{getProduceEmoji(produce.name)}</span>
                      <span className="flex-1 text-left font-medium text-earth-800">
                        {produce.name}
                      </span>
                      <div
                        className={`
                          w-12 h-7 rounded-full p-1 transition-colors
                          ${produce.isAvailable ? 'bg-primary-500' : 'bg-gray-300'}
                        `}
                      >
                        <div
                          className={`
                            w-5 h-5 rounded-full bg-white shadow transition-transform
                            ${produce.isAvailable ? 'translate-x-5' : 'translate-x-0'}
                          `}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="flex-shrink-0 bg-primary-500 text-white px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {availableCount} items marked as available
          </span>
          <span className="text-sm opacity-80">
            Changes are saved automatically
          </span>
        </div>
      </div>
    </div>
  )
}

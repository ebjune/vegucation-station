import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProduceStore } from '../../viewmodels/useProduceStore'
import { useSellerStore } from '../../viewmodels/useSellerStore'
import { useAppStore } from '../../viewmodels/useAppStore'
import LoadingSpinner from '../shared/LoadingSpinner'
import { getProduceEmoji, useProduceImage } from '../shared/ProduceCard'
import type { Produce } from '../../models/Produce'

interface EditingProduce {
  id: number
  name: string
  imageSourceUrl: string | null
  imageCreditName: string | null
  imageCreditUrl: string | null
  imageLicense: string | null
}

// Component to show produce image or emoji fallback
// refreshKey forces re-check when image is updated
function ProduceImageOrEmoji({ name, size = 'md', refreshKey = 0 }: { name: string; size?: 'sm' | 'md' | 'lg'; refreshKey?: number }) {
  const imageSrc = useProduceImage(name, refreshKey)
  const sizeClasses = {
    sm: 'w-8 h-8 text-2xl',
    md: 'w-12 h-12 text-3xl',
    lg: 'w-32 h-32 text-5xl',
  }

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={name}
        className={`${sizeClasses[size]} rounded-lg object-cover`}
      />
    )
  }

  return (
    <span className={sizeClasses[size]}>{getProduceEmoji(name)}</span>
  )
}

function ImageEditModal({
  produce,
  onClose,
  onSave,
}: {
  produce: EditingProduce
  onClose: () => void
  onSave: () => void
}) {
  const [imageUrl, setImageUrl] = useState(produce.imageSourceUrl || '')
  const [creditName, setCreditName] = useState(produce.imageCreditName || '')
  const [creditUrl, setCreditUrl] = useState(produce.imageCreditUrl || '')
  const [license, setLicense] = useState(produce.imageLicense || '')
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Get current image from the hook
  const currentImage = useProduceImage(produce.name)

  const handleDownload = async () => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL')
      return
    }

    // Basic URL validation
    try {
      new URL(imageUrl)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setIsDownloading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await window.electronAPI.downloadImageForProduce(
        produce.id,
        imageUrl,
        {
          creditName: creditName.trim() || undefined,
          creditUrl: creditUrl.trim() || undefined,
          license: license.trim() || undefined,
        }
      )
      if (result.success) {
        setSuccess(true)
        // Trigger a refresh after a brief delay to show success message
        setTimeout(() => {
          onSave()
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download image')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-touch-lg font-bold text-earth-800">
            Edit Image: {produce.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Image Preview */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-earth-800/70 mb-2">
            Current Image
          </label>
          <div className="w-32 h-32 mx-auto rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
            <ProduceImageOrEmoji name={produce.name} size="lg" />
          </div>
        </div>

        {/* Image URL Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-earth-800/70 mb-2">
            Image URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value)
              setError(null)
              setSuccess(false)
            }}
            placeholder="https://images.pexels.com/photos/..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:outline-none select-text"
            disabled={isDownloading}
          />
        </div>

        {/* Attribution Section */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-earth-800 mb-3">
            Image Attribution (for credits)
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-earth-800/70 mb-1">
                Photographer / Creator Name
              </label>
              <input
                type="text"
                value={creditName}
                onChange={(e) => setCreditName(e.target.value)}
                placeholder="e.g., Jane Smith"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-primary-500 focus:outline-none select-text"
                disabled={isDownloading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-earth-800/70 mb-1">
                Credit URL (link to photographer or image page)
              </label>
              <input
                type="url"
                value={creditUrl}
                onChange={(e) => setCreditUrl(e.target.value)}
                placeholder="https://www.pexels.com/@photographer"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-primary-500 focus:outline-none select-text"
                disabled={isDownloading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-earth-800/70 mb-1">
                License
              </label>
              <select
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-primary-500 focus:outline-none bg-white"
                disabled={isDownloading}
              >
                <option value="">Select license...</option>
                <option value="Pexels License">Pexels License</option>
                <option value="Unsplash License">Unsplash License</option>
                <option value="CC0 (Public Domain)">CC0 (Public Domain)</option>
                <option value="CC-BY">CC-BY (Attribution)</option>
                <option value="CC-BY-SA">CC-BY-SA (Attribution-ShareAlike)</option>
                <option value="Pixabay License">Pixabay License</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Current attribution display */}
        {produce.imageSourceUrl && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
            <div className="font-medium text-blue-800 mb-1">Current Attribution:</div>
            <div className="text-blue-700 space-y-1">
              {produce.imageCreditName && <div>Credit: {produce.imageCreditName}</div>}
              {produce.imageLicense && <div>License: {produce.imageLicense}</div>}
              <div className="break-all">
                Source: <a href={produce.imageSourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{produce.imageSourceUrl}</a>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Image downloaded and saved successfully!
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-medium text-earth-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isDownloading}
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading || !imageUrl.trim()}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isDownloading ? (
              <>
                <LoadingSpinner size="sm" />
                Downloading...
              </>
            ) : (
              'Download & Save'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

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

  const [editingProduce, setEditingProduce] = useState<EditingProduce | null>(null)
  const [imageRefreshKey, setImageRefreshKey] = useState(0)

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

  const handleEditImage = (produce: Produce) => {
    setEditingProduce({
      id: produce.id,
      name: produce.name,
      imageSourceUrl: produce.imageSourceUrl || null,
      imageCreditName: produce.imageCreditName || null,
      imageCreditUrl: produce.imageCreditUrl || null,
      imageLicense: produce.imageLicense || null,
    })
  }

  const handleSaveImage = () => {
    setEditingProduce(null)
    // Increment refresh key to force image components to re-check
    setImageRefreshKey(prev => prev + 1)
    // Refresh produce data to get updated image info
    fetchAllProduce()
  }

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
                    <div
                      key={produce.id}
                      className={`
                        flex items-center gap-4 p-4 rounded-touch transition-all
                        ${produce.isAvailable
                          ? 'bg-primary-50 border-2 border-primary-500'
                          : 'bg-white border-2 border-gray-200'
                        }
                      `}
                    >
                      {/* Edit Image Button */}
                      <button
                        onClick={() => handleEditImage(produce)}
                        className="relative group flex-shrink-0"
                        title="Edit image"
                      >
                        <ProduceImageOrEmoji name={produce.name} size="md" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                      </button>

                      {/* Name - clicking toggles availability */}
                      <button
                        onClick={() => toggleAvailability(produce.id)}
                        className="flex-1 text-left font-medium text-earth-800 hover:text-primary-600 transition-colors"
                      >
                        {produce.name}
                      </button>

                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleAvailability(produce.id)}
                        className={`
                          w-12 h-7 rounded-full p-1 transition-colors flex-shrink-0
                          ${produce.isAvailable ? 'bg-primary-500' : 'bg-gray-300'}
                        `}
                      >
                        <div
                          className={`
                            w-5 h-5 rounded-full bg-white shadow transition-transform
                            ${produce.isAvailable ? 'translate-x-5' : 'translate-x-0'}
                          `}
                        />
                      </button>
                    </div>
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
            Click image to edit | Changes saved automatically
          </span>
        </div>
      </div>

      {/* Image Edit Modal */}
      {editingProduce && (
        <ImageEditModal
          produce={editingProduce}
          onClose={() => setEditingProduce(null)}
          onSave={handleSaveImage}
        />
      )}
    </div>
  )
}

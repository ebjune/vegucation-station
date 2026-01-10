import type { Category } from '../../models/Category'

interface CategoryFilterProps {
  categories: Category[]
  selectedCategoryId: number | null
  onCategorySelect: (categoryId: number | null) => void
}

export default function CategoryFilter({
  categories,
  selectedCategoryId,
  onCategorySelect,
}: CategoryFilterProps) {
  return (
    <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex gap-3 overflow-x-auto scroll-touch pb-2">
        {/* All Categories Button */}
        <button
          onClick={() => onCategorySelect(null)}
          className={`
            flex-shrink-0 px-5 py-3 rounded-full text-touch-sm font-semibold
            transition-all duration-150 active:scale-95
            ${selectedCategoryId === null
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-earth-800 hover:bg-gray-200'
            }
          `}
        >
          All
        </button>

        {/* Category Buttons */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`
              flex-shrink-0 px-5 py-3 rounded-full text-touch-sm font-semibold
              transition-all duration-150 active:scale-95
              flex items-center gap-2
              ${selectedCategoryId === category.id
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-earth-800 hover:bg-gray-200'
              }
            `}
          >
            {category.icon && <span>{category.icon}</span>}
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}

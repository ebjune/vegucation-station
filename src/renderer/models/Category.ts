export interface Category {
  id: number
  name: string
  icon: string | null
  sortOrder: number
}

export const CATEGORY_ICONS: Record<string, string> = {
  'Vegetables': '🥬',
  'Fruits': '🍎',
  'Eggs & Dairy': '🥚',
  'Mushrooms': '🍄',
  'Herbs & Microgreens': '🌿',
  'Other': '🧺',
}

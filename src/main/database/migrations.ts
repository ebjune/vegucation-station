import Database from 'better-sqlite3'
import crypto from 'crypto'

// Default categories
const DEFAULT_CATEGORIES = [
  { name: 'Vegetables', icon: '🥬', sortOrder: 1 },
  { name: 'Fruits', icon: '🍎', sortOrder: 2 },
  { name: 'Eggs & Dairy', icon: '🥚', sortOrder: 3 },
  { name: 'Mushrooms', icon: '🍄', sortOrder: 4 },
  { name: 'Herbs & Microgreens', icon: '🌿', sortOrder: 5 },
  { name: 'Other', icon: '🧺', sortOrder: 6 },
]

// Sample produce items for each category
const DEFAULT_PRODUCE: { name: string; category: string }[] = [
  // Vegetables
  { name: 'Tomatoes', category: 'Vegetables' },
  { name: 'Carrots', category: 'Vegetables' },
  { name: 'Lettuce', category: 'Vegetables' },
  { name: 'Spinach', category: 'Vegetables' },
  { name: 'Kale', category: 'Vegetables' },
  { name: 'Zucchini', category: 'Vegetables' },
  { name: 'Bell Peppers', category: 'Vegetables' },
  { name: 'Cucumbers', category: 'Vegetables' },
  { name: 'Broccoli', category: 'Vegetables' },
  { name: 'Cauliflower', category: 'Vegetables' },
  { name: 'Green Beans', category: 'Vegetables' },
  { name: 'Corn', category: 'Vegetables' },
  { name: 'Potatoes', category: 'Vegetables' },
  { name: 'Sweet Potatoes', category: 'Vegetables' },
  { name: 'Onions', category: 'Vegetables' },
  { name: 'Garlic', category: 'Vegetables' },
  { name: 'Beets', category: 'Vegetables' },
  { name: 'Radishes', category: 'Vegetables' },
  { name: 'Turnips', category: 'Vegetables' },
  { name: 'Squash', category: 'Vegetables' },
  { name: 'Pumpkin', category: 'Vegetables' },
  { name: 'Eggplant', category: 'Vegetables' },
  { name: 'Asparagus', category: 'Vegetables' },
  { name: 'Celery', category: 'Vegetables' },
  { name: 'Cabbage', category: 'Vegetables' },

  // Fruits
  { name: 'Apples', category: 'Fruits' },
  { name: 'Peaches', category: 'Fruits' },
  { name: 'Strawberries', category: 'Fruits' },
  { name: 'Blueberries', category: 'Fruits' },
  { name: 'Raspberries', category: 'Fruits' },
  { name: 'Blackberries', category: 'Fruits' },
  { name: 'Watermelon', category: 'Fruits' },
  { name: 'Cantaloupe', category: 'Fruits' },
  { name: 'Grapes', category: 'Fruits' },
  { name: 'Pears', category: 'Fruits' },
  { name: 'Plums', category: 'Fruits' },
  { name: 'Cherries', category: 'Fruits' },

  // Eggs & Dairy
  { name: 'Chicken Eggs', category: 'Eggs & Dairy' },
  { name: 'Duck Eggs', category: 'Eggs & Dairy' },
  { name: 'Goat Cheese', category: 'Eggs & Dairy' },
  { name: 'Fresh Milk', category: 'Eggs & Dairy' },
  { name: 'Butter', category: 'Eggs & Dairy' },

  // Mushrooms
  { name: 'Shiitake', category: 'Mushrooms' },
  { name: 'Oyster Mushrooms', category: 'Mushrooms' },
  { name: 'Portobello', category: 'Mushrooms' },
  { name: 'Cremini', category: 'Mushrooms' },
  { name: 'Lion\'s Mane', category: 'Mushrooms' },

  // Herbs & Microgreens
  { name: 'Basil', category: 'Herbs & Microgreens' },
  { name: 'Cilantro', category: 'Herbs & Microgreens' },
  { name: 'Parsley', category: 'Herbs & Microgreens' },
  { name: 'Mint', category: 'Herbs & Microgreens' },
  { name: 'Rosemary', category: 'Herbs & Microgreens' },
  { name: 'Thyme', category: 'Herbs & Microgreens' },
  { name: 'Dill', category: 'Herbs & Microgreens' },
  { name: 'Microgreens Mix', category: 'Herbs & Microgreens' },
  { name: 'Sunflower Sprouts', category: 'Herbs & Microgreens' },

  // Other
  { name: 'Honey', category: 'Other' },
  { name: 'Maple Syrup', category: 'Other' },
  { name: 'Jam', category: 'Other' },
  { name: 'Pickles', category: 'Other' },
  { name: 'Fresh Bread', category: 'Other' },
]

// Default PIN is "1234" - should be changed on first use
const DEFAULT_PIN = '1234'

export function seedInitialData(db: Database.Database): void {
  console.log('Seeding initial data...')

  // Insert categories
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, icon, sort_order)
    VALUES (?, ?, ?)
  `)

  const categoryIds: Record<string, number> = {}

  for (const category of DEFAULT_CATEGORIES) {
    const result = insertCategory.run(category.name, category.icon, category.sortOrder)
    categoryIds[category.name] = result.lastInsertRowid as number
  }

  // Insert produce items
  const insertProduce = db.prepare(`
    INSERT INTO produce (name, category_id, is_available)
    VALUES (?, ?, 0)
  `)

  for (const produce of DEFAULT_PRODUCE) {
    const categoryId = categoryIds[produce.category]
    if (categoryId) {
      insertProduce.run(produce.name, categoryId)
    }
  }

  // Set default PIN (hashed)
  const hashedPin = hashPin(DEFAULT_PIN)
  const insertSetting = db.prepare(`
    INSERT OR REPLACE INTO settings (key, value)
    VALUES (?, ?)
  `)
  insertSetting.run('seller_pin_hash', hashedPin)

  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories and ${DEFAULT_PRODUCE.length} produce items`)
}

export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex')
}

export function verifyPin(db: Database.Database, pin: string): boolean {
  const result = db.prepare(`
    SELECT value FROM settings WHERE key = 'seller_pin_hash'
  `).get() as { value: string } | undefined

  if (!result) return false

  const hashedInput = hashPin(pin)
  return hashedInput === result.value
}

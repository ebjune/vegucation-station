import { getDatabase } from './schema'

// Type definitions
export interface Category {
  id: number
  name: string
  icon: string | null
  sortOrder: number
}

export interface Produce {
  id: number
  name: string
  categoryId: number
  imagePath: string | null
  isAvailable: boolean
  createdAt: string
}

export interface EducationContent {
  id: number
  produceId: number
  funFacts: string[]
  nutritionInfo: Record<string, unknown>
  detailedInfo: string
  generatedAt: string
}

export interface Recipe {
  title: string
  description: string
  prepTime: string
  difficulty: string
  servings: number
  ingredients: string[]
  steps: string[]
}

// Category operations
export function getCategories(): Category[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT id, name, icon, sort_order as sortOrder
    FROM categories
    ORDER BY sort_order
  `).all() as Category[]
  return rows
}

// Produce operations
export function getProduce(categoryId?: number): Produce[] {
  const db = getDatabase()
  let query = `
    SELECT id, name, category_id as categoryId, image_path as imagePath,
           is_available as isAvailable, created_at as createdAt
    FROM produce
  `
  const params: number[] = []

  if (categoryId !== undefined) {
    query += ' WHERE category_id = ?'
    params.push(categoryId)
  }

  query += ' ORDER BY name'

  const rows = db.prepare(query).all(...params) as Array<{
    id: number
    name: string
    categoryId: number
    imagePath: string | null
    isAvailable: number
    createdAt: string
  }>

  return rows.map((row) => ({
    ...row,
    isAvailable: Boolean(row.isAvailable),
  }))
}

export function getAvailableProduce(): Produce[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT id, name, category_id as categoryId, image_path as imagePath,
           is_available as isAvailable, created_at as createdAt
    FROM produce
    WHERE is_available = 1
    ORDER BY name
  `).all() as Array<{
    id: number
    name: string
    categoryId: number
    imagePath: string | null
    isAvailable: number
    createdAt: string
  }>

  return rows.map((row) => ({
    ...row,
    isAvailable: true,
  }))
}

export function setProduceAvailability(id: number, available: boolean): void {
  const db = getDatabase()
  db.prepare(`
    UPDATE produce SET is_available = ? WHERE id = ?
  `).run(available ? 1 : 0, id)
}

export function addProduce(produce: {
  name: string
  categoryId: number
  imagePath?: string
}): number {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO produce (name, category_id, image_path)
    VALUES (?, ?, ?)
  `).run(produce.name, produce.categoryId, produce.imagePath || null)
  return result.lastInsertRowid as number
}

// Education content operations
export function getEducationContent(produceId: number): EducationContent | null {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT id, produce_id as produceId, fun_facts, nutrition_info,
           detailed_info, generated_at as generatedAt
    FROM education_cache
    WHERE produce_id = ?
  `).get(produceId) as {
    id: number
    produceId: number
    fun_facts: string
    nutrition_info: string
    detailed_info: string
    generatedAt: string
  } | undefined

  if (!row) return null

  return {
    id: row.id,
    produceId: row.produceId,
    funFacts: JSON.parse(row.fun_facts),
    nutritionInfo: JSON.parse(row.nutrition_info),
    detailedInfo: row.detailed_info,
    generatedAt: row.generatedAt,
  }
}

export function saveEducationContent(
  produceId: number,
  content: {
    funFacts: string[]
    nutritionInfo: Record<string, unknown>
    detailedInfo: string
  }
): void {
  const db = getDatabase()
  db.prepare(`
    INSERT OR REPLACE INTO education_cache
    (produce_id, fun_facts, nutrition_info, detailed_info, generated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    produceId,
    JSON.stringify(content.funFacts),
    JSON.stringify(content.nutritionInfo),
    content.detailedInfo
  )
}

// Recipe cache operations
export function getCachedRecipes(ingredientHash: string): Recipe[] | null {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT recipes FROM recipe_cache WHERE ingredient_hash = ?
  `).get(ingredientHash) as { recipes: string } | undefined

  if (!row) return null
  return JSON.parse(row.recipes)
}

export function saveRecipesToCache(ingredientHash: string, recipes: Recipe[]): void {
  const db = getDatabase()
  db.prepare(`
    INSERT OR REPLACE INTO recipe_cache (ingredient_hash, recipes, generated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `).run(ingredientHash, JSON.stringify(recipes))
}

// Settings operations
export function getSetting(key: string): string | null {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT value FROM settings WHERE key = ?
  `).get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  const db = getDatabase()
  db.prepare(`
    INSERT OR REPLACE INTO settings (key, value)
    VALUES (?, ?)
  `).run(key, value)
}

// IPC Channel types for type-safe communication between main and renderer

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
  id?: number
  produceId: number
  funFacts: string[]
  nutritionInfo: {
    calories?: string
    vitamins?: string[]
    minerals?: string[]
    benefits?: string[]
  }
  detailedInfo: string
  generatedAt?: string
}

export interface Recipe {
  title: string
  description: string
  prepTime: string
  difficulty: 'Easy' | 'Medium' | 'Advanced'
  servings: number
  ingredients: string[]
  steps: string[]
}

// IPC Channel names
export const IPC_CHANNELS = {
  // Database
  DB_GET_CATEGORIES: 'db:getCategories',
  DB_GET_PRODUCE: 'db:getProduce',
  DB_GET_AVAILABLE_PRODUCE: 'db:getAvailableProduce',
  DB_SET_PRODUCE_AVAILABILITY: 'db:setProduceAvailability',
  DB_ADD_PRODUCE: 'db:addProduce',

  // Education
  EDUCATION_GET_CONTENT: 'education:getContent',
  EDUCATION_GENERATE: 'education:generate',

  // Recipes
  RECIPES_GENERATE: 'recipes:generate',
  RECIPES_GET_CACHED: 'recipes:getCached',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_VERIFY_PIN: 'settings:verifyPin',

  // Email
  EMAIL_IS_ENABLED: 'email:isEnabled',
  EMAIL_SEND_RECIPE: 'email:sendRecipe',

  // App
  APP_GET_VERSION: 'app:getVersion',
  APP_IS_ONLINE: 'app:isOnline',
} as const

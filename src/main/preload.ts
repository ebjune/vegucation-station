import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  getCategories: () => ipcRenderer.invoke('db:getCategories'),
  getProduce: (categoryId?: number) => ipcRenderer.invoke('db:getProduce', categoryId),
  getAvailableProduce: () => ipcRenderer.invoke('db:getAvailableProduce'),
  setProduceAvailability: (id: number, available: boolean) =>
    ipcRenderer.invoke('db:setProduceAvailability', id, available),
  addProduce: (produce: { name: string; categoryId: number; imagePath?: string }) =>
    ipcRenderer.invoke('db:addProduce', produce),
  getProduceById: (id: number) => ipcRenderer.invoke('db:getProduceById', id),

  // Image management
  downloadImageForProduce: (
    produceId: number,
    imageUrl: string,
    attribution: { creditName?: string; creditUrl?: string; license?: string }
  ) => ipcRenderer.invoke('image:downloadForProduce', produceId, imageUrl, attribution),

  // Education content
  getEducationContent: (produceId: number) =>
    ipcRenderer.invoke('education:getContent', produceId),
  generateEducationContent: (produceName: string, produceId: number) =>
    ipcRenderer.invoke('education:generate', produceName, produceId),

  // Recipe operations
  generateRecipes: (ingredients: string[]) =>
    ipcRenderer.invoke('recipes:generate', ingredients),
  getCachedRecipes: (ingredientHash: string) =>
    ipcRenderer.invoke('recipes:getCached', ingredientHash),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke('settings:set', key, value),
  verifyPin: (pin: string) => ipcRenderer.invoke('settings:verifyPin', pin),

  // Email
  isEmailEnabled: () => ipcRenderer.invoke('email:isEnabled'),
  sendRecipeEmail: (email: string, recipes: unknown) =>
    ipcRenderer.invoke('email:sendRecipe', email, recipes),

  // App info
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  isOnline: () => ipcRenderer.invoke('app:isOnline'),
})

// Type definitions for the exposed API
export interface ElectronAPI {
  getCategories: () => Promise<Category[]>
  getProduce: (categoryId?: number) => Promise<Produce[]>
  getAvailableProduce: () => Promise<Produce[]>
  setProduceAvailability: (id: number, available: boolean) => Promise<void>
  addProduce: (produce: { name: string; categoryId: number; imagePath?: string }) => Promise<number>
  getProduceById: (id: number) => Promise<Produce | null>
  downloadImageForProduce: (
    produceId: number,
    imageUrl: string,
    attribution: { creditName?: string; creditUrl?: string; license?: string }
  ) => Promise<{ success: boolean; imagePath: string }>
  getEducationContent: (produceId: number) => Promise<EducationContent | null>
  generateEducationContent: (produceName: string, produceId: number) => Promise<EducationContent>
  generateRecipes: (ingredients: string[]) => Promise<Recipe[]>
  getCachedRecipes: (ingredientHash: string) => Promise<Recipe[] | null>
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
  verifyPin: (pin: string) => Promise<boolean>
  isEmailEnabled: () => Promise<boolean>
  sendRecipeEmail: (email: string, recipes: unknown) => Promise<boolean>
  getAppVersion: () => Promise<string>
  isOnline: () => Promise<boolean>
}

interface Category {
  id: number
  name: string
  icon: string | null
  sortOrder: number
}

interface Produce {
  id: number
  name: string
  categoryId: number
  imagePath: string | null
  imageSourceUrl: string | null
  imageCreditName: string | null
  imageCreditUrl: string | null
  imageLicense: string | null
  isAvailable: boolean
  createdAt: string
}

interface EducationContent {
  id: number
  produceId: number
  funFacts: string[]
  nutritionInfo: Record<string, unknown>
  detailedInfo: string
  generatedAt: string
}

interface Recipe {
  title: string
  description: string
  prepTime: string
  difficulty: string
  servings: number
  ingredients: string[]
  steps: string[]
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

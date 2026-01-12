import { IpcMain, app } from 'electron'
import * as repository from '../database/repository'
import { verifyPin, hashPin } from '../database/migrations'
import { getDatabase } from '../database/schema'
import { generateEducationContent, generateRecipes } from '../services/claude'
import { sendRecipeEmail, isEmailEnabled } from '../services/email'
import { downloadProduceImage } from '../services/imageDownloader'

export function registerIpcHandlers(ipcMain: IpcMain): void {
  // Database: Categories
  ipcMain.handle('db:getCategories', () => {
    return repository.getCategories()
  })

  // Database: Produce
  ipcMain.handle('db:getProduce', (_, categoryId?: number) => {
    return repository.getProduce(categoryId)
  })

  ipcMain.handle('db:getAvailableProduce', () => {
    return repository.getAvailableProduce()
  })

  ipcMain.handle('db:setProduceAvailability', (_, id: number, available: boolean) => {
    repository.setProduceAvailability(id, available)
  })

  ipcMain.handle('db:addProduce', (_, produce: { name: string; categoryId: number; imagePath?: string }) => {
    return repository.addProduce(produce)
  })

  ipcMain.handle('db:getProduceById', (_, id: number) => {
    return repository.getProduceById(id)
  })

  // Image management
  ipcMain.handle('image:downloadForProduce', async (
    _,
    produceId: number,
    imageUrl: string,
    attribution: { creditName?: string; creditUrl?: string; license?: string }
  ) => {
    const produce = repository.getProduceById(produceId)
    if (!produce) {
      throw new Error('Produce not found')
    }

    // Download the image and get the local path
    const localPath = await downloadProduceImage(imageUrl, produce.name)

    // Update the database with the new image path and attribution
    repository.updateProduceImage(produceId, localPath, {
      sourceUrl: imageUrl,
      creditName: attribution.creditName,
      creditUrl: attribution.creditUrl,
      license: attribution.license,
    })

    return { success: true, imagePath: localPath }
  })

  // Education content
  ipcMain.handle('education:getContent', (_, produceId: number) => {
    return repository.getEducationContent(produceId)
  })

  ipcMain.handle('education:generate', async (_, produceName: string, produceId: number) => {
    // Check if we already have cached content
    const cached = repository.getEducationContent(produceId)
    if (cached) return cached

    // Generate new content
    const content = await generateEducationContent(produceName)

    // Save to cache
    repository.saveEducationContent(produceId, content)

    return {
      produceId,
      ...content,
      generatedAt: new Date().toISOString(),
    }
  })

  // Recipe operations
  ipcMain.handle('recipes:generate', async (_, ingredients: string[]) => {
    // Create hash for caching
    const ingredientHash = ingredients.sort().join(',').toLowerCase()

    // Check cache first
    const cached = repository.getCachedRecipes(ingredientHash)
    if (cached) return cached

    // Generate new recipes
    const recipes = await generateRecipes(ingredients)

    // Save to cache
    repository.saveRecipesToCache(ingredientHash, recipes)

    return recipes
  })

  ipcMain.handle('recipes:getCached', (_, ingredientHash: string) => {
    return repository.getCachedRecipes(ingredientHash)
  })

  // Settings
  ipcMain.handle('settings:get', (_, key: string) => {
    return repository.getSetting(key)
  })

  ipcMain.handle('settings:set', (_, key: string, value: string) => {
    repository.setSetting(key, value)
  })

  ipcMain.handle('settings:verifyPin', (_, pin: string) => {
    const db = getDatabase()
    return verifyPin(db, pin)
  })

  ipcMain.handle('settings:setPin', (_, newPin: string) => {
    const hashedPin = hashPin(newPin)
    repository.setSetting('seller_pin_hash', hashedPin)
  })

  // Email
  ipcMain.handle('email:isEnabled', () => {
    return isEmailEnabled()
  })

  ipcMain.handle('email:sendRecipe', async (_, email: string, recipes: repository.Recipe[]) => {
    return sendRecipeEmail(email, recipes)
  })

  // App info
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:isOnline', () => {
    // Simple check - in production you might want more robust checking
    return require('dns').promises.lookup('google.com')
      .then(() => true)
      .catch(() => false)
  })
}

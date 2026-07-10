import { IpcMain, app } from 'electron'
import * as repository from '../database/repository'
import { verifyPin, hashPin } from '../database/migrations'
import { getDatabase } from '../database/schema'
import { generateEducationContent, generateRecipes } from '../services/claude'
import { isFallbackEducationContent } from '../services/educationFallback'
import { sendRecipeEmail, isEmailEnabled } from '../services/email'
import { downloadProduceImage } from '../services/imageDownloader'
import { searchProduceImage } from '../services/imageSearch'
import { printRecipe } from '../services/printer'

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

  // Don't persist placeholder content — allow retry when back online
    if (!isFallbackEducationContent(content)) {
      repository.saveEducationContent(produceId, content)
    }

    return {
      produceId,
      ...content,
      generatedAt: new Date().toISOString(),
      isFallback: isFallbackEducationContent(content),
    }
  })

  ipcMain.handle('education:refresh', async (_, produceName: string, produceId: number) => {
    repository.deleteEducationContent(produceId)

    const content = await generateEducationContent(produceName)
    const isFallback = isFallbackEducationContent(content)

    if (!isFallback) {
      repository.saveEducationContent(produceId, content)
    }

    return {
      produceId,
      ...content,
      generatedAt: new Date().toISOString(),
      isFallback,
    }
  })

  ipcMain.handle('education:isFallback', (_, produceId: number) => {
    const cached = repository.getEducationContent(produceId)
    if (!cached) return false
    return isFallbackEducationContent(cached)
  })

  ipcMain.handle('produce:createWithDetails', async (_, data: { name: string; categoryId: number }) => {
    const trimmedName = data.name.trim()
    if (!trimmedName) {
      throw new Error('Item name is required')
    }

    const existing = repository.getProduceByName(trimmedName)
    if (existing) {
      throw new Error(`An item named "${trimmedName}" already exists`)
    }

    const category = repository.getCategoryById(data.categoryId)
    if (!category) {
      throw new Error('Selected category was not found')
    }

    const produceId = repository.addProduce({
      name: trimmedName,
      categoryId: data.categoryId,
    })

    const [content, imageResult] = await Promise.all([
      generateEducationContent(trimmedName),
      searchProduceImage(trimmedName, category.name),
    ])

    const isFallback = isFallbackEducationContent(content)
    if (!isFallback) {
      repository.saveEducationContent(produceId, content)
    }

    let imageGenerated = false
    if (imageResult) {
      try {
        const localPath = await downloadProduceImage(imageResult.imageUrl, trimmedName)
        repository.updateProduceImage(produceId, localPath, {
          sourceUrl: imageResult.sourceUrl,
          creditName: imageResult.creditName,
          creditUrl: imageResult.creditUrl,
          license: imageResult.license,
        })
        imageGenerated = true
      } catch (error) {
        console.error('Failed to download image for new produce:', error)
      }
    }

    const produce = repository.getProduceById(produceId)

    return {
      produce,
      educationGenerated: !isFallback,
      imageGenerated,
    }
  })

  // Recipe operations
  ipcMain.handle('recipes:generate', async (_, ingredients: string[]) => {
    // Create hash for caching
    const ingredientHash = ingredients.sort().join(',').toLowerCase()

    // Check cache first — ignore incomplete cached results from earlier failures
    const cached = repository.getCachedRecipes(ingredientHash)
    if (cached && cached.length >= 3) return cached

    // Generate new recipes
    const recipes = await generateRecipes(ingredients)

    // Only cache complete recipe sets
    if (recipes.length >= 3) {
      repository.saveRecipesToCache(ingredientHash, recipes)
    }

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

  ipcMain.handle('app:quit', () => {
    app.quit()
  })

  ipcMain.handle('app:isOnline', () => {
    // Simple check - in production you might want more robust checking
    return require('dns').promises.lookup('google.com')
      .then(() => true)
      .catch(() => false)
  })

  // Thermal / receipt printer (silent print via Electron)
  ipcMain.handle('printer:printRecipe', async (_, recipe: repository.Recipe) => {
    return printRecipe(recipe)
  })
}

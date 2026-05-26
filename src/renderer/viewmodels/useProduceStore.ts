import { create } from 'zustand'
import type { Produce } from '../models/Produce'
import type { Category } from '../models/Category'

interface ProduceState {
  // Categories
  categories: Category[]
  categoriesLoading: boolean
  fetchCategories: () => Promise<void>

  // All produce items
  allProduce: Produce[]
  produceLoading: boolean
  fetchAllProduce: () => Promise<void>

  // Available produce (for customers)
  availableProduce: Produce[]
  fetchAvailableProduce: () => Promise<void>

  // Get produce by category
  getProduceByCategory: (categoryId: number) => Produce[]

  // Toggle availability (seller mode)
  toggleAvailability: (produceId: number) => Promise<void>

  // Add a new produce item with AI-generated content
  addProduceItem: (name: string, categoryId: number) => Promise<{
    success: boolean
    error?: string
    educationGenerated?: boolean
  }>

  // Refresh AI-generated education content for an item
  refreshItemInfo: (produceId: number, produceName: string) => Promise<{
    success: boolean
    isFallback?: boolean
    error?: string
  }>

  // Check if item has placeholder education content
  checkFallbackStatus: (produceId: number) => Promise<boolean>

  // Selected category filter
  selectedCategoryId: number | null
  setSelectedCategoryId: (categoryId: number | null) => void
}

export const useProduceStore = create<ProduceState>((set, get) => ({
  // Categories
  categories: [],
  categoriesLoading: false,

  fetchCategories: async () => {
    set({ categoriesLoading: true })
    try {
      const categories = await window.electronAPI.getCategories()
      set({ categories })
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      set({ categoriesLoading: false })
    }
  },

  // All produce
  allProduce: [],
  produceLoading: false,

  fetchAllProduce: async () => {
    set({ produceLoading: true })
    try {
      const allProduce = await window.electronAPI.getProduce()
      set({ allProduce })
    } catch (error) {
      console.error('Failed to fetch produce:', error)
    } finally {
      set({ produceLoading: false })
    }
  },

  // Available produce
  availableProduce: [],

  fetchAvailableProduce: async () => {
    set({ produceLoading: true })
    try {
      const availableProduce = await window.electronAPI.getAvailableProduce()
      set({ availableProduce })
    } catch (error) {
      console.error('Failed to fetch available produce:', error)
    } finally {
      set({ produceLoading: false })
    }
  },

  // Get filtered produce
  getProduceByCategory: (categoryId: number) => {
    return get().allProduce.filter((p) => p.categoryId === categoryId)
  },

  // Toggle availability
  toggleAvailability: async (produceId: number) => {
    const { allProduce } = get()
    const produce = allProduce.find((p) => p.id === produceId)
    if (!produce) return

    const newAvailability = !produce.isAvailable

    try {
      await window.electronAPI.setProduceAvailability(produceId, newAvailability)

      // Update local state
      set({
        allProduce: allProduce.map((p) =>
          p.id === produceId ? { ...p, isAvailable: newAvailability } : p
        ),
      })

      // Also update available produce list
      if (newAvailability) {
        set((state) => ({
          availableProduce: [...state.availableProduce, { ...produce, isAvailable: true }],
        }))
      } else {
        set((state) => ({
          availableProduce: state.availableProduce.filter((p) => p.id !== produceId),
        }))
      }
    } catch (error) {
      console.error('Failed to toggle availability:', error)
    }
  },

  // Category filter
  selectedCategoryId: null,
  setSelectedCategoryId: (selectedCategoryId) => set({ selectedCategoryId }),

  addProduceItem: async (name: string, categoryId: number) => {
    try {
      const result = await window.electronAPI.createProduceWithDetails({ name, categoryId })
      await get().fetchAllProduce()
      return {
        success: true,
        educationGenerated: result.educationGenerated,
      }
    } catch (error) {
      console.error('Failed to add produce item:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add item',
      }
    }
  },

  refreshItemInfo: async (produceId: number, produceName: string) => {
    try {
      const content = await window.electronAPI.refreshEducationContent(produceName, produceId)
      return {
        success: true,
        isFallback: content.isFallback ?? false,
      }
    } catch (error) {
      console.error('Failed to refresh item info:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh item info',
      }
    }
  },

  checkFallbackStatus: async (produceId: number) => {
    try {
      return await window.electronAPI.isFallbackEducationContent(produceId)
    } catch {
      return false
    }
  },
}))

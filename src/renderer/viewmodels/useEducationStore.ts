import { create } from 'zustand'
import type { EducationContent } from '../models/EducationContent'

interface EducationState {
  // Cache of education content by produce ID
  contentCache: Record<number, EducationContent>

  // Currently viewed produce ID
  currentProduceId: number | null
  setCurrentProduceId: (id: number | null) => void

  // Loading state
  isLoading: boolean

  // Error state
  error: string | null

  // "Learn More" expanded state
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void

  // Fetch content (from cache or generate)
  fetchContent: (produceId: number, produceName: string) => Promise<EducationContent | null>

  // Get cached content
  getCachedContent: (produceId: number) => EducationContent | undefined
}

export const useEducationStore = create<EducationState>((set, get) => ({
  contentCache: {},
  currentProduceId: null,
  isLoading: false,
  error: null,
  isExpanded: false,

  setCurrentProduceId: (currentProduceId) => set({ currentProduceId, isExpanded: false }),

  setIsExpanded: (isExpanded) => set({ isExpanded }),

  fetchContent: async (produceId: number, produceName: string) => {
    // Check cache first
    const cached = get().contentCache[produceId]
    if (cached) {
      set({ currentProduceId: produceId })
      return cached
    }

    set({ isLoading: true, error: null })

    try {
      // Try to get from local database cache first
      let content = await window.electronAPI.getEducationContent(produceId)

      // If not in database, generate new content
      if (!content) {
        content = await window.electronAPI.generateEducationContent(produceName, produceId)
      }

      if (content) {
        // Add to local cache
        set((state) => ({
          contentCache: {
            ...state.contentCache,
            [produceId]: content as EducationContent,
          },
          currentProduceId: produceId,
          isLoading: false,
        }))
        return content as EducationContent
      }

      throw new Error('Failed to get education content')
    } catch (error) {
      console.error('Failed to fetch education content:', error)
      set({
        error: 'Unable to load educational content. Please try again.',
        isLoading: false,
      })
      return null
    }
  },

  getCachedContent: (produceId: number) => {
    return get().contentCache[produceId]
  },
}))

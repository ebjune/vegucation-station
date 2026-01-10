import { create } from 'zustand'
import type { Recipe } from '../models/Recipe'
import type { Produce } from '../models/Produce'

interface RecipeState {
  // Selected ingredients for recipe generation
  selectedIngredients: Produce[]
  addIngredient: (produce: Produce) => void
  removeIngredient: (produceId: number) => void
  clearIngredients: () => void
  isSelected: (produceId: number) => boolean

  // Generated recipes
  recipes: Recipe[]
  setRecipes: (recipes: Recipe[]) => void

  // Loading state
  isGenerating: boolean

  // Error state
  error: string | null

  // Generate recipes from selected ingredients
  generateRecipes: () => Promise<void>

  // Email state
  emailSending: boolean
  emailSent: boolean
  sendEmail: (email: string) => Promise<boolean>
  resetEmailState: () => void
}

const MAX_INGREDIENTS = 5

export const useRecipeStore = create<RecipeState>((set, get) => ({
  selectedIngredients: [],
  recipes: [],
  isGenerating: false,
  error: null,
  emailSending: false,
  emailSent: false,

  addIngredient: (produce: Produce) => {
    const { selectedIngredients } = get()
    if (selectedIngredients.length >= MAX_INGREDIENTS) {
      set({ error: `You can select up to ${MAX_INGREDIENTS} ingredients` })
      return
    }
    if (selectedIngredients.find((p) => p.id === produce.id)) {
      return // Already selected
    }
    set({
      selectedIngredients: [...selectedIngredients, produce],
      error: null,
    })
  },

  removeIngredient: (produceId: number) => {
    set((state) => ({
      selectedIngredients: state.selectedIngredients.filter((p) => p.id !== produceId),
      error: null,
    }))
  },

  clearIngredients: () => {
    set({ selectedIngredients: [], recipes: [], error: null })
  },

  isSelected: (produceId: number) => {
    return get().selectedIngredients.some((p) => p.id === produceId)
  },

  setRecipes: (recipes) => set({ recipes }),

  generateRecipes: async () => {
    const { selectedIngredients } = get()

    if (selectedIngredients.length === 0) {
      set({ error: 'Please select at least one ingredient' })
      return
    }

    set({ isGenerating: true, error: null })

    try {
      const ingredientNames = selectedIngredients.map((p) => p.name)
      const recipes = await window.electronAPI.generateRecipes(ingredientNames)
      set({ recipes, isGenerating: false })
    } catch (error) {
      console.error('Failed to generate recipes:', error)
      set({
        error: 'Unable to generate recipes. Please try again.',
        isGenerating: false,
      })
    }
  },

  sendEmail: async (email: string) => {
    const { recipes } = get()

    if (recipes.length === 0) {
      set({ error: 'No recipes to send' })
      return false
    }

    set({ emailSending: true, error: null })

    try {
      const success = await window.electronAPI.sendRecipeEmail(email, recipes)
      set({ emailSending: false, emailSent: success })
      return success
    } catch (error) {
      console.error('Failed to send email:', error)
      set({
        error: 'Unable to send email. Please try again.',
        emailSending: false,
      })
      return false
    }
  },

  resetEmailState: () => {
    set({ emailSending: false, emailSent: false })
  },
}))

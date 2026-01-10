export interface Recipe {
  title: string
  description: string
  prepTime: string
  difficulty: 'Easy' | 'Medium' | 'Advanced'
  servings: number
  ingredients: string[]
  steps: string[]
}

export interface NutritionInfo {
  calories?: string
  vitamins?: string[]
  minerals?: string[]
  benefits?: string[]
}

export interface EducationContent {
  id?: number
  produceId: number
  funFacts: string[]
  nutritionInfo: NutritionInfo
  detailedInfo: string
  generatedAt?: string
}

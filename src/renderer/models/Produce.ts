export interface Produce {
  id: number
  name: string
  categoryId: number
  imagePath: string | null
  isAvailable: boolean
  createdAt: string
}

export interface ProduceWithCategory extends Produce {
  categoryName: string
  categoryIcon: string | null
}

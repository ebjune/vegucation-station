export interface Produce {
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

export interface ProduceWithCategory extends Produce {
  categoryName: string
  categoryIcon: string | null
}
